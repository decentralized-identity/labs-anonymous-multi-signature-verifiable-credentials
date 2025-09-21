import { verifyProof } from '@semaphore-protocol/proof'
import { ProofVerifier, ZKProof, PublicInputs, VoteInputs, VerificationResult } from './types'

export class ProofVerifierImpl implements ProofVerifier {
  async verifyMembershipProof(proof: ZKProof, publicInputs: PublicInputs): Promise<boolean> {
    try {
      // For development, accept mock proofs
      if (this.isMockProof(proof)) {
        return this.verifyMockProof(proof, publicInputs)
      }

      // Verify using Semaphore
      const isValid = await verifyProof(proof as any)

      // Additional checks
      if (isValid && publicInputs.merkleTreeRoot) {
        return proof.merkleTreeRoot === publicInputs.merkleTreeRoot
      }

      return isValid
    } catch (error) {
      console.error('Error verifying membership proof:', error)
      return false
    }
  }

  async verifyVoteProof(proof: ZKProof, voteInputs: VoteInputs): Promise<boolean> {
    try {
      // For development, accept mock proofs
      if (this.isMockProof(proof)) {
        return this.verifyMockVoteProof(proof, voteInputs)
      }

      // Verify using Semaphore
      const isValid = await verifyProof(proof as any)

      // Additional vote-specific checks
      if (isValid) {
        if (voteInputs.merkleTreeRoot && proof.merkleTreeRoot !== voteInputs.merkleTreeRoot) {
          return false
        }

        if (proof.voteType !== voteInputs.voteType) {
          return false
        }

        if (proof.proposalId !== voteInputs.proposalId) {
          return false
        }
      }

      return isValid
    } catch (error) {
      console.error('Error verifying vote proof:', error)
      return false
    }
  }

  async verifyProof(proof: any): Promise<boolean> {
    try {
      // For development, accept mock proofs
      if (this.isMockProof(proof)) {
        return true
      }

      // Verify using Semaphore
      return await verifyProof(proof)
    } catch (error) {
      console.error('Error verifying proof:', error)
      return false
    }
  }

  async verifyWithDetails(proof: any): Promise<VerificationResult> {
    try {
      const valid = await this.verifyProof(proof)

      return {
        valid,
        message: valid ? 'Proof verified successfully' : 'Proof verification failed',
        details: {
          isMock: this.isMockProof(proof),
          merkleRoot: proof.merkleTreeRoot,
          nullifier: proof.nullifier
        }
      }
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Verification failed',
        details: { error }
      }
    }
  }

  private isMockProof(proof: ZKProof): boolean {
    // Check if this is a mock proof (all zeros in points)
    if (!proof.points || proof.points.length !== 8) {
      return false
    }

    return proof.points.every(point => point === BigInt(0))
  }

  private verifyMockProof(proof: ZKProof, publicInputs: PublicInputs): boolean {
    // Basic validation for mock proofs
    if (!proof.nullifier || !proof.merkleTreeRoot) {
      return false
    }

    if (publicInputs.merkleTreeRoot && proof.merkleTreeRoot !== publicInputs.merkleTreeRoot) {
      return false
    }

    if (publicInputs.nullifierHash && proof.nullifier !== publicInputs.nullifierHash) {
      return false
    }

    return true
  }

  private verifyMockVoteProof(proof: ZKProof, voteInputs: VoteInputs): boolean {
    // Basic validation for mock vote proofs
    if (!this.verifyMockProof(proof, voteInputs)) {
      return false
    }

    if (proof.voteType !== voteInputs.voteType) {
      return false
    }

    if (proof.proposalId !== voteInputs.proposalId) {
      return false
    }

    return true
  }
}