import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../prisma/prisma.service"
import { MinioService } from "./minio.service"
import { TikaService } from "./tika.service"
import { DocumentClassifier } from "./classifier.service"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
]
const MAX_FILE_SIZE = 50 * 1024 * 1024

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private tika: TikaService,
    private classifier: DocumentClassifier,
    private config: ConfigService,
  ) {}

  async findAll(params: {
    companyId?: string
    clientCompanyId?: string
    documentType?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const { companyId, clientCompanyId, documentType, status, page = 1, limit = 20 } = params
    const where: any = {}

    if (clientCompanyId) where.clientCompanyId = clientCompanyId
    if (documentType) where.documentType = documentType
    if (status) where.status = status
    if (companyId) {
      where.clientCompany = { companyId }
    }

    const [data, total] = await Promise.all([
      this.prisma.clientDocument.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { clientCompany: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.clientDocument.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const doc = await this.prisma.clientDocument.findUnique({
      where: { id },
      include: { clientCompany: true },
    })
    if (!doc) throw new NotFoundException("Document not found")
    return doc
  }

  async upload(data: {
    clientCompanyId: string
    title: string
    documentType?: string
    fileBuffer: Buffer
    fileName: string
    mimeType: string
    fileSize: number
  }) {
    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${data.mimeType}`)
    }
    if (data.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException("El archivo excede el tamaño máximo de 50MB")
    }

    const objectName = `${data.clientCompanyId}/${Date.now()}-${data.fileName}`
    await this.minio.uploadBuffer(objectName, data.fileBuffer, data.fileSize, data.mimeType)

    const extractedText = await this.tika.extractText(data.fileBuffer, data.mimeType)
    const docType = data.documentType || this.classifier.classify(data.fileName, extractedText)
    const checksum = this.calculateChecksum(data.fileBuffer)

    const existing = await this.prisma.clientDocument.findFirst({ where: { checksum } })
    if (existing) {
      await this.minio.delete(objectName)
      throw new BadRequestException("Este documento ya fue subido anteriormente")
    }

    const doc = await this.prisma.clientDocument.create({
      data: {
        clientCompanyId: data.clientCompanyId,
        title: data.title,
        documentType: docType,
        fileUrl: objectName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        checksum,
        status: "completed",
      },
    })
    return doc
  }

  async update(id: string, data: Partial<{
    title: string
    documentType: string
    status: string
  }>) {
    const doc = await this.prisma.clientDocument.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException("Document not found")
    return this.prisma.clientDocument.update({ where: { id }, data })
  }

  async remove(id: string) {
    const doc = await this.prisma.clientDocument.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException("Document not found")
    await this.minio.delete(doc.fileUrl)
    return this.prisma.clientDocument.delete({ where: { id } })
  }

  async process(id: string) {
    const doc = await this.prisma.clientDocument.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException("Document not found")
    await this.prisma.clientDocument.update({ where: { id }, data: { status: "processing" } })

    try {
      const stream = await this.minio.getStream(doc.fileUrl)
      const chunks: Buffer[] = []
      for await (const chunk of stream) chunks.push(Buffer.from(chunk))
      const buffer = Buffer.concat(chunks)
      const extractedText = await this.tika.extractText(buffer, doc.mimeType || "application/octet-stream")
      const classified = this.classifier.classify(doc.title || doc.fileUrl, extractedText)

      await this.prisma.clientDocument.update({
        where: { id },
        data: {
          status: "completed",
          documentType: classified,
        },
      })
      return { status: "completed", documentType: classified }
    } catch {
      await this.prisma.clientDocument.update({ where: { id }, data: { status: "failed" } })
      throw new Error("Document processing failed")
    }
  }

  async getSignedUrl(id: string) {
    const doc = await this.prisma.clientDocument.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException("Document not found")
    return { url: await this.minio.getSignedUrl(doc.fileUrl) }
  }

  async getStats(companyId: string) {
    const [total, byType, byStatus] = await Promise.all([
      this.prisma.clientDocument.count({
        where: { clientCompany: { companyId } },
      }),
      this.prisma.clientDocument.groupBy({
        by: ["documentType"],
        where: { clientCompany: { companyId } },
        _count: true,
      }),
      this.prisma.clientDocument.groupBy({
        by: ["status"],
        where: { clientCompany: { companyId } },
        _count: true,
      }),
    ])
    return { total, byType, byStatus }
  }

  private calculateChecksum(buffer: Buffer): string {
    let hash = 0
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i]
      hash = hash & hash
    }
    return hash.toString(16)
  }
}
