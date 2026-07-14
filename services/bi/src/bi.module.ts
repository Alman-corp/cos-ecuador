import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { PrismaModule } from "@cos/prisma"
import { BusinessIntelligenceService } from "./bi.service"
import { BIController } from "./bi.controller"

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [BusinessIntelligenceService],
  controllers: [BIController],
  exports: [BusinessIntelligenceService],
})
export class BusinessIntelligenceModule {}
