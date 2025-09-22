/**
 * Types for voting and verification
 */

export interface VoteProof {
  proof: any;
  nullifierHash: string;
  externalNullifier: string;
  signal: string;
  merkleTreeRoot: string;
}

export interface Proposal {
  proposalId: string;
  vcClaims: any;
  approvalThreshold: number;
  totalMembers: number;
  issuerDid: string;
  groupDid: string;
  externalNullifierApprove: string;
  externalNullifierReject: string;
  approvals: VoteProof[];
  rejections: VoteProof[];
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  merkleRoot: string;
}

export interface VerificationResult {
  valid: boolean;
  checks: {
    signatureValid: boolean;
    evidenceValid: boolean;
    thresholdMet: boolean;
    nullifiersUnique: boolean;
    merkleRootValid: boolean;
    approvalProofsValid: boolean;
  };
  details?: {
    issuer?: string;
    approvalCount?: number;
    approvalThreshold?: number;
    merkleRootSource?: string;
    errors?: string[];
  };
}

export interface EvidenceResult {
  evidenceValid: boolean;
  thresholdMet: boolean;
  nullifiersUnique: boolean;
  merkleRootValid: boolean;
  approvalProofsValid: boolean;
  approvalCount?: number;
  approvalThreshold?: number;
  merkleRootSource?: string;
  errors: string[];
}