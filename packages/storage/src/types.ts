import { GroupState, RootRecord } from '@zkmap/group'

// Avoid circular dependency - define interface here instead of importing
export interface Proposal {
  id: string
  toJSON(): any
  [key: string]: any
}

export interface StorageAdapter {
  // Proposal storage
  saveProposal(proposal: Proposal): Promise<void>
  getProposal(id: string): Promise<Proposal | null>
  listProposals(filter?: ProposalFilter): Promise<Proposal[]>
  deleteProposal(id: string): Promise<void>

  // Group storage
  saveGroupState(state: GroupState): Promise<void>
  getGroupState(id: string): Promise<GroupState | null>
  listGroups(): Promise<GroupState[]>
  deleteGroup(id: string): Promise<void>

  // Merkle root history
  saveMerkleRootHistory(record: RootRecord): Promise<void>
  getMerkleRootHistory(groupId: string): Promise<RootRecord[]>
  pruneOldRoots(groupId: string, before: Date): Promise<void>

  // Issued VCs storage
  saveIssuedVC(vc: IssuedVC): Promise<void>
  getIssuedVC(id: string): Promise<IssuedVC | null>
  listIssuedVCs(filter?: VCFilter): Promise<IssuedVC[]>

  // General
  connect?(): Promise<void>
  disconnect?(): Promise<void>
  clear?(): Promise<void>
}

export interface ProposalFilter {
  groupId?: string
  status?: string
  createdAfter?: Date
  createdBefore?: Date
}

export interface VCFilter {
  issuerDid?: string
  proposalId?: string
  issuedAfter?: Date
  issuedBefore?: Date
}

export interface IssuedVC {
  id: string
  proposalId: string
  vc: any
  issuedAt: Date
  issuerDid: string
  evidence?: any
}

export interface StorageConfig {
  type: 'memory' | 'mongodb' | 'postgres' | 'file'
  connectionString?: string
  options?: Record<string, any>
}

export interface StorageFactory {
  createAdapter(config: StorageConfig): StorageAdapter
}