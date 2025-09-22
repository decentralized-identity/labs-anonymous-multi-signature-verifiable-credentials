import { VCClaims, Proposal, IssuedVC } from '@/types/issuance'

const API_BASE_URL = 'http://localhost:3001/api'

export interface CreateProposalRequest {
  vcClaims: VCClaims
  groupDid: string
  approvalPolicy: { m: number; n: number }
}

export interface SubmitVoteRequest {
  memberSecret: string
  voteType: 'approve' | 'reject'
  groupDid: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export class IssuanceService {
  static async createProposal(request: CreateProposalRequest): Promise<ApiResponse<Proposal>> {
    const response = await fetch(`${API_BASE_URL}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return response.json()
  }

  static async getProposal(proposalId: string): Promise<ApiResponse<Proposal>> {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`)
    return response.json()
  }

  static async submitVote(proposalId: string, request: SubmitVoteRequest): Promise<ApiResponse<{ proposal: Proposal }>> {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return response.json()
  }

  static async issueVC(proposalId: string): Promise<ApiResponse<IssuedVC>> {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  }
}