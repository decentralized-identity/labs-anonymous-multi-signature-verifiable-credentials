'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface CredentialInputProps {
  credential: string
  setCredential: (value: string) => void
  loading: boolean
  error: string
  onVerify: () => void
}

export function CredentialInput({
  credential,
  setCredential,
  loading,
  error,
  onVerify
}: CredentialInputProps) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Verify Credential</CardTitle>
        <CardDescription>
          Paste a JWT credential to verify its authenticity and anonymous approvals
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <TextArea
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="Paste your JWT verifiable credential here..."
            rows={6}
            className="font-mono text-sm"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3">
            <Button
              onClick={onVerify}
              loading={loading}
              disabled={!credential.trim()}
              className="flex-1"
              size="lg"
            >
              Verify Credential
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}