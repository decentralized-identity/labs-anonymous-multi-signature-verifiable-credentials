import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { initializeAgent } from '@/lib/veramo/agent';
import { GroupDIDService } from '@/lib/services/group-did-service-mongo';
import { Identity } from '@semaphore-protocol/identity';

@Controller('group')
export class GroupController {
  @Post('create')
  async createGroup(@Body() body: {
    groupName: string;
    groupDescription: string;
    contractAddress?: string;
    chainId?: string;
  }) {
    try {
      const { groupName, groupDescription, contractAddress, chainId } = body;
      console.log('body', body);
      
      const agent = await initializeAgent();
      const groupDIDService = await GroupDIDService.getInstance(agent);

      const result = await groupDIDService.createGroupDID({
        groupName,
        groupDescription,
        semaphoreContractAddress: contractAddress,
        chainId: chainId,
      });

      const groupInfo = await groupDIDService.getGroupInfo(result.did.did);

      return {
        success: true,
        data: groupInfo,
      };
    } catch (error) {
      console.error('Error creating group DID:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('add-member')
  async addMember(@Body() body: {
    groupDid: string;
    memberSecret: string;
  }) {
    try {
      const { groupDid, memberSecret } = body;

      const agent = await initializeAgent();
      const groupDIDService = await GroupDIDService.getInstance(agent);

      const memberIdentity = new Identity(memberSecret);

      await groupDIDService.addMemberToGroup(groupDid, memberIdentity);

      const groupInfo = await groupDIDService.getGroupInfo(groupDid);

      return {
        success: true,
        data: {
          memberCommitment: memberIdentity.commitment.toString(),
          updatedGroup: groupInfo,
        },
      };
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('export-key')
  async exportKey(@Body() body: { kid: string }) {
    try {
      const { kid } = body;

      const agent = await initializeAgent();
      
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
    } catch (error) {
      console.error('Error exporting key:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}