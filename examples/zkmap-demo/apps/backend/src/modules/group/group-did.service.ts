import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Agent } from '../../lib/veramo/agent'
import { SemaphoreGroupManager, SemaphoreGroupConfig } from '../../lib/semaphore/group-manager'
import { Identity } from '@semaphore-protocol/identity'
import { IIdentifier } from '@veramo/core'
import { Group, GroupDocument, GroupConfig, GroupConfigDocument } from './group.schema'
import { MerkleRootHistory, MerkleRootHistoryDocument } from './merkle-root-history.schema'

export interface GroupDIDConfig {
  groupName: string
  groupDescription: string
  semaphoreContractAddress?: string
  chainId?: string
}

// Global instance for in-memory Semaphore groups
const globalGroupManager = new SemaphoreGroupManager()
let globalServiceInstance: GroupDIDService | null = null

@Injectable()
export class GroupDIDService {
  private agent: Agent | null = null
  private groupManager: SemaphoreGroupManager

  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupConfig.name) private groupConfigModel: Model<GroupConfigDocument>,
    @InjectModel(MerkleRootHistory.name) private merkleRootHistoryModel: Model<MerkleRootHistoryDocument>
  ) {
    this.groupManager = globalGroupManager
  }

  async initialize(agent: Agent) {
    this.agent = agent
  }

  async createGroupDID(config: GroupDIDConfig): Promise<{
    did: IIdentifier
    semaphoreGroup: ReturnType<SemaphoreGroupManager['exportGroupData']>
  }> {
    if (!this.agent) {
      throw new Error('Agent not initialized')
    }

    // Generate a unique group ID
    const groupId = Date.now().toString()

    // Create Semaphore group
    const semaphoreConfig: SemaphoreGroupConfig = {
      groupId,
      name: config.groupName,
      description: config.groupDescription,
      merkleTreeDepth: 20,
    }
    
    const group = this.groupManager.createGroup(semaphoreConfig)

    console.log('process.env.INFURA_PROJECT_ID', process.env.INFURA_PROJECT_ID)
    
    // Determine which network to use
    const networkToUse = process.env.INFURA_PROJECT_ID ? 'sepolia' : 'hardhat'
    console.log('Using network:', networkToUse)
    
    // Create DID for the group
    const identifier = await this.agent.didManagerCreate({
      provider: 'did:ethr',
      options: {
        network: networkToUse,
      },
    })

    console.log('Created DID:', identifier.did)

    // Store in MongoDB
    await this.groupModel.create({
      did: identifier.did,
      identifier,
      groupId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Generate archive config with group-specific endpoint
    const archiveConfig = {
      type: 'MongoDB',
      endpoint: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/groups/${groupId}/merkle-roots`
    }

    await this.groupConfigModel.create({
      ...semaphoreConfig,
      members: [],
      merkleRoot: group.root.toString(),
      archiveConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Initialize merkle root history collection
    await this.merkleRootHistoryModel.create({
      groupId,
      root: group.root.toString(),
      blockNumber: null, // Will be null for off-chain groups
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    })

    return {
      did: identifier,
      semaphoreGroup: this.groupManager.exportGroupData(groupId),
    }
  }

  private async buildGroupDIDDocument(
    identifier: IIdentifier,
    groupId: string,
    config: GroupDIDConfig
  ) {
    const groupData = this.groupManager.exportGroupData(groupId)
    
    // Get historical merkle roots from database
    const merkleRootHistory = await this.getMerkleRootHistory(groupId)
    
    // Build service endpoints for the DID Document according to spec
    const services: any[] = []
    
    // Semaphore Group service endpoint
    if (config.semaphoreContractAddress) {
      services.push({
        id: `${identifier.did}#semaphore`,
        type: 'SemaphoreGroup',
        serviceEndpoint: {
          type: 'EthereumSmartContract',
          contractAddress: config.semaphoreContractAddress,
          chainId: config.chainId || 'eip155:1',
        },
      })
    } else {
      services.push({
        id: `${identifier.did}#semaphore`,
        type: 'SemaphoreGroup',
        serviceEndpoint: {
          type: 'OffChain',
          groupId: groupId,
          merkleTreeDepth: groupData.merkleTreeDepth,
        },
      })
    }

    // Get archive config from stored group config
    const groupConfig = await this.groupConfigModel.findOne({ groupId })

    // Get total count for archive info
    const totalRootsCount = await this.merkleRootHistoryModel
      .countDocuments({ groupId }) || 0

    // Use stored archive config or generate default
    const archiveInfo = groupConfig?.archiveConfig || {
      type: 'MongoDB',
      endpoint: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/groups/${groupId}/merkle-roots`
    }

    services.push({
      id: `${identifier.did}#merkle-roots-history`,
      type: 'MerkleRootHistory',
      recentRoots: merkleRootHistory, // Only recent 10 roots
      archiveInfo: {
        ...archiveInfo,
        totalRoots: totalRootsCount
      }
    })

    return {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: identifier.did,
      verificationMethod: identifier.keys.map(key => ({
        id: `${identifier.did}#${key.kid}`,
        type: key.type === 'Secp256k1' ? 'EcdsaSecp256k1VerificationKey2019' : 'Ed25519VerificationKey2018',
        controller: identifier.did,
        publicKeyHex: key.publicKeyHex,
      })),
      authentication: identifier.keys.map(key => `${identifier.did}#${key.kid}`),
      service: services,
    }
  }

  async addMemberToGroup(groupDid: string, memberIdentity: Identity): Promise<void> {
    console.log('Looking for group DID:', groupDid)

    // Find group data from MongoDB
    const groupData = await this.groupModel.findOne({ did: groupDid })
    
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    // Restore group in memory if needed
    const groupConfig = await this.groupConfigModel.findOne({ groupId: groupData.groupId })
    
    if (!this.groupManager.getGroup(groupData.groupId)) {
      this.groupManager.createGroup(groupConfig as unknown as SemaphoreGroupConfig)
    }

    // Add member to Semaphore group
    this.groupManager.addMember(groupData.groupId, memberIdentity)

    const newMerkleRoot = this.groupManager.getMerkleRoot(groupData.groupId).toString()

    // Update MongoDB with new member
    await this.groupConfigModel.updateOne(
      { groupId: groupData.groupId },
      {
        $push: { members: memberIdentity.commitment.toString() } as any,
        $set: {
          merkleRoot: newMerkleRoot,
          updatedAt: new Date()
        }
      }
    )

    // Add new merkle root to history
    await this.merkleRootHistoryModel.create({
      groupId: groupData.groupId,
      root: newMerkleRoot,
      blockNumber: null, // Will be null for off-chain groups
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    })
  }

  private async getMerkleRootHistory(groupId: string, limit: number = 10) {
    // Get only the most recent N roots for DID document
    const history = await this.merkleRootHistoryModel
      .find({ groupId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit) // Only get recent 10
      .exec()

    // Reverse to maintain chronological order (oldest to newest)
    return history.reverse().map(entry => ({
      root: entry.root,
      blockNumber: entry.blockNumber,
      timestamp: entry.timestamp,
    }))
  }

  // Search for a specific merkle root in the full history (MongoDB archive)
  async searchMerkleRoot(groupId: string, targetRoot: string): Promise<any | null> {
    const rootEntry = await this.merkleRootHistoryModel.findOne({
      groupId,
      root: targetRoot
    })

    if (!rootEntry) {
      return null
    }

    return {
      root: rootEntry.root,
      blockNumber: rootEntry.blockNumber,
      timestamp: rootEntry.timestamp,
      createdAt: rootEntry.createdAt
    }
  }

  async getGroupInfo(groupDid: string) {
    // Find group data from MongoDB
    const groupData = await this.groupModel.findOne({ did: groupDid })
    
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    // Get config from MongoDB
    const groupConfig = await this.groupConfigModel.findOne({ groupId: groupData.groupId })
    
    if (!groupConfig) {
      throw new Error(`Group config not found for ID: ${groupData.groupId}`)
    }

    console.log('Raw groupConfig from MongoDB:', groupConfig) // Debug

    // Restore group in memory if needed
    if (!this.groupManager.getGroup(groupData.groupId)) {
      this.groupManager.createGroup(groupConfig as unknown as SemaphoreGroupConfig)
      
      // Restore members to the in-memory group
      if (groupConfig?.members && groupConfig.members.length > 0) {
        console.log('Restoring members:', groupConfig.members) // Debug
        for (const memberCommitment of groupConfig.members) {
          try {
            // Add member commitment to the Semaphore group
            const group = this.groupManager.getGroup(groupData.groupId)
            if (group) {
              group.addMember(BigInt(memberCommitment))
            }
          } catch (error) {
            console.error('Failed to restore member:', memberCommitment, error)
          }
        }
      }
    }

    const groupExportData = this.groupManager.exportGroupData(groupData.groupId)
    console.log('Final groupExportData:', groupExportData) // Debug
    
    const didDocument = await this.buildGroupDIDDocument(
      groupData.identifier,
      groupData.groupId,
      {
        groupName: groupExportData.config.name,
        groupDescription: groupExportData.config.description,
      }
    )

    return {
      did: groupData.identifier,
      semaphoreGroup: groupExportData,
      didDocument,
    }
  }

  // Static method to get or create global instance
}