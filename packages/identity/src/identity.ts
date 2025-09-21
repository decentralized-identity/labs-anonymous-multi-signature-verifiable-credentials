import { Identity as SemaphoreIdentity } from '@semaphore-protocol/identity'
import { Identity, SerializedIdentity } from './types'

export class IdentityImpl implements Identity {
  private semaphoreIdentity: SemaphoreIdentity
  private _trapdoor: bigint
  private _nullifier: bigint

  constructor(secret?: string) {
    this.semaphoreIdentity = new SemaphoreIdentity(secret)
    // Generate trapdoor and nullifier from the secret scalar
    // These are derived values used in zero-knowledge proofs
    this._trapdoor = this.semaphoreIdentity.secretScalar
    this._nullifier = BigInt('0x' + this.hashBigInt(this.semaphoreIdentity.secretScalar))
  }

  private hashBigInt(value: bigint): string {
    // Simple hash function for nullifier generation
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(value.toString()).digest('hex').slice(0, 31)
  }

  get trapdoor(): bigint {
    return this._trapdoor
  }

  get nullifier(): bigint {
    return this._nullifier
  }

  get commitment(): bigint {
    return this.semaphoreIdentity.commitment
  }

  getSecret(): string {
    return this.semaphoreIdentity.export()
  }

  getSemaphoreIdentity(): SemaphoreIdentity {
    return this.semaphoreIdentity
  }

  static fromSemaphore(semaphoreIdentity: SemaphoreIdentity): IdentityImpl {
    const identity = Object.create(IdentityImpl.prototype)
    identity.semaphoreIdentity = semaphoreIdentity
    identity._trapdoor = semaphoreIdentity.secretScalar

    // Recreate hashBigInt logic for static method
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256').update(semaphoreIdentity.secretScalar.toString()).digest('hex').slice(0, 31)
    identity._nullifier = BigInt('0x' + hash)

    return identity
  }
}