import { Module } from "@nestjs/common"
import { NotificationsService } from "./notifications.service"
import { NotificationsController } from "./notifications.controller"
import { VaultModule } from "../vault/vault.module"
import { TemplatesModule } from "./templates/templates.module"

@Module({
  imports: [VaultModule, TemplatesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
