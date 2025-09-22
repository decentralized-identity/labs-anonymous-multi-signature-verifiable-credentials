import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IssuedVCDocument = HydratedDocument<IssuedVC>;

@Schema({ timestamps: true })
export class IssuedVC {
  @Prop({ required: true })
  proposalId: string;

  @Prop({ type: Object, required: true })
  vc: any;

  @Prop({ required: true })
  issuerDid: string;

  @Prop({ type: Object, required: true })
  evidence: {
    type: string;
    proposalId: string;
    groupMerkleRoot: string;
    approvalThreshold: number;
    totalMembers: number;
    approvals: {
      count: number;
      nullifiers: string[];
    };
    rejections?: {
      count: number;
      nullifiers: string[];
    };
  };

  @Prop()
  issuedAt?: Date;
}

export const IssuedVCSchema = SchemaFactory.createForClass(IssuedVC);