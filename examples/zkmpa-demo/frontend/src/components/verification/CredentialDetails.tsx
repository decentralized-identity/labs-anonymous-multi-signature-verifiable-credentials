'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface CredentialDetailsProps {
  decodedCredential: any
}

export function CredentialDetails({ decodedCredential }: CredentialDetailsProps) {
  if (!decodedCredential) return null

  const subjectInfo = decodedCredential.vc?.credentialSubject
  const evidence = decodedCredential.vc?.evidence

  return (
    <div className="space-y-4">
      {/* Subject Information */}
      {subjectInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(subjectInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      {evidence && (
        <Card>
          <CardHeader>
            <CardTitle>Anonymous Approval Evidence</CardTitle>
            <CardDescription>
              Cryptographic proofs of anonymous multi-party approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-blue-50 rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Full Decoded Credential */}
      <Card>
        <CardHeader>
          <CardTitle>Full Decoded Credential</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
            {JSON.stringify(decodedCredential, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}