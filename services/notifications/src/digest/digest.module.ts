import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { DigestProcessor } from "./digest.processor"
import { TemplatesModule } from "../notifications/templates/templates.module"

@Module({
  imports: [ScheduleModule.forRoot(), TemplatesModule],
  providers: [DigestProcessor],
})
export class DigestModule {}
