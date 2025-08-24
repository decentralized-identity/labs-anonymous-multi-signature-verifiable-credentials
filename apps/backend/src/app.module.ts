import { Module } from '@nestjs/common';
import { GroupController } from './controllers/group.controller';
import { IssuanceController } from './controllers/issuance.controller';

@Module({
  imports: [],
  controllers: [GroupController, IssuanceController],
  providers: [],
})
export class AppModule {}