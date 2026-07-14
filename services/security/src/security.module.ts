import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ISO27001ControlsModule } from "./iso27001/controls.module"
import { Soc2Module } from "./soc2/soc2.module"
import { PentestModule } from "./pentest/pentest.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ISO27001ControlsModule,
    Soc2Module,
    PentestModule,
  ],
  exports: [ISO27001ControlsModule, Soc2Module, PentestModule],
})
export class SecurityModule {}
