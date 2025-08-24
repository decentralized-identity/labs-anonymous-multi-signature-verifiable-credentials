"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemaphoreGroupManager = void 0;
const group_1 = require("@semaphore-protocol/group");
class SemaphoreGroupManager {
    constructor() {
        this.groups = new Map();
        this.groupConfigs = new Map();
        this.memberIdentities = new Map();
    }
    createGroup(config) {
        const group = new group_1.Group();
        this.groups.set(config.groupId, group);
        this.groupConfigs.set(config.groupId, config);
        this.memberIdentities.set(config.groupId, new Map());
        return group;
    }
    addMember(groupId, identity) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found`);
        }
        const memberMap = this.memberIdentities.get(groupId);
        const memberId = identity.commitment.toString();
        if (memberMap.has(memberId)) {
            throw new Error(`Member already exists in group ${groupId}`);
        }
        group.addMember(identity.commitment);
        memberMap.set(memberId, identity);
    }
    removeMember(groupId, identityCommitment) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found`);
        }
        const memberMap = this.memberIdentities.get(groupId);
        memberMap.delete(identityCommitment.toString());
        const index = group.indexOf(identityCommitment);
        if (index === -1) {
            throw new Error(`Member not found in group ${groupId}`);
        }
        group.removeMember(index);
    }
    getGroup(groupId) {
        return this.groups.get(groupId);
    }
    getGroupConfig(groupId) {
        return this.groupConfigs.get(groupId);
    }
    getMerkleRoot(groupId) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found`);
        }
        return group.root;
    }
    getMerkleProof(groupId, identityCommitment) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found`);
        }
        const index = group.indexOf(identityCommitment);
        if (index === -1) {
            throw new Error(`Member not found in group ${groupId}`);
        }
        return group.generateMerkleProof(index);
    }
    getMembers(groupId) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group ${groupId} not found`);
        }
        return group.members;
    }
    getMemberIdentities(groupId) {
        return this.memberIdentities.get(groupId) || new Map();
    }
    exportGroupData(groupId) {
        const group = this.groups.get(groupId);
        const config = this.groupConfigs.get(groupId);
        if (!group || !config) {
            throw new Error(`Group ${groupId} not found`);
        }
        return {
            config,
            merkleRoot: group.root.toString(),
            merkleTreeDepth: group.depth,
            members: group.members.map(m => m.toString()),
            memberCount: group.members.length,
        };
    }
}
exports.SemaphoreGroupManager = SemaphoreGroupManager;
//# sourceMappingURL=group-manager.js.map