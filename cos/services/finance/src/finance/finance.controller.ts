import { Controller, Post, Body } from "@nestjs/common"
import { FinanceService } from "./finance.service"

@Controller("finance")
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post("ratios")
  calculateRatios(@Body() params: { data: any; prevData?: any }) {
    return this.financeService.calculateRatios(params.data, params.prevData)
  }

  @Post("dcf")
  calculateDcf(@Body() params: {
    freeCashFlows: number[]
    terminalGrowthRate: number
    discountRate: number
    sharesOutstanding: number
    netDebt: number
  }) {
    return this.financeService.calculateDcf(params)
  }

  @Post("project")
  projectStatements(@Body() params: { baseYear: any; assumptions: any }) {
    return this.financeService.projectStatements(params.baseYear, params.assumptions)
  }

  @Post("monte-carlo")
  runMonteCarlo(@Body() params: {
    historicalReturns: number[]
    initialValue: number
    horizon: number
    iterations: number
    confidenceLevel: number
  }) {
    return this.financeService.runMonteCarlo(params)
  }
}
