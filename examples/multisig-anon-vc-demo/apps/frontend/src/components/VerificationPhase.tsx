'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Fingerprint as FingerprintIcon,
  Groups as GroupsIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';

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
  const [showInspect, setShowInspect] = useState(false);

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
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify credential');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (silent = false) => {
    if (!credential.trim() && !silent) {
      setError('Please enter a credential to inspect');
      return;
    }

    if (!silent) {
      setLoading(true);
      setError('');
    }

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
        throw new Error(data.error || 'Inspection failed');
      }

      setInspectResult(data.credential);
      if (!silent) setShowInspect(true);
    } catch (err) {
      if (!silent) {
        console.error('Inspection error:', err);
        setError(err instanceof Error ? err.message : 'Failed to inspect credential');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getCheckIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircleIcon color="success" />
    ) : (
      <CancelIcon color="error" />
    );
  };

  const getCheckLabel = (key: string): string => {
    const labels: Record<string, string> = {
      signatureValid: 'Digital Signature Verification',
      evidenceValid: 'Evidence Structure Validation',
      thresholdMet: 'Approval Threshold Requirement',
      nullifiersUnique: 'Nullifier Uniqueness Check',
      merkleRootValid: 'Merkle Root Validation'
    };
    return labels[key] || key;
  };

  const getCheckDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      signatureValid: 'Verifies the VC was signed by the claimed issuer',
      evidenceValid: 'Validates the anonymous approval evidence format',
      thresholdMet: 'Confirms sufficient members approved the issuance',
      nullifiersUnique: 'Ensures no duplicate votes were counted',
      merkleRootValid: 'Verifies the merkle root exists in issuer history'
    };
    return descriptions[key] || '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Enter Credential
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              placeholder="Paste your JWT credential here..."
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading || !credential.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
              >
                {loading ? 'Verifying...' : 'Verify Credential'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleInspect(false)}
                disabled={loading || !credential.trim()}
                startIcon={<FingerprintIcon />}
              >
                Inspect Only
              </Button>
            </Box>
          </Paper>

          {/* Credential Details */}
          {inspectResult && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Credential Details</Typography>
                <IconButton onClick={() => setShowInspect(!showInspect)}>
                  {showInspect ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={showInspect}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Issuer</Typography>
                  <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                    {inspectResult.issuer || 'Unknown'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">Issuance Date</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {inspectResult.issuanceDate ?
                      new Date(inspectResult.issuanceDate).toLocaleString() :
                      'Unknown'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                  <Paper variant="outlined" sx={{ p: 1, mb: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.85rem', overflow: 'auto' }}>
                      {JSON.stringify(inspectResult.subject, null, 2)}
                    </pre>
                  </Paper>

                  {inspectResult.evidence && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">Evidence</Typography>
                      <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: '0.85rem', overflow: 'auto' }}>
                          {JSON.stringify(inspectResult.evidence, null, 2)}
                        </pre>
                      </Paper>
                    </>
                  )}
                </Box>
              </Collapse>
            </Paper>
          )}
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} lg={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {verificationResult && (
            <>
              {/* Overall Result */}
              <Card
                sx={{
                  mb: 3,
                  borderLeft: 6,
                  borderLeftColor: verificationResult.valid ? 'success.main' : 'error.main'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getCheckIcon(verificationResult.valid)}
                    <Box>
                      <Typography variant="h5">
                        {verificationResult.valid ? 'Valid Credential' : 'Invalid Credential'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {verificationResult.valid ?
                          'All verification checks passed successfully' :
                          'One or more verification checks failed'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Verification Checks */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  Verification Checks
                </Typography>
                <Divider sx={{ my: 2 }} />

                <List>
                  {Object.entries(verificationResult.checks).map(([key, value]) => (
                    <ListItem key={key} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getCheckIcon(value)}
                      </ListItemIcon>
                      <ListItemText
                        primary={getCheckLabel(key)}
                        secondary={getCheckDescription(key)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              {/* Additional Details */}
              {verificationResult.details && (
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Verification Details</Typography>
                    <IconButton onClick={() => setShowDetails(!showDetails)}>
                      {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={showDetails}>
                    <Box sx={{ mt: 2 }}>
                      {verificationResult.details.approvalThreshold && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            <GroupsIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                            Approval Status
                          </Typography>
                          <Typography variant="body1">
                            {verificationResult.details.approvalCount} of {verificationResult.details.approvalThreshold} required approvals
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`${verificationResult.details.approvalCount}/${verificationResult.details.approvalThreshold}`}
                              color={verificationResult.checks.thresholdMet ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      )}

                      {verificationResult.details.merkleRootSource && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            <AccountTreeIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                            Merkle Root Source
                          </Typography>
                          <Chip
                            label={verificationResult.details.merkleRootSource}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      )}

                      {verificationResult.details.errors && verificationResult.details.errors.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="error">
                            Errors
                          </Typography>
                          {verificationResult.details.errors.map((err, idx) => (
                            <Alert severity="error" sx={{ mt: 1 }} key={idx}>
                              {err}
                            </Alert>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </div>
  );
}