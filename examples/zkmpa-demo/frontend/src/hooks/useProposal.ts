import { useState } from 'react'
import { VCClaims, Proposal, DEFAULT_APPROVAL_POLICY } from '@/types/issuance'
import { IssuanceService } from '@/services/issuance.service'

export function useProposal(groupDid: string) {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [vcClaims, setVcClaims] = useState<VCClaims>({
    subject: 'did:example:holder123',
    credentialSubject: {
      id: 'did:example:holder123',
      name: '',
      email: '',
      role: '',
    }
  })

  const [approvalPolicy, setApprovalPolicy] = useState(DEFAULT_APPROVAL_POLICY)

  const createProposal = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await IssuanceService.createProposal({
        vcClaims,
        groupDid,
        approvalPolicy
      })

      if (result.success && result.data) {
        setProposal(result.data)
        return result.data
      } else {
        setError(result.error || 'Failed to create proposal')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadProposal = async (proposalId: string) => {
    if (!proposalId.trim()) {
      setError('Please enter a proposal ID')
      return null
    }

    setLoading(true)
    setError('')

    try {
      const result = await IssuanceService.getProposal(proposalId.trim())

      if (result.success && result.data) {
        setProposal(result.data)
        return result.data
      } else {
        setError(result.error || 'Failed to load proposal')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    proposal,
    loading,
    error,
    vcClaims,
    approvalPolicy,
    setProposal,
    setVcClaims,
    setApprovalPolicy,
    createProposal,
    loadProposal
  }
}