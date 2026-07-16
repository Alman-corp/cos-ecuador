import { Controller, Get, Post, Put, Delete, Param, Query, Body, UploadedFile, UseInterceptors } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { DocumentsService } from "./documents.service"

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @Query("companyId") companyId?: string,
    @Query("clientCompanyId") clientCompanyId?: string,
    @Query("documentType") documentType?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.documentsService.findAll({
      companyId,
      clientCompanyId,
      documentType,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
  }

  @Get("stats")
  getStats(@Query("companyId") companyId: string) {
    return this.documentsService.getStats(companyId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.documentsService.findById(id)
  }

  @Get(":id/signed-url")
  getSignedUrl(@Param("id") id: string) {
    return this.documentsService.getSignedUrl(id)
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("clientCompanyId") clientCompanyId: string,
    @Body("title") title: string,
    @Body("documentType") documentType?: string,
  ) {
    return this.documentsService.upload({
      clientCompanyId,
      title,
      documentType,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    })
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.documentsService.update(id, data)
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documentsService.remove(id)
  }

  @Post(":id/process")
  process(@Param("id") id: string) {
    return this.documentsService.process(id)
  }
}
