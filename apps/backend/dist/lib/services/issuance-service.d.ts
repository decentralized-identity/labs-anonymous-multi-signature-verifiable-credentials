import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { Agent } from "../veramo/agent";
export interface VCClaims {
    subject: string;
    credentialSubject: {
        id: string;
        [key: string]: any;
    };
    [key: string]: any;
}
export interface VoteProof {
    proof: any;
    nullifierHash: string;
    externalNullifier: string;
    signal: string;
    merkleTreeRoot: string;
}
export interface IssuanceProposal {
    proposalId: string;
    vcClaims: VCClaims;
    groupDid: string;
    groupId: string;
    externalNullifierApprove: string;
    externalNullifierReject: string;
    approvals: VoteProof[];
    rejections: VoteProof[];
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    merkleRoot: string;
    approvalThreshold: number;
    totalMembers: number;
}
export declare class IssuanceService {
    private agent;
    private db;
    initialize(agent: Agent): Promise<void>;
    createIssuanceProposal(vcClaims: VCClaims, groupDid: string, approvalPolicy: {
        m: number;
        n: number;
    }): Promise<IssuanceProposal>;
    generateVoteProof(proposalId: string, memberIdentity: Identity, voteType: "approve" | "reject", group: Group): Promise<VoteProof>;
    submitVote(proposalId: string, voteProof: VoteProof, voteType: "approve" | "reject"): Promise<void>;
    private checkAndUpdateProposalStatus;
    issueVCWithEvidence(proposalId: string): Promise<any>;
    getProposal(proposalId: string): Promise<IssuanceProposal | null>;
    static getInstance(agent?: Agent): Promise<IssuanceService>;
}
