import { ProposalManager, Proposal, ProposalParams, Vote, ProposalStatus, ProposalResult, ProposalFilter } from './types'
import { ProposalImpl } from './proposal'
import { GroupManager } from '@zkmpa/group'
import { StorageAdapter } from '@zkmpa/storage'

export class ProposalManagerImpl implements ProposalManager {
  private proposals: Map<string, ProposalImpl> = new Map()
  private groupManager?: GroupManager
  private storage?: StorageAdapter

  constructor(groupManager?: GroupManager, storage?: StorageAdapter) {
    this.groupManager = groupManager
    this.storage = storage
  }

  async createProposal(params: ProposalParams): Promise<Proposal> {
    // Get current merkle root from group
    let merkleRoot = '0'
    if (this.groupManager) {
      const group = this.groupManager.getGroup(params.groupId)
      if (group) {
        merkleRoot = group.getMerkleRoot().toString()
      }
    }

    const proposal = new ProposalImpl(params, merkleRoot)
    this.proposals.set(proposal.id, proposal)

    // Save to storage if available
    if (this.storage) {
      await this.storage.saveProposal(proposal)
    }

    return proposal
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    // Try memory first
    let proposal = this.proposals.get(proposalId)

    // Try storage if not in memory
    if (!proposal && this.storage) {
      proposal = await this.storage.getProposal(proposalId) as ProposalImpl
      if (proposal) {
        this.proposals.set(proposalId, proposal)
      }
    }

    return proposal || null
  }

  async submitVote(proposalId: string, vote: Vote): Promise<void> {
    const proposal = await this.getProposal(proposalId)
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`)
    }

    proposal.submitVote(vote)

    // Update storage
    if (this.storage) {
      await this.storage.saveProposal(proposal)
    }
  }

  async getProposalStatus(proposalId: string): Promise<ProposalStatus> {
    const proposal = await this.getProposal(proposalId)
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`)
    }

    return proposal.checkStatus()
  }

  async finalizeProposal(proposalId: string): Promise<ProposalResult> {
    const proposal = await this.getProposal(proposalId)
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`)
    }

    const result = proposal.finalize()

    // Update storage
    if (this.storage) {
      await this.storage.saveProposal(proposal)
    }

    return result
  }

  async listProposals(filter?: ProposalFilter): Promise<Proposal[]> {
    let proposals = Array.from(this.proposals.values())

    if (filter) {
      if (filter.groupId) {
        proposals = proposals.filter(p => p.groupId === filter.groupId)
      }
      if (filter.status) {
        proposals = proposals.filter(p => p.status === filter.status)
      }
      if (filter.createdAfter) {
        proposals = proposals.filter(p => p.createdAt >= filter.createdAfter!)
      }
      if (filter.createdBefore) {
        proposals = proposals.filter(p => p.createdAt <= filter.createdBefore!)
      }
    }

    return proposals
  }

  setGroupManager(groupManager: GroupManager): void {
    this.groupManager = groupManager
  }

  setStorage(storage: StorageAdapter): void {
    this.storage = storage
  }
}