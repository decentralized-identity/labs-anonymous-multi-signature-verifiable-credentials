import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { initializeAgent } from '../../lib/veramo/agent';
import { GroupDIDService } from './group-did.service';
import { MerkleRootVerifier } from '../verification/merkle-root-verifier';
import { Identity } from '@semaphore-protocol/identity';
import { Group, GroupDocument } from './group.schema';
import { MerkleRootHistory, MerkleRootHistoryDocument } from './merkle-root-history.schema';

@Controller('group')
export class GroupController {
  constructor(
    private readonly groupDIDService: GroupDIDService,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(MerkleRootHistory.name) private merkleRootHistoryModel: Model<MerkleRootHistoryDocument>
  ) {}
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
      await this.groupDIDService.initialize(agent);

      const result = await this.groupDIDService.createGroupDID({
        groupName,
        groupDescription,
        semaphoreContractAddress: contractAddress,
        chainId: chainId,
      });

      const groupInfo = await this.groupDIDService.getGroupInfo(result.did.did);

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
      await this.groupDIDService.initialize(agent);

      const memberIdentity = new Identity(memberSecret);

      await this.groupDIDService.addMemberToGroup(groupDid, memberIdentity);

      const groupInfo = await this.groupDIDService.getGroupInfo(groupDid);

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

  @Get(':groupDid/merkle-roots/stats')
  async getMerkleRootStats(@Param('groupDid') groupDid: string) {
    try {
      const agent = await initializeAgent();
      await this.groupDIDService.initialize(agent);
      const merkleRootVerifier = new MerkleRootVerifier(
        this.groupDIDService,
        this.groupModel,
        this.merkleRootHistoryModel
      );

      const stats = await merkleRootVerifier.getRootHistoryStats(groupDid);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting merkle root stats:', error);
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get merkle root statistics'
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