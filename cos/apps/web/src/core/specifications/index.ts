export abstract class Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other)
  }
  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other)
  }
  not(): Specification<T> {
    return new NotSpecification(this)
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) { super() }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(private left: Specification<T>, private right: Specification<T>) { super() }
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private spec: Specification<T>) { super() }
  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate)
  }
}

// --- Concrete specifications for Client ---
import type { Client } from "@prisma/client"

export class HighRiskClientSpec extends Specification<Client> {
  constructor(private threshold = 50) { super() }
  isSatisfiedBy(client: Client): boolean {
    return client.score <= this.threshold
  }
}

export class HealthyClientSpec extends Specification<Client> {
  constructor(private threshold = 70) { super() }
  isSatisfiedBy(client: Client): boolean {
    return client.score >= this.threshold
  }
}

export class EnterpriseClientSpec extends Specification<Client> {
  isSatisfiedBy(client: Client): boolean {
    return client.segment === "enterprise"
  }
}

export class ActiveClientSpec extends Specification<Client> {
  isSatisfiedBy(client: Client): boolean {
    return client.status === "active"
  }
}

export class ClientByIndustrySpec extends Specification<Client> {
  constructor(private industry: string) { super() }
  isSatisfiedBy(client: Client): boolean {
    return client.industry === this.industry
  }
}
