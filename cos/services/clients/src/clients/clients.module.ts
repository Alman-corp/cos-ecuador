import { Module } from "@nestjs/common"
import { ClientsController } from "./clients.controller"
import { ClientsService } from "./clients.service"
import { ContactsController } from "./contacts.controller"
import { ContactsService } from "./contacts.service"
import { ContractsController } from "./contracts.controller"
import { ContractsService } from "./contracts.service"
import { MeetingsController } from "./meetings.controller"
import { MeetingsService } from "./meetings.service"

@Module({
  controllers: [ClientsController, ContactsController, ContractsController, MeetingsController],
  providers: [ClientsService, ContactsService, ContractsService, MeetingsService],
  exports: [ClientsService, ContactsService, ContractsService, MeetingsService],
})
export class ClientsModule {}
