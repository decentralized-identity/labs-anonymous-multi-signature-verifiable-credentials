"use client";

import { useState } from "react";
import { Identity } from "@semaphore-protocol/identity";

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
      approvalPolicy: {
        m: number;
        n: number;
      };
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
  const [m, setM] = useState(2);
  const [n, setN] = useState(3);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId] = useState("eip155:11155111");
  const [merkleRootHistoryEndpoint, setMerkleRootHistoryEndpoint] =
    useState("");

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [memberSecret, setMemberSecret] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          m,
          n,
          contractAddress: contractAddress || undefined,
          chainId,
          merkleRootHistoryEndpoint: merkleRootHistoryEndpoint || undefined,
        }),
      });

      console.log("Response:", response);

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        Semaphore Group Setup with Group DID
      </h1>

      {!groupInfo ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create Group</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="DAO Governance Group"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Group Description
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Multi-party approval group for verifiable credentials"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min Approvals (m)
                </label>
                <input
                  type="number"
                  value={m}
                  onChange={(e) => setM(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Members (n)
                </label>
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  min={m}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contract Address (Optional)
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Merkle Root History Endpoint (Optional)
              </label>
              <input
                type="text"
                value={merkleRootHistoryEndpoint}
                onChange={(e) => setMerkleRootHistoryEndpoint(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://api.example.com/merkle-roots"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={createGroup}
              disabled={loading || !groupName || !groupDescription}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Group DID"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Group Created Successfully!
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Group DID:</strong>{" "}
                <code className="bg-white px-2 py-1 rounded">
                  {groupInfo.did.did}
                </code>
              </p>
              <p>
                <strong>Group ID:</strong>{" "}
                {groupInfo.semaphoreGroup.config.groupId}
              </p>
              <p>
                <strong>Merkle Root:</strong>{" "}
                <code className="text-xs break-all">
                  {groupInfo.semaphoreGroup.merkleRoot}
                </code>
              </p>
              <p>
                <strong>Approval Policy:</strong>{" "}
                {groupInfo.semaphoreGroup.config.approvalPolicy.m} of{" "}
                {groupInfo.semaphoreGroup.config.approvalPolicy.n}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add Members</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Member Identity Secret
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberSecret}
                    onChange={(e) => setMemberSecret(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Enter or generate identity"
                  />
                  <button
                    onClick={generateRandomIdentity}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                onClick={addMember}
                disabled={loading || !memberSecret}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Member"}
              </button>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">
                Current Members ({groupInfo.semaphoreGroup.memberCount})
              </h4>
              <div className="space-y-1">
                {groupInfo.semaphoreGroup.members.map((member, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-gray-50 p-2 rounded font-mono break-all"
                  >
                    {member}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">DID Document</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(groupInfo.didDocument, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
