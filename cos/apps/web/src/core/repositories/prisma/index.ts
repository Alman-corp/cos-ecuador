import { PrismaCompanyRepository } from "./PrismaCompanyRepository"
import { PrismaUserRepository } from "./PrismaUserRepository"
import { PrismaClientRepository } from "./PrismaClientRepository"
import { PrismaLeadRepository } from "./PrismaLeadRepository"
import { PrismaDocumentRepository } from "./PrismaDocumentRepository"
import { PrismaFinancialStatementRepository } from "./PrismaFinancialStatementRepository"

export const prismaCompanyRepo = new PrismaCompanyRepository()
export const prismaUserRepo = new PrismaUserRepository()
export const prismaClientRepo = new PrismaClientRepository()
export const prismaLeadRepo = new PrismaLeadRepository()
export const prismaDocumentRepo = new PrismaDocumentRepository()
export const prismaFinancialStatementRepo = new PrismaFinancialStatementRepository()
