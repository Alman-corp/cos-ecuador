import { ValidationError } from "../errors"

export abstract class BusinessRule {
  abstract get description(): string
  abstract validate(): Promise<boolean> | boolean
}

export class BusinessValidationResult {
  constructor(
    public readonly valid: boolean,
    public readonly errors: string[] = [],
  ) {}
  static ok(): BusinessValidationResult { return new BusinessValidationResult(true) }
  static fail(...errors: string[]): BusinessValidationResult {
    return new BusinessValidationResult(false, errors)
  }
  throwIfInvalid(): void {
    if (!this.valid) throw new ValidationError(this.errors.join("; "))
  }
}

export async function validateRules(rules: BusinessRule[]): Promise<BusinessValidationResult> {
  const errors: string[] = []
  for (const rule of rules) {
    const passed = await rule.validate()
    if (!passed) errors.push(rule.description)
  }
  return errors.length === 0
    ? BusinessValidationResult.ok()
    : BusinessValidationResult.fail(...errors)
}

// --- Concrete business rules ---
export class CompanyMustHaveSubscription extends BusinessRule {
  description = "Company must have an active subscription"
  constructor(private companyId: string) { super() }
  async validate(): Promise<boolean> {
    const { prisma } = await import("@/lib/db/prisma")
    const company = await prisma.company.findUnique({
      where: { id: this.companyId },
      select: { status: true },
    })
    return company?.status === "active"
  }
}

export class LeadCannotBeConvertedTwice extends BusinessRule {
  description = "Lead cannot be converted more than once"
  constructor(private leadId: string) { super() }
  async validate(): Promise<boolean> {
    const { prisma } = await import("@/lib/db/prisma")
    const lead = await prisma.lead.findUnique({
      where: { id: this.leadId },
      select: { convertedToClientId: true },
    })
    return lead?.convertedToClientId === null
  }
}

export class ClientMustHaveRepresentative extends BusinessRule {
  description = "Client must have at least one assigned representative"
  constructor(private clientId: string) { super() }
  async validate(): Promise<boolean> {
    const { prisma } = await import("@/lib/db/prisma")
    const contacts = await prisma.clientContact.count({ where: { clientId: this.clientId } })
    return contacts > 0
  }
}

export class FinancialStatementsMustBalance extends BusinessRule {
  description = "Financial statements must balance (Assets = Liabilities + Equity)"
  constructor(
    private totalAssets: number,
    private totalLiabilities: number,
    private equity: number,
  ) { super() }
  validate(): boolean {
    return Math.abs(this.totalAssets - (this.totalLiabilities + this.equity)) < 0.01
  }
}

export class EmailMustBeUnique extends BusinessRule {
  description = "Email must be unique within the company"
  constructor(
    private email: string,
    private companyId: string,
    private excludeId?: string,
  ) { super() }
  async validate(): Promise<boolean> {
    const { prisma } = await import("@/lib/db/prisma")
    const existing = await prisma.user.findFirst({
      where: {
        email: this.email,
        companyId: this.companyId,
        ...(this.excludeId && { id: { not: this.excludeId } }),
      },
      select: { id: true },
    })
    return existing === null
  }
}

export class ClientEmailMustBeUniqueInCompany extends BusinessRule {
  description = "Client email must be unique within the company"
  constructor(
    private email: string | null | undefined,
    private companyId: string,
    private excludeId?: string,
  ) { super() }
  async validate(): Promise<boolean> {
    if (!this.email) return true
    const { prisma } = await import("@/lib/db/prisma")
    const existing = await prisma.client.findFirst({
      where: {
        email: this.email,
        companyId: this.companyId,
        ...(this.excludeId && { id: { not: this.excludeId } }),
      },
      select: { id: true },
    })
    return existing === null
  }
}
