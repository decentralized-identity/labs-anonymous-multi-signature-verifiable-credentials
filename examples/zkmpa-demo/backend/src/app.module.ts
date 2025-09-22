import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
    // Serve static files for JSON-LD context
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    GroupModule,
    IssuanceModule,
    VerificationModule,
    MerkleRootModule,
  ],
})
export class AppModule {}