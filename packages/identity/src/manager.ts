import { Identity as SemaphoreIdentity } from '@semaphore-protocol/identity'
import { IdentityManager, Identity, SerializedIdentity } from './types'
import { IdentityImpl } from './identity'

export class IdentityManagerImpl implements IdentityManager {
  createIdentity(secret?: string): Identity {
    return new IdentityImpl(secret)
  }

  deriveCommitment(identity: Identity): bigint {
    return identity.commitment
  }

  exportIdentity(identity: Identity): SerializedIdentity {
    return {
      trapdoor: identity.trapdoor.toString(),
      nullifier: identity.nullifier.toString(),
      commitment: identity.commitment.toString()
    }
  }

  importIdentity(data: SerializedIdentity): Identity {
    const secret = this.reconstructSecret(data)
    return new IdentityImpl(secret)
  }

  private reconstructSecret(data: SerializedIdentity): string {
    return JSON.stringify({
      trapdoor: data.trapdoor,
      nullifier: data.nullifier
    })
  }
}