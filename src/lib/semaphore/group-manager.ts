import { Group } from '@semaphore-protocol/group'
import { Identity } from '@semaphore-protocol/identity'
import { generateProof, verifyProof } from '@semaphore-protocol/proof'

export interface SemaphoreGroupConfig {
  groupId: string
  name: string
  description: string
  merkleTreeDepth: number
  approvalPolicy: {
    m: number // minimum required approvals
    n: number // total number of members
  }
}

export class SemaphoreGroupManager {
  private groups: Map<string, Group> = new Map()
  public groupConfigs: Map<string, SemaphoreGroupConfig> = new Map()
  private memberIdentities: Map<string, Map<string, Identity>> = new Map()

  createGroup(config: SemaphoreGroupConfig): Group {
    // Create a new Semaphore group with empty members array
    const group = new Group([], config.merkleTreeDepth)
    this.groups.set(config.groupId, group)
    this.groupConfigs.set(config.groupId, config)
    this.memberIdentities.set(config.groupId, new Map())
    return group
  }

  addMember(groupId: string, identity: Identity): void {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    
    const memberMap = this.memberIdentities.get(groupId)!
    const memberId = identity.commitment.toString()
    
    if (memberMap.has(memberId)) {
      throw new Error(`Member already exists in group ${groupId}`)
    }
    
    group.addMember(identity.commitment)
    memberMap.set(memberId, identity)
  }

  removeMember(groupId: string, identityCommitment: bigint): void {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    
    const memberMap = this.memberIdentities.get(groupId)!
    memberMap.delete(identityCommitment.toString())
    
    const index = group.indexOf(identityCommitment)
    if (index === -1) {
      throw new Error(`Member not found in group ${groupId}`)
    }
    
    group.removeMember(index)
  }

  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId)
  }

  getGroupConfig(groupId: string): SemaphoreGroupConfig | undefined {
    return this.groupConfigs.get(groupId)
  }

  getMerkleRoot(groupId: string): bigint {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.root
  }

  getMerkleProof(groupId: string, identityCommitment: bigint) {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    
    const index = group.indexOf(identityCommitment)
    if (index === -1) {
      throw new Error(`Member not found in group ${groupId}`)
    }
    
    return group.generateMerkleProof(index)
  }

  getMembers(groupId: string): bigint[] {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.members
  }

  getMemberIdentities(groupId: string): Map<string, Identity> {
    return this.memberIdentities.get(groupId) || new Map()
  }

  exportGroupData(groupId: string) {
    const group = this.groups.get(groupId)
    const config = this.groupConfigs.get(groupId)
    
    if (!group || !config) {
      throw new Error(`Group ${groupId} not found`)
    }
    
    return {
      config,
      merkleRoot: group.root.toString(),
      merkleTreeDepth: group.depth,
      members: group.members.map(m => m.toString()),
      memberCount: group.members.length,
    }
  }
}