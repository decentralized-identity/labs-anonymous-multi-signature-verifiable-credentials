"use client";

import { useCredentialInput } from "@/hooks/useCredentialInput";
import { useCredentialVerification } from "@/hooks/useCredentialVerification";
import { useDetailsToggle } from "@/hooks/useDetailsToggle";
import { CredentialInput } from "./verification/CredentialInput";
import { VerificationResults } from "./verification/VerificationResults";
import { CredentialDetails } from "./verification/CredentialDetails";

export default function VerificationPhase() {
  const { credential, decodedCredential, setCredential } = useCredentialInput();
  const { verificationResult, loading, error, verifyCredential } =
    useCredentialVerification();
  const { showDetails, toggleDetails } = useDetailsToggle();

  const handleVerify = async () => {
    await verifyCredential(credential);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <CredentialInput
        credential={credential}
        setCredential={setCredential}
        loading={loading}
        error={error}
        onVerify={handleVerify}
      />

      {/* Verification Results */}
      {verificationResult && (
        <VerificationResults
          verificationResult={verificationResult}
          showDetails={showDetails}
          onToggleDetails={toggleDetails}
        />
      )}

      {/* Credential Details */}
      {showDetails && decodedCredential && (
        <CredentialDetails decodedCredential={decodedCredential} />
      )}
    </div>
  );
}
