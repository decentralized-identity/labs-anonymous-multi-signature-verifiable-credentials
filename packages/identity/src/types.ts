export interface Identity {
  trapdoor: bigint
  nullifier: bigint
  commitment: bigint
  getSecret(): string
}

export interface SerializedIdentity {
  trapdoor: string
  nullifier: string
  commitment: string
}

export interface IdentityManager {
  createIdentity(secret?: string): Identity
  deriveCommitment(identity: Identity): bigint
  exportIdentity(identity: Identity): SerializedIdentity
  importIdentity(data: SerializedIdentity): Identity
}