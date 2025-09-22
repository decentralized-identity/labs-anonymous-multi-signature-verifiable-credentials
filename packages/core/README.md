# @zkmpa/core

Core implementation of zkMPA (Zero-Knowledge Multi-Party Approval), providing privacy-preserving multi-party credential issuance using zero-knowledge proofs.

## Features

- 🔐 **Anonymous Voting**: Group members can vote without revealing identity
- 🎭 **Zero-Knowledge Proofs**: Using Semaphore protocol for privacy
- 📜 **Verifiable Credentials**: W3C VC standard compliant
- 🏗️ **Modular Architecture**: Composable packages for flexibility
- 💾 **Multiple Storage Options**: In-memory, file, or database backends

## Installation

```bash
npm install @zkmpa/core
```

## Quick Start

```typescript
import {
  IdentityManager,
  GroupManager,
  ProposalManager,
  CredentialIssuer,
  StorageFactory
} from '@zkmpa/core'

// Initialize components
const storage = StorageFactory.createMemoryAdapter()
const identityManager = new IdentityManager()
const groupManager = new GroupManager()
const proposalManager = new ProposalManager(groupManager, storage)
const credentialIssuer = new CredentialIssuer()

// Create a group
const group = groupManager.createGroup({
  id: 'dao-validators',
  name: 'DAO Validators',
  merkleTreeDepth: 20
})

// Create identities and add to group
const alice = identityManager.createIdentity()
const bob = identityManager.createIdentity()
const charlie = identityManager.createIdentity()

groupManager.addMember('dao-validators', alice.commitment)
groupManager.addMember('dao-validators', bob.commitment)
groupManager.addMember('dao-validators', charlie.commitment)

// Create a proposal for VC issuance
const proposal = await proposalManager.createProposal({
  content: {
    credentialSubject: {
      id: 'did:example:user123',
      role: 'validator',
      level: 'senior'
    }
  },
  groupId: 'dao-validators',
  approvalThreshold: 2 // Need 2 out of 3 approvals
})

// Members vote anonymously
// ... voting logic ...

// Issue VC with anonymous approval evidence
const vc = await credentialIssuer.issueWithEvidence(
  proposal.content,
  proposal.getApprovalEvidence(),
  'did:group:dao-validators'
)
```

## Package Structure

### Core Packages

- **@zkmpa/identity**: Identity creation and management
- **@zkmpa/group**: Group membership and Merkle tree management
- **@zkmpa/proposal**: Proposal creation and voting logic
- **@zkmpa/credential**: VC issuance and verification
- **@zkmpa/proof**: ZK proof generation and verification
- **@zkmpa/storage**: Pluggable storage adapters

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│                        @zkmpa/core                           │
├──────────────┬────────────┬──────────────┬─────────────────┤
│   Identity   │   Group    │   Proposal   │   Credential    │
├──────────────┴────────────┴──────────────┴─────────────────┤
│                         Proof                                │
├──────────────────────────────────────────────────────────────┤
│                        Storage                               │
└──────────────────────────────────────────────────────────────┘
```

## Use Cases

1. **DAO Governance**: Anonymous voting on proposals
2. **Multi-sig Wallets**: Privacy-preserving approvals
3. **Credential Issuance**: Decentralized identity verification
4. **Review Systems**: Anonymous peer reviews
5. **Whistleblowing**: Secure, anonymous reporting

## API Reference

### IdentityManager

```typescript
const identity = identityManager.createIdentity(secret?: string)
const serialized = identityManager.exportIdentity(identity)
const imported = identityManager.importIdentity(serialized)
```

### GroupManager

```typescript
const group = groupManager.createGroup(config)
groupManager.addMember(groupId, commitment)
const merkleProof = groupManager.getMerkleProof(groupId, commitment)
```

### ProposalManager

```typescript
const proposal = await proposalManager.createProposal(params)
await proposalManager.submitVote(proposalId, vote)
const status = await proposalManager.getProposalStatus(proposalId)
```

### CredentialIssuer

```typescript
const vc = await credentialIssuer.issueWithEvidence(claims, evidence, issuerDID)
```

### CredentialVerifier

```typescript
const result = await credentialVerifier.verifyComplete(vcJwt)
```

## License

MIT