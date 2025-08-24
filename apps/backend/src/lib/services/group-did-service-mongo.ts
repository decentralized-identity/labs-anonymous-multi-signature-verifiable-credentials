import { Agent } from '../veramo/agent'
import { SemaphoreGroupManager, SemaphoreGroupConfig } from '../semaphore/group-manager'
import { Identity } from '@semaphore-protocol/identity'
import { IIdentifier } from '@veramo/core'
import { connectToDatabase } from '../db/mongodb'
import { Db } from 'mongodb'

export interface GroupDIDConfig {
  groupName: string
  groupDescription: string
  semaphoreContractAddress?: string
  chainId?: string
  merkleRootHistoryEndpoint?: string
}

// Global instance for in-memory Semaphore groups
const globalGroupManager = new SemaphoreGroupManager()
let globalServiceInstance: GroupDIDService | null = null

export class GroupDIDService {
  private agent: Agent | null = null
  private groupManager: SemaphoreGroupManager
  private db: Db | null = null

  constructor() {
    this.groupManager = globalGroupManager
  }

  async initialize(agent: Agent) {
    this.agent = agent
    const { db } = await connectToDatabase()
    this.db = db
  }

  async createGroupDID(config: GroupDIDConfig): Promise<{
    did: IIdentifier
    semaphoreGroup: ReturnType<SemaphoreGroupManager['exportGroupData']>
  }> {
    if (!this.agent || !this.db) {
      throw new Error('Service not initialized')
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
    const groupDIDsCollection = this.db.collection('groupDIDs')
    const groupConfigsCollection = this.db.collection('groupConfigs')

    await groupDIDsCollection.insertOne({
      did: identifier.did,
      identifier,
      groupId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await groupConfigsCollection.insertOne({
      ...semaphoreConfig,
      members: [],
      merkleRoot: group.root.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
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
          merkleRoot: groupData.merkleRoot,
        },
      })
    } else {
      services.push({
        id: `${identifier.did}#semaphore`,
        type: 'SemaphoreGroup',
        serviceEndpoint: {
          type: 'OffChain',
          groupId: groupId,
          merkleRoot: groupData.merkleRoot,
          merkleTreeDepth: groupData.merkleTreeDepth,
        },
      })
    }

    if (config.merkleRootHistoryEndpoint) {
      services.push({
        id: `${identifier.did}#merkle-roots-history`,
        type: 'MerkleRootHistory',
        serviceEndpoint: config.merkleRootHistoryEndpoint,
      })
    }

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
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    console.log('Looking for group DID:', groupDid)
    
    // Find group data from MongoDB
    const groupDIDsCollection = this.db.collection('groupDIDs')
    const groupData = await groupDIDsCollection.findOne({ did: groupDid })
    
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    // Restore group in memory if needed
    const groupConfigsCollection = this.db.collection('groupConfigs')
    const groupConfig = await groupConfigsCollection.findOne({ groupId: groupData.groupId })
    
    if (!this.groupManager.getGroup(groupData.groupId)) {
      this.groupManager.createGroup(groupConfig as unknown as SemaphoreGroupConfig)
    }

    // Add member to Semaphore group
    this.groupManager.addMember(groupData.groupId, memberIdentity)

    // Update MongoDB with new member
    await groupConfigsCollection.updateOne(
      { groupId: groupData.groupId },
      { 
        $push: { members: memberIdentity.commitment.toString() } as any,
        $set: { 
          merkleRoot: this.groupManager.getMerkleRoot(groupData.groupId).toString(),
          updatedAt: new Date() 
        }
      }
    )
  }

  async getGroupInfo(groupDid: string) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // Find group data from MongoDB
    const groupDIDsCollection = this.db.collection('groupDIDs')
    const groupData = await groupDIDsCollection.findOne({ did: groupDid })
    
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    // Get config from MongoDB
    const groupConfigsCollection = this.db.collection('groupConfigs')
    const groupConfig = await groupConfigsCollection.findOne({ groupId: groupData.groupId })
    
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
  static async getInstance(agent?: Agent): Promise<GroupDIDService> {
    if (!globalServiceInstance) {
      globalServiceInstance = new GroupDIDService()
      if (agent) {
        await globalServiceInstance.initialize(agent)
      }
    } else if (agent && (!globalServiceInstance.agent || !globalServiceInstance.db)) {
      await globalServiceInstance.initialize(agent)
    }
    
    return globalServiceInstance
  }
}