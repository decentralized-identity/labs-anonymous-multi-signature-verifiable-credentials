"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAgent = initializeAgent;
const core_1 = require("@veramo/core");
const did_manager_1 = require("@veramo/did-manager");
const did_provider_ethr_1 = require("@veramo/did-provider-ethr");
const did_provider_web_1 = require("@veramo/did-provider-web");
const key_manager_1 = require("@veramo/key-manager");
const kms_local_1 = require("@veramo/kms-local");
const credential_w3c_1 = require("@veramo/credential-w3c");
const did_resolver_1 = require("@veramo/did-resolver");
const did_resolver_2 = require("did-resolver");
const ethr_did_resolver_1 = require("ethr-did-resolver");
const web_did_resolver_1 = require("web-did-resolver");
const did_manager_2 = require("@veramo/did-manager");
let agentInstance = null;
async function initializeAgent() {
    if (agentInstance) {
        return agentInstance;
    }
    const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || '';
    console.log('Agent initialization - INFURA_PROJECT_ID:', INFURA_PROJECT_ID);
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
    ];
    console.log('Configured networks:', networks.map(n => n.name));
    const keyStore = new key_manager_1.MemoryKeyStore();
    const didStore = new did_manager_2.MemoryDIDStore();
    const privateKeyStore = new key_manager_1.MemoryPrivateKeyStore();
    const agent = (0, core_1.createAgent)({
        plugins: [
            new key_manager_1.KeyManager({
                store: keyStore,
                kms: {
                    local: new kms_local_1.KeyManagementSystem(privateKeyStore),
                },
            }),
            new did_manager_1.DIDManager({
                store: didStore,
                defaultProvider: 'did:ethr',
                providers: {
                    'did:ethr': new did_provider_ethr_1.EthrDIDProvider({
                        defaultKms: 'local',
                        networks,
                    }),
                    'did:web': new did_provider_web_1.WebDIDProvider({
                        defaultKms: 'local',
                    }),
                },
            }),
            new did_resolver_1.DIDResolverPlugin({
                resolver: new did_resolver_2.Resolver({
                    ...(0, ethr_did_resolver_1.getResolver)({
                        infuraProjectId: INFURA_PROJECT_ID,
                        networks: INFURA_PROJECT_ID ? undefined : [
                            { name: 'hardhat', chainId: 31337, rpcUrl: 'http://localhost:8545' }
                        ]
                    }),
                    ...(0, web_did_resolver_1.getResolver)(),
                }),
            }),
            new credential_w3c_1.CredentialPlugin(),
        ],
    });
    agentInstance = agent;
    return agentInstance;
}
//# sourceMappingURL=agent.js.map