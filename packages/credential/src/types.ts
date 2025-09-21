export interface VCClaims {
  subject?: string
  credentialSubject: {
    id: string
    [key: string]: any
  }
  [key: string]: any
}

export interface VerifiableCredential {
  '@context': string[]
  type: string[]
  issuer: string | { id: string }
  issuanceDate: string
  credentialSubject: any
  evidence?: any[]
  proof?: any
  [key: string]: any
}

export interface ApprovalEvidence {
  type: 'SemaphoreAnonymousVoting'
  proposalId: string
  groupMerkleRoot: string
  approvalThreshold: number
  totalMembers?: number
  approvals: {
    count: number
    nullifiers: string[]
  }
  rejections?: {
    count: number
    nullifiers: string[]
  }
  timestamp?: string
}

export interface SignatureVerification {
  valid: boolean
  verifiableCredential?: VerifiableCredential
  error?: string
}

export interface EvidenceVerification {
  valid: boolean
  checks: {
    evidenceValid: boolean
    thresholdMet: boolean
    nullifiersUnique: boolean
    merkleRootValid: boolean
  }
  details?: {
    approvalCount?: number
    approvalThreshold?: number
    merkleRootSource?: string
    errors?: string[]
  }
}

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

export interface CredentialIssuer {
  issueWithEvidence(
    claims: VCClaims,
    evidence: ApprovalEvidence,
    issuerDID: string
  ): Promise<VerifiableCredential>

  issue(
    claims: VCClaims,
    issuerDID: string
  ): Promise<VerifiableCredential>
}

export interface CredentialVerifier {
  verifySignature(vc: string): Promise<SignatureVerification>
  verifyEvidence(vc: VerifiableCredential): Promise<EvidenceVerification>
  verifyComplete(vc: string): Promise<VerificationResult>
}

export interface CredentialAgent {
  createVerifiableCredential(params: {
    credential: any
    proofFormat?: string
  }): Promise<VerifiableCredential>

  verifyCredential(params: {
    credential: string
    fetchRemoteContexts?: boolean
    policies?: any
  }): Promise<any>

  didManagerGet?(params: { did: string }): Promise<any>
  didManagerImport?(identifier: any): Promise<any>
}