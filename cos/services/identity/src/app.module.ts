import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { CompanyModule } from "./company/company.module"
import { UserModule } from "./user/user.module"
import { RoleModule } from "./role/role.module"
import { PrismaModule } from "./prisma/prisma.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CompanyModule,
    UserModule,
    RoleModule,
  ],
})
export class AppModule {}
