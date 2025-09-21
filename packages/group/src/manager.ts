import { GroupManager, Group, GroupConfig, GroupState, MerkleProof } from './types'
import { GroupImpl } from './group'

export class GroupManagerImpl implements GroupManager {
  private groups: Map<string, GroupImpl> = new Map()

  createGroup(config: GroupConfig): Group {
    if (this.groups.has(config.id)) {
      throw new Error(`Group ${config.id} already exists`)
    }
    const group = new GroupImpl(config)
    this.groups.set(config.id, group)
    return group
  }

  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId)
  }

  addMember(groupId: string, commitment: bigint): void {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    group.addMember(commitment)
  }

  removeMember(groupId: string, commitment: bigint): void {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    group.removeMember(commitment)
  }

  getMerkleRoot(groupId: string): bigint {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.getMerkleRoot()
  }

  getMerkleProof(groupId: string, commitment: bigint): MerkleProof {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.getMerkleProof(commitment)
  }

  exportGroupState(groupId: string): GroupState {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.exportState()
  }

  getAllGroups(): Map<string, Group> {
    return new Map(this.groups)
  }
}