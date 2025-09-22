import { useState } from 'react'
import { VerificationResult } from '@/types/verification'
import { VerificationService } from '@/services/verification.service'

export function useCredentialVerification() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const verifyCredential = async (credential: string) => {
    if (!credential.trim()) {
      setError('Please enter a credential to verify')
      return null
    }

    setLoading(true)
    setError('')
    setVerificationResult(null)

    try {
      const result = await VerificationService.verifyCredential(credential)

      if (result.success && result.verification) {
        setVerificationResult(result.verification)
        return result.verification
      } else {
        setError('Verification failed')
        return null
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to verify credential'
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setError('')
  }

  return {
    verificationResult,
    loading,
    error,
    verifyCredential,
    resetVerification
  }
}