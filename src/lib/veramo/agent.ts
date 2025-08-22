import { createAgent, IResolver, IKeyManager, IDIDManager, ICredentialIssuer, TAgent } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { WebDIDProvider } from '@veramo/did-provider-web'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'
import { MemoryDIDStore } from '@veramo/did-manager'

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || ''

let agentInstance: Agent | null = null

export async function initializeAgent() {
  if (agentInstance) {
    return agentInstance
  }

  // Use in-memory stores for Veramo
  // MongoDB will be used for group data, not for keys
  const keyStore = new MemoryKeyStore()
  const didStore = new MemoryDIDStore()
  const privateKeyStore = new MemoryPrivateKeyStore()

  agentInstance = createAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer>({
    plugins: [
      new KeyManager({
        store: keyStore,
        kms: {
          local: new KeyManagementSystem(privateKeyStore),
        },
      }),
      new DIDManager({
        store: didStore,
        defaultProvider: 'did:ethr',
        providers: {
          'did:ethr': new EthrDIDProvider({
            defaultKms: 'local',
            networks: [
              {
                name: 'mainnet',
                rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
              },
              {
                name: 'sepolia',
                rpcUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
              },
            ],
          }),
          'did:web': new WebDIDProvider({
            defaultKms: 'local',
          }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
          ...webDidResolver(),
        }),
      }),
      new CredentialPlugin(),
    ],
  })

  return agentInstance
}

export type Agent = TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer>