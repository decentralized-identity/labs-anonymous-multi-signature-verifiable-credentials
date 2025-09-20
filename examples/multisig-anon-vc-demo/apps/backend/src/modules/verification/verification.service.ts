import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Agent } from '../../lib/veramo/agent'
import { MerkleRootVerifier } from './merkle-root-verifier'
import { GroupDIDService } from '../group/group-did.service'
import { Group, GroupDocument } from '../group/group.schema'
import { MerkleRootHistory, MerkleRootHistoryDocument } from '../group/merkle-root-history.schema'

export interface VerificationResult {
  valid: boolean
  checks: {
    signatureValid: boolean
    evidenceValid: boolean
    thresholdMet: boolean
    nullifiersUnique: boolean
    merkleRootValid: boolean
  }
  details?: {
    issuer?: string
    approvalCount?: number
    approvalThreshold?: number
    merkleRootSource?: string
    errors?: string[]
  }
}

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
        merkleRootValid: false
      },
      details: {
        errors
      }
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

      result.checks.evidenceValid = evidenceResult.evidenceValid
      result.checks.thresholdMet = evidenceResult.thresholdMet
      result.checks.nullifiersUnique = evidenceResult.nullifiersUnique
      result.checks.merkleRootValid = evidenceResult.merkleRootValid

      result.details!.approvalCount = evidenceResult.approvalCount
      result.details!.approvalThreshold = evidenceResult.approvalThreshold
      result.details!.merkleRootSource = evidenceResult.merkleRootSource

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
  private async verifyEvidence(verifiableCredential: any): Promise<{
    evidenceValid: boolean
    thresholdMet: boolean
    nullifiersUnique: boolean
    merkleRootValid: boolean
    approvalCount?: number
    approvalThreshold?: number
    merkleRootSource?: string
    errors: string[]
  }> {
    const errors: string[] = []
    const result = {
      evidenceValid: false,
      thresholdMet: false,
      nullifiersUnique: false,
      merkleRootValid: false,
      approvalCount: 0,
      approvalThreshold: 0,
      merkleRootSource: undefined as string | undefined,
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
      const nullifiers = semaphoreEvidence.approvals?.nullifiers || []
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