"use client";

import { useState } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface GroupInfo {
  did: {
    did: string;
    controllerKeyId?: string;
    keys: unknown[];
    services: unknown[];
  };
  semaphoreGroup: {
    config: {
      groupId: string;
      name: string;
      description: string;
    };
    merkleRoot: string;
    members: string[];
    memberCount: number;
  };
  didDocument: unknown;
}

export default function GroupSetup({
  onGroupCreated,
}: {
  onGroupCreated?: (groupDid: string) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainId] = useState("eip155:11155111");

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [memberSecret, setMemberSecret] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDIDDocument, setShowDIDDocument] = useState(false);

  const createGroup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          groupDescription,
          contractAddress: contractAddress || undefined,
          chainId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGroupInfo(result.data);
        if (onGroupCreated) {
          onGroupCreated(result.data.did.did);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!groupInfo || !memberSecret) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/group/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupDid: groupInfo.did.did,
          memberSecret,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMembers([...members, result.data.memberCommitment]);
        setGroupInfo(result.data.updatedGroup);
        setMemberSecret("");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomIdentity = () => {
    const identity = new Identity();
    setMemberSecret(identity.toString());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!groupInfo) {
    return (
      <div className="grid gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Create Semaphore Group</CardTitle>
            <CardDescription>
              Initialize a new group with DID-based identity management
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <Input
                label="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="DAO Governance Group"
                helper="A descriptive name for your group"
              />

              <TextArea
                label="Group Description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                placeholder="Multi-party approval group for verifiable credentials"
                helper="Explain the purpose and use case of this group"
              />

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Optional Configuration
                </h4>

                <Input
                  label="Smart Contract Address"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  helper="Leave empty for off-chain management"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              </div>

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={createGroup}
              disabled={loading || !groupName || !groupDescription}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Create Group DID
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Success Banner */}
      <Alert variant="success" title="Group Created Successfully!">
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Group DID:</span>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-green-100 px-2 py-1 rounded">
                {groupInfo.did.did.slice(0, 30)}...
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(groupInfo.did.did)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span>Group ID: <strong>{groupInfo.semaphoreGroup.config.groupId}</strong></span>
            <Badge variant="info">Off-chain</Badge>
          </div>
        </div>
      </Alert>

      {/* Group Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Member Management */}
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
            <CardDescription>
              Add members to participate in anonymous voting
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={memberSecret}
                  onChange={(e) => setMemberSecret(e.target.value)}
                  placeholder="Enter or generate identity"
                  className="flex-1"
                />
                <Button
                  onClick={generateRandomIdentity}
                  variant="secondary"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Generate
                </Button>
              </div>

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              <Button
                onClick={addMember}
                disabled={loading || !memberSecret}
                loading={loading}
                className="w-full"
                variant="primary"
              >
                Add Member to Group
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Current Members
                </span>
                <Badge variant="success">
                  {groupInfo.semaphoreGroup.memberCount} members
                </Badge>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groupInfo.semaphoreGroup.members.map((member, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-gray-50 px-3 py-2 rounded-lg font-mono text-gray-600 break-all hover:bg-gray-100 transition-colors"
                  >
                    {member}
                  </div>
                ))}
                {groupInfo.semaphoreGroup.members.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No members added yet
                  </div>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Group Information */}
        <Card>
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
            <CardDescription>
              Technical details and configuration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{groupInfo.semaphoreGroup.config.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{groupInfo.semaphoreGroup.config.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Current Merkle Root</label>
                <div className="mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {groupInfo.semaphoreGroup.merkleRoot}
                  </code>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600">
                  <span className="inline-flex items-center space-x-1">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Approval policies are configured per VC issuance</span>
                  </span>
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => setShowDIDDocument(!showDIDDocument)}
              variant="outline"
              className="w-full"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDIDDocument ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                </svg>
              }
            >
              {showDIDDocument ? 'Hide' : 'View'} DID Document
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* DID Document */}
      {showDIDDocument && (
        <Card>
          <CardHeader>
            <CardTitle>DID Document</CardTitle>
            <CardDescription>
              Full decentralized identifier document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(groupInfo.didDocument, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}