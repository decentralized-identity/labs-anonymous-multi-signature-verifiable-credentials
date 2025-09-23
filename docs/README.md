# zkMPA - Zero-Knowledge Multi-Party Approval for Verifiable Credentials

## Overview

zkMPA enables organizations to issue W3C Verifiable Credentials based on anonymous multi-party approval. Members vote on credential issuance without revealing their identities using Semaphore zero-knowledge proofs.

## Background & Motivation

### Problem: DAOs Need Anonymous Yet Verifiable Decisions
Decentralized organizations face a fundamental dilemma in collective decision-making:
- **Transparency vs. Privacy**: On-chain voting exposes who voted for what, creating social pressure and potential retaliation
- **Traditional Multisig Limitations**: Standard m-of-n schemes reveal individual signers' identities
- **Duplicate Prevention Challenge**: Anonymous systems struggle to prevent members from voting multiple times

### Why Existing Solutions Fall Short

| Solution | Strengths | Limitations |
|----------|-----------|-------------|
| **Traditional Multisig** | • Threshold enforcement (m-of-n) | • No voter privacy<br>• Vulnerable to coercion<br>• Signers are publicly visible |
| **Threshold BLS** | • Efficient single signature<br>• Cryptographically secure | • Cannot prevent duplicate votes<br>• No individual membership proofs<br>• Incompatible with VC evidence |

### zkMPA Solution
zkMPA uniquely combines:
1. **Anonymous Voting**: Zero-knowledge proofs hide voter identities
2. **Membership Verification**: Each vote cryptographically proves group membership
3. **Duplicate Prevention**: Nullifiers ensure one-vote-per-member without revealing identity
4. **VC Standard Compatibility**: Evidence field preserves all proofs for verifiable audit trail

This enables DAOs to issue credentials based on genuine member consensus while protecting individual privacy—something not achievable with existing multisig or threshold signature schemes.

## Key Features

- **Anonymous Voting**: Members vote using Semaphore zero-knowledge proofs
- **Threshold Approval**: Configurable m-of-n approval requirements
- **Standard VC Format**: VCDM 2.0 compliant using VC-JWT format (VC-JOSE-COSE)
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
- Upon threshold, VC is issued as JWT with [evidence](#vc-format-vcdm-20-vc-jwt)

### 3. Verification Phase
Two-stage verification process:
1. **JWT Signature Check**: Verify the compact JWT signature using the issuer's DID and public key
2. **Evidence Check** (within the vc claim):
   - Validate approval threshold met
   - Ensure nullifiers are unique
   - Verify merkle root in issuer's history
   - Validate all approval proofs are from group members

## VC Format (VCDM 2.0 VC-JWT)

VCs are issued as compact JWT (JWS) following the VC-JOSE-COSE specification:

### JWT Header
```json
{
  "alg": "ES256K",
  "kid": "did:ethr:0x123...#keys-1",
  "typ": "application/vc+jwt"
}
```

### JWT Payload
```json
{
  "iss": "did:ethr:0x123...",
  "sub": "did:example:holder",
  "nbf": 1758573650,
  "iat": 1758573650,
  "exp": 1790109650,
  "jti": "urn:uuid:...",
  "vc": {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://w3id.org/zkmpa/contexts/v1"
    ],
    "type": ["VerifiableCredential"],
    "credentialSubject": {
      "id": "did:example:holder",
      "name": "John Doe",
      "role": "Developer"
    },
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
  }
}
```

### Final VC Format
The VC is delivered as a compact JWS string:
```
eyJhbGciOiJFUzI1NksiLC....<header>.<payload>.<signature>
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
| `jwtSignatureValid` | Verifies JWT signature using issuer's public key from DID |
| `evidenceValid` | Validates evidence structure within vc claim |
| `thresholdMet` | Confirms minimum approvals |
| `nullifiersUnique` | Ensures no duplicate votes |
| `merkleRootValid` | Verifies root in issuer's history |
| `approvalProofsValid` | Validates proofs are from group members |

## Implementation

See the [zkMPA demo](../examples/zkmpa-demo/README.md) for a complete implementation.

## Custom Context for Evidence

The evidence field uses a custom JSON-LD context to provide semantic meaning for the Semaphore anonymous voting properties. The context definition is available at [`v1.jsonld`](./v1.jsonld).

Include the context URL in your VC's `@context` array:

```json
"@context": [
  "https://www.w3.org/ns/credentials/v2",
  "https://w3id.org/zkmpa/contexts/v1"
]
```

This ensures semantic interoperability while maintaining compatibility with standard VC processors and enables proper JSON-LD processing of the evidence field.

## References

- [Semaphore Protocol](https://docs.semaphore.pse.dev/)
- [W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)
- [W3C VC-JOSE-COSE](https://www.w3.org/TR/vc-jose-cose/)
- [W3C VC Evidence](https://www.w3.org/TR/vc-data-model-2.0/#evidence)
- [DID Services](https://www.w3.org/TR/did-1.0/#services)