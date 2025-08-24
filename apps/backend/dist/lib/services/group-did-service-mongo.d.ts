import { Agent } from '../veramo/agent';
import { SemaphoreGroupManager, SemaphoreGroupConfig } from '../semaphore/group-manager';
import { Identity } from '@semaphore-protocol/identity';
import { IIdentifier } from '@veramo/core';
export interface GroupDIDConfig {
    groupName: string;
    groupDescription: string;
    semaphoreContractAddress?: string;
    chainId?: string;
    merkleRootHistoryEndpoint?: string;
}
export declare class GroupDIDService {
    private agent;
    private groupManager;
    private db;
    constructor();
    initialize(agent: Agent): Promise<void>;
    createGroupDID(config: GroupDIDConfig): Promise<{
        did: IIdentifier;
        semaphoreGroup: ReturnType<SemaphoreGroupManager['exportGroupData']>;
    }>;
    private buildGroupDIDDocument;
    addMemberToGroup(groupDid: string, memberIdentity: Identity): Promise<void>;
    getGroupInfo(groupDid: string): Promise<{
        did: any;
        semaphoreGroup: {
            config: SemaphoreGroupConfig;
            merkleRoot: string;
            merkleTreeDepth: number;
            members: string[];
            memberCount: number;
        };
        didDocument: {
            '@context': string[];
            id: string;
            verificationMethod: {
                id: string;
                type: string;
                controller: string;
                publicKeyHex: string;
            }[];
            authentication: string[];
            service: any[];
        };
    }>;
    static getInstance(agent?: Agent): Promise<GroupDIDService>;
}
