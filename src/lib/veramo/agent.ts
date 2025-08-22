import { createAgent, IResolver, IDataStore, IKeyManager, IDIDManager, ICredentialIssuer, TAgent } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { WebDIDProvider } from '@veramo/did-provider-web'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'
import { 
  DataStore, 
  KeyStore, 
  DIDStore, 
  PrivateKeyStore,
  Entities
} from '@veramo/data-store'
import { DataSource } from 'typeorm'

const DATABASE_FILE = 'database.sqlite'
const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || ''
// Use the key from env or generate a default one, ensuring proper format
const envKey = process.env.KMS_SECRET_KEY || '796f75722d7365637265742d6b65792d61742d6c656173742d33322d6368617273'
// Remove any duplicate 0x prefix
const cleanKey = envKey.replace(/^(0x)+/, '')
const KMS_SECRET_KEY = cleanKey
console.log('KMS_SECRET_KEY:', KMS_SECRET_KEY) // Debug log

let dbConnection: DataSource | null = null
let agentInstance: Agent | null = null

async function getDbConnection(): Promise<DataSource> {
  if (dbConnection && dbConnection.isInitialized) {
    return dbConnection
  }

  dbConnection = new DataSource({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: true,
    logging: false,
    entities: Entities,
  })

  await dbConnection.initialize()
  return dbConnection
}

export async function initializeAgent() {
  if (agentInstance) {
    return agentInstance
  }

  const connection = await getDbConnection()
  
  // Create shared stores
  const keyStore = new KeyStore(connection)
  const didStore = new DIDStore(connection)
  // Create SecretBox with cleaned key
  const secretKey = KMS_SECRET_KEY.replace(/^(0x)+/, '0x')
  console.log('Using secret key:', secretKey) // Debug
  const privateKeyStore = new PrivateKeyStore(connection, new SecretBox(secretKey))

  agentInstance = createAgent<IResolver & IDataStore & IKeyManager & IDIDManager & ICredentialIssuer>({
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
      new DataStore(connection),
    ],
  })

  return agentInstance
}

export type Agent = TAgent<IResolver & IDataStore & IKeyManager & IDIDManager & ICredentialIssuer>