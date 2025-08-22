import { Agent } from '../veramo/agent'
import { SemaphoreGroupManager, SemaphoreGroupConfig } from '../semaphore/group-manager'
import { Identity } from '@semaphore-protocol/identity'
import { IIdentifier } from '@veramo/core'
import * as fs from 'fs'
import * as path from 'path'

export interface GroupDIDConfig {
  groupName: string
  groupDescription: string
  approvalPolicy: {
    m: number
    n: number
  }
  semaphoreContractAddress?: string
  chainId?: string
  merkleRootHistoryEndpoint?: string
}

// File-based storage path
const STORAGE_PATH = './group-data.json'

// Global storage to persist across API calls
const globalGroupManager = new SemaphoreGroupManager()
const globalGroupDIDs = new Map<string, { identifier: IIdentifier, groupId: string }>()

// Load data from file
function loadDataFromFile() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'))
      
      // Clear existing data before loading
      globalGroupDIDs.clear()
      
      // Restore group DIDs
      for (const [did, groupData] of Object.entries(data.groupDIDs || {})) {
        globalGroupDIDs.set(did, groupData as { identifier: IIdentifier, groupId: string })
      }
      
      // Restore group manager data
      if (data.groupConfigs) {
        for (const [groupId, config] of Object.entries(data.groupConfigs)) {
          try {
            // Check if group already exists
            if (!globalGroupManager.getGroup(groupId)) {
              globalGroupManager.createGroup(config as SemaphoreGroupConfig)
              console.log('Restored group:', groupId)
            }
          } catch (error) {
            console.error('Failed to restore group:', groupId, error)
          }
        }
      }
      
      // Restore members if any
      if (data.members) {
        // TODO: Restore member identities if needed
      }
      
      console.log('Loaded data from file:', globalGroupDIDs.size, 'groups')
    }
  } catch (error) {
    console.error('Failed to load data from file:', error)
  }
}

// Save data to file
function saveDataToFile() {
  try {
    const data = {
      groupDIDs: Object.fromEntries(globalGroupDIDs.entries()),
      groupConfigs: Object.fromEntries(globalGroupManager.groupConfigs.entries())
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2))
    console.log('Saved data to file')
  } catch (error) {
    console.error('Failed to save data to file:', error)
  }
}

// Global service instance
let globalServiceInstance: GroupDIDService | null = null

export class GroupDIDService {
  private agent: Agent | null = null
  private groupManager: SemaphoreGroupManager
  private groupDIDs: Map<string, { identifier: IIdentifier, groupId: string }>

  constructor() {
    // Use global instances to persist data across API calls
    this.groupManager = globalGroupManager
    this.groupDIDs = globalGroupDIDs
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

    // Generate a unique group ID (Semaphore requires a numeric ID)
    const groupId = Date.now().toString()

    // Create Semaphore group
    const semaphoreConfig: SemaphoreGroupConfig = {
      groupId,
      name: config.groupName,
      description: config.groupDescription,
      merkleTreeDepth: 20, // Standard depth for Semaphore groups
      approvalPolicy: config.approvalPolicy,
    }
    
    const group = this.groupManager.createGroup(semaphoreConfig)

    // Create DID for the group
    const identifier = await this.agent.didManagerCreate({
      provider: 'did:ethr',
      options: {
        network: 'mainnet', // Using mainnet for Universal Resolver compatibility
      },
    })

    // Log the private key info (for demo purposes only - never log in production!)
    console.log('Created DID:', identifier.did)
    console.log('Keys:', identifier.keys.map(key => ({
      kid: key.kid,
      type: key.type,
      publicKeyHex: key.publicKeyHex,
      // Private key is stored encrypted in the database
    })))

    // Store the association with both identifier and groupId
    this.groupDIDs.set(identifier.did, { identifier, groupId })
    console.log('Stored group DID:', identifier.did)
    console.log('Total groups stored:', this.groupDIDs.size)
    
    // Save to file
    saveDataToFile()

    // Update DID Document with Semaphore group information
    const didDocument = await this.buildGroupDIDDocument(
      identifier,
      groupId,
      config
    )

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
      // On-chain Semaphore group
      services.push({
        id: `${identifier.did}#semaphore`,
        type: 'SemaphoreGroup',
        serviceEndpoint: {
          type: 'EthereumSmartContract',
          contractAddress: config.semaphoreContractAddress,
          chainId: config.chainId || 'eip155:1', // Mainnet chain ID
          merkleRoot: groupData.merkleRoot,
          approvalPolicy: {
            m: config.approvalPolicy.m,
            n: config.approvalPolicy.n,
          },
        },
      })
    } else {
      // Off-chain Semaphore group
      services.push({
        id: `${identifier.did}#semaphore`,
        type: 'SemaphoreGroup',
        serviceEndpoint: {
          type: 'OffChain',
          groupId: groupId,
          merkleRoot: groupData.merkleRoot,
          merkleTreeDepth: groupData.merkleTreeDepth,
          approvalPolicy: {
            m: config.approvalPolicy.m,
            n: config.approvalPolicy.n,
          },
        },
      })
    }

    // Merkle Root History service endpoint
    if (config.merkleRootHistoryEndpoint) {
      services.push({
        id: `${identifier.did}#merkle-roots-history`,
        type: 'MerkleRootHistory',
        serviceEndpoint: config.merkleRootHistoryEndpoint,
      })
    }

    // Note: In a real implementation, you would update the DID Document
    // on-chain or in the DID registry. For this demo, we're returning
    // the structure that would be published.
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
    console.log('Available groups:', Array.from(this.groupDIDs.keys()))
    
    const groupData = this.groupDIDs.get(groupDid)
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    this.groupManager.addMember(groupData.groupId, memberIdentity)
    
    // Save to file after adding member
    saveDataToFile()
  }

  async removeMemberFromGroup(groupDid: string, identityCommitment: bigint): Promise<void> {
    const groupData = this.groupDIDs.get(groupDid)
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    this.groupManager.removeMember(groupData.groupId, identityCommitment)
  }

  async getGroupInfo(groupDid: string) {
    const groupData = this.groupDIDs.get(groupDid)
    if (!groupData) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    const groupExportData = this.groupManager.exportGroupData(groupData.groupId)
    const didDocument = await this.buildGroupDIDDocument(
      groupData.identifier,
      groupData.groupId,
      {
        groupName: groupExportData.config.name,
        groupDescription: groupExportData.config.description,
        approvalPolicy: groupExportData.config.approvalPolicy,
      }
    )

    return {
      did: groupData.identifier,
      semaphoreGroup: groupExportData,
      didDocument,
    }
  }

  getGroupManager(): SemaphoreGroupManager {
    return this.groupManager
  }

  // Static method to get or create global instance
  static async getInstance(agent?: Agent): Promise<GroupDIDService> {
    // Always load data from file to ensure consistency
    loadDataFromFile()
    
    console.log('getInstance called, current instance:', !!globalServiceInstance)
    console.log('globalGroupDIDs size:', globalGroupDIDs.size)
    console.log('globalGroupDIDs keys:', Array.from(globalGroupDIDs.keys()))
    
    if (!globalServiceInstance) {
      globalServiceInstance = new GroupDIDService()
      if (agent) {
        await globalServiceInstance.initialize(agent)
      }
    } else if (agent && !globalServiceInstance.agent) {
      await globalServiceInstance.initialize(agent)
    }
    return globalServiceInstance
  }
}