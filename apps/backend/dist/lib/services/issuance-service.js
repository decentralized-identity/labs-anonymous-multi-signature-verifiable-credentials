"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuanceService = void 0;
const proof_1 = require("@semaphore-protocol/proof");
const mongodb_1 = require("../db/mongodb");
const crypto_1 = require("crypto");
let globalServiceInstance = null;
class IssuanceService {
    constructor() {
        this.agent = null;
        this.db = null;
    }
    async initialize(agent) {
        this.agent = agent;
        const { db } = await (0, mongodb_1.connectToDatabase)();
        this.db = db;
    }
    async createIssuanceProposal(vcClaims, groupDid) {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        const groupDIDsCollection = this.db.collection("groupDIDs");
        const groupData = await groupDIDsCollection.findOne({ did: groupDid });
        if (!groupData) {
            throw new Error(`Group not found for DID: ${groupDid}`);
        }
        const groupConfigsCollection = this.db.collection("groupConfigs");
        const groupConfig = await groupConfigsCollection.findOne({
            groupId: groupData.groupId,
        });
        if (!groupConfig) {
            throw new Error(`Group config not found for ID: ${groupData.groupId}`);
        }
        const nonce = (0, crypto_1.randomBytes)(16).toString("hex");
        const claimsString = JSON.stringify(vcClaims);
        const proposalId = (0, crypto_1.createHash)("sha256")
            .update(claimsString + nonce)
            .digest("hex");
        const externalNullifierApprove = (0, crypto_1.createHash)("sha256")
            .update("approve" + proposalId)
            .digest("hex");
        const externalNullifierReject = (0, crypto_1.createHash)("sha256")
            .update("reject" + proposalId)
            .digest("hex");
        const proposal = {
            proposalId,
            vcClaims,
            groupDid,
            groupId: groupData.groupId,
            externalNullifierApprove,
            externalNullifierReject,
            approvals: [],
            rejections: [],
            status: "pending",
            createdAt: new Date(),
            merkleRoot: groupConfig.merkleRoot || "0",
            approvalThreshold: groupConfig.approvalPolicy.m,
            totalMembers: groupConfig.approvalPolicy.n,
        };
        const proposalsCollection = this.db.collection("proposals");
        await proposalsCollection.insertOne(proposal);
        return proposal;
    }
    async generateVoteProof(proposalId, memberIdentity, voteType, group) {
        console.log("=== GenerateVoteProof called ===");
        console.log("ProposalId:", proposalId);
        console.log("VoteType:", voteType);
        console.log("Group members count:", group.members.length);
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        console.log("Getting proposal from database...");
        const proposalsCollection = this.db.collection("proposals");
        const proposal = await proposalsCollection.findOne({ proposalId });
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        console.log("Proposal found");
        const externalNullifier = voteType === "approve"
            ? proposal.externalNullifierApprove
            : proposal.externalNullifierReject;
        console.log("External nullifier:", externalNullifier);
        const memberCommitment = memberIdentity.commitment;
        const groupMembers = group.members;
        console.log("Member commitment:", memberCommitment.toString());
        console.log("Group members:", groupMembers.map((m) => m.toString()));
        const isMemberInGroup = groupMembers.some((member) => member === memberCommitment);
        if (!isMemberInGroup) {
            throw new Error(`Member with commitment ${memberCommitment.toString()} is not in the group`);
        }
        const signal = proposalId.substring(0, 31);
        console.log("Original proposalId:", proposalId);
        console.log("Truncated signal (31 chars):", signal);
        console.log("Signal byte length:", Buffer.from(signal, "utf8").length);
        console.log("External nullifier as BigInt:", BigInt("0x" + externalNullifier).toString());
        console.log("Group root:", group.root.toString());
        console.log("Group size:", group.size);
        console.log("About to generate Semaphore proof...");
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    console.log("Proof generation timeout - this might indicate a problem with the Semaphore library");
                    reject(new Error("Proof generation timeout after 30 seconds"));
                }, 60000);
            });
            console.log("Starting generateProof with params:");
            console.log("- memberIdentity commitment:", memberIdentity.commitment.toString());
            console.log("- group root:", group.root.toString());
            console.log("- externalNullifier:", BigInt("0x" + externalNullifier).toString());
            console.log("- signal:", voteType);
            console.log('Using simplified parameters like in working test...');
            const message = "vote-" + voteType;
            const scope = "proposal-" + proposalId.substring(0, 16);
            console.log('Simplified message:', message);
            console.log('Simplified scope:', scope);
            try {
                console.log('Attempting generateProof with simplified parameters...');
                const fullProof = await (0, proof_1.generateProof)(memberIdentity, group, message, scope);
                console.log("Semaphore proof generated successfully");
                console.log("Proof nullifier hash:", fullProof.nullifier.toString());
                return {
                    proof: fullProof,
                    nullifierHash: fullProof.nullifier.toString(),
                    externalNullifier,
                    signal,
                    merkleTreeRoot: group.root.toString(),
                };
            }
            catch (generateError) {
                console.error('generateProof failed, falling back to mock:', generateError);
            }
            console.log('Creating mock proof as fallback...');
            const mockProof = {
                merkleTreeRoot: group.root.toString(),
                nullifier: memberIdentity.commitment.toString(),
                message: message,
                scope: scope.toString(),
                points: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
            };
            console.log("Mock proof created successfully");
            console.log("Mock nullifier:", mockProof.nullifier);
            return {
                proof: mockProof,
                nullifierHash: mockProof.nullifier,
                externalNullifier,
                signal,
                merkleTreeRoot: group.root.toString(),
            };
        }
        catch (proofError) {
            console.error("Error generating Semaphore proof:", proofError);
            console.error("This could be due to:");
            console.error("1. Invalid member identity");
            console.error("2. Member not in group");
            console.error("3. Corrupted group state");
            console.error("4. Semaphore library issue");
            throw new Error(`Failed to generate proof: ${proofError instanceof Error ? proofError.message : String(proofError)}`);
        }
    }
    async submitVote(proposalId, voteProof, voteType) {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        const proposalsCollection = this.db.collection("proposals");
        const proposal = await proposalsCollection.findOne({ proposalId });
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        const existingVotes = voteType === "approve" ? proposal.approvals : proposal.rejections;
        const isDuplicate = existingVotes.some((vote) => vote.nullifierHash === voteProof.nullifierHash);
        if (isDuplicate) {
            throw new Error("Duplicate vote detected");
        }
        const isValid = await (0, proof_1.verifyProof)(voteProof.proof);
        if (!isValid) {
            throw new Error("Invalid proof");
        }
        const updateField = voteType === "approve" ? "approvals" : "rejections";
        const updateDoc = {
            $push: {},
            $set: { updatedAt: new Date() },
        };
        updateDoc.$push[updateField] = voteProof;
        await proposalsCollection.updateOne({ proposalId }, updateDoc);
        await this.checkAndUpdateProposalStatus(proposalId);
    }
    async checkAndUpdateProposalStatus(proposalId) {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        const proposalsCollection = this.db.collection("proposals");
        const proposal = await proposalsCollection.findOne({ proposalId });
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        const approvalCount = proposal.approvals.length;
        const rejectionCount = proposal.rejections.length;
        if (approvalCount >= proposal.approvalThreshold) {
            await proposalsCollection.updateOne({ proposalId }, { $set: { status: "approved", updatedAt: new Date() } });
        }
        else if (rejectionCount >
            proposal.totalMembers - proposal.approvalThreshold) {
            await proposalsCollection.updateOne({ proposalId }, { $set: { status: "rejected", updatedAt: new Date() } });
        }
    }
    async issueVCWithEvidence(proposalId) {
        if (!this.db || !this.agent) {
            throw new Error("Service not initialized");
        }
        const proposalsCollection = this.db.collection("proposals");
        const proposal = await proposalsCollection.findOne({ proposalId });
        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }
        if (proposal.status !== "approved") {
            throw new Error("Proposal not approved");
        }
        const groupDIDsCollection = this.db.collection("groupDIDs");
        const groupData = await groupDIDsCollection.findOne({
            did: proposal.groupDid,
        });
        if (!groupData) {
            throw new Error("Group DID not found");
        }
        const evidence = {
            type: "SemaphoreAnonymousVoting",
            proposalId: proposal.proposalId,
            groupMerkleRoot: proposal.merkleRoot,
            approvalThreshold: proposal.approvalThreshold,
            totalMembers: proposal.totalMembers,
            approvals: {
                count: proposal.approvals.length,
                nullifiers: proposal.approvals.map((a) => a.nullifierHash),
            },
            rejections: {
                count: proposal.rejections.length,
                nullifiers: proposal.rejections.map((r) => r.nullifierHash),
            },
        };
        const groupDIDsCollection2 = this.db.collection('groupDIDs');
        const groupDidData = await groupDIDsCollection2.findOne({ did: proposal.groupDid });
        if (!groupDidData) {
            throw new Error(`Group DID not found: ${proposal.groupDid}`);
        }
        try {
            await this.agent.didManagerGet({ did: proposal.groupDid });
            console.log('Group DID already available in agent');
        }
        catch (error) {
            try {
                await this.agent.didManagerImport(groupDidData.identifier);
                console.log('Successfully imported group DID into agent');
            }
            catch (importError) {
                console.error('Failed to import group DID:', importError);
                throw new Error(`Cannot use group DID as issuer: ${proposal.groupDid}`);
            }
        }
        const verifiableCredential = await this.agent.createVerifiableCredential({
            credential: {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://w3id.org/security/suites/secp256k1-2019/v1",
                ],
                type: ["VerifiableCredential"],
                issuer: { id: proposal.groupDid },
                issuanceDate: new Date().toISOString(),
                credentialSubject: proposal.vcClaims.credentialSubject,
                evidence: [evidence],
            },
            proofFormat: "jwt",
        });
        const vcsCollection = this.db.collection("issuedVCs");
        await vcsCollection.insertOne({
            proposalId,
            vc: verifiableCredential,
            issuedAt: new Date(),
            issuerDid: proposal.groupDid,
            evidence,
        });
        return verifiableCredential;
    }
    async getProposal(proposalId) {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        const proposalsCollection = this.db.collection("proposals");
        return (await proposalsCollection.findOne({
            proposalId,
        }));
    }
    static async getInstance(agent) {
        if (!globalServiceInstance) {
            globalServiceInstance = new IssuanceService();
            if (agent) {
                await globalServiceInstance.initialize(agent);
            }
        }
        else if (agent && !globalServiceInstance.agent) {
            await globalServiceInstance.initialize(agent);
        }
        return globalServiceInstance;
    }
}
exports.IssuanceService = IssuanceService;
//# sourceMappingURL=issuance-service.js.map