'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  VerificationResult,
  CHECK_LABELS,
  CHECK_DESCRIPTIONS,
} from '@/types/verification'

interface VerificationResultsProps {
  verificationResult: VerificationResult
  showDetails: boolean
  onToggleDetails: () => void
}

export function VerificationResults({
  verificationResult,
  showDetails,
  onToggleDetails
}: VerificationResultsProps) {
  const getCheckIcon = (isValid: boolean) => {
    if (isValid) {
      return (
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    }
    return (
      <svg
        className="w-5 h-5 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }

  return (
    <Card variant={verificationResult.valid ? "default" : "bordered"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {verificationResult.valid ? (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            )}
            <div>
              <CardTitle
                className={
                  verificationResult.valid
                    ? "text-green-900"
                    : "text-red-900"
                }
              >
                {verificationResult.valid
                  ? "Valid Credential"
                  : "Invalid Credential"}
              </CardTitle>
              <CardDescription>
                {verificationResult.valid
                  ? "All verification checks passed successfully"
                  : "One or more verification checks failed"}
              </CardDescription>
            </div>
          </div>
          <Badge variant={verificationResult.valid ? "success" : "error"}>
            {verificationResult.valid ? "VERIFIED" : "FAILED"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Verification Checks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Verification Checks
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(verificationResult.checks).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      value
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {getCheckIcon(value)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {CHECK_LABELS[key as keyof typeof CHECK_LABELS]}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {
                          CHECK_DESCRIPTIONS[
                            key as keyof typeof CHECK_DESCRIPTIONS
                          ]
                        }
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Details */}
          {verificationResult.details && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {verificationResult.details.issuer && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs font-medium text-gray-600">
                      Issuer
                    </label>
                    <p className="text-sm font-mono mt-1 break-all">
                      {verificationResult.details.issuer}
                    </p>
                  </div>
                )}
                {verificationResult.details.approvalCount !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs font-medium text-gray-600">
                      Approval Count
                    </label>
                    <p className="text-sm mt-1">
                      {verificationResult.details.approvalCount} /{" "}
                      {verificationResult.details.approvalThreshold}
                    </p>
                  </div>
                )}
                {verificationResult.details.merkleRootSource && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs font-medium text-gray-600">
                      Merkle Root Source
                    </label>
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
          {verificationResult.details?.errors &&
            verificationResult.details.errors.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Errors
                </h3>
                <div className="space-y-1">
                  {verificationResult.details.errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-red-700 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onToggleDetails}
          variant="outline"
          className="w-full"
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showDetails ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          }
        >
          {showDetails ? "Hide" : "Show"} Credential Details
        </Button>
      </CardFooter>
    </Card>
  )
}