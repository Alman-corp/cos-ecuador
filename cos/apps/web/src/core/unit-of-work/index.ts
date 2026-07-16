import { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { ICompanyRepository } from "../repositories/CompanyRepository"
import type { IUserRepository } from "../repositories/UserRepository"
import type { IClientRepository } from "../repositories/ClientRepository"
import type { ILeadRepository } from "../repositories/LeadRepository"
import type { IDocumentRepository } from "../repositories/DocumentRepository"
import type { IFinancialStatementRepository } from "../repositories/FinancialStatementRepository"
import { PrismaCompanyRepository } from "../repositories/prisma/PrismaCompanyRepository"
import { PrismaUserRepository } from "../repositories/prisma/PrismaUserRepository"
import { PrismaClientRepository } from "../repositories/prisma/PrismaClientRepository"
import { PrismaLeadRepository } from "../repositories/prisma/PrismaLeadRepository"
import { PrismaDocumentRepository } from "../repositories/prisma/PrismaDocumentRepository"
import { PrismaFinancialStatementRepository } from "../repositories/prisma/PrismaFinancialStatementRepository"

export interface IUnitOfWork {
  companies: ICompanyRepository
  users: IUserRepository
  clients: IClientRepository
  leads: ILeadRepository
  documents: IDocumentRepository
  financialStatements: IFinancialStatementRepository
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  run<T>(fn: (uow: IUnitOfWork) => Promise<T>): Promise<T>
}

export class UnitOfWork implements IUnitOfWork {
  private tx: PrismaClient | null = null
  private inTransaction = false
  private _companies!: ICompanyRepository
  private _users!: IUserRepository
  private _clients!: IClientRepository
  private _leads!: ILeadRepository
  private _documents!: IDocumentRepository
  private _financialStatements!: IFinancialStatementRepository

  get companies(): ICompanyRepository { return this._companies }
  get users(): IUserRepository { return this._users }
  get clients(): IClientRepository { return this._clients }
  get leads(): ILeadRepository { return this._leads }
  get documents(): IDocumentRepository { return this._documents }
  get financialStatements(): IFinancialStatementRepository { return this._financialStatements }

  private initRepositories() {
    const db = this.tx ?? prisma
    this._companies = new PrismaCompanyRepository()
    this._users = new PrismaUserRepository()
    this._clients = new PrismaClientRepository()
    this._leads = new PrismaLeadRepository()
    this._documents = new PrismaDocumentRepository()
    this._financialStatements = new PrismaFinancialStatementRepository()
  }

  async begin(): Promise<void> {
    if (this.inTransaction) throw new Error("Transaction already in progress")
    this.tx = prisma
    this.inTransaction = true
    this.initRepositories()
  }

  async commit(): Promise<void> {
    if (!this.inTransaction) throw new Error("No transaction in progress")
    this.inTransaction = false
    this.tx = null
  }

  async rollback(): Promise<void> {
    if (!this.inTransaction) throw new Error("No transaction in progress")
    this.inTransaction = false
    this.tx = null
  }

  async run<T>(fn: (uow: IUnitOfWork) => Promise<T>): Promise<T> {
    const isOuter = !this.inTransaction
    if (isOuter) await this.begin()
    try {
      const result = await fn(this)
      if (isOuter) await this.commit()
      return result
    } catch (error) {
      if (isOuter) await this.rollback()
      throw error
    }
  }
}

export const unitOfWork = new UnitOfWork()
