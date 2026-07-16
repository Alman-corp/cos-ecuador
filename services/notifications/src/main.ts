import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { Logger } from "@nestjs/common"
import * as amqp from "amqplib"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger("Bootstrap")

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })

  const port = process.env.PORT ?? 3010
  await app.listen(port)
  logger.log(`Notifications service running on port ${port}`)

  const rabbitUrl = process.env.RABBITMQ_URL ?? "amqp://localhost:5672"
  try {
    const conn = await amqp.connect(rabbitUrl)
    const channel = await conn.createChannel()
    await channel.assertExchange("notifications", "topic", { durable: true })
    await channel.assertQueue("notifications.queue", { durable: true })
    await channel.bindQueue("notifications.queue", "notifications", "#")
    logger.log("Connected to RabbitMQ")
  } catch {
    logger.warn("RabbitMQ not available, running without message broker")
  }
}

bootstrap()
