export declare class GroupController {
    createGroup(body: {
        groupName: string;
        groupDescription: string;
        m: number;
        n: number;
        contractAddress: string;
        chainId: number;
        merkleRootHistoryEndpoint: string;
    }): Promise<{
        success: boolean;
        data: {
            did: any;
            semaphoreGroup: {
                config: import("../lib/semaphore/group-manager").SemaphoreGroupConfig;
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
        };
    }>;
    addMember(body: {
        groupDid: string;
        memberSecret: string;
    }): Promise<{
        success: boolean;
        data: {
            memberCommitment: string;
            updatedGroup: {
                did: any;
                semaphoreGroup: {
                    config: import("../lib/semaphore/group-manager").SemaphoreGroupConfig;
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
            };
        };
    }>;
    exportKey(body: {
        kid: string;
    }): Promise<{
        success: boolean;
        data: {
            kid: string;
            type: import("@veramo/core-types").TKeyType;
            publicKeyHex: string;
            privateKeyHex: string;
            warning: string;
        };
    }>;
}
