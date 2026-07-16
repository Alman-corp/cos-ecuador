import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { VaultModule } from "./vault/vault.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { TemplatesModule } from "./notifications/templates/templates.module"
import { EventsModule } from "./events/events.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VaultModule,
    TemplatesModule,
    NotificationsModule,
    EventsModule,
  ],
})
export class AppModule {}
