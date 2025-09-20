'use client'

import { useState, useEffect } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'

interface VCClaims {
  subject: string
  credentialSubject: {
    id: string
    name: string
    email: string
    role: string
    [key: string]: unknown
  }
}

interface Proposal {
  proposalId: string
  vcClaims: VCClaims
  groupDid: string
  status: 'pending' | 'approved' | 'rejected'
  approvals: Array<{ nullifierHash: string }>
  rejections: Array<{ nullifierHash: string }>
  approvalThreshold: number
  totalMembers: number
  externalNullifierApprove: string
  externalNullifierReject: string
}

export default function IssuancePhase({ groupDid }: { groupDid: string }) {
  const [step, setStep] = useState<'request' | 'voting' | 'issue'>('request')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [vcClaims, setVcClaims] = useState<VCClaims>({
    subject: 'did:example:holder123',
    credentialSubject: {
      id: 'did:example:holder123',
      name: '',
      email: '',
      role: '',
    }
  })
  
  const [approvalPolicy, setApprovalPolicy] = useState({
    m: 2, // minimum approvals needed
    n: 3  // total members who can vote
  })
  
  const [memberSecret, setMemberSecret] = useState('')
  const [issuedVC, setIssuedVC] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Create issuance proposal
  const createProposal = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/issuance/create-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcClaims, groupDid, approvalPolicy }),
      })

      const result = await response.json()
      
      if (result.success) {
        setProposal(result.data)
        setStep('voting')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Submit vote
  const submitVote = async (voteType: 'approve' | 'reject') => {
    if (!proposal || !memberSecret) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/issuance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.proposalId,
          memberSecret,
          voteType,
          groupDid,
        }),
      })

      const result = await response.json()
      console.log('Vote response:', result) // Debug log
      
      if (result.success) {
        setProposal(result.data.proposal)
        setMemberSecret('') // Clear after voting
        
        // Check if threshold reached
        if (result.data.proposal.status === 'approved') {
          setStep('issue')
        }
      } else {
        setError(`${result.error}${result.details ? '\n\nDetails: ' + result.details : ''}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Issue VC
  const issueVC = async () => {
    if (!proposal) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/issuance/issue-vc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.proposalId }),
      })

      const result = await response.json()
      
      if (result.success) {
        setIssuedVC(result.data.verifiableCredential)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue VC')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomIdentity = () => {
    const identity = new Identity()
    setMemberSecret(identity.toString())
  }

  // Poll for proposal updates during voting
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (step === 'voting' && proposal && proposal.status === 'pending' && !loading) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3001/issuance/get-proposal?proposalId=${proposal.proposalId}`)
          const result = await response.json()
          
          if (result.success) {
            setProposal(result.data)
            if (result.data.status === 'approved') {
              setStep('issue')
              if (interval) clearInterval(interval)
            }
          }
        } catch (error) {
          console.error('Failed to poll proposal:', error)
        }
      }, 3000) // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, proposal, loading])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Issuance Phase: Anonymous Multi-Party Approval</h1>
      
      {/* Step indicators */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <div className={`flex items-center space-x-2 ${step === 'request' ? 'text-blue-600' : (step === 'voting' || step === 'issue') ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'request' ? 'bg-blue-100' : (step === 'voting' || step === 'issue') ? 'bg-green-100' : 'bg-gray-100'}`}>
            <span className="text-sm font-semibold">1</span>
          </div>
          <span>VC Request</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${step === 'voting' ? 'text-blue-600' : step === 'issue' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'voting' ? 'bg-blue-100' : step === 'issue' ? 'bg-green-100' : 'bg-gray-100'}`}>
            <span className="text-sm font-semibold">2</span>
          </div>
          <span>Anonymous Voting</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${step === 'issue' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'issue' ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <span className="text-sm font-semibold">3</span>
          </div>
          <span>VC Issuance</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{error}</div>
      )}

      {/* Step 1: VC Request */}
      {step === 'request' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Create VC Issuance Request</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject DID</label>
              <input
                type="text"
                value={vcClaims.subject}
                onChange={(e) => setVcClaims(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="did:example:holder123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={vcClaims.credentialSubject.name}
                onChange={(e) => setVcClaims(prev => ({ 
                  ...prev, 
                  credentialSubject: { ...prev.credentialSubject, name: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={vcClaims.credentialSubject.email}
                onChange={(e) => setVcClaims(prev => ({ 
                  ...prev, 
                  credentialSubject: { ...prev.credentialSubject, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={vcClaims.credentialSubject.role}
                onChange={(e) => setVcClaims(prev => ({ 
                  ...prev, 
                  credentialSubject: { ...prev.credentialSubject, role: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Developer"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Approval Policy for this VC</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Approvals (m)</label>
                  <input
                    type="number"
                    value={approvalPolicy.m}
                    onChange={(e) => setApprovalPolicy(prev => ({ ...prev, m: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-md"
                    min={1}
                    max={approvalPolicy.n}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Total Voters (n)</label>
                  <input
                    type="number"
                    value={approvalPolicy.n}
                    onChange={(e) => setApprovalPolicy(prev => ({ ...prev, n: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-md"
                    min={approvalPolicy.m}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This VC requires {approvalPolicy.m} out of {approvalPolicy.n} approvals
              </p>
            </div>

            <button
              onClick={createProposal}
              disabled={loading || !vcClaims.credentialSubject.name}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Proposal...' : 'Create Issuance Proposal'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Voting */}
      {step === 'voting' && proposal && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Anonymous Multi-Party Voting</h2>
          
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h3 className="font-semibold mb-2">Proposal Details</h3>
            <p><strong>Proposal ID:</strong> <code className="text-xs">{proposal.proposalId}</code></p>
            <p><strong>Subject:</strong> {proposal.vcClaims.credentialSubject.name}</p>
            <p><strong>Email:</strong> {proposal.vcClaims.credentialSubject.email}</p>
            <p><strong>Role:</strong> {proposal.vcClaims.credentialSubject.role}</p>
            <p><strong>Threshold:</strong> {proposal.approvalThreshold} of {proposal.totalMembers}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">{proposal.approvals.length}</div>
              <div className="text-sm text-green-600">Approvals</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-md">
              <div className="text-2xl font-bold text-red-600">{proposal.rejections.length}</div>
              <div className="text-sm text-red-600">Rejections</div>
            </div>
          </div>

          {proposal.status === 'pending' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Member Identity (to vote)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberSecret}
                    onChange={(e) => setMemberSecret(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-xs"
                    placeholder="Member identity secret"
                  />
                  <button
                    onClick={generateRandomIdentity}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => submitVote('approve')}
                  disabled={loading || !memberSecret}
                  className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Voting...' : 'Approve'}
                </button>
                
                <button
                  onClick={() => submitVote('reject')}
                  disabled={loading || !memberSecret}
                  className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Voting...' : 'Reject'}
                </button>
              </div>
            </div>
          )}

          {proposal.status === 'approved' && (
            <div className="bg-green-50 text-green-800 p-4 rounded-md">
              <h4 className="font-semibold">✅ Proposal Approved!</h4>
              <p>The threshold of {proposal.approvalThreshold} approvals has been reached.</p>
            </div>
          )}

          {proposal.status === 'rejected' && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md">
              <h4 className="font-semibold">❌ Proposal Rejected</h4>
              <p>The proposal has been rejected by the group.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Issue VC */}
      {step === 'issue' && proposal && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Issue Verifiable Credential with Evidence</h2>
          
          {!issuedVC ? (
            <div>
              <p className="mb-4">The proposal has been approved! Click below to issue the VC with cryptographic evidence of the anonymous multi-party approval.</p>
              
              <button
                onClick={issueVC}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Issuing VC...' : 'Issue Verifiable Credential'}
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4">
                <h4 className="font-semibold">✅ VC Issued Successfully!</h4>
                <p>The VC includes cryptographic evidence of the anonymous multi-party approval.</p>
              </div>

              {/* JWT Token for Verification */}
              {issuedVC?.proof?.jwt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-blue-900">JWT Token for Verification</h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(issuedVC.proof.jwt)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckIcon style={{ fontSize: 16 }} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ContentCopyIcon style={{ fontSize: 16 }} />
                          Copy JWT
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Copy this JWT token and paste it in the Verification Phase to verify the credential
                  </p>
                  <div className="bg-white rounded-md p-3 border border-blue-200">
                    <code className="text-xs break-all text-gray-700">
                      {issuedVC.proof.jwt}
                    </code>
                  </div>
                </div>
              )}

              {/* Full Credential Details */}
              <h3 className="text-lg font-semibold mb-2">Full Credential Details:</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs">
                {JSON.stringify(issuedVC, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}