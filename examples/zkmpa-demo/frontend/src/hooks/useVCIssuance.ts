import { useState } from 'react'
import { Proposal, IssuedVC } from '@/types/issuance'
import { IssuanceService } from '@/services/issuance.service'

export function useVCIssuance() {
  const [issuedVC, setIssuedVC] = useState<IssuedVC | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const issueVC = async (proposal: Proposal) => {
    setLoading(true)
    setError('')

    try {
      const result = await IssuanceService.issueVC(proposal.proposalId)

      if (result.success && result.data) {
        setIssuedVC(result.data)
        return result.data
      } else {
        setError(result.error || 'Failed to issue VC')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue VC')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    issuedVC,
    loading,
    error,
    setIssuedVC,
    issueVC
  }
}