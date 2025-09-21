import { ZKProof } from '@zkmap/proof'

export interface ProposalParams {
  content: any
  groupId: string
  approvalThreshold: number
  votingPeriod?: number
  metadata?: Record<string, any>
}

export interface Vote {
  proof: ZKProof | any
  voteType: 'approve' | 'reject'
  nullifierHash: string
  timestamp?: number
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface ProposalResult {
  status: ProposalStatus
  approvals: Vote[]
  rejections: Vote[]
  finalizedAt?: Date
}

export interface Proposal {
  id: string
  content: any
  groupId: string
  approvalThreshold: number
  votingPeriod?: number
  status: ProposalStatus
  approvals: Vote[]
  rejections: Vote[]
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  merkleRoot: string
  metadata?: Record<string, any>

  submitVote(vote: Vote): void
  checkStatus(): ProposalStatus
  finalize(): ProposalResult
  getApprovalEvidence(): ApprovalEvidence
  toJSON(): SerializedProposal
}

export interface SerializedProposal {
  id: string
  content: any
  groupId: string
  approvalThreshold: number
  votingPeriod?: number
  status: ProposalStatus
  approvals: Vote[]
  rejections: Vote[]
  createdAt: string
  updatedAt: string
  expiresAt?: string
  merkleRoot: string
  metadata?: Record<string, any>
}

export interface ApprovalEvidence {
  type: 'SemaphoreAnonymousVoting'
  proposalId: string
  groupMerkleRoot: string
  approvalThreshold: number
  totalMembers?: number
  approvals: {
    count: number
    nullifiers: string[]
  }
  rejections?: {
    count: number
    nullifiers: string[]
  }
  timestamp: string
}

export interface ProposalManager {
  createProposal(params: ProposalParams): Promise<Proposal>
  getProposal(proposalId: string): Promise<Proposal | null>
  submitVote(proposalId: string, vote: Vote): Promise<void>
  getProposalStatus(proposalId: string): Promise<ProposalStatus>
  finalizeProposal(proposalId: string): Promise<ProposalResult>
  listProposals(filter?: ProposalFilter): Promise<Proposal[]>
}

export interface ProposalFilter {
  groupId?: string
  status?: ProposalStatus
  createdAfter?: Date
  createdBefore?: Date
}