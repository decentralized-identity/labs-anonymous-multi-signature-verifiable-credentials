import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { GroupModule } from '../group/group.module';
import { Proposal, ProposalSchema } from './proposal.schema';
import { IssuedVC, IssuedVCSchema } from './issued-vc.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema, collection: 'proposals' },
      { name: IssuedVC.name, schema: IssuedVCSchema, collection: 'issuedVCs' },
    ]),
    GroupModule,
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService],
  exports: [IssuanceService],
})
export class IssuanceModule {}