import { Module } from '@nestjs/common';
import { GroupController } from './controllers/group.controller';
import { IssuanceController } from './controllers/issuance.controller';
import { MerkleRootController } from './controllers/merkle-root.controller';
import { VerificationController } from './controllers/verification.controller';

@Module({
  imports: [],
  controllers: [GroupController, IssuanceController, MerkleRootController, VerificationController],
  providers: [],
})
export class AppModule {}