import { Identity } from '@zkmap/identity'
import { Group } from '@zkmap/group'

export interface ZKProof {
  merkleTreeRoot: string
  nullifier: string
  message: string
  scope: string
  points?: bigint[]
  [key: string]: any
}

export interface ProofParams {
  identity: Identity
  group: Group
  message: string
  scope: string
}

export interface VoteProofParams extends ProofParams {
  proposalId: string
  voteType: 'approve' | 'reject'
}

export interface PublicInputs {
  merkleTreeRoot: string
  nullifierHash: string
  signalHash?: string
  externalNullifier?: string
}

export interface VoteInputs extends PublicInputs {
  voteType: 'approve' | 'reject'
  proposalId: string
}

export interface ProofGenerator {
  generateMembershipProof(params: ProofParams): Promise<ZKProof>
  generateVoteProof(params: VoteProofParams): Promise<ZKProof>
}

export interface ProofVerifier {
  verifyMembershipProof(proof: ZKProof, publicInputs: PublicInputs): Promise<boolean>
  verifyVoteProof(proof: ZKProof, voteInputs: VoteInputs): Promise<boolean>
  verifyProof(proof: any): Promise<boolean>
}

export interface ProofResult {
  valid: boolean
  proof?: ZKProof
  error?: string
}

export interface VerificationResult {
  valid: boolean
  message?: string
  details?: any
}