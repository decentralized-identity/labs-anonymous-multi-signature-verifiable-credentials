// Identity Management
export {
  Identity,
  IdentityManager,
  SerializedIdentity,
  type IdentityManager as IIdentityManager,
  type Identity as IIdentity,
  type SerializedIdentity as ISerializedIdentity
} from '@zkmap/identity'

// Group Management
export {
  Group,
  GroupManager,
  MerkleRootHistory,
  type GroupConfig,
  type GroupState,
  type MerkleProof,
  type RootRecord,
  type Group as IGroup,
  type GroupManager as IGroupManager,
  type MerkleRootHistory as IMerkleRootHistory
} from '@zkmap/group'

// Proposal and Voting
export {
  Proposal,
  ProposalManager,
  type ProposalParams,
  type Vote,
  type ProposalStatus,
  type ProposalResult,
  type ProposalFilter,
  type ApprovalEvidence,
  type SerializedProposal,
  type Proposal as IProposal,
  type ProposalManager as IProposalManager
} from '@zkmap/proposal'

// Credential Management
export {
  CredentialIssuer,
  CredentialVerifier,
  type VCClaims,
  type VerifiableCredential,
  type SignatureVerification,
  type EvidenceVerification,
  type VerificationResult,
  type CredentialAgent,
  type CredentialIssuer as ICredentialIssuer,
  type CredentialVerifier as ICredentialVerifier
} from '@zkmap/credential'

// Zero-Knowledge Proofs
export {
  ProofGenerator,
  ProofVerifier,
  type ZKProof,
  type ProofParams,
  type VoteProofParams,
  type PublicInputs,
  type VoteInputs,
  type ProofResult,
  type VerificationResult as ProofVerificationResult,
  type ProofGenerator as IProofGenerator,
  type ProofVerifier as IProofVerifier
} from '@zkmap/proof'

// Storage
export {
  StorageFactory,
  InMemoryStorageAdapter,
  FileStorageAdapter,
  type StorageAdapter,
  type StorageConfig,
  type ProposalFilter as StorageProposalFilter,
  type VCFilter,
  type IssuedVC,
  type StorageFactory as IStorageFactory
} from '@zkmap/storage'

// Main Protocol
export { zkMAPProtocol, zkMAPProtocol as AnonymousApprovalProtocol } from './protocol'