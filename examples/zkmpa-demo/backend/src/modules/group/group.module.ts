import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupController } from './group.controller';
import { GroupDIDService } from './group-did.service';
import { Group, GroupSchema, GroupConfig, GroupConfigSchema } from './group.schema';
import { MerkleRootHistory, MerkleRootHistorySchema } from './merkle-root-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema, collection: 'groupDIDs' },
      { name: GroupConfig.name, schema: GroupConfigSchema, collection: 'groupConfigs' },
      { name: MerkleRootHistory.name, schema: MerkleRootHistorySchema, collection: 'merkleRootHistory' },
    ]),
  ],
  controllers: [GroupController],
  providers: [GroupDIDService],
  exports: [GroupDIDService, MongooseModule],
})
export class GroupModule {}