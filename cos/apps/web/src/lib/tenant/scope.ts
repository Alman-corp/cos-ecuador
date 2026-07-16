import { prisma } from "@/lib/db/prisma"

type TenantModel =
  | "clientCompany" | "companySettings" | "branch" | "brand" | "department" | "role"
  | "user" | "financialStatement"
  | "workflowDefinition" | "workflowInstance" | "workflowTrigger"
  | "notificationTemplate" | "notification"
  | "auditLog"

const FIELD_MAP: Record<TenantModel, string> = {
  clientCompany: "companyId",
  companySettings: "companyId",
  branch: "companyId",
  brand: "companyId",
  department: "companyId",
  role: "companyId",
  user: "companyId",
  financialStatement: "companyId",
  workflowDefinition: "companyId",
  workflowInstance: "companyId",
  workflowTrigger: "companyId",
  notificationTemplate: "companyId",
  notification: "companyId",
  auditLog: "companyId",
}

const MODELS_WITH_COMPANY_ID = new Set(Object.keys(FIELD_MAP))

function hasCompanyId(model: string): model is TenantModel {
  return MODELS_WITH_COMPANY_ID.has(model)
}

export function tenantFindMany<T extends Record<string, any>>(
  model: string,
  args: { where?: Record<string, any>; [key: string]: any },
  companyId: string,
) {
  if (!hasCompanyId(model)) return (prisma as any)[model].findMany(args)
  return (prisma as any)[model].findMany({
    ...args,
    where: { ...args.where, [FIELD_MAP[model]]: companyId },
  })
}

export function tenantFindFirst<T extends Record<string, any>>(
  model: string,
  args: { where?: Record<string, any>; [key: string]: any },
  companyId: string,
) {
  if (!hasCompanyId(model)) return (prisma as any)[model].findFirst(args)
  return (prisma as any)[model].findFirst({
    ...args,
    where: { ...args.where, [FIELD_MAP[model]]: companyId },
  })
}

export function tenantCount(
  model: string,
  args: { where?: Record<string, any>; [key: string]: any },
  companyId: string,
) {
  if (!hasCompanyId(model)) return (prisma as any)[model].count(args)
  return (prisma as any)[model].count({
    ...args,
    where: { ...args.where, [FIELD_MAP[model]]: companyId },
  })
}

export function tenantCreate<T extends Record<string, any>>(
  model: string,
  args: { data: Record<string, any>; [key: string]: any },
  companyId: string,
) {
  if (!hasCompanyId(model)) return (prisma as any)[model].create(args)
  return (prisma as any)[model].create({
    ...args,
    data: { ...args.data, [FIELD_MAP[model]]: companyId },
  })
}

export function tenantAggregate(
  model: string,
  args: { where?: Record<string, any>; [key: string]: any },
  companyId: string,
) {
  if (!hasCompanyId(model)) return (prisma as any)[model].aggregate(args)
  return (prisma as any)[model].aggregate({
    ...args,
    where: { ...args.where, [FIELD_MAP[model]]: companyId },
  })
}

export { prisma }
