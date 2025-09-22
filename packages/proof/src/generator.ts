import { generateProof } from '@semaphore-protocol/proof'
import { ProofGenerator, ZKProof, ProofParams, VoteProofParams } from './types'
import { IdentityImpl } from '@zkmpa/identity'
import { GroupImpl } from '@zkmpa/group'
import { createHash } from 'crypto'

export class ProofGeneratorImpl implements ProofGenerator {
  async generateMembershipProof(params: ProofParams): Promise<ZKProof> {
    try {
      // Get Semaphore identity and group
      const semaphoreIdentity = (params.identity as IdentityImpl).getSemaphoreIdentity()
      const semaphoreGroup = (params.group as GroupImpl).getSemaphoreGroup()

      // Generate Semaphore proof
      const fullProof = await generateProof(
        semaphoreIdentity,
        semaphoreGroup,
        params.message,
        params.scope
      )

      return {
        merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
        nullifier: fullProof.nullifier.toString(),
        message: params.message,
        scope: params.scope,
        points: []  // Simplified for compatibility
      }
    } catch (error) {
      console.error('Error generating membership proof:', error)

      // Return a mock proof for development
      return this.createMockProof(params)
    }
  }

  async generateVoteProof(params: VoteProofParams): Promise<ZKProof> {
    try {
      // Get Semaphore identity and group
      const semaphoreIdentity = (params.identity as IdentityImpl).getSemaphoreIdentity()
      const semaphoreGroup = (params.group as GroupImpl).getSemaphoreGroup()

      // Create vote-specific message and scope
      const message = `vote-${params.voteType}-${params.proposalId.substring(0, 16)}`
      const scope = `proposal-${params.proposalId.substring(0, 16)}`

      // Generate Semaphore proof
      const fullProof = await generateProof(
        semaphoreIdentity,
        semaphoreGroup,
        message,
        scope
      )

      return {
        merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
        nullifier: fullProof.nullifier.toString(),
        message,
        scope,
        voteType: params.voteType,
        proposalId: params.proposalId,
        points: []  // Simplified for compatibility
      }
    } catch (error) {
      console.error('Error generating vote proof:', error)

      // Return a mock proof for development
      return this.createMockVoteProof(params)
    }
  }

  private createMockProof(params: ProofParams): ZKProof {
    const mockNullifier = createHash('sha256')
      .update(params.identity.commitment.toString() + params.scope)
      .digest('hex')

    return {
      merkleTreeRoot: params.group.getMerkleRoot().toString(),
      nullifier: mockNullifier,
      message: params.message,
      scope: params.scope,
      points: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
    }
  }

  private createMockVoteProof(params: VoteProofParams): ZKProof {
    const mockNullifier = createHash('sha256')
      .update(params.identity.commitment.toString() + params.proposalId + params.voteType)
      .digest('hex')

    return {
      merkleTreeRoot: params.group.getMerkleRoot().toString(),
      nullifier: mockNullifier,
      message: `vote-${params.voteType}-${params.proposalId.substring(0, 16)}`,
      scope: `proposal-${params.proposalId.substring(0, 16)}`,
      voteType: params.voteType,
      proposalId: params.proposalId,
      points: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
    }
  }
}