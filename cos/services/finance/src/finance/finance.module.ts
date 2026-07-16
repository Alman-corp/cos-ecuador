import { Module } from "@nestjs/common"
import { FinanceController } from "./finance.controller"
import { FinanceService } from "./finance.service"
import { RatiosEngine } from "./ratios-engine"
import { ProjectionsEngine } from "./projections-engine"

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, RatiosEngine, ProjectionsEngine],
  exports: [FinanceService, RatiosEngine, ProjectionsEngine],
})
export class FinanceModule {}
