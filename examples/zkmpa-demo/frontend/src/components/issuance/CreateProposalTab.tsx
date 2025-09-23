'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { VCClaims } from '@/types/issuance'

interface CreateProposalTabProps {
  vcClaims: VCClaims
  setVcClaims: (claims: VCClaims) => void
  approvalPolicy: { m: number; n: number }
  setApprovalPolicy: (policy: { m: number; n: number }) => void
  loading: boolean
  error: string
  onCreateProposal: () => void
}

export function CreateProposalTab({
  vcClaims,
  setVcClaims,
  approvalPolicy,
  setApprovalPolicy,
  loading,
  error,
  onCreateProposal
}: CreateProposalTabProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  const toggleOptionalFields = () => {
    if (!showOptionalFields) {
      // Initialize optional fields when showing them
      setVcClaims({
        ...vcClaims,
        credentialSubject: {
          ...vcClaims.credentialSubject,
          grantAmount: vcClaims.credentialSubject.grantAmount || '',
          projectDescription: vcClaims.credentialSubject.projectDescription || ''
        }
      })
    }
    setShowOptionalFields(!showOptionalFields)
  }
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Create VC Issuance Proposal</CardTitle>
        <CardDescription>
          Define the verifiable credential claims and approval requirements
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Proposal Title */}
          <Input
            label="Proposal Name"
            value={vcClaims.title}
            onChange={(e) => setVcClaims({
              ...vcClaims,
              title: e.target.value
            })}
            placeholder="Grant Application - StartupX"
            helper="A descriptive name for this proposal"
          />

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
                label="Credential Type"
                value={vcClaims.credentialSubject.role}
                onChange={(e) => setVcClaims({
                  ...vcClaims,
                  credentialSubject: { ...vcClaims.credentialSubject, role: e.target.value }
                })}
                placeholder="Grant Recipient"
                helper="Type of credential to issue (e.g., Grant Recipient, DAO Member, Developer)"
              />

              {/* Optional Fields Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleOptionalFields}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <svg
                    className={`w-4 h-4 mr-1 transform transition-transform ${showOptionalFields ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showOptionalFields ? 'Hide' : 'Show'} Optional Fields (Grant Details)
                </button>
              </div>

              {/* Optional Grant Fields */}
              {showOptionalFields && (
                <>
                  <Input
                    label="Grant Amount (Optional)"
                    value={vcClaims.credentialSubject.grantAmount || ''}
                    onChange={(e) => setVcClaims({
                      ...vcClaims,
                      credentialSubject: { ...vcClaims.credentialSubject, grantAmount: e.target.value }
                    })}
                    placeholder="$50,000"
                    helper="Requested funding amount"
                  />

                  <TextArea
                    label="Project Description (Optional)"
                    value={vcClaims.credentialSubject.projectDescription || ''}
                    onChange={(e) => setVcClaims({
                      ...vcClaims,
                      credentialSubject: { ...vcClaims.credentialSubject, projectDescription: e.target.value }
                    })}
                    rows={3}
                    placeholder="Brief description of the project or purpose"
                    helper="Additional context for the credential"
                  />
                </>
              )}
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
          onClick={onCreateProposal}
          disabled={loading || !vcClaims.title || !vcClaims.credentialSubject.name}
          loading={loading}
          className="w-full"
          size="lg"
        >
          Create Proposal
        </Button>
      </CardFooter>
    </Card>
  )
}