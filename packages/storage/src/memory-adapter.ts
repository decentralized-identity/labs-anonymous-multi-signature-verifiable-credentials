import { StorageAdapter, ProposalFilter, VCFilter, IssuedVC, Proposal } from './types'
import { GroupState, RootRecord } from '@zkmpa/group'

export class InMemoryStorageAdapter implements StorageAdapter {
  private proposals: Map<string, Proposal> = new Map()
  private groups: Map<string, GroupState> = new Map()
  private merkleRootHistory: Map<string, RootRecord[]> = new Map()
  private issuedVCs: Map<string, IssuedVC> = new Map()

  async saveProposal(proposal: Proposal): Promise<void> {
    this.proposals.set(proposal.id, proposal)
  }

  async getProposal(id: string): Promise<Proposal | null> {
    const proposal = this.proposals.get(id)
    return proposal || null
  }

  async listProposals(filter?: ProposalFilter): Promise<Proposal[]> {
    let proposals = Array.from(this.proposals.values())

    if (filter) {
      if (filter.groupId) {
        proposals = proposals.filter(p => p['groupId'] === filter.groupId)
      }
      if (filter.status) {
        proposals = proposals.filter(p => p['status'] === filter.status)
      }
      if (filter.createdAfter) {
        proposals = proposals.filter(p => new Date(p['createdAt']) >= filter.createdAfter!)
      }
      if (filter.createdBefore) {
        proposals = proposals.filter(p => new Date(p['createdAt']) <= filter.createdBefore!)
      }
    }

    return proposals
  }

  async deleteProposal(id: string): Promise<void> {
    this.proposals.delete(id)
  }

  async saveGroupState(state: GroupState): Promise<void> {
    this.groups.set(state.id, state)
  }

  async getGroupState(id: string): Promise<GroupState | null> {
    return this.groups.get(id) || null
  }

  async listGroups(): Promise<GroupState[]> {
    return Array.from(this.groups.values())
  }

  async deleteGroup(id: string): Promise<void> {
    this.groups.delete(id)
    this.merkleRootHistory.delete(id)
  }

  async saveMerkleRootHistory(record: RootRecord): Promise<void> {
    if (!this.merkleRootHistory.has(record.groupId)) {
      this.merkleRootHistory.set(record.groupId, [])
    }

    const history = this.merkleRootHistory.get(record.groupId)!
    history.push(record)

    // Sort by timestamp
    history.sort((a, b) => a.timestamp - b.timestamp)
  }

  async getMerkleRootHistory(groupId: string): Promise<RootRecord[]> {
    return this.merkleRootHistory.get(groupId) || []
  }

  async pruneOldRoots(groupId: string, before: Date): Promise<void> {
    const history = this.merkleRootHistory.get(groupId)
    if (!history) return

    const beforeTimestamp = before.getTime()
    const prunedHistory = history.filter(record =>
      record.timestamp >= beforeTimestamp
    )

    this.merkleRootHistory.set(groupId, prunedHistory)
  }

  async saveIssuedVC(vc: IssuedVC): Promise<void> {
    this.issuedVCs.set(vc.id, vc)
  }

  async getIssuedVC(id: string): Promise<IssuedVC | null> {
    return this.issuedVCs.get(id) || null
  }

  async listIssuedVCs(filter?: VCFilter): Promise<IssuedVC[]> {
    let vcs = Array.from(this.issuedVCs.values())

    if (filter) {
      if (filter.issuerDid) {
        vcs = vcs.filter(vc => vc.issuerDid === filter.issuerDid)
      }
      if (filter.proposalId) {
        vcs = vcs.filter(vc => vc.proposalId === filter.proposalId)
      }
      if (filter.issuedAfter) {
        vcs = vcs.filter(vc => vc.issuedAt >= filter.issuedAfter!)
      }
      if (filter.issuedBefore) {
        vcs = vcs.filter(vc => vc.issuedAt <= filter.issuedBefore!)
      }
    }

    return vcs
  }

  async clear(): Promise<void> {
    this.proposals.clear()
    this.groups.clear()
    this.merkleRootHistory.clear()
    this.issuedVCs.clear()
  }

  // Optional methods
  async connect(): Promise<void> {
    // No-op for in-memory storage
  }

  async disconnect(): Promise<void> {
    // No-op for in-memory storage
  }
}