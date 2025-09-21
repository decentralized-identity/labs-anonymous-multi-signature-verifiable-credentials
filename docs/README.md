# zkMAP - Zero-Knowledge Multi-party Approval Protocol Specification

### 1. Introduction

This document specifies zkMAP (Zero-Knowledge Multi-party Approval Protocol), a way for issuing W3C Verifiable Credentials (VCs) or IETF SD-JWT VCs based on anonymous, multi-party approval from a group of members. It combines the cryptographic privacy of the Semaphore zero-knowledge protocol with existing decentralized identity standards to enable organizations like DAOs, committees, or multi-stakeholder boards to collectively issue credentials without revealing the identities of the participating signers.

The primary goal is to provide a standardized mechanism for `m-of-n` VC issuance that is compatible with standard VC formats and verification workflows while preserving internal member anonymity.

### 2. Core Components & Actors

- **Issuer Organization:** A collective entity (e.g., a DAO) responsible for defining issuance policies and managing the Semaphore membership group. It is identified by a Decentralized Identifier (DID).
- **Member:** An individual or entity that is a member of the Issuer Organization. Each Member possesses a Semaphore `Identity`.
- **Holder:** The subject to whom the Verifiable Credential is being issued.
- **Verifier:** An entity that requests and verifies the VC presented by the Holder.
- **Semaphore Group:** A Merkle tree of `Identity Commitments` of all Members, managed by the Issuer Organization. The state of this group is represented by its **Merkle Root**, which must be publicly resolvable and associated with the Issuer's DID.
- **Approval Proposal:** A request for VC issuance that needs to be approved by the Members. Each proposal is uniquely identified.

### 3. Architecture: The Relationship between Issuer DID and Semaphore Group

This framework is built on a clear hierarchical relationship between the Issuer's identity and the tools it uses.

- **The Issuer DID is the root of trust.** It represents the official, sovereign identity of the organization.
- **The Semaphore Group is a service operated by the Issuer.** It is a tool used by the organization to facilitate anonymous voting.

The link between the Issuer DID and the Semaphore Group is not established by issuing a DID *from* the group. Instead, the **Issuer's DID Document explicitly declares ownership and control over a specific Semaphore Group**. This linkage is what allows a Verifier to trust that they are checking against the correct, official group.

This declaration is made by adding a serviceEndpoint to the Issuer's DID Document that points to the Semaphore Group.

### 4. Protocol Flow

### 4.1. Setup Phase

1. **Issuer DID Creation:** The Issuer Organization creates a DID (e.g., `did:ethr`, `did:ion`, `did:web`) and registers it in a verifiable data registry (e.g., a public blockchain, web server).
2. **Semaphore Group Initialization:**
    - The Issuer Organization deploys or configures a Semaphore group. The group information **MUST** be published in the Issuer's DID Document through two required service entries:

    **Required DID Document Services:**
    
    ```jsx
    "service": [{
      "id": "did:ethr:0x123...#semaphore",
      "type": "SemaphoreGroup",
      "serviceEndpoint": {
        "type": "EthereumSmartContract",
        "contractAddress": "0xabc... (The address of the Semaphore group contract)",
        "chainId": "eip155:1"
      }
    }, {
      "id": "did:ethr:0x123...#merkle-roots-history",
      "type": "MerkleRootHistory",
      "merkleRoots": [
        {
          "root": "0xabc123...",
          "blockNumber": 12345,
          "timestamp": "2024-01-01T00:00:00Z"
        },
        {
          "root": "0xdef456...",
          "blockNumber": 12350,
          "timestamp": "2024-01-01T01:00:00Z"
        }
      ]
    }]
    ```

    - **SemaphoreGroup Service:** Points to the smart contract where the current Semaphore group is deployed. This allows verifiers to locate the active group for current operations.
    
    - **MerkleRootHistory Service:** Contains a chronological record of all historical merkle roots of the Semaphore group. This enables verifiers to validate proofs against past group states without relying on external APIs. Each entry includes:
        - `root`: The merkle root hash at a specific point in time
        - `blockNumber`: The blockchain block number when this root was recorded
        - `timestamp`: The timestamp when this root became active
        
        This history is essential because VC issuance may have occurred when the group had a different membership composition than the current state.
            
    - The Issuer defines and publishes its approval policy (the values of `m` and `n`).
3. **Member Registration:**
    - The Issuer adds authorized Members to the Semaphore group by registering their `Identity Commitments`.
    - The group's Merkle Root is computed and made publicly available. Any change in membership results in a new Merkle Root.

### 4.2. Issuance Phase: Anonymous Approval and VC Generation

This is the core of the protocol, detailing how anonymous approvals are gathered and bound to a VC.

1. **VC Issuance Request:** A Holder requests a VC from the Issuer Organization, providing the necessary claims.
2. **Internal Proposal Generation:** The Issuer's system converts the request into an internal proposal. A unique identifier for this specific issuance event is created to serve as the `externalNullifier`. To support both approval and rejection, two distinct nullifiers are derived:
    - `proposalId = hash(canonicalize(VC_claims) + nonce)`
    - `externalNullifier_approve = hash("approve" + proposalId)`
    - `externalNullifier_reject = hash("reject" + proposalId)`
3. **Anonymous Member Voting:**
    - Members review the proposal.
    - To **approve**, a Member generates a Semaphore proof using their `Identity` and `externalNullifier_approve`.
    - To **reject**, a Member generates a Semaphore proof using their `Identity` and `externalNullifier_reject`.
    - Each Member submits their generated `proof` and the resulting `nullifier_hash` to the Issuer's system.
4. **Proof Aggregation and Verification:**
    - The Issuer's system collects the proofs and categorizes them as approvals or rejections based on the `externalNullifier` used for verification.
    - The system verifies each proof against the group's current Merkle Root and the corresponding `externalNullifier`.
    - It checks for duplicate `nullifier_hash` values within each category to prevent double-voting.
5. **VC Creation and Signing:**
    - If the number of valid approval proofs meets or exceeds the threshold `m` (and rejections do not exceed a defined threshold, if applicable), the Issuer proceeds to create the VC.
    - The VC **MUST** include an `evidence` property containing the cryptographic proof of the multi-party approval. This binds the anonymous approvals to the VC.
    - The Issuer signs the **entire VC object** (including the `evidence` property) using the private key associated with its DID.

### 4.2.1. The `evidence` Property Schema

The `evidence` property of VC should conform to the following JSON structure:

```json
"evidence": [{
  "type": "SemaphoreAnonymousVoting",
  "proposalId": "0x... (hash of claims)",
  "groupMerkleRoot": "0x... (root at the time of voting)",
  "approvalThreshold": 10, // 'm'
  "totalMembers": 15,      // 'n'
  "approvals": {
    "count": 12,
    "nullifiers": [
      "0x... (unique nullifier hash)",
      "0x... (unique nullifier hash)"
    ]
  },
  "rejections": { // Optional, if rejection tracking is implemented
    "count": 1,
    "nullifiers": [
      "0x... (unique nullifier hash)"
    ]
  }
}]
```

### 4.3. Verification Phase

A Verifier performs a two-stage process to validate the VC.

1. **Standard VC Verification (Signature Check):**
    - The Verifier resolves the Issuer's DID from the `issuer` field of the VC to retrieve the DID Document.
    - It extracts the Issuer's public key from the `verificationMethod` section.
    - It verifies the digital signature of the VC using the public key.
    - **Result:** This proves that the VC, including the `evidence` property, was issued and sealed by the legitimate Issuer and has not been tampered with.
2. **Anonymous Approval Verification (Evidence Check):**
    - The Verifier parses the `evidence` property.
    - It checks that `approvals.count` is greater than or equal to `approvalThreshold`.
    - It verifies that all `nullifiers` in the `approvals.nullifiers` array are unique.
    - It resolves the Semaphore group information from the Issuer's DID Document (via the `serviceEndpoint`).
    - It confirms that the `groupMerkleRoot` listed in the `evidence` is a valid, historical, or current root for that Semaphore group. This can be checked against a list of valid roots maintained by the Issuer.
    - **Result:** This cryptographically proves that the issuance was authorized by a sufficient number of unique, anonymous members of the Issuer's official group.

## 5. Merkle Root History Management

To efficiently manage and verify historical merkle roots while keeping DID documents lightweight, the protocol uses a hybrid storage approach:

### 5.1. Hybrid Storage Architecture

The DID Document contains only recent merkle roots (e.g., last 10), while complete history is stored in external storage:

```json
{
  "id": "did:example:123#merkle-roots-history",
  "type": "MerkleRootHistory",
  "recentRoots": [
    {
      "root": "0x1234...",
      "timestamp": "2024-01-20T10:00:00Z",
      "blockNumber": 1234567
    }
    // ... recent 10 roots only
  ],
  "archiveInfo": {
    "type": "MongoDB",
    "endpoint": "https://api.example.com/api/groups/{groupId}/merkle-roots",
    "totalRoots": 5432
  }
}
```

### 5.2. Verification Flow

When verifying a merkle root:

1. **Check DID Document** - Fast path for recent roots (~10ms)
2. **Query External Storage** - For older roots via archive endpoint (~50ms)
3. **Reject if Not Found** - Root not in history means invalid proof

### 5.3. Storage Options

- **Centralized Database** (e.g., MongoDB, PostgreSQL): Fast indexed queries, suitable for real-time verification
- **IPFS**: Decentralized archive, suitable for long-term audit trails
- **On-chain Index**: Optional smart contract for critical checkpoints

This approach ensures DID documents remain small while maintaining full verifiability of all historical proofs.

---

## References

- Semaphore
    - https://docs.semaphore.pse.dev/
- https://www.w3.org/TR/vc-data-model-2.0/#evidence
- https://www.w3.org/TR/did-1.0/#services

## Implementation

See the [zkMAP demo example](../examples/zkmap-demo/README.md) for a complete implementation of the zkMAP protocol.