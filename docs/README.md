# zkMAP - Zero-Knowledge Multi-party Approval Protocol

## Overview

zkMAP enables organizations to issue W3C Verifiable Credentials based on anonymous multi-party approval. Members vote on credential issuance without revealing their identities using Semaphore zero-knowledge proofs.

## Key Features

- **Anonymous Voting**: Members vote using Semaphore zero-knowledge proofs
- **Threshold Approval**: Configurable m-of-n approval requirements
- **Standard VC Format**: Compatible with W3C Verifiable Credentials
- **Verifiable Membership**: All approval proofs validate group membership
- **Merkle Root History**: Tracks group state changes over time

## Protocol Flow

### 1. Setup Phase
- Organization creates a DID and Semaphore group
- Members are added with their identity commitments
- Approval policy (m-of-n) is defined
- Group information is published in [DID Document](#semaphore-group-did-document-structure) services:
  - **SemaphoreGroup**: Points to the active group contract
  - **MerkleRootHistory**: Maintains historical merkle roots for verification

### 2. Issuance Phase
- VC request is converted to a proposal
- Members vote anonymously using ZK proofs
- System verifies proofs and prevents double-voting
- Upon threshold, VC is issued with [evidence](#vc-evidence-schema)

### 3. Verification Phase
Two-stage verification process:
1. **Signature Check**: Verify issuer's digital signature
2. **Evidence Check**:
   - Validate approval threshold met
   - Ensure nullifiers are unique
   - Verify merkle root in issuer's history
   - Validate all approval proofs are from group members

## VC Evidence Schema

VCs include cryptographic proof of multi-party approval:

```json
"evidence": [{
  "type": "SemaphoreAnonymousVoting",
  "proposalId": "0x...",
  "groupMerkleRoot": "0x...",
  "approvalThreshold": 3,
  "totalMembers": 5,
  "approvals": {
    "count": 3,
    "proofs": [
      {
        "proof": { /* Semaphore proof object */ },
        "nullifierHash": "0x...",
        "merkleTreeRoot": "0x..."
      }
    ]
  }
}]
```

## Semaphore Group DID Document Structure

The issuer's DID Document declares ownership of the Semaphore group and maintains merkle root history:

```json
{
  "id": "did:ethr:0x123...",
  "verificationMethod": [...],
  "service": [
    {
      "id": "did:ethr:0x123...#semaphore",
      "type": "SemaphoreGroup",
      "serviceEndpoint": {
        "contractAddress": "0xabc...",
        "chainId": "eip155:1"
      }
    },
    {
      "id": "did:ethr:0x123...#merkle-roots",
      "type": "MerkleRootHistory",
      "recentRoots": [
        {
          "root": "0x1234...",
          "timestamp": "2024-01-20T10:00:00Z",
          "blockNumber": 1234567
        }
        // Last 10 roots for quick verification
      ],
      "archiveInfo": {
        "endpoint": "https://api.example.com/groups/{groupId}/merkle-roots",
        "totalRoots": 5432
      }
    }
  ]
}
```

**Service Descriptions:**
- **SemaphoreGroup**: Points to the smart contract where the current Semaphore group is deployed
- **MerkleRootHistory**: Maintains recent merkle roots (for fast verification) with archive reference for complete history

## Verification Checks

| Check | Description |
|-------|-------------|
| `signatureValid` | Verifies issuer's digital signature |
| `evidenceValid` | Validates evidence structure |
| `thresholdMet` | Confirms minimum approvals |
| `nullifiersUnique` | Ensures no duplicate votes |
| `merkleRootValid` | Verifies root in issuer's history |
| `approvalProofsValid` | Validates proofs are from group members |

## Implementation

See the [zkMAP demo](../examples/zkmap-demo/README.md) for a complete implementation.

## References

- [Semaphore Protocol](https://docs.semaphore.pse.dev/)
- [W3C VC Evidence](https://www.w3.org/TR/vc-data-model-2.0/#evidence)
- [DID Services](https://www.w3.org/TR/did-1.0/#services)