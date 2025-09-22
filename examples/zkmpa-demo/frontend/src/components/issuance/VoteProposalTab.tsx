"use client";

import { Identity } from "@semaphore-protocol/identity";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Proposal } from "@/types/issuance";

interface VoteProposalTabProps {
  proposal: Proposal | null;
  proposalId: string;
  setProposalId: (id: string) => void;
  memberSecret: string;
  setMemberSecret: (secret: string) => void;
  loading: boolean;
  error: string;
  onLoadProposal: () => void;
  onSubmitVote: (voteType: "approve" | "reject") => void;
  onIssueVC: () => void;
}

export function VoteProposalTab({
  proposal,
  proposalId,
  setProposalId,
  memberSecret,
  setMemberSecret,
  loading,
  error,
  onLoadProposal,
  onSubmitVote,
  onIssueVC,
}: VoteProposalTabProps) {
  const generateRandomIdentity = () => {
    const identity = new Identity();
    setMemberSecret(identity.toString());
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "error",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Load Proposal */}
      {!proposal && (
        <Card>
          <CardHeader>
            <CardTitle>Load Existing Proposal</CardTitle>
            <CardDescription>
              Enter a proposal ID to load and vote on it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
                placeholder="Enter proposal ID"
                className="flex-1"
              />
              <Button
                onClick={onLoadProposal}
                disabled={loading || !proposalId}
                loading={loading}
              >
                Load Proposal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Details */}
      {proposal && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proposal Details</CardTitle>
                  <CardDescription>ID: {proposal.proposalId}</CardDescription>
                </div>
                {getStatusBadge(proposal.status)}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </h4>
                    <p className="text-sm">
                      {proposal.vcClaims.credentialSubject.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {proposal.vcClaims.credentialSubject.email}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Role
                    </h4>
                    <p className="text-sm">
                      {proposal.vcClaims.credentialSubject.role}
                    </p>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Voting Progress
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-600">Approvals</span>
                        <span>
                          {proposal.approvals.length} /{" "}
                          {proposal.approvalThreshold}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (proposal.approvals.length /
                                proposal.approvalThreshold) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-600">Rejections</span>
                        <span>{proposal.rejections.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (proposal.rejections.length /
                                proposal.totalMembers) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            {proposal.status === "approved" && (
              <CardFooter>
                <Button
                  onClick={onIssueVC}
                  loading={loading}
                  className="w-full"
                  variant="primary"
                  size="lg"
                >
                  Issue Verifiable Credential
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Voting Section */}
          {proposal.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
                <CardDescription>
                  Vote anonymously using your member identity
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={memberSecret}
                      onChange={(e) => setMemberSecret(e.target.value)}
                      placeholder="Enter your member identity"
                      className="flex-1"
                    />
                    <Button
                      onClick={generateRandomIdentity}
                      variant="secondary"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      }
                    >
                      Generate
                    </Button>
                  </div>

                  {error && <Alert variant="error">{error}</Alert>}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => onSubmitVote("approve")}
                      disabled={loading || !memberSecret}
                      loading={loading}
                      variant="primary"
                      className="w-full"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => onSubmitVote("reject")}
                      disabled={loading || !memberSecret}
                      loading={loading}
                      variant="danger"
                      className="w-full"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
