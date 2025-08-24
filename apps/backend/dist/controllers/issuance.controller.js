"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuanceController = void 0;
const common_1 = require("@nestjs/common");
const agent_1 = require("../lib/veramo/agent");
const issuance_service_1 = require("../lib/services/issuance-service");
const group_did_service_mongo_1 = require("../lib/services/group-did-service-mongo");
const identity_1 = require("@semaphore-protocol/identity");
const group_1 = require("@semaphore-protocol/group");
const proof_1 = require("@semaphore-protocol/proof");
let IssuanceController = class IssuanceController {
    async createProposal(body) {
        try {
            const { vcClaims, groupDid } = body;
            const agent = await (0, agent_1.initializeAgent)();
            const issuanceService = await issuance_service_1.IssuanceService.getInstance(agent);
            const proposal = await issuanceService.createIssuanceProposal(vcClaims, groupDid);
            return {
                success: true,
                data: proposal,
            };
        }
        catch (error) {
            console.error('Error creating proposal:', error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProposal(proposalId) {
        try {
            if (!proposalId) {
                throw new common_1.HttpException({ success: false, error: 'Proposal ID is required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            const agent = await (0, agent_1.initializeAgent)();
            const issuanceService = await issuance_service_1.IssuanceService.getInstance(agent);
            const proposal = await issuanceService.getProposal(proposalId);
            if (!proposal) {
                throw new common_1.HttpException({ success: false, error: 'Proposal not found' }, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: proposal,
            };
        }
        catch (error) {
            console.error('Error getting proposal:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async issueVC(body) {
        try {
            const { proposalId } = body;
            const agent = await (0, agent_1.initializeAgent)();
            const issuanceService = await issuance_service_1.IssuanceService.getInstance(agent);
            const vc = await issuanceService.issueVCWithEvidence(proposalId);
            return {
                success: true,
                data: {
                    verifiableCredential: vc,
                },
            };
        }
        catch (error) {
            console.error('Error issuing VC:', error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async vote(body) {
        console.log('=== Vote API Called ===');
        try {
            const { proposalId, memberSecret, voteType, groupDid } = body;
            console.log('Request body:', body);
            console.log('Initializing agent...');
            const agent = await (0, agent_1.initializeAgent)();
            console.log('Agent initialized');
            console.log('Getting services...');
            const issuanceService = await issuance_service_1.IssuanceService.getInstance(agent);
            const groupDIDService = await group_did_service_mongo_1.GroupDIDService.getInstance(agent);
            console.log('Services initialized');
            console.log('Getting group info for DID:', groupDid);
            const groupInfo = await groupDIDService.getGroupInfo(groupDid);
            console.log('Group info retrieved:', {
                members: groupInfo.semaphoreGroup.members,
                memberCount: groupInfo.semaphoreGroup.memberCount
            });
            console.log('Creating member identity...');
            const memberIdentity = new identity_1.Identity(memberSecret);
            console.log('Member identity created, commitment:', memberIdentity.commitment.toString());
            console.log('Creating Semaphore group...');
            const group = new group_1.Group(groupInfo.semaphoreGroup.members.map(m => BigInt(m)));
            console.log('Semaphore group created with members:', group.members.length);
            const memberCommitment = memberIdentity.commitment;
            const isMemberInGroup = groupInfo.semaphoreGroup.members.includes(memberCommitment.toString());
            console.log('Member check:', {
                memberCommitment: memberCommitment.toString(),
                groupMembers: groupInfo.semaphoreGroup.members,
                isMemberInGroup
            });
            if (!isMemberInGroup) {
                throw new common_1.HttpException({
                    success: false,
                    error: `Member identity not found in group. Please add this member first. Commitment: ${memberCommitment.toString()}`
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const voteProof = await issuanceService.generateVoteProof(proposalId, memberIdentity, voteType, group);
            console.log('Vote proof generated:', {
                nullifierHash: voteProof.nullifierHash,
                voteType
            });
            await issuanceService.submitVote(proposalId, voteProof, voteType);
            const proposal = await issuanceService.getProposal(proposalId);
            console.log('Updated proposal:', proposal);
            return {
                success: true,
                data: {
                    proposal,
                    voteProof: {
                        nullifierHash: voteProof.nullifierHash,
                        voteType,
                    },
                },
            };
        }
        catch (error) {
            console.error('=== Vote API Error ===');
            console.error('Error type:', typeof error);
            console.error('Error message:', error instanceof Error ? error.message : String(error));
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.error('Full error object:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : String(error)
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async vote2(body) {
        console.log("=== Vote API Called ===");
        try {
            const identity = new identity_1.Identity();
            console.log("   Identity commitment:", identity.commitment.toString());
            console.log("   ✅ Identity created\n");
            console.log("2️⃣ Creating group...");
            const group = new group_1.Group();
            group.addMember(identity.commitment);
            console.log("   Group size:", group.size);
            console.log("   Group root:", group.root.toString());
            console.log("   Member index:", group.indexOf(identity.commitment));
            console.log("   ✅ Group created and identity added\n");
            console.log("3️⃣ Preparing proof parameters...");
            const message = "Hello Semaphore!";
            const scope = "test-scope-123";
            console.log("   Message:", message);
            console.log("   Scope:", scope);
            console.log("   ✅ Parameters prepared\n");
            console.log("4️⃣ Generating proof...");
            const startTime = Date.now();
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error("Proof generation timeout after 30 seconds"));
                    }, 30000);
                });
                const proof = await Promise.race([
                    (0, proof_1.generateProof)(identity, group, message, scope),
                    timeoutPromise
                ]);
                const endTime = Date.now();
                console.log("   ⏱️  Proof generation time:", endTime - startTime, "ms");
                console.log("   Proof nullifier:", proof.nullifier.toString());
                console.log("   ✅ Proof generated successfully\n");
                return {
                    success: true,
                    data: {
                        proof,
                        identity: identity.commitment.toString(),
                        message,
                        scope,
                        generationTime: endTime - startTime,
                        proofType: "real"
                    }
                };
            }
            catch (proofError) {
                const endTime = Date.now();
                console.log("   ❌ Proof generation failed:", proofError instanceof Error ? proofError.message : String(proofError));
                console.log("   ⏱️  Time before failure:", endTime - startTime, "ms");
                console.log("   🔄 Creating mock proof as fallback...");
                const mockProof = {
                    merkleTreeRoot: group.root.toString(),
                    nullifier: identity.commitment.toString(),
                    message: message,
                    scope: scope,
                    points: [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]
                };
                console.log("   ✅ Mock proof created successfully\n");
                return {
                    success: true,
                    data: {
                        proof: mockProof,
                        identity: identity.commitment.toString(),
                        message,
                        scope,
                        generationTime: endTime - startTime,
                        proofType: "mock",
                        warning: "Real proof generation failed, using mock proof"
                    }
                };
            }
        }
        catch (error) {
            console.error("=== Vote API Error ===");
            console.error("Error type:", typeof error);
            console.error("Error message:", error instanceof Error ? error.message : String(error));
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
            console.error("Full error object:", error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                details: error instanceof Error ? error.stack : String(error),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.IssuanceController = IssuanceController;
__decorate([
    (0, common_1.Post)('create-proposal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IssuanceController.prototype, "createProposal", null);
__decorate([
    (0, common_1.Get)('get-proposal'),
    __param(0, (0, common_1.Query)('proposalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IssuanceController.prototype, "getProposal", null);
__decorate([
    (0, common_1.Post)('issue-vc'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IssuanceController.prototype, "issueVC", null);
__decorate([
    (0, common_1.Post)('vote'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IssuanceController.prototype, "vote", null);
__decorate([
    (0, common_1.Post)('vote2'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IssuanceController.prototype, "vote2", null);
exports.IssuanceController = IssuanceController = __decorate([
    (0, common_1.Controller)('issuance')
], IssuanceController);
//# sourceMappingURL=issuance.controller.js.map