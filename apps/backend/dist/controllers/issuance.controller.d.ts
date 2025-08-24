export declare class IssuanceController {
    createProposal(body: {
        vcClaims: any;
        groupDid: string;
    }): Promise<{
        success: boolean;
        data: import("@/lib/services/issuance-service").IssuanceProposal;
    }>;
    getProposal(proposalId: string): Promise<{
        success: boolean;
        data: import("@/lib/services/issuance-service").IssuanceProposal;
    }>;
    issueVC(body: {
        proposalId: string;
    }): Promise<{
        success: boolean;
        data: {
            verifiableCredential: any;
        };
    }>;
    vote(body: {
        proposalId: string;
        memberSecret: string;
        voteType: 'approve' | 'reject';
        groupDid: string;
    }): Promise<{
        success: boolean;
        data: {
            proposal: import("@/lib/services/issuance-service").IssuanceProposal;
            voteProof: {
                nullifierHash: string;
                voteType: "approve" | "reject";
            };
        };
    }>;
    vote2(body: any): Promise<{
        success: boolean;
        data: {
            proof: import("@semaphore-protocol/proof").SemaphoreProof;
            identity: string;
            message: string;
            scope: string;
            generationTime: number;
            proofType: string;
            warning?: undefined;
        };
    } | {
        success: boolean;
        data: {
            proof: {
                merkleTreeRoot: string;
                nullifier: string;
                message: string;
                scope: string;
                points: bigint[];
            };
            identity: string;
            message: string;
            scope: string;
            generationTime: number;
            proofType: string;
            warning: string;
        };
    }>;
}
