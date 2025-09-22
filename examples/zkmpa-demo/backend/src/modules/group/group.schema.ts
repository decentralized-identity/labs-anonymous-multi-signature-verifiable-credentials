import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, unique: true })
  did: string;

  @Prop({ required: true, unique: true })
  groupId: string;

  @Prop({ type: Object, required: true })
  identifier: any;

  @Prop({ type: Object })
  archiveConfig?: {
    type: string;
    endpoint: string;
  };

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

@Schema({ timestamps: true })
export class GroupConfig {
  @Prop({ required: true, unique: true })
  groupId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: 20 })
  merkleTreeDepth: number;

  @Prop({ type: [String], default: [] })
  members: string[];

  @Prop({ required: true })
  merkleRoot: string;

  @Prop({ type: Object })
  archiveConfig?: {
    type: string;
    endpoint: string;
  };

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export type GroupConfigDocument = HydratedDocument<GroupConfig>;
export const GroupConfigSchema = SchemaFactory.createForClass(GroupConfig);