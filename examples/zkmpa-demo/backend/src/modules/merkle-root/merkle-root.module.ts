import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerkleRootController } from './merkle-root.controller';
import { MerkleRootHistory, MerkleRootHistorySchema } from './merkle-root-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MerkleRootHistory.name, schema: MerkleRootHistorySchema, collection: 'merkleRootHistory' },
    ]),
  ],
  controllers: [MerkleRootController],
})
export class MerkleRootModule {}