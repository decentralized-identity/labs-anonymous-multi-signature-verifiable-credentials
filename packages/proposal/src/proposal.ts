import { Proposal, ProposalParams, Vote, ProposalStatus, ProposalResult, ApprovalEvidence, SerializedProposal } from './types'
import { createHash, randomBytes } from 'crypto'

export class ProposalImpl implements Proposal {
  public id: string
  public content: any
  public groupId: string
  public approvalThreshold: number
  public votingPeriod?: number
  public status: ProposalStatus
  public approvals: Vote[]
  public rejections: Vote[]
  public createdAt: Date
  public updatedAt: Date
  public expiresAt?: Date
  public merkleRoot: string
  public metadata?: Record<string, any>

  private nullifierSet: Set<string>
  public externalNullifierApprove: string
  public externalNullifierReject: string

  constructor(params: ProposalParams, merkleRoot: string) {
    const nonce = randomBytes(16).toString('hex')
    const contentString = JSON.stringify(params.content)
    this.id = createHash('sha256')
      .update(contentString + nonce + Date.now())
      .digest('hex')

    this.content = params.content
    this.groupId = params.groupId
    this.approvalThreshold = params.approvalThreshold
    this.votingPeriod = params.votingPeriod
    this.metadata = params.metadata

    this.status = 'pending'
    this.approvals = []
    this.rejections = []
    this.createdAt = new Date()
    this.updatedAt = new Date()

    if (params.votingPeriod) {
      this.expiresAt = new Date(this.createdAt.getTime() + params.votingPeriod)
    }

    this.merkleRoot = merkleRoot
    this.nullifierSet = new Set()

    // Generate external nullifiers for voting
    this.externalNullifierApprove = createHash('sha256')
      .update('approve' + this.id)
      .digest('hex')
    this.externalNullifierReject = createHash('sha256')
      .update('reject' + this.id)
      .digest('hex')
  }

  submitVote(vote: Vote): void {
    // Check if voting period has expired
    if (this.expiresAt && new Date() > this.expiresAt) {
      this.status = 'expired'
      throw new Error('Voting period has expired')
    }

    // Check if proposal is already finalized
    if (this.status !== 'pending') {
      throw new Error(`Cannot vote on ${this.status} proposal`)
    }

    // Check for duplicate nullifier
    if (this.nullifierSet.has(vote.nullifierHash)) {
      throw new Error('Duplicate vote detected')
    }

    // Add vote
    if (vote.voteType === 'approve') {
      this.approvals.push({
        ...vote,
        timestamp: vote.timestamp || Date.now()
      })
    } else {
      this.rejections.push({
        ...vote,
        timestamp: vote.timestamp || Date.now()
      })
    }

    this.nullifierSet.add(vote.nullifierHash)
    this.updatedAt = new Date()

    // Check if threshold is met
    this.checkStatus()
  }

  checkStatus(): ProposalStatus {
    // Check if expired
    if (this.expiresAt && new Date() > this.expiresAt) {
      this.status = 'expired'
      return this.status
    }

    // Check if approved
    if (this.approvals.length >= this.approvalThreshold) {
      this.status = 'approved'
      return this.status
    }

    // Check if impossible to approve (too many rejections)
    // This is optional logic - you might want different rules
    const totalVotes = this.approvals.length + this.rejections.length
    const remainingVotes = this.getTotalMembers() - totalVotes
    if (this.approvals.length + remainingVotes < this.approvalThreshold) {
      this.status = 'rejected'
      return this.status
    }

    return this.status
  }

  finalize(): ProposalResult {
    this.checkStatus()

    if (this.status === 'pending') {
      // Force expiration if voting period is over
      if (this.expiresAt && new Date() > this.expiresAt) {
        this.status = 'expired'
      } else {
        throw new Error('Cannot finalize pending proposal')
      }
    }

    return {
      status: this.status,
      approvals: this.approvals,
      rejections: this.rejections,
      finalizedAt: new Date()
    }
  }

  getApprovalEvidence(): ApprovalEvidence {
    return {
      type: 'SemaphoreAnonymousVoting',
      proposalId: this.id,
      groupMerkleRoot: this.merkleRoot,
      approvalThreshold: this.approvalThreshold,
      totalMembers: this.getTotalMembers(),
      approvals: {
        count: this.approvals.length,
        proofs: this.approvals.map(a => ({
          proof: a.proof,
          nullifierHash: a.nullifierHash,
          merkleTreeRoot: a.merkleTreeRoot || this.merkleRoot
        }))
      },
      rejections: {
        count: this.rejections.length,
        proofs: this.rejections.map(r => ({
          proof: r.proof,
          nullifierHash: r.nullifierHash,
          merkleTreeRoot: r.merkleTreeRoot || this.merkleRoot
        }))
      },
      timestamp: new Date().toISOString()
    }
  }

  toJSON(): SerializedProposal {
    return {
      id: this.id,
      content: this.content,
      groupId: this.groupId,
      approvalThreshold: this.approvalThreshold,
      votingPeriod: this.votingPeriod,
      status: this.status,
      approvals: this.approvals,
      rejections: this.rejections,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      expiresAt: this.expiresAt?.toISOString(),
      merkleRoot: this.merkleRoot,
      metadata: this.metadata
    }
  }

  private getTotalMembers(): number {
    // This would typically come from group configuration
    // For now, return a default or from metadata
    return this.metadata?.totalMembers || 10
  }

  static fromJSON(data: SerializedProposal): ProposalImpl {
    const proposal = Object.create(ProposalImpl.prototype)
    Object.assign(proposal, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      nullifierSet: new Set([
        ...data.approvals.map(a => a.nullifierHash),
        ...data.rejections.map(r => r.nullifierHash)
      ])
    })
    return proposal
  }
}