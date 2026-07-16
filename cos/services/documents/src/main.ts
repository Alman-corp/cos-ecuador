import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("api/v1")
  app.enableCors()
  await app.listen(3003)
  console.log("📄 Documents Service running on port 3003")
}
bootstrap()
