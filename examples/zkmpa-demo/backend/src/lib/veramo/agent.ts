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

let agentInstance: Agent | null = null

export async function initializeAgent() {
  if (agentInstance) {
    return agentInstance
  }

  // Get INFURA_PROJECT_ID at runtime
  const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || ''
  console.log('Agent initialization - INFURA_PROJECT_ID:', INFURA_PROJECT_ID)
  
  // Configure networks based on INFURA_PROJECT_ID
  const networks = [
    ...(INFURA_PROJECT_ID ? [
      {
        name: 'mainnet',
        rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      },
      {
        name: 'sepolia',
        rpcUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      },
    ] : []),
    {
      name: 'hardhat',
      rpcUrl: 'http://localhost:8545',
    },
  ]
  
  console.log('Configured networks:', networks.map(n => n.name))

  // Use in-memory stores for Veramo
  // MongoDB will be used for group data, not for keys
  const keyStore = new MemoryKeyStore()
  const didStore = new MemoryDIDStore()
  const privateKeyStore = new MemoryPrivateKeyStore()

  const agent = createAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer>({
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
            networks,
          }),
          'did:web': new WebDIDProvider({
            defaultKms: 'local',
          }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...ethrDidResolver({ 
            infuraProjectId: INFURA_PROJECT_ID,
            networks: INFURA_PROJECT_ID ? undefined : [
              { name: 'hardhat', chainId: 31337, rpcUrl: 'http://localhost:8545' }
            ]
          }),
          ...webDidResolver(),
        }),
      }),
      new CredentialPlugin(),
    ],
  })

  agentInstance = agent
  return agentInstance
}

export type Agent = TAgent<IResolver & IKeyManager & IDIDManager & ICredentialIssuer>