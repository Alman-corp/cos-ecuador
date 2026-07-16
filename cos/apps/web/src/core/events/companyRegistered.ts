import type { IEvent } from "../bus/EventBus"

export interface CompanyRegisteredEvent extends IEvent {
  readonly type: "identity.companyRegistered"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  name: string
  email: string
  adminId: string
}

export function companyRegistered(
  aggregateId: string, companyId: string, name: string, email: string, adminId: string,
): CompanyRegisteredEvent {
  return {
    type: "identity.companyRegistered",
    aggregateId,
    occurredAt: new Date(),
    companyId,
    name,
    email,
    adminId,
  }
}
