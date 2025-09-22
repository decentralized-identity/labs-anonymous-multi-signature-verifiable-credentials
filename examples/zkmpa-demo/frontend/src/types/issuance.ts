export interface VCClaims {
  subject: string;
  credentialSubject: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Proposal {
  proposalId: string;
  vcClaims: VCClaims;
  groupDid: string;
  groupId?: string;
  externalNullifierApprove: string;
  externalNullifierReject: string;
  approvals: Array<{ nullifierHash: string }>;
  rejections: Array<{ nullifierHash: string }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  merkleRoot?: string;
  approvalThreshold: number;
  totalMembers: number;
}

export interface IssuedVC {
  credential: string;
  verifiableCredential?: any;
  evidence?: any;
}

export type TabType = 'create' | 'vote' | 'manage';

export const TABS = [
  { id: 'create' as const, label: 'Create Proposal', icon: '📝' },
  { id: 'vote' as const, label: 'Vote on Proposal', icon: '🗳️' },
  { id: 'manage' as const, label: 'Manage VCs', icon: '🎫' },
];

export const DEFAULT_APPROVAL_POLICY = {
  m: 2, // minimum approvals required
  n: 3  // total members who can vote
};