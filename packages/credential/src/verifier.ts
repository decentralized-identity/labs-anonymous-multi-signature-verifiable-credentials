import {
  CredentialVerifier,
  SignatureVerification,
  EvidenceVerification,
  VerificationResult,
  VerifiableCredential,
  CredentialAgent,
  ApprovalEvidence
} from './types'
import { MerkleRootHistory } from '@zkmpa/group'

export class CredentialVerifierImpl implements CredentialVerifier {
  private agent?: CredentialAgent
  private merkleRootHistory?: MerkleRootHistory

  constructor(agent?: CredentialAgent, merkleRootHistory?: MerkleRootHistory) {
    this.agent = agent
    this.merkleRootHistory = merkleRootHistory
  }

  async verifySignature(vcJwt: string): Promise<SignatureVerification> {
    if (!this.agent) {
      // Without agent, we can't verify JWT signature
      return {
        valid: false,
        error: 'No verification agent configured'
      }
    }

    try {
      const result = await this.agent.verifyCredential({
        credential: vcJwt,
        fetchRemoteContexts: true
      })

      if (!result.verified) {
        return {
          valid: false,
          error: result.error || 'Signature verification failed'
        }
      }

      return {
        valid: true,
        verifiableCredential: result.verifiableCredential
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      }
    }
  }

  async verifyEvidence(vc: VerifiableCredential): Promise<EvidenceVerification> {
    const errors: string[] = []
    const result: EvidenceVerification = {
      valid: false,
      checks: {
        evidenceValid: false,
        thresholdMet: false,
        nullifiersUnique: false,
        merkleRootValid: false,
        approvalProofsValid: false
      },
      details: {
        errors
      }
    }

    try {
      // Extract evidence
      const evidence = vc.evidence
      if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
        errors.push('No evidence found in VC')
        return result
      }

      // Find SemaphoreAnonymousVoting evidence
      const semaphoreEvidence = evidence.find(
        (e: any) => e.type === 'SemaphoreAnonymousVoting'
      ) as ApprovalEvidence | undefined

      if (!semaphoreEvidence) {
        errors.push('No SemaphoreAnonymousVoting evidence found')
        return result
      }

      result.checks.evidenceValid = true

      // Check approval threshold
      const approvalCount = semaphoreEvidence.approvals?.count || 0
      const approvalThreshold = semaphoreEvidence.approvalThreshold || 0

      result.details!.approvalCount = approvalCount
      result.details!.approvalThreshold = approvalThreshold
      result.checks.thresholdMet = approvalCount >= approvalThreshold

      if (!result.checks.thresholdMet) {
        errors.push(`Approval count (${approvalCount}) below threshold (${approvalThreshold})`)
      }

      // Check nullifiers uniqueness
      const approvalProofs = semaphoreEvidence.approvals?.proofs || []
      const nullifiers = approvalProofs.map((p: any) => p.nullifierHash).filter(Boolean)
      const uniqueNullifiers = new Set(nullifiers)
      result.checks.nullifiersUnique = nullifiers.length === uniqueNullifiers.size

      if (!result.checks.nullifiersUnique) {
        errors.push('Duplicate nullifiers detected')
      }

      // Verify approval proofs (basic check - ensure proofs exist)
      if (approvalProofs.length > 0) {
        result.checks.approvalProofsValid = true
        for (const proofData of approvalProofs) {
          if (!proofData.proof || !proofData.nullifierHash || !proofData.merkleTreeRoot) {
            result.checks.approvalProofsValid = false
            errors.push(`Incomplete proof data for nullifier ${proofData.nullifierHash}`)
            break
          }
          // Verify proof's merkle root matches the group merkle root
          if (proofData.merkleTreeRoot !== semaphoreEvidence.groupMerkleRoot) {
            result.checks.approvalProofsValid = false
            errors.push(`Merkle root mismatch for nullifier ${proofData.nullifierHash}`)
            break
          }
        }
      } else {
        errors.push('No approval proofs found')
      }

      // Verify merkle root if history is available
      if (this.merkleRootHistory) {
        const groupId = this.extractGroupId(vc)
        const merkleRoot = semaphoreEvidence.groupMerkleRoot

        if (groupId && merkleRoot) {
          const rootValid = this.merkleRootHistory.verifyHistoricalRoot(
            groupId,
            BigInt(merkleRoot),
            30 * 24 * 60 * 60 * 1000 // 30 days
          )

          result.checks.merkleRootValid = rootValid
          result.details!.merkleRootSource = rootValid ? 'history' : 'not found'

          if (!rootValid) {
            errors.push(`Merkle root ${merkleRoot} not found in history`)
          }
        } else {
          errors.push('Missing group ID or merkle root for verification')
        }
      } else {
        // Without merkle root history, we can't verify
        result.checks.merkleRootValid = true // Assume valid if no verifier
        result.details!.merkleRootSource = 'unverified'
      }

      result.valid = Object.values(result.checks).every(check => check === true)

      return result

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Evidence verification error')
      return result
    }
  }

  async verifyComplete(vcJwt: string): Promise<VerificationResult> {
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
      details: {
        errors
      }
    }

    try {
      // Stage 1: Verify signature
      const signatureResult = await this.verifySignature(vcJwt)
      result.checks.signatureValid = signatureResult.valid

      if (!signatureResult.valid) {
        errors.push(signatureResult.error || 'Invalid VC signature')
        return result
      }

      const verifiableCredential = signatureResult.verifiableCredential!
      result.details!.issuer = typeof verifiableCredential.issuer === 'string'
        ? verifiableCredential.issuer
        : verifiableCredential.issuer?.id

      // Stage 2: Verify evidence
      const evidenceResult = await this.verifyEvidence(verifiableCredential)

      result.checks.evidenceValid = evidenceResult.checks.evidenceValid
      result.checks.thresholdMet = evidenceResult.checks.thresholdMet
      result.checks.nullifiersUnique = evidenceResult.checks.nullifiersUnique
      result.checks.merkleRootValid = evidenceResult.checks.merkleRootValid
      result.checks.approvalProofsValid = evidenceResult.checks.approvalProofsValid

      result.details!.approvalCount = evidenceResult.details?.approvalCount
      result.details!.approvalThreshold = evidenceResult.details?.approvalThreshold
      result.details!.merkleRootSource = evidenceResult.details?.merkleRootSource

      if (evidenceResult.details?.errors && evidenceResult.details.errors.length > 0) {
        errors.push(...evidenceResult.details.errors)
      }

      // Overall verification passes if all checks pass
      result.valid = Object.values(result.checks).every(check => check === true)

      return result

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown verification error')
      return result
    }
  }

  private extractGroupId(vc: VerifiableCredential): string | undefined {
    // Try to extract group ID from issuer DID or evidence
    const issuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.id
    if (issuer && issuer.includes('group:')) {
      const parts = issuer.split(':')
      const groupIndex = parts.indexOf('group')
      if (groupIndex !== -1 && groupIndex < parts.length - 1) {
        return parts[groupIndex + 1]
      }
    }

    // Try to extract from evidence
    const evidence = vc.evidence?.[0] as any
    if (evidence?.groupId) {
      return evidence.groupId
    }

    return undefined
  }

  setAgent(agent: CredentialAgent): void {
    this.agent = agent
  }

  setMerkleRootHistory(merkleRootHistory: MerkleRootHistory): void {
    this.merkleRootHistory = merkleRootHistory
  }
}