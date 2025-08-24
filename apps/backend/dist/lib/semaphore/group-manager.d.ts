import { Group } from '@semaphore-protocol/group';
import { Identity } from '@semaphore-protocol/identity';
export interface SemaphoreGroupConfig {
    groupId: string;
    name: string;
    description: string;
    merkleTreeDepth: number;
}
export declare class SemaphoreGroupManager {
    private groups;
    groupConfigs: Map<string, SemaphoreGroupConfig>;
    private memberIdentities;
    createGroup(config: SemaphoreGroupConfig): Group;
    addMember(groupId: string, identity: Identity): void;
    removeMember(groupId: string, identityCommitment: bigint): void;
    getGroup(groupId: string): Group | undefined;
    getGroupConfig(groupId: string): SemaphoreGroupConfig | undefined;
    getMerkleRoot(groupId: string): bigint;
    getMerkleProof(groupId: string, identityCommitment: bigint): import("@semaphore-protocol/group").MerkleProof;
    getMembers(groupId: string): bigint[];
    getMemberIdentities(groupId: string): Map<string, Identity>;
    exportGroupData(groupId: string): {
        config: SemaphoreGroupConfig;
        merkleRoot: string;
        merkleTreeDepth: number;
        members: string[];
        memberCount: number;
    };
}
