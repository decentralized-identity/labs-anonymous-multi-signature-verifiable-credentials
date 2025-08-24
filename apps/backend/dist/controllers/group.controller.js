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
exports.GroupController = void 0;
const common_1 = require("@nestjs/common");
const agent_1 = require("../lib/veramo/agent");
const group_did_service_mongo_1 = require("../lib/services/group-did-service-mongo");
const identity_1 = require("@semaphore-protocol/identity");
let GroupController = class GroupController {
    async createGroup(body) {
        try {
            const { groupName, groupDescription, m, n, contractAddress, chainId, merkleRootHistoryEndpoint } = body;
            console.log('body', body);
            const agent = await (0, agent_1.initializeAgent)();
            const groupDIDService = await group_did_service_mongo_1.GroupDIDService.getInstance(agent);
            const result = await groupDIDService.createGroupDID({
                groupName,
                groupDescription,
                approvalPolicy: { m, n },
                semaphoreContractAddress: contractAddress,
                chainId: chainId.toString(),
                merkleRootHistoryEndpoint,
            });
            const groupInfo = await groupDIDService.getGroupInfo(result.did.did);
            return {
                success: true,
                data: groupInfo,
            };
        }
        catch (error) {
            console.error('Error creating group DID:', error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async addMember(body) {
        try {
            const { groupDid, memberSecret } = body;
            const agent = await (0, agent_1.initializeAgent)();
            const groupDIDService = await group_did_service_mongo_1.GroupDIDService.getInstance(agent);
            const memberIdentity = new identity_1.Identity(memberSecret);
            await groupDIDService.addMemberToGroup(groupDid, memberIdentity);
            const groupInfo = await groupDIDService.getGroupInfo(groupDid);
            return {
                success: true,
                data: {
                    memberCommitment: memberIdentity.commitment.toString(),
                    updatedGroup: groupInfo,
                },
            };
        }
        catch (error) {
            console.error('Error adding member to group:', error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async exportKey(body) {
        try {
            const { kid } = body;
            const agent = await (0, agent_1.initializeAgent)();
            const key = await agent.keyManagerGet({ kid });
            const privateKeyHex = key.privateKeyHex;
            return {
                success: true,
                data: {
                    kid: key.kid,
                    type: key.type,
                    publicKeyHex: key.publicKeyHex,
                    privateKeyHex: privateKeyHex,
                    warning: 'This private key should NEVER be exposed in production!'
                },
            };
        }
        catch (error) {
            console.error('Error exporting key:', error);
            throw new common_1.HttpException({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.GroupController = GroupController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Post)('add-member'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "addMember", null);
__decorate([
    (0, common_1.Post)('export-key'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "exportKey", null);
exports.GroupController = GroupController = __decorate([
    (0, common_1.Controller)('group')
], GroupController);
//# sourceMappingURL=group.controller.js.map