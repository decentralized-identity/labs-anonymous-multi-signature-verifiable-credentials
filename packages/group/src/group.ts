import { Group as SemaphoreGroup } from '@semaphore-protocol/group'
import { Group, GroupConfig, GroupState, MerkleProof } from './types'

export class GroupImpl implements Group {
  public readonly id: string
  public readonly config: GroupConfig
  private semaphoreGroup: SemaphoreGroup
  private memberSet: Set<string>

  constructor(config: GroupConfig) {
    this.id = config.id
    this.config = config
    this.semaphoreGroup = new SemaphoreGroup()
    this.memberSet = new Set()
  }

  addMember(commitment: bigint): void {
    const commitmentStr = commitment.toString()
    if (this.memberSet.has(commitmentStr)) {
      throw new Error(`Member ${commitmentStr} already exists in group ${this.id}`)
    }
    this.semaphoreGroup.addMember(commitment)
    this.memberSet.add(commitmentStr)
  }

  removeMember(commitment: bigint): void {
    const index = this.indexOf(commitment)
    if (index === -1) {
      throw new Error(`Member ${commitment} not found in group ${this.id}`)
    }
    this.semaphoreGroup.removeMember(index)
    this.memberSet.delete(commitment.toString())
  }

  getMerkleRoot(): bigint {
    return this.semaphoreGroup.root
  }

  getMerkleProof(commitment: bigint): MerkleProof {
    const index = this.indexOf(commitment)
    if (index === -1) {
      throw new Error(`Member ${commitment} not found in group ${this.id}`)
    }

    const proof = this.semaphoreGroup.generateMerkleProof(index)

    // Create path indices from index
    const pathIndices: number[] = []
    let currentIndex = index
    for (let i = 0; i < proof.siblings.length; i++) {
      pathIndices.push(currentIndex % 2)
      currentIndex = Math.floor(currentIndex / 2)
    }

    return {
      siblings: proof.siblings.map((s: any) => s.toString()),
      pathIndices
    }
  }

  getMembers(): bigint[] {
    return this.semaphoreGroup.members
  }

  indexOf(commitment: bigint): number {
    return this.semaphoreGroup.indexOf(commitment)
  }

  exportState(): GroupState {
    return {
      id: this.id,
      config: this.config,
      merkleRoot: this.getMerkleRoot().toString(),
      merkleTreeDepth: this.semaphoreGroup.depth,
      members: this.getMembers().map(m => m.toString()),
      memberCount: this.getMembers().length
    }
  }

  getSemaphoreGroup(): SemaphoreGroup {
    return this.semaphoreGroup
  }
}