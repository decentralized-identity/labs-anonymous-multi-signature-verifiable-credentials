import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MerkleRootHistoryDocument = HydratedDocument<MerkleRootHistory>;

@Schema({ timestamps: true })
export class MerkleRootHistory {
  @Prop({ required: true, index: true })
  groupId: string;

  @Prop({ required: true, index: true })
  root: string;

  @Prop({ default: null })
  blockNumber: number | null;

  @Prop({ required: true })
  timestamp: string;

  @Prop()
  createdAt?: Date;
}

export const MerkleRootHistorySchema = SchemaFactory.createForClass(MerkleRootHistory);

// 복합 인덱스 추가
MerkleRootHistorySchema.index({ groupId: 1, root: 1 });
MerkleRootHistorySchema.index({ groupId: 1, timestamp: -1 });