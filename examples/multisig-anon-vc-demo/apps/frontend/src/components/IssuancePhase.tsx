'use client'

import { useState, useEffect } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

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
  const [activeTab, setActiveTab] = useState<'create' | 'vote' | 'manage'>('create')
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposalId, setProposalId] = useState('')
  const [copied, setCopied] = useState(false)

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
        setActiveTab('vote')
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

      if (result.success) {
        setProposal(result.data.proposal)
        setMemberSecret('')
      } else {
        setError(result.error)
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
        setIssuedVC(result.data)
        setActiveTab('manage')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue VC')
    } finally {
      setLoading(false)
    }
  }

  const loadProposal = async () => {
    if (!proposalId) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:3001/issuance/proposal?proposalId=${proposalId}`)
      const result = await response.json()

      if (result.success) {
        setProposal(result.data)
        setActiveTab('vote')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomIdentity = () => {
    const identity = new Identity()
    setMemberSecret(identity.toString())
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  const tabs = [
    { id: 'create', label: 'Create Proposal', icon: '📝' },
    { id: 'vote', label: 'Vote on Proposal', icon: '🗳️' },
    { id: 'manage', label: 'Manage VCs', icon: '🎫' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Proposal Tab */}
      {activeTab === 'create' && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Create VC Issuance Proposal</CardTitle>
            <CardDescription>
              Define the verifiable credential claims and approval requirements
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* VC Claims Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Credential Claims
                </h3>

                <div className="space-y-4 pl-6">
                  <Input
                    label="Subject DID"
                    value={vcClaims.subject}
                    onChange={(e) => setVcClaims({
                      ...vcClaims,
                      subject: e.target.value,
                      credentialSubject: { ...vcClaims.credentialSubject, id: e.target.value }
                    })}
                    placeholder="did:example:holder123"
                    helper="The DID of the credential subject"
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      value={vcClaims.credentialSubject.name}
                      onChange={(e) => setVcClaims({
                        ...vcClaims,
                        credentialSubject: { ...vcClaims.credentialSubject, name: e.target.value }
                      })}
                      placeholder="John Doe"
                    />

                    <Input
                      label="Email"
                      value={vcClaims.credentialSubject.email}
                      onChange={(e) => setVcClaims({
                        ...vcClaims,
                        credentialSubject: { ...vcClaims.credentialSubject, email: e.target.value }
                      })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <Input
                    label="Role"
                    value={vcClaims.credentialSubject.role}
                    onChange={(e) => setVcClaims({
                      ...vcClaims,
                      credentialSubject: { ...vcClaims.credentialSubject, role: e.target.value }
                    })}
                    placeholder="DAO Member"
                  />
                </div>
              </div>

              {/* Approval Policy Section */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Approval Policy
                </h3>

                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <Input
                    label="Minimum Approvals (m)"
                    type="number"
                    value={approvalPolicy.m}
                    onChange={(e) => setApprovalPolicy({ ...approvalPolicy, m: parseInt(e.target.value) || 0 })}
                    min={1}
                    helper="Minimum approvals needed"
                  />

                  <Input
                    label="Total Voters (n)"
                    type="number"
                    value={approvalPolicy.n}
                    onChange={(e) => setApprovalPolicy({ ...approvalPolicy, n: parseInt(e.target.value) || 0 })}
                    min={1}
                    helper="Total members who can vote"
                  />
                </div>

                <div className="mt-3 pl-6">
                  <Alert variant="info">
                    Requires {approvalPolicy.m} out of {approvalPolicy.n} approvals to issue the credential
                  </Alert>
                </div>
              </div>

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={createProposal}
              disabled={loading || !vcClaims.credentialSubject.name}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Create Proposal
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Vote Tab */}
      {activeTab === 'vote' && (
        <div className="space-y-6">
          {/* Load Proposal */}
          {!proposal && (
            <Card>
              <CardHeader>
                <CardTitle>Load Existing Proposal</CardTitle>
                <CardDescription>
                  Enter a proposal ID to load and vote on it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={proposalId}
                    onChange={(e) => setProposalId(e.target.value)}
                    placeholder="Enter proposal ID"
                    className="flex-1"
                  />
                  <Button
                    onClick={loadProposal}
                    disabled={loading || !proposalId}
                    loading={loading}
                  >
                    Load Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposal Details */}
          {proposal && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Proposal Details</CardTitle>
                      <CardDescription>
                        ID: {proposal.proposalId}
                      </CardDescription>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Subject</h4>
                        <p className="text-sm">{proposal.vcClaims.credentialSubject.name}</p>
                        <p className="text-xs text-gray-500">{proposal.vcClaims.credentialSubject.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Role</h4>
                        <p className="text-sm">{proposal.vcClaims.credentialSubject.role}</p>
                      </div>
                    </div>

                    {/* Voting Progress */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Voting Progress</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-600">Approvals</span>
                            <span>{proposal.approvals.length} / {proposal.approvalThreshold}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(proposal.approvals.length / proposal.approvalThreshold) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-600">Rejections</span>
                            <span>{proposal.rejections.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${(proposal.rejections.length / proposal.totalMembers) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {proposal.status === 'approved' && (
                  <CardFooter>
                    <Button
                      onClick={issueVC}
                      loading={loading}
                      className="w-full"
                      variant="primary"
                      size="lg"
                    >
                      Issue Verifiable Credential
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Voting Section */}
              {proposal.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cast Your Vote</CardTitle>
                    <CardDescription>
                      Vote anonymously using your member identity
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={memberSecret}
                          onChange={(e) => setMemberSecret(e.target.value)}
                          placeholder="Enter your member identity"
                          type="password"
                          className="flex-1"
                        />
                        <Button
                          onClick={generateRandomIdentity}
                          variant="secondary"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          }
                        >
                          Generate
                        </Button>
                      </div>

                      {error && (
                        <Alert variant="error">
                          {error}
                        </Alert>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => submitVote('approve')}
                          disabled={loading || !memberSecret}
                          loading={loading}
                          variant="primary"
                          className="w-full"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => submitVote('reject')}
                          disabled={loading || !memberSecret}
                          loading={loading}
                          variant="danger"
                          className="w-full"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Manage VCs Tab */}
      {activeTab === 'manage' && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Issued Verifiable Credential</CardTitle>
            <CardDescription>
              Your credential has been successfully issued with anonymous multi-party approval
            </CardDescription>
          </CardHeader>

          {issuedVC ? (
            <>
              <CardContent>
                <div className="space-y-6">
                  {/* JWT Token */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">JWT Token</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(issuedVC.credential || issuedVC.verifiableCredential?.proof?.jwt || '')}
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <code className="text-xs text-gray-700 break-all">
                        {issuedVC.credential || issuedVC.verifiableCredential?.proof?.jwt || 'JWT token not available'}
                      </code>
                    </div>
                  </div>

                  {/* VC Details */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Credential Details</label>
                    <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify(issuedVC.verifiableCredential, null, 2)}
                    </pre>
                  </div>

                  {/* Evidence */}
                  {issuedVC.evidence && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Anonymous Approval Evidence</label>
                      <pre className="bg-blue-50 rounded-lg p-4 text-xs overflow-x-auto">
                        {JSON.stringify(issuedVC.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Alert variant="info">
                  <strong>💡 Tip:</strong> Copy the JWT token above to test it in the Verification phase
                </Alert>
              </CardFooter>
            </>
          ) : (
            <CardContent>
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No credentials issued yet</p>
                <Button
                  onClick={() => setActiveTab('create')}
                  variant="outline"
                >
                  Create a Proposal
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}