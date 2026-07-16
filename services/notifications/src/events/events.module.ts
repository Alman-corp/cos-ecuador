import { Module } from "@nestjs/common"
import { EventsConsumer } from "./events.consumer"
import { EventsPublisher } from "./events.publisher"
import { NotificationsModule } from "../notifications/notifications.module"

@Module({
  imports: [NotificationsModule],
  providers: [EventsConsumer, EventsPublisher],
  exports: [EventsPublisher],
})
export class EventsModule {}
