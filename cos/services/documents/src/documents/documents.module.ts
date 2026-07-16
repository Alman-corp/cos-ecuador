import { Module } from "@nestjs/common"
import { DocumentsController } from "./documents.controller"
import { DocumentsService } from "./documents.service"
import { MinioService } from "./minio.service"
import { TikaService } from "./tika.service"
import { DocumentClassifier } from "./classifier.service"

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService, TikaService, DocumentClassifier],
  exports: [DocumentsService, MinioService, TikaService, DocumentClassifier],
})
export class DocumentsModule {}
