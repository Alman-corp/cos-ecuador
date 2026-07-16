import { Controller, Get, Post, Put, Delete, Param, Body } from "@nestjs/common"
import { ContactsService } from "./contacts.service"

@Controller("clients/:clientId/contacts")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findByClient(@Param("clientId") clientId: string) {
    return this.contactsService.findByClient(clientId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.contactsService.findById(id)
  }

  @Post()
  create(@Param("clientId") clientId: string, @Body() data: any) {
    return this.contactsService.create({ ...data, clientCompanyId: clientId })
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.contactsService.update(id, data)
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.contactsService.remove(id)
  }
}
