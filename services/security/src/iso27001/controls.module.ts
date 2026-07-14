import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { ISO27001ControlsService } from "./controls.service"
import { ISO27001ControlsController } from "./controls.controller"

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ISO27001ControlsController],
  providers: [ISO27001ControlsService],
  exports: [ISO27001ControlsService],
})
export class ISO27001ControlsModule {}
