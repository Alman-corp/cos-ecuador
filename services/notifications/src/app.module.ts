import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { VaultModule } from "./vault/vault.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { TemplatesModule } from "./notifications/templates/templates.module"
import { EventsModule } from "./events/events.module"
import { DigestModule } from "./digest/digest.module"
import { WebhooksModule } from "./webhooks/webhooks.module"
import { NotificationsGateway } from "./notifications.gateway"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VaultModule,
    TemplatesModule,
    NotificationsModule,
    EventsModule,
    DigestModule,
    WebhooksModule,
  ],
  providers: [NotificationsGateway],
})
export class AppModule {}
