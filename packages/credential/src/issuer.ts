import { CredentialIssuer, VCClaims, ApprovalEvidence, VerifiableCredential, CredentialAgent } from './types'

export class CredentialIssuerImpl implements CredentialIssuer {
  private agent?: CredentialAgent

  constructor(agent?: CredentialAgent) {
    this.agent = agent
  }

  async issueWithEvidence(
    claims: VCClaims,
    evidence: ApprovalEvidence,
    issuerDID: string
  ): Promise<VerifiableCredential> {
    if (!this.agent) {
      // Return a simple VC without agent
      return this.createSimpleVC(claims, [evidence], issuerDID)
    }

    // Try to ensure the issuer DID is available in the agent
    if (this.agent.didManagerGet && this.agent.didManagerImport) {
      try {
        await this.agent.didManagerGet({ did: issuerDID })
      } catch (error) {
        // DID might not exist, but we'll proceed anyway
        console.warn(`DID ${issuerDID} not found in agent:`, error)
      }
    }

    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/secp256k1-2019/v1'
      ],
      type: ['VerifiableCredential'],
      issuer: { id: issuerDID },
      issuanceDate: new Date().toISOString(),
      credentialSubject: claims.credentialSubject,
      evidence: [evidence]
    }

    try {
      return await this.agent.createVerifiableCredential({
        credential,
        proofFormat: 'jwt'
      })
    } catch (error) {
      console.error('Failed to create VC with agent:', error)
      // Fallback to simple VC
      return this.createSimpleVC(claims, [evidence], issuerDID)
    }
  }

  async issue(
    claims: VCClaims,
    issuerDID: string
  ): Promise<VerifiableCredential> {
    if (!this.agent) {
      return this.createSimpleVC(claims, undefined, issuerDID)
    }

    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/secp256k1-2019/v1'
      ],
      type: ['VerifiableCredential'],
      issuer: { id: issuerDID },
      issuanceDate: new Date().toISOString(),
      credentialSubject: claims.credentialSubject
    }

    try {
      return await this.agent.createVerifiableCredential({
        credential,
        proofFormat: 'jwt'
      })
    } catch (error) {
      console.error('Failed to create VC with agent:', error)
      return this.createSimpleVC(claims, undefined, issuerDID)
    }
  }

  private createSimpleVC(
    claims: VCClaims,
    evidence?: any[],
    issuerDID?: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1'
      ],
      type: ['VerifiableCredential'],
      issuer: issuerDID || 'did:unknown:issuer',
      issuanceDate: new Date().toISOString(),
      credentialSubject: claims.credentialSubject,
      ...(evidence && { evidence })
    }
  }

  setAgent(agent: CredentialAgent): void {
    this.agent = agent
  }
}