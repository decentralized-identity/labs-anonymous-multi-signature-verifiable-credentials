import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Agent } from '../../lib/veramo/agent'
import { MerkleRootVerifier } from './merkle-root-verifier'
import { GroupDIDService } from '../group/group-did.service'
import { Group, GroupDocument } from '../group/group.schema'
import { MerkleRootHistory, MerkleRootHistoryDocument } from '../group/merkle-root-history.schema'
import { VoteProof, VerificationResult, EvidenceResult } from '../../types/vote.types'

@Injectable()
export class VerificationService {
  private agent: Agent | null = null
  private merkleRootVerifier: MerkleRootVerifier | null = null

  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(MerkleRootHistory.name) private merkleRootHistoryModel: Model<MerkleRootHistoryDocument>,
    private groupDIDService: GroupDIDService
  ) {}

  async initialize(agent: Agent) {
    this.agent = agent
    // Initialize merkle root verifier
    this.merkleRootVerifier = new MerkleRootVerifier(
      this.groupDIDService,
      this.groupModel,
      this.merkleRootHistoryModel
    )
  }

  /**
   * Verify a Verifiable Credential with anonymous multi-party approval
   * Performs two-stage verification as specified in the protocol
   */
  async verifyCredential(vcJwt: string): Promise<VerificationResult> {
    const errors: string[] = []
    const result: VerificationResult = {
      valid: false,
      checks: {
        signatureValid: false,
        evidenceValid: false,
        thresholdMet: false,
        nullifiersUnique: false,
        merkleRootValid: false,
        approvalProofsValid: false
      },
      details: { errors }
    }

    try {
      // Stage 1: Standard VC Verification (Signature Check)
      const signatureResult = await this.verifySignature(vcJwt)
      result.checks.signatureValid = signatureResult.valid

      if (!signatureResult.valid) {
        errors.push('Invalid VC signature')
        return result
      }

      const verifiableCredential = signatureResult.verifiableCredential
      result.details!.issuer = verifiableCredential.issuer?.id || verifiableCredential.issuer

      // Stage 2: Anonymous Approval Verification (Evidence Check)
      const evidenceResult = await this.verifyEvidence(verifiableCredential)

      // Map evidence results to verification checks
      result.checks = {
        ...result.checks,
        evidenceValid: evidenceResult.evidenceValid,
        thresholdMet: evidenceResult.thresholdMet,
        nullifiersUnique: evidenceResult.nullifiersUnique,
        merkleRootValid: evidenceResult.merkleRootValid,
        approvalProofsValid: evidenceResult.approvalProofsValid
      }

      // Map evidence details
      result.details = {
        ...result.details,
        approvalCount: evidenceResult.approvalCount,
        approvalThreshold: evidenceResult.approvalThreshold,
        merkleRootSource: evidenceResult.merkleRootSource
      }

      // Consolidate errors
      if (evidenceResult.errors.length > 0) {
        errors.push(...evidenceResult.errors)
      }

      // Overall verification passes if all checks pass
      result.valid = Object.values(result.checks).every(check => check === true)

      return result

    } catch (error) {
      console.error('Verification error:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown verification error')
      return result
    }
  }

  /**
   * Stage 1: Verify VC signature
   */
  private async verifySignature(vcJwt: string): Promise<{
    valid: boolean
    verifiableCredential?: any
  }> {
    if (!this.agent) {
      throw new Error('Agent not initialized')
    }

    try {
      // Verify the JWT signature using Veramo
      const verifyResult = await this.agent.verifyCredential({
        credential: vcJwt,
        fetchRemoteContexts: true
      })

      if (!verifyResult.verified) {
        console.error('VC signature verification failed:', verifyResult.error)
        return { valid: false }
      }

      // Parse the verified credential
      const verifiableCredential = verifyResult.verifiableCredential

      return {
        valid: true,
        verifiableCredential
      }

    } catch (error) {
      console.error('Error verifying signature:', error)
      return { valid: false }
    }
  }

  /**
   * Stage 2: Verify anonymous approval evidence
   */
  private async verifyEvidence(verifiableCredential: any): Promise<EvidenceResult> {
    const errors: string[] = []
    const result: EvidenceResult = {
      evidenceValid: false,
      thresholdMet: false,
      nullifiersUnique: false,
      merkleRootValid: false,
      approvalProofsValid: false,
      approvalCount: 0,
      approvalThreshold: 0,
      merkleRootSource: undefined,
      errors
    }

    try {
      // Extract evidence from VC
      const evidence = verifiableCredential.evidence
      if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
        errors.push('No evidence found in VC')
        return result
      }

      // Find SemaphoreAnonymousVoting evidence
      const semaphoreEvidence = evidence.find(
        (e: any) => e.type === 'SemaphoreAnonymousVoting'
      )

      if (!semaphoreEvidence) {
        errors.push('No SemaphoreAnonymousVoting evidence found')
        return result
      }

      result.evidenceValid = true

      // Check approval threshold
      const approvalCount = semaphoreEvidence.approvals?.count || 0
      const approvalThreshold = semaphoreEvidence.approvalThreshold || 0

      result.approvalCount = approvalCount
      result.approvalThreshold = approvalThreshold
      result.thresholdMet = approvalCount >= approvalThreshold

      if (!result.thresholdMet) {
        errors.push(`Approval count (${approvalCount}) below threshold (${approvalThreshold})`)
      }

      // Check nullifiers uniqueness
      const approvalProofs: VoteProof[] = semaphoreEvidence.approvals?.proofs || []
      const nullifiers = approvalProofs.map((p: VoteProof) => p.nullifierHash).filter(Boolean)
      const uniqueNullifiers = new Set(nullifiers)
      result.nullifiersUnique = nullifiers.length === uniqueNullifiers.size

      if (!result.nullifiersUnique) {
        errors.push('Duplicate nullifiers detected')
      }

      // Verify merkle root
      if (!this.merkleRootVerifier) {
        errors.push('Merkle root verifier not initialized')
        return result
      }

      const issuerDid = verifiableCredential.issuer?.id || verifiableCredential.issuer
      const groupMerkleRoot = semaphoreEvidence.groupMerkleRoot

      if (!groupMerkleRoot) {
        errors.push('No group merkle root in evidence')
        return result
      }

      // Find the merkle root in DID document or archive
      const rootSearchResult = await this.merkleRootVerifier.findMerkleRoot(
        issuerDid,
        groupMerkleRoot
      )

      result.merkleRootValid = rootSearchResult.found
      result.merkleRootSource = rootSearchResult.source

      if (!result.merkleRootValid) {
        errors.push(`Merkle root ${groupMerkleRoot} not found in issuer's history`)
      }

      // Verify that all approval proofs are valid members of the group
      if (approvalProofs.length > 0) {
        result.approvalProofsValid = true

        for (const proofData of approvalProofs) {
          if (!proofData.proof || !proofData.merkleTreeRoot) {
            result.approvalProofsValid = false
            errors.push(`Missing proof data for nullifier ${proofData.nullifierHash}`)
            continue
          }

          // Verify that the proof's merkle root matches the group merkle root
          if (proofData.merkleTreeRoot !== groupMerkleRoot) {
            result.approvalProofsValid = false
            errors.push(`Merkle root mismatch for nullifier ${proofData.nullifierHash}`)
            continue
          }

          // Verify the Semaphore proof itself
          try {
            const verificationResult = await this.merkleRootVerifier.verifyProofWithRoot(
              issuerDid,
              proofData.proof,
              proofData.merkleTreeRoot,
              30 * 24 * 60 * 60 * 1000 // Max root age: 30 days
            )

            if (!verificationResult.valid) {
              result.approvalProofsValid = false
              errors.push(`Invalid proof for nullifier ${proofData.nullifierHash}: ${verificationResult.message}`)
            }
          } catch (error) {
            result.approvalProofsValid = false
            errors.push(`Failed to verify proof for nullifier ${proofData.nullifierHash}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      } else {
        // If no proofs are included, we can't verify membership
        errors.push('No proofs included in evidence for verification')
      }

      return result

    } catch (error) {
      console.error('Error verifying evidence:', error)
      errors.push(error instanceof Error ? error.message : 'Evidence verification error')
      return result
    }
  }

  /**
   * Get detailed information about a VC
   */
  async inspectCredential(vcJwt: string): Promise<{
    decoded?: any
    issuer?: string
    subject?: any
    evidence?: any
    issuanceDate?: string
    error?: string
  }> {
    if (!this.agent) {
      throw new Error('Agent not initialized')
    }

    try {
      // Decode without verification for inspection
      const decoded = await this.agent.verifyCredential({
        credential: vcJwt,
        fetchRemoteContexts: true,
        policies: {
          now: Date.now() + 1000000000 // Far future to skip expiration check
        }
      })

      const vc = decoded.verifiableCredential

      return {
        decoded: vc,
        issuer: vc.issuer?.id || vc.issuer,
        subject: vc.credentialSubject,
        evidence: vc.evidence,
        issuanceDate: vc.issuanceDate
      }

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to decode credential'
      }
    }
  }

}