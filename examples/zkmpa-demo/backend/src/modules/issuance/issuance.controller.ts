import { Controller, Post, Get, Body, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { initializeAgent } from '../../lib/veramo/agent';
import { IssuanceService } from './issuance.service';
import { GroupDIDService } from '../group/group-did.service';
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';

@Controller('api')
export class IssuanceController {
  constructor(
    private readonly issuanceService: IssuanceService,
    private readonly groupDIDService: GroupDIDService
  ) {}
  @Post('proposals')
  async createProposal(@Body() body: {
    vcClaims: any;
    groupDid: string;
    approvalPolicy: { m: number; n: number };
  }) {
    try {
      const { vcClaims, groupDid, approvalPolicy } = body;

      const agent = await initializeAgent();
      await this.issuanceService.initialize(agent);

      const proposal = await this.issuanceService.createIssuanceProposal(vcClaims, groupDid, approvalPolicy);

      return {
        success: true,
        data: proposal,
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('proposals/:proposalId')
  async getProposal(@Param('proposalId') proposalId: string) {
    try {
      if (!proposalId) {
        throw new HttpException(
          { success: false, error: 'Proposal ID is required' },
          HttpStatus.BAD_REQUEST
        );
      }

      const agent = await initializeAgent();
      await this.issuanceService.initialize(agent);

      const proposal = await this.issuanceService.getProposal(proposalId);

      if (!proposal) {
        throw new HttpException(
          { success: false, error: 'Proposal not found' },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: proposal,
      };
    } catch (error) {
      console.error('Error getting proposal:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('proposals/:proposalId/issue')
  async issueVC(@Param('proposalId') proposalId: string) {
    try {

      const agent = await initializeAgent();
      await this.issuanceService.initialize(agent);

      // The service now returns the JWT string directly
      const vcJwt = await this.issuanceService.issueVCWithEvidence(proposalId);

      return {
        success: true,
        data: {
          credential: vcJwt  // Only return the JWT string
        },
      };
    } catch (error) {
      console.error('Error issuing VC:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('proposals/:proposalId/votes')
  async vote(
    @Param('proposalId') proposalId: string,
    @Body() body: {
      memberSecret: string;
      voteType: 'approve' | 'reject';
      groupDid: string;
    }
  ) {
    console.log('=== Vote API Called ===');
    try {
      const { memberSecret, voteType, groupDid } = body;
      console.log('Request body:', body);
      
      console.log('Initializing agent...');
      const agent = await initializeAgent();
      console.log('Agent initialized');
      
      console.log('Getting services...');
      await this.issuanceService.initialize(agent);
      await this.groupDIDService.initialize(agent);
      console.log('Services initialized');

      console.log('Getting group info for DID:', groupDid);
      const groupInfo = await this.groupDIDService.getGroupInfo(groupDid);
      console.log('Group info retrieved:', {
        members: groupInfo.semaphoreGroup.members,
        memberCount: groupInfo.semaphoreGroup.memberCount
      });
      
      console.log('Creating member identity...');
      const memberIdentity = new Identity(memberSecret);
      console.log('Member identity created, commitment:', memberIdentity.commitment.toString());
      
      console.log('Creating Semaphore group...');
      const group = new Group(
        groupInfo.semaphoreGroup.members.map(m => BigInt(m))
      );
      console.log('Semaphore group created with members:', group.members.length);
      
      const memberCommitment = memberIdentity.commitment;
      const isMemberInGroup = groupInfo.semaphoreGroup.members.includes(memberCommitment.toString());
      console.log('Member check:', {
        memberCommitment: memberCommitment.toString(),
        groupMembers: groupInfo.semaphoreGroup.members,
        isMemberInGroup
      });
      if (!isMemberInGroup) {
        throw new HttpException(
          {
            success: false,
            error: `Member identity not found in group. Please add this member first. Commitment: ${memberCommitment.toString()}`
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const voteProof = await this.issuanceService.generateVoteProof(
        proposalId,
        memberIdentity,
        voteType,
        group
      );

      console.log('Vote proof generated:', {
        nullifierHash: voteProof.nullifierHash,
        voteType
      });
      
      await this.issuanceService.submitVote(proposalId, voteProof, voteType);

      const proposal = await this.issuanceService.getProposal(proposalId);

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
    } catch (error) {
      console.error('=== Vote API Error ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Full error object:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : String(error)
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('proposals/:proposalId/test-vote')
  async testVote(
    @Param('proposalId') proposalId: string,
    @Body() body: any
  ) {
    console.log("=== Vote API Called ===");
    try {
      const identity = new Identity();
      console.log("   Identity commitment:", identity.commitment.toString());
      console.log("   ✅ Identity created\n");

      console.log("2️⃣ Creating group...");
      const group = new Group();
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
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Proof generation timeout after 30 seconds"));
          }, 30000);
        });

        const proof = await Promise.race([
          generateProof(identity, group, message, scope),
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

      } catch (proofError) {
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
    } catch (error) {
      console.error("=== Vote API Error ===");
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      console.error("Full error object:", error);

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          details: error instanceof Error ? error.stack : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}