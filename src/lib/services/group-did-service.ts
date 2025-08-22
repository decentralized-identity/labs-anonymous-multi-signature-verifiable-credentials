import { Agent } from '../veramo/agent'
import { SemaphoreGroupManager, SemaphoreGroupConfig } from '../semaphore/group-manager'
import { Identity } from '@semaphore-protocol/identity'
import { IIdentifier } from '@veramo/core'

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

export class GroupDIDService {
  private agent: Agent | null = null
  private groupManager: SemaphoreGroupManager
  private groupDIDs: Map<string, IIdentifier> = new Map()

  constructor() {
    this.groupManager = new SemaphoreGroupManager()
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

    // Store the association
    this.groupDIDs.set(groupId, identifier)

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
    const groupId = this.findGroupIdByDID(groupDid)
    if (!groupId) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    this.groupManager.addMember(groupId, memberIdentity)
  }

  async removeMemberFromGroup(groupDid: string, identityCommitment: bigint): Promise<void> {
    const groupId = this.findGroupIdByDID(groupDid)
    if (!groupId) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    this.groupManager.removeMember(groupId, identityCommitment)
  }

  async getGroupInfo(groupDid: string) {
    const groupId = this.findGroupIdByDID(groupDid)
    if (!groupId) {
      throw new Error(`Group not found for DID: ${groupDid}`)
    }

    const groupData = this.groupManager.exportGroupData(groupId)
    const identifier = this.groupDIDs.get(groupId)
    const didDocument = await this.buildGroupDIDDocument(
      identifier!,
      groupId,
      {
        groupName: groupData.config.name,
        groupDescription: groupData.config.description,
        approvalPolicy: groupData.config.approvalPolicy,
      }
    )

    return {
      did: identifier,
      semaphoreGroup: groupData,
      didDocument,
    }
  }

  private findGroupIdByDID(did: string): string | undefined {
    for (const [groupId, identifier] of this.groupDIDs.entries()) {
      if (identifier.did === did) {
        return groupId
      }
    }
    return undefined
  }

  getGroupManager(): SemaphoreGroupManager {
    return this.groupManager
  }
}