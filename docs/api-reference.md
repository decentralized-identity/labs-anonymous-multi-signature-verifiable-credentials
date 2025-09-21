# zkMAP API Reference

## Core Packages

### @zkmap/identity

Identity management for zkMAP protocol.

```typescript
import { IdentityManager } from '@zkmap/identity'

const manager = new IdentityManager()
const identity = manager.createIdentity()
```

#### Methods

- `createIdentity(secret?: string): Identity`
- `exportIdentity(identity: Identity): SerializedIdentity`
- `importIdentity(data: SerializedIdentity): Identity`
- `deriveCommitment(identity: Identity): bigint`

### @zkmap/group

Group and membership management.

```typescript
import { GroupManager } from '@zkmap/group'

const manager = new GroupManager()
const group = manager.createGroup({
  id: 'dao-validators',
  name: 'DAO Validators',
  merkleTreeDepth: 20
})
```

#### Methods

- `createGroup(config: GroupConfig): Group`
- `addMember(groupId: string, commitment: bigint): void`
- `removeMember(groupId: string, commitment: bigint): void`
- `getMerkleRoot(groupId: string): bigint`
- `getMerkleProof(groupId: string, commitment: bigint): MerkleProof`

### @zkmap/proposal

Proposal and voting management.

```typescript
import { ProposalManager } from '@zkmap/proposal'

const manager = new ProposalManager(groupManager, storage)
const proposal = await manager.createProposal({
  content: vcClaims,
  groupId: 'dao-validators',
  approvalThreshold: 3
})
```

#### Methods

- `createProposal(params: ProposalParams): Promise<Proposal>`
- `submitVote(proposalId: string, vote: Vote): Promise<void>`
- `getProposalStatus(proposalId: string): Promise<ProposalStatus>`
- `finalizeProposal(proposalId: string): Promise<ProposalResult>`

### @zkmap/credential

VC issuance and verification.

```typescript
import { CredentialIssuer, CredentialVerifier } from '@zkmap/credential'

const issuer = new CredentialIssuer(agent)
const vc = await issuer.issueWithEvidence(
  claims,
  evidence,
  issuerDID
)

const verifier = new CredentialVerifier(agent, merkleRootHistory)
const result = await verifier.verifyComplete(vcJwt)
```

#### Issuer Methods

- `issueWithEvidence(claims: VCClaims, evidence: ApprovalEvidence, issuerDID: string): Promise<VerifiableCredential>`
- `issue(claims: VCClaims, issuerDID: string): Promise<VerifiableCredential>`

#### Verifier Methods

- `verifySignature(vc: string): Promise<SignatureVerification>`
- `verifyEvidence(vc: VerifiableCredential): Promise<EvidenceVerification>`
- `verifyComplete(vc: string): Promise<VerificationResult>`

### @zkmap/proof

Zero-knowledge proof generation and verification.

```typescript
import { ProofGenerator, ProofVerifier } from '@zkmap/proof'

const generator = new ProofGenerator()
const proof = await generator.generateVoteProof({
  identity,
  group,
  proposalId,
  voteType: 'approve'
})

const verifier = new ProofVerifier()
const isValid = await verifier.verifyVoteProof(proof, voteInputs)
```

#### Generator Methods

- `generateMembershipProof(params: ProofParams): Promise<ZKProof>`
- `generateVoteProof(params: VoteProofParams): Promise<ZKProof>`

#### Verifier Methods

- `verifyMembershipProof(proof: ZKProof, publicInputs: PublicInputs): Promise<boolean>`
- `verifyVoteProof(proof: ZKProof, voteInputs: VoteInputs): Promise<boolean>`

### @zkmap/storage

Storage adapters for persistence.

```typescript
import { StorageFactory } from '@zkmap/storage'

// In-memory storage
const memoryStorage = StorageFactory.createMemoryAdapter()

// File-based storage
const fileStorage = StorageFactory.createFileAdapter('./data')

// Use with protocol
const protocol = new zkMAPProtocol(memoryStorage)
```

#### Storage Methods

- `saveProposal(proposal: Proposal): Promise<void>`
- `getProposal(id: string): Promise<Proposal | null>`
- `saveGroupState(state: GroupState): Promise<void>`
- `getGroupState(id: string): Promise<GroupState | null>`
- `saveMerkleRootHistory(record: RootRecord): Promise<void>`

### @zkmap/core

Main protocol orchestrator.

```typescript
import { zkMAPProtocol } from '@zkmap/core'

const protocol = new zkMAPProtocol(storage, agent)
await protocol.initialize()

// Complete flow
const vc = await protocol.createAndApproveCredential(
  claims,
  groupId,
  approvalThreshold,
  votes
)
```

## Data Types

### Identity

```typescript
interface Identity {
  trapdoor: bigint
  nullifier: bigint
  commitment: bigint
  getSecret(): string
}
```

### Group

```typescript
interface GroupConfig {
  id: string
  name: string
  merkleTreeDepth: number
  did?: string
}

interface Group {
  id: string
  config: GroupConfig
  addMember(commitment: bigint): void
  removeMember(commitment: bigint): void
  getMerkleRoot(): bigint
  getMerkleProof(commitment: bigint): MerkleProof
}
```

### Proposal

```typescript
interface ProposalParams {
  content: any
  groupId: string
  approvalThreshold: number
  votingPeriod?: number
}

interface Vote {
  proof: ZKProof
  voteType: 'approve' | 'reject'
  nullifierHash: string
}

type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired'
```

### Verifiable Credential

```typescript
interface VerifiableCredential {
  '@context': string[]
  type: string[]
  issuer: string | { id: string }
  issuanceDate: string
  credentialSubject: any
  evidence?: ApprovalEvidence[]
  proof?: any
}

interface ApprovalEvidence {
  type: 'SemaphoreAnonymousVoting'
  proposalId: string
  groupMerkleRoot: string
  approvalThreshold: number
  totalMembers?: number
  approvals: {
    count: number
    nullifiers: string[]
  }
}
```

## Error Handling

All methods throw errors with descriptive messages:

```typescript
try {
  await proposalManager.submitVote(proposalId, vote)
} catch (error) {
  if (error.message === 'Duplicate vote detected') {
    // Handle duplicate vote
  } else if (error.message === 'Voting period has expired') {
    // Handle expired proposal
  }
}
```

## Events

The protocol emits events for key actions (when using with event emitters):

- `proposal.created`
- `vote.submitted`
- `proposal.approved`
- `proposal.rejected`
- `credential.issued`
- `credential.verified`