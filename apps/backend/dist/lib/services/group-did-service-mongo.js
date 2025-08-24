"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupDIDService = void 0;
const group_manager_1 = require("../semaphore/group-manager");
const mongodb_1 = require("../db/mongodb");
const globalGroupManager = new group_manager_1.SemaphoreGroupManager();
let globalServiceInstance = null;
class GroupDIDService {
    constructor() {
        this.agent = null;
        this.db = null;
        this.groupManager = globalGroupManager;
    }
    async initialize(agent) {
        this.agent = agent;
        const { db } = await (0, mongodb_1.connectToDatabase)();
        this.db = db;
    }
    async createGroupDID(config) {
        if (!this.agent || !this.db) {
            throw new Error('Service not initialized');
        }
        const groupId = Date.now().toString();
        const semaphoreConfig = {
            groupId,
            name: config.groupName,
            description: config.groupDescription,
            merkleTreeDepth: 20,
        };
        const group = this.groupManager.createGroup(semaphoreConfig);
        console.log('process.env.INFURA_PROJECT_ID', process.env.INFURA_PROJECT_ID);
        const networkToUse = process.env.INFURA_PROJECT_ID ? 'sepolia' : 'hardhat';
        console.log('Using network:', networkToUse);
        const identifier = await this.agent.didManagerCreate({
            provider: 'did:ethr',
            options: {
                network: networkToUse,
            },
        });
        console.log('Created DID:', identifier.did);
        const groupDIDsCollection = this.db.collection('groupDIDs');
        const groupConfigsCollection = this.db.collection('groupConfigs');
        await groupDIDsCollection.insertOne({
            did: identifier.did,
            identifier,
            groupId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await groupConfigsCollection.insertOne({
            ...semaphoreConfig,
            members: [],
            merkleRoot: group.root.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return {
            did: identifier,
            semaphoreGroup: this.groupManager.exportGroupData(groupId),
        };
    }
    async buildGroupDIDDocument(identifier, groupId, config) {
        const groupData = this.groupManager.exportGroupData(groupId);
        const services = [];
        if (config.semaphoreContractAddress) {
            services.push({
                id: `${identifier.did}#semaphore`,
                type: 'SemaphoreGroup',
                serviceEndpoint: {
                    type: 'EthereumSmartContract',
                    contractAddress: config.semaphoreContractAddress,
                    chainId: config.chainId || 'eip155:1',
                    merkleRoot: groupData.merkleRoot,
                },
            });
        }
        else {
            services.push({
                id: `${identifier.did}#semaphore`,
                type: 'SemaphoreGroup',
                serviceEndpoint: {
                    type: 'OffChain',
                    groupId: groupId,
                    merkleRoot: groupData.merkleRoot,
                    merkleTreeDepth: groupData.merkleTreeDepth,
                },
            });
        }
        if (config.merkleRootHistoryEndpoint) {
            services.push({
                id: `${identifier.did}#merkle-roots-history`,
                type: 'MerkleRootHistory',
                serviceEndpoint: config.merkleRootHistoryEndpoint,
            });
        }
        return {
            '@context': ['https://www.w3.org/ns/did/v1'],
            id: identifier.did,
            verificationMethod: identifier.keys.map(key => ({
                id: `${identifier.did}#${key.kid}`,
                type: key.type === 'Secp256k1' ? 'EcdsaSecp256k1VerificationKey2019' : 'Ed25519VerificationKey2018',
                controller: identifier.did,
                publicKeyHex: key.publicKeyHex,
            })),
            authentication: identifier.keys.map(key => `${identifier.did}#${key.kid}`),
            service: services,
        };
    }
    async addMemberToGroup(groupDid, memberIdentity) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        console.log('Looking for group DID:', groupDid);
        const groupDIDsCollection = this.db.collection('groupDIDs');
        const groupData = await groupDIDsCollection.findOne({ did: groupDid });
        if (!groupData) {
            throw new Error(`Group not found for DID: ${groupDid}`);
        }
        const groupConfigsCollection = this.db.collection('groupConfigs');
        const groupConfig = await groupConfigsCollection.findOne({ groupId: groupData.groupId });
        if (!this.groupManager.getGroup(groupData.groupId)) {
            this.groupManager.createGroup(groupConfig);
        }
        this.groupManager.addMember(groupData.groupId, memberIdentity);
        await groupConfigsCollection.updateOne({ groupId: groupData.groupId }, {
            $push: { members: memberIdentity.commitment.toString() },
            $set: {
                merkleRoot: this.groupManager.getMerkleRoot(groupData.groupId).toString(),
                updatedAt: new Date()
            }
        });
    }
    async getGroupInfo(groupDid) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const groupDIDsCollection = this.db.collection('groupDIDs');
        const groupData = await groupDIDsCollection.findOne({ did: groupDid });
        if (!groupData) {
            throw new Error(`Group not found for DID: ${groupDid}`);
        }
        const groupConfigsCollection = this.db.collection('groupConfigs');
        const groupConfig = await groupConfigsCollection.findOne({ groupId: groupData.groupId });
        if (!groupConfig) {
            throw new Error(`Group config not found for ID: ${groupData.groupId}`);
        }
        console.log('Raw groupConfig from MongoDB:', groupConfig);
        if (!this.groupManager.getGroup(groupData.groupId)) {
            this.groupManager.createGroup(groupConfig);
            if (groupConfig?.members && groupConfig.members.length > 0) {
                console.log('Restoring members:', groupConfig.members);
                for (const memberCommitment of groupConfig.members) {
                    try {
                        const group = this.groupManager.getGroup(groupData.groupId);
                        if (group) {
                            group.addMember(BigInt(memberCommitment));
                        }
                    }
                    catch (error) {
                        console.error('Failed to restore member:', memberCommitment, error);
                    }
                }
            }
        }
        const groupExportData = this.groupManager.exportGroupData(groupData.groupId);
        console.log('Final groupExportData:', groupExportData);
        const didDocument = await this.buildGroupDIDDocument(groupData.identifier, groupData.groupId, {
            groupName: groupExportData.config.name,
            groupDescription: groupExportData.config.description,
        });
        return {
            did: groupData.identifier,
            semaphoreGroup: groupExportData,
            didDocument,
        };
    }
    static async getInstance(agent) {
        if (!globalServiceInstance) {
            globalServiceInstance = new GroupDIDService();
            if (agent) {
                await globalServiceInstance.initialize(agent);
            }
        }
        else if (agent && (!globalServiceInstance.agent || !globalServiceInstance.db)) {
            await globalServiceInstance.initialize(agent);
        }
        return globalServiceInstance;
    }
}
exports.GroupDIDService = GroupDIDService;
//# sourceMappingURL=group-did-service-mongo.js.map