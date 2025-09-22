'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface VerificationResult {
  valid: boolean;
  checks: {
    signatureValid: boolean;
    evidenceValid: boolean;
    thresholdMet: boolean;
    nullifiersUnique: boolean;
    merkleRootValid: boolean;
  };
  details?: {
    issuer?: string;
    approvalCount?: number;
    approvalThreshold?: number;
    merkleRootSource?: string;
    errors?: string[];
  };
}

interface InspectResult {
  decoded?: any;
  issuer?: string;
  subject?: any;
  evidence?: any;
  issuanceDate?: string;
}

export default function VerificationPhase() {
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleVerify = async () => {
    if (!credential.trim()) {
      setError('Please enter a credential to verify');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);
    setInspectResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credential.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationResult(data.verification);

      // Auto-inspect for details
      await handleInspect(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (silent = false) => {
    if (!credential.trim()) {
      if (!silent) setError('Please enter a credential to inspect');
      return;
    }

    if (!silent) setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/verification/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credential.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (!silent) {
          throw new Error(data.error || 'Inspection failed');
        }
        return;
      }

      setInspectResult(data.credential);
    } catch (error) {
      if (!silent) {
        setError(error instanceof Error ? error.message : 'Failed to inspect credential');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getCheckIcon = (isValid: boolean) => {
    if (isValid) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const checkLabels = {
    signatureValid: 'Digital Signature',
    evidenceValid: 'Evidence Structure',
    thresholdMet: 'Approval Threshold',
    nullifiersUnique: 'Unique Nullifiers',
    merkleRootValid: 'Merkle Root Verification',
    approvalProofsValid: 'Approval Proofs'
  };

  const checkDescriptions = {
    signatureValid: 'Verifies the issuer\'s digital signature',
    evidenceValid: 'Validates the anonymous approval evidence format',
    thresholdMet: 'Confirms minimum approvals were received',
    nullifiersUnique: 'Ensures no duplicate votes were cast',
    merkleRootValid: 'Verifies merkle root exists in issuer\'s history',
    approvalProofsValid: 'Validates all approval proofs are from group members'
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
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

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleVerify}
                loading={loading}
                disabled={!credential.trim()}
                className="flex-1"
                size="lg"
              >
                Verify Credential
              </Button>
              <Button
                onClick={() => handleInspect()}
                variant="outline"
                disabled={!credential.trim() || loading}
              >
                Inspect Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResult && (
        <Card variant={verificationResult.valid ? 'default' : 'bordered'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {verificationResult.valid ? (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <div>
                  <CardTitle className={verificationResult.valid ? 'text-green-900' : 'text-red-900'}>
                    {verificationResult.valid ? 'Valid Credential' : 'Invalid Credential'}
                  </CardTitle>
                  <CardDescription>
                    {verificationResult.valid
                      ? 'All verification checks passed successfully'
                      : 'One or more verification checks failed'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={verificationResult.valid ? 'success' : 'error'}>
                {verificationResult.valid ? 'VERIFIED' : 'FAILED'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Verification Checks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Verification Checks</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(verificationResult.checks).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {getCheckIcon(value)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {checkLabels[key as keyof typeof checkLabels]}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {checkDescriptions[key as keyof typeof checkDescriptions]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              {verificationResult.details && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {verificationResult.details.issuer && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-xs font-medium text-gray-600">Issuer</label>
                        <p className="text-sm font-mono mt-1 break-all">
                          {verificationResult.details.issuer}
                        </p>
                      </div>
                    )}
                    {verificationResult.details.approvalCount !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-xs font-medium text-gray-600">Approval Count</label>
                        <p className="text-sm mt-1">
                          {verificationResult.details.approvalCount} / {verificationResult.details.approvalThreshold}
                        </p>
                      </div>
                    )}
                    {verificationResult.details.merkleRootSource && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-xs font-medium text-gray-600">Merkle Root Source</label>
                        <p className="text-sm mt-1">
                          <Badge variant="info" size="sm">
                            {verificationResult.details.merkleRootSource}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {verificationResult.details?.errors && verificationResult.details.errors.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">Errors</h3>
                  <div className="space-y-1">
                    {verificationResult.details.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {inspectResult && (
            <CardFooter>
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                className="w-full"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                }
              >
                {showDetails ? 'Hide' : 'Show'} Credential Details
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Credential Details */}
      {showDetails && inspectResult && (
        <div className="space-y-4">
          {/* Subject Information */}
          {inspectResult.subject && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(inspectResult.subject, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Evidence */}
          {inspectResult.evidence && (
            <Card>
              <CardHeader>
                <CardTitle>Anonymous Approval Evidence</CardTitle>
                <CardDescription>
                  Cryptographic proofs of anonymous multi-party approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-blue-50 rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(inspectResult.evidence, null, 2)}
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
                {JSON.stringify(inspectResult.decoded, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inspect-only Results */}
      {!verificationResult && inspectResult && (
        <Card>
          <CardHeader>
            <CardTitle>Credential Inspection</CardTitle>
            <CardDescription>
              Decoded credential without verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="warning" className="mb-4">
              This credential has been decoded but not verified. Run verification to check its validity.
            </Alert>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(inspectResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}