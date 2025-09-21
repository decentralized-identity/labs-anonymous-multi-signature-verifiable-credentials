import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProposalDocument = HydratedDocument<Proposal>;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ required: true, unique: true })
  proposalId: string;

  @Prop({ required: true })
  groupDid: string;

  @Prop({ required: true })
  groupId: string;

  @Prop({ type: Object, required: true })
  vcClaims: {
    subject: string;
    credentialSubject: {
      id: string;
      [key: string]: any;
    };
    [key: string]: any;
  };

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: string;

  @Prop({ type: [Object], default: [] })
  approvals: Array<{
    proof: any;
    nullifierHash: string;
    externalNullifier: string;
    signal: string;
    merkleTreeRoot: string;
  }>;

  @Prop({ type: [Object], default: [] })
  rejections: Array<{
    proof: any;
    nullifierHash: string;
    externalNullifier: string;
    signal: string;
    merkleTreeRoot: string;
  }>;

  @Prop({ default: 2 })
  approvalThreshold: number;

  @Prop({ required: true })
  externalNullifierApprove: string;

  @Prop({ required: true })
  externalNullifierReject: string;

  @Prop({ required: true })
  merkleRoot: string;

  @Prop({ required: true })
  totalMembers: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);