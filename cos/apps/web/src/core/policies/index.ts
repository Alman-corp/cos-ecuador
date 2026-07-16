export abstract class Policy<TContext = void> {
  abstract evaluate(context: TContext): PolicyResult
  and(other: Policy<TContext>): Policy<TContext> {
    return new AndPolicy(this, other)
  }
}

export class PolicyResult {
  constructor(
    public readonly allowed: boolean,
    public readonly reason?: string,
  ) {}
  static allow(): PolicyResult { return new PolicyResult(true) }
  static deny(reason: string): PolicyResult { return new PolicyResult(false, reason) }
}

class AndPolicy<TContext> extends Policy<TContext> {
  constructor(private left: Policy<TContext>, private right: Policy<TContext>) { super() }
  evaluate(context: TContext): PolicyResult {
    const leftResult = this.left.evaluate(context)
    if (!leftResult.allowed) return leftResult
    return this.right.evaluate(context)
  }
}

export interface PolicyContext {
  userId: string
  companyId: string
  role: string
  permissions: string[]
  isActive: boolean
  companyStatus?: string
}

export class SubscriptionActivePolicy extends Policy<PolicyContext> {
  evaluate(context: PolicyContext): PolicyResult {
    if (context.companyStatus === "inactive" || context.companyStatus === "suspended") {
      return PolicyResult.deny("Company is not active")
    }
    return PolicyResult.allow()
  }
}

export class HasPermissionPolicy extends Policy<PolicyContext> {
  constructor(private requiredPermission: string) { super() }
  evaluate(context: PolicyContext): PolicyResult {
    if (context.permissions.includes(this.requiredPermission)) {
      return PolicyResult.allow()
    }
    return PolicyResult.deny(`Missing permission: ${this.requiredPermission}`)
  }
}

export class UserIsActivePolicy extends Policy<PolicyContext> {
  evaluate(context: PolicyContext): PolicyResult {
    if (!context.isActive) return PolicyResult.deny("User account is inactive")
    return PolicyResult.allow()
  }
}

// --- Specific business policies ---
export class CanDeleteClientPolicy extends Policy<PolicyContext & { clientId: string }> {
  evaluate(context: PolicyContext & { clientId: string }): PolicyResult {
    const sub = new SubscriptionActivePolicy().evaluate(context)
    if (!sub.allowed) return sub
    const perm = new HasPermissionPolicy("clients.delete").evaluate(context)
    if (!perm.allowed) return perm
    return PolicyResult.allow()
  }
}

export class CanApproveInvoicePolicy extends Policy<PolicyContext & { invoiceId: string }> {
  evaluate(context: PolicyContext & { invoiceId: string }): PolicyResult {
    const perm = new HasPermissionPolicy("invoices.approve").evaluate(context)
    if (!perm.allowed) return perm
    if (context.role !== "admin" && context.role !== "partner") {
      return PolicyResult.deny("Only admins and partners can approve invoices")
    }
    return PolicyResult.allow()
  }
}

export class CanRunAuditPolicy extends Policy<PolicyContext & { clientId: string }> {
  evaluate(context: PolicyContext & { clientId: string }): PolicyResult {
    const perm = new HasPermissionPolicy("audit.run").evaluate(context)
    if (!perm.allowed) return perm
    const sub = new SubscriptionActivePolicy().evaluate(context)
    if (!sub.allowed) return sub
    return PolicyResult.allow()
  }
}

export class CanCreateStrategyPolicy extends Policy<PolicyContext & { clientId: string }> {
  evaluate(context: PolicyContext & { clientId: string }): PolicyResult {
    const perm = new HasPermissionPolicy("strategy.create").evaluate(context)
    if (!perm.allowed) return perm
    if (context.role !== "partner" && context.role !== "director") {
      return PolicyResult.deny("Only partners and directors can create strategies")
    }
    return PolicyResult.allow()
  }
}
