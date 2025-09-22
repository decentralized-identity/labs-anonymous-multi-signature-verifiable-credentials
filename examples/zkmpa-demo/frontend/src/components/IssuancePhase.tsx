"use client";

import { useState } from "react";
import { TABS } from "@/types/issuance";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useProposal } from "@/hooks/useProposal";
import { useVoting } from "@/hooks/useVoting";
import { useVCIssuance } from "@/hooks/useVCIssuance";
import { CreateProposalTab } from "./issuance/CreateProposalTab";
import { VoteProposalTab } from "./issuance/VoteProposalTab";
import { ManageVCsTab } from "./issuance/ManageVCsTab";

export default function IssuancePhase({ groupDid }: { groupDid: string }) {
  const [proposalId, setProposalId] = useState("");

  const { activeTab, setActiveTab } = useTabNavigation("create");

  const {
    proposal,
    loading: proposalLoading,
    error: proposalError,
    vcClaims,
    approvalPolicy,
    setProposal,
    setVcClaims,
    setApprovalPolicy,
    createProposal,
    loadProposal,
  } = useProposal(groupDid);

  const {
    memberSecret,
    loading: votingLoading,
    error: votingError,
    setMemberSecret,
    submitVote,
  } = useVoting(groupDid);

  const {
    issuedVC,
    loading: vcLoading,
    error: vcError,
    issueVC,
  } = useVCIssuance();

  // Handle proposal creation
  const handleCreateProposal = async () => {
    const newProposal = await createProposal();
    if (newProposal) {
      setActiveTab("vote");
    }
  };

  // Handle proposal loading
  const handleLoadProposal = async () => {
    const loadedProposal = await loadProposal(proposalId);
    if (loadedProposal) {
      setActiveTab("vote");
    }
  };

  // Handle voting
  const handleSubmitVote = async (voteType: "approve" | "reject") => {
    if (!proposal) return;

    const updatedProposal = await submitVote(proposal, voteType);
    if (updatedProposal) {
      setProposal(updatedProposal);
    }
  };

  // Handle VC issuance
  const handleIssueVC = async () => {
    if (!proposal) return;

    const vc = await issueVC(proposal);
    if (vc) {
      setActiveTab("manage");
    }
  };

  // Determine current error based on active tab
  const getCurrentError = () => {
    switch (activeTab) {
      case "create":
        return proposalError;
      case "vote":
        return votingError || proposalError;
      case "manage":
        return vcError;
      default:
        return "";
    }
  };

  // Determine current loading state based on active tab
  const isLoading = () => {
    switch (activeTab) {
      case "create":
        return proposalLoading;
      case "vote":
        return votingLoading || proposalLoading;
      case "manage":
        return vcLoading;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="grid grid-cols-3 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Tab Content */}
      {activeTab === "create" && (
        <CreateProposalTab
          vcClaims={vcClaims}
          setVcClaims={setVcClaims}
          approvalPolicy={approvalPolicy}
          setApprovalPolicy={setApprovalPolicy}
          loading={proposalLoading}
          error={proposalError}
          onCreateProposal={handleCreateProposal}
        />
      )}

      {activeTab === "vote" && (
        <VoteProposalTab
          proposal={proposal}
          proposalId={proposalId}
          setProposalId={setProposalId}
          memberSecret={memberSecret}
          setMemberSecret={setMemberSecret}
          loading={isLoading()}
          error={getCurrentError()}
          onLoadProposal={handleLoadProposal}
          onSubmitVote={handleSubmitVote}
          onIssueVC={handleIssueVC}
        />
      )}

      {activeTab === "manage" && (
        <ManageVCsTab issuedVC={issuedVC} onNavigate={setActiveTab} />
      )}
    </div>
  );
}
