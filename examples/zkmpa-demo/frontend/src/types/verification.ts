export interface VerificationResult {
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

export const CHECK_LABELS = {
  signatureValid: 'Digital Signature',
  evidenceValid: 'Evidence Structure',
  thresholdMet: 'Approval Threshold',
  nullifiersUnique: 'Unique Nullifiers',
  merkleRootValid: 'Merkle Root Verification',
  approvalProofsValid: 'Approval Proofs'
} as const;

export const CHECK_DESCRIPTIONS = {
  signatureValid: 'Verifies the issuer\'s digital signature',
  evidenceValid: 'Validates the anonymous approval evidence format',
  thresholdMet: 'Confirms minimum approvals were received',
  nullifiersUnique: 'Ensures no duplicate votes were cast',
  merkleRootValid: 'Verifies merkle root exists in issuer\'s history',
  approvalProofsValid: 'Validates all approval proofs are from group members'
} as const;