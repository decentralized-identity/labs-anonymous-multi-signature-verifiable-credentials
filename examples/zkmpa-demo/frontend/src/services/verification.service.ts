import { VerificationResult } from '@/types/verification'

const API_BASE_URL = 'http://localhost:3001/api'

export interface VerifyCredentialRequest {
  credential: string
}

export interface VerifyCredentialResponse {
  success: boolean
  verification?: VerificationResult
  error?: string
}

export class VerificationService {
  static async verifyCredential(credential: string): Promise<VerifyCredentialResponse> {
    const response = await fetch(`${API_BASE_URL}/verification/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: credential.trim() }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Verification failed')
    }

    return {
      success: true,
      verification: data.verification
    }
  }
}