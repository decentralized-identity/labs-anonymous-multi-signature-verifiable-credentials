import { useState } from 'react'
import { Proposal } from '@/types/issuance'
import { IssuanceService } from '@/services/issuance.service'

export function useVoting(groupDid: string) {
  const [memberSecret, setMemberSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitVote = async (proposal: Proposal, voteType: 'approve' | 'reject') => {
    if (!memberSecret) {
      setError('Please enter your member identity')
      return null
    }

    setLoading(true)
    setError('')

    try {
      const result = await IssuanceService.submitVote(proposal.proposalId, {
        memberSecret,
        voteType,
        groupDid
      })

      if (result.success && result.data) {
        setMemberSecret('')
        return result.data.proposal
      } else {
        setError(result.error || 'Failed to submit vote')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    memberSecret,
    loading,
    error,
    setMemberSecret,
    submitVote
  }
}