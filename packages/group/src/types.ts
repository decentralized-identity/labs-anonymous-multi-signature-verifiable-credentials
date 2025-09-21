export interface GroupConfig {
  id: string
  name: string
  merkleTreeDepth: number
  did?: string
}

export interface GroupState {
  id: string
  config: GroupConfig
  merkleRoot: string
  merkleTreeDepth: number
  members: string[]
  memberCount: number
}

export interface MerkleProof {
  siblings: string[]
  pathIndices: number[]
}

export interface RootRecord {
  groupId: string
  root: string
  timestamp: number
  blockNumber?: number
}

export interface Group {
  id: string
  config: GroupConfig
  addMember(commitment: bigint): void
  removeMember(commitment: bigint): void
  getMerkleRoot(): bigint
  getMerkleProof(commitment: bigint): MerkleProof
  getMembers(): bigint[]
  indexOf(commitment: bigint): number
  exportState(): GroupState
}

export interface GroupManager {
  createGroup(config: GroupConfig): Group
  getGroup(groupId: string): Group | undefined
  addMember(groupId: string, commitment: bigint): void
  removeMember(groupId: string, commitment: bigint): void
  getMerkleRoot(groupId: string): bigint
  getMerkleProof(groupId: string, commitment: bigint): MerkleProof
  exportGroupState(groupId: string): GroupState
}

export interface MerkleRootHistory {
  trackRoot(groupId: string, root: bigint, timestamp?: number): void
  verifyHistoricalRoot(groupId: string, root: bigint, maxAge?: number): boolean
  getRootHistory(groupId: string): RootRecord[]
  pruneOldRoots(groupId: string, maxAge: number): void
}