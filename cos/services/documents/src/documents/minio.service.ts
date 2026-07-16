import { Injectable, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as Minio from "minio"

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client
  private bucket: string

  constructor(private config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.config.get("MINIO_ENDPOINT", "localhost"),
      port: Number(this.config.get("MINIO_PORT", "9000")),
      useSSL: this.config.get("MINIO_USE_SSL", "false") === "true",
      accessKey: this.config.get("MINIO_ACCESS_KEY", "minioadmin"),
      secretKey: this.config.get("MINIO_SECRET_KEY", "minioadmin"),
    })
    this.bucket = this.config.get("MINIO_BUCKET", "cos-documents")
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket)
    if (!exists) {
      await this.client.makeBucket(this.bucket)
    }
  }

  async upload(objectName: string, filePath: string, metaData?: Record<string, string>) {
    return this.client.fPutObject(this.bucket, objectName, filePath, metaData)
  }

  async uploadBuffer(objectName: string, buffer: Buffer, size: number, mimeType: string) {
    return this.client.putObject(this.bucket, objectName, buffer, size, { "Content-Type": mimeType })
  }

  async download(objectName: string, filePath: string) {
    return this.client.fGetObject(this.bucket, objectName, filePath)
  }

  async getStream(objectName: string) {
    return this.client.getObject(this.bucket, objectName)
  }

  async getSignedUrl(objectName: string, expiresIn = 3600) {
    return this.client.presignedGetObject(this.bucket, objectName, expiresIn)
  }

  async getUploadUrl(objectName: string, expiresIn = 3600) {
    return this.client.presignedPutObject(this.bucket, objectName, expiresIn)
  }

  async delete(objectName: string) {
    return this.client.removeObject(this.bucket, objectName)
  }

  async exists(objectName: string) {
    try {
      await this.client.statObject(this.bucket, objectName)
      return true
    } catch {
      return false
    }
  }
}
