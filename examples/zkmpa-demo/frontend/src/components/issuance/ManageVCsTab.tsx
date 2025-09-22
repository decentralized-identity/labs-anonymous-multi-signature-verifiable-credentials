'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { IssuedVC, TabType } from '@/types/issuance'
import { decodeJWT } from '@/utils/jwt'

interface ManageVCsTabProps {
  issuedVC: IssuedVC | null
  onNavigate: (tab: TabType) => void
}

export function ManageVCsTab({ issuedVC, onNavigate }: ManageVCsTabProps) {
  const [copied, setCopied] = useState(false)

  const decodedCredential = issuedVC?.credential ? decodeJWT(issuedVC.credential) : null
  const evidenceData = decodedCredential?.vc?.evidence

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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
                    onClick={() => copyToClipboard(issuedVC.credential || '')}
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
                    {issuedVC.credential || 'JWT token not available'}
                  </code>
                </div>
              </div>

              {/* Decoded VC Details */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Credential Details (Decoded JWT)</label>
                <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(decodedCredential || {}, null, 2)}
                </pre>
              </div>

              {/* Evidence from decoded JWT */}
              {evidenceData && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Anonymous Approval Evidence</label>
                  <pre className="bg-blue-50 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(evidenceData, null, 2)}
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
              onClick={() => onNavigate('create')}
              variant="outline"
            >
              Create a Proposal
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}