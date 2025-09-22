import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { MerkleRootVerifier } from './merkle-root-verifier';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [GroupModule],
  controllers: [VerificationController],
  providers: [VerificationService, MerkleRootVerifier],
  exports: [VerificationService, MerkleRootVerifier],
})
export class VerificationModule {}