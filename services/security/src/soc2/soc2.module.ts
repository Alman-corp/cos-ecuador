import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { Soc2Service } from "./soc2.service"
import { Soc2Controller } from "./soc2.controller"

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [Soc2Controller],
  providers: [Soc2Service],
  exports: [Soc2Service],
})
export class Soc2Module {}
