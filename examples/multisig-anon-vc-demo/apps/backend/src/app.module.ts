import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupModule } from './modules/group/group.module';
import { IssuanceModule } from './modules/issuance/issuance.module';
import { VerificationModule } from './modules/verification/verification.module';
import { MerkleRootModule } from './modules/merkle-root/merkle-root.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/anonymous-multi-party-vc',
      {
        // Mongoose 옵션
        retryWrites: true,
        w: 'majority',
      }
    ),
    GroupModule,
    IssuanceModule,
    VerificationModule,
    MerkleRootModule,
  ],
})
export class AppModule {}