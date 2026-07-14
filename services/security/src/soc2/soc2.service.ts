import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"

export interface SOC2TrustService {
  name: string
  description: string
  criteria: SOC2Criterion[]
  score: number
  status: "compliant" | "needs_improvement" | "non_compliant"
  lastAssessment: string
}

export interface SOC2Criterion {
  id: string
  description: string
  category: string
  status: "implemented" | "partial" | "missing"
  evidence: string[]
  notes: string
}

export interface SOC2AuditReport {
  tenantId: string
  overallScore: number
  overallStatus: string
  trustServices: SOC2TrustService[]
  gaps: { service: string; criteria: string[] }[]
  remediation: { priority: "high" | "medium" | "low"; action: string; dueDate: string }[]
  generatedAt: string
}

export interface EvidenceItem {
  id: string
  control: string
  description: string
  collected: boolean
  collectedAt?: string
  collectedBy?: string
  url?: string
  expiresAt?: string
}

@Injectable()
export class Soc2Service {
  private readonly logger = new Logger(Soc2Service.name)
  private readonly trustServices = new Map<string, SOC2TrustService[]>()
  private readonly evidenceStore = new Map<string, EvidenceItem[]>()

  private buildSecurityService(): SOC2TrustService {
    return {
      name: "security",
      description: "Logical and physical access controls, monitoring, and incident response",
      score: 78,
      status: "needs_improvement",
      lastAssessment: "2026-06-01T10:00:00.000Z",
      criteria: [
        {
          id: "CC6.1",
          description: "Logical and physical access controls",
          category: "Access Control",
          status: "implemented",
          evidence: ["access_control_policy_v5.pdf", "physical_access_audit_2026.pdf"],
          notes: "Badge access and keycard logs reviewed monthly",
        },
        {
          id: "CC6.2",
          description: "User access provisioning",
          category: "Access Control",
          status: "implemented",
          evidence: ["provisioning_workflow.pdf"],
          notes: "Automated via identity provider with manager approval",
        },
        {
          id: "CC6.3",
          description: "Role-based access management",
          category: "Access Control",
          status: "implemented",
          evidence: ["rbac_matrix_v3.xlsx"],
          notes: "Roles defined for all departments",
        },
        {
          id: "CC6.4",
          description: "Segregation of duties",
          category: "Access Control",
          status: "partial",
          evidence: ["sod_report_q1_2026.pdf"],
          notes: "Finance and dev roles partially segregated",
        },
        {
          id: "CC6.5",
          description: "Vulnerability management",
          category: "Operations",
          status: "partial",
          evidence: ["nessus_scan_2026_06.pdf"],
          notes: "12 medium findings unresolved beyond SLA",
        },
        {
          id: "CC6.6",
          description: "Malware protection",
          category: "Operations",
          status: "implemented",
          evidence: ["endpoint_protection_report.pdf"],
          notes: "EDR deployed on all endpoints; definitions updated hourly",
        },
        {
          id: "CC6.7",
          description: "Network security controls",
          category: "Network",
          status: "implemented",
          evidence: ["network_diagram_v4.pdf", "firewall_rule_review.pdf"],
          notes: "Micro-segmentation enforced; all traffic logged",
        },
        {
          id: "CC7.1",
          description: "Monitoring and detection",
          category: "Operations",
          status: "implemented",
          evidence: ["siem_dashboard_june_2026.pdf"],
          notes: "24/7 SOC monitoring via Wazuh SIEM",
        },
        {
          id: "CC7.2",
          description: "Incident response",
          category: "Operations",
          status: "partial",
          evidence: ["ir_plan_v4.pdf"],
          notes: "Plan documented but tabletop exercises overdue",
        },
        {
          id: "CC7.3",
          description: "System monitoring",
          category: "Operations",
          status: "implemented",
          evidence: ["system_monitoring_dashboard.pdf"],
          notes: "All critical systems monitored with Datadog",
        },
      ],
    }
  }

  private buildAvailabilityService(): SOC2TrustService {
    return {
      name: "availability",
      description: "Capacity management, backup, DR, and business continuity",
      score: 88,
      status: "compliant",
      lastAssessment: "2026-05-15T08:00:00.000Z",
      criteria: [
        {
          id: "A1.1",
          description: "Capacity management",
          category: "Operations",
          status: "implemented",
          evidence: ["capacity_plan_q2_2026.pdf"],
          notes: "Auto-scaling configured; quarterly capacity reviews",
        },
        {
          id: "A1.2",
          description: "Backup and recovery",
          category: "Operations",
          status: "implemented",
          evidence: ["backup_test_results.pdf"],
          notes: "Daily backups, 30-day retention; monthly restore tests",
        },
        {
          id: "A1.3",
          description: "Disaster recovery plan",
          category: "BCP",
          status: "implemented",
          evidence: ["drp_2026_v3.pdf"],
          notes: "RTO=4h, RPO=1h; multi-region active-active",
        },
        {
          id: "A1.4",
          description: "Business continuity",
          category: "BCP",
          status: "partial",
          evidence: ["bcp_workshop_minutes.pdf"],
          notes: "BCP approved; last walkthrough 9 months ago",
        },
        {
          id: "A1.5",
          description: "Redundancy and failover",
          category: "Infrastructure",
          status: "implemented",
          evidence: ["redundancy_diagram.pdf"],
          notes: "N+1 for all critical components; automatic failover tested",
        },
        {
          id: "A1.6",
          description: "SLA monitoring",
          category: "Operations",
          status: "implemented",
          evidence: ["sla_dashboard_june_2026.pdf"],
          notes: "99.99% uptime YTD; SLA breaches trigger automatic escalation",
        },
      ],
    }
  }

  private buildProcessingIntegrityService(): SOC2TrustService {
    return {
      name: "processing_integrity",
      description: "Complete, accurate, and valid processing of data",
      score: 82,
      status: "compliant",
      lastAssessment: "2026-04-20T14:00:00.000Z",
      criteria: [
        {
          id: "PI1.1",
          description: "Complete and accurate processing",
          category: "Processing",
          status: "implemented",
          evidence: ["processing_controls_manual.pdf"],
          notes: "Automated reconciliation runs after each batch",
        },
        {
          id: "PI1.2",
          description: "Data validation",
          category: "Processing",
          status: "implemented",
          evidence: ["input_validation_rules.pdf"],
          notes: "Schema validation at API gateway and application layer",
        },
        {
          id: "PI1.3",
          description: "Error handling",
          category: "Processing",
          status: "partial",
          evidence: [],
          notes: "Standard error handling in place; no formal error classification",
        },
        {
          id: "PI1.4",
          description: "Processing controls",
          category: "Processing",
          status: "implemented",
          evidence: ["batch_job_audit_logs.pdf"],
          notes: "All batch jobs logged with checksums for data integrity",
        },
        {
          id: "PI1.5",
          description: "Output verification",
          category: "Processing",
          status: "implemented",
          evidence: ["output_verification_test_results.pdf"],
          notes: "Automated output verification for all critical reports",
        },
      ],
    }
  }

  private buildConfidentialityService(): SOC2TrustService {
    return {
      name: "confidentiality",
      description: "Encryption, access restrictions, and data masking for confidential data",
      score: 92,
      status: "compliant",
      lastAssessment: "2026-06-10T09:00:00.000Z",
      criteria: [
        {
          id: "C1.1",
          description: "Confidential information identification",
          category: "Data Classification",
          status: "implemented",
          evidence: ["data_classification_policy.pdf"],
          notes: "Automated DLP scanning classifies data at rest and in motion",
        },
        {
          id: "C1.2",
          description: "Encryption at rest and transit",
          category: "Cryptography",
          status: "implemented",
          evidence: ["encryption_audit_report.pdf"],
          notes: "AES-256-GCM at rest, TLS 1.3 in transit",
        },
        {
          id: "C1.3",
          description: "Access restrictions",
          category: "Access Control",
          status: "implemented",
          evidence: ["confidential_access_matrix.pdf"],
          notes: "Confidential data access limited to authorized personnel only",
        },
        {
          id: "C1.4",
          description: "Data masking",
          category: "Privacy",
          status: "partial",
          evidence: [],
          notes: "Production data masked in non-prod environments; PII masking partial",
        },
        {
          id: "C1.5",
          description: "Confidentiality agreements",
          category: "Legal",
          status: "implemented",
          evidence: ["nda_log.xlsx"],
          notes: "All employees and contractors sign NDAs; automated tracking",
        },
      ],
    }
  }

  private buildPrivacyService(): SOC2TrustService {
    return {
      name: "privacy",
      description: "Notice, consent, access, disclosure, and quality of personal information",
      score: 74,
      status: "needs_improvement",
      lastAssessment: "2026-03-01T11:00:00.000Z",
      criteria: [
        {
          id: "P1.1",
          description: "Notice and communication",
          category: "Notice",
          status: "implemented",
          evidence: ["privacy_policy_v2.pdf"],
          notes: "Privacy notice published and provided at data collection points",
        },
        {
          id: "P2.1",
          description: "Choice and consent",
          category: "Consent",
          status: "partial",
          evidence: ["consent_management_audit.pdf"],
          notes: "Consent obtained but withdrawal mechanism not fully automated",
        },
        {
          id: "P3.1",
          description: "Collection and use",
          category: "Collection",
          status: "implemented",
          evidence: ["data_inventory.xlsx"],
          notes: "Data inventory maintained; purpose limitation enforced",
        },
        {
          id: "P4.1",
          description: "Access and correction",
          category: "Access",
          status: "partial",
          evidence: [],
          notes: "DSAR process exists but average response is 12 days (target: 7)",
        },
        {
          id: "P5.1",
          description: "Disclosure and sharing",
          category: "Disclosure",
          status: "implemented",
          evidence: ["third_party_register.pdf"],
          notes: "Data sharing agreements with all third parties; DPAs in place",
        },
        {
          id: "P6.1",
          description: "Quality and security",
          category: "Quality",
          status: "partial",
          evidence: ["data_quality_report.pdf"],
          notes: "Data quality checks run monthly; accuracy issues identified in legacy systems",
        },
      ],
    }
  }

  private initializeTrustServices(tenantId: string): SOC2TrustService[] {
    const services = [
      this.buildSecurityService(),
      this.buildAvailabilityService(),
      this.buildProcessingIntegrityService(),
      this.buildConfidentialityService(),
      this.buildPrivacyService(),
    ]
    this.trustServices.set(tenantId, services)
    return services
  }

  private getOrCreateServices(tenantId: string): SOC2TrustService[] {
    const existing = this.trustServices.get(tenantId)
    if (existing) return existing
    return this.initializeTrustServices(tenantId)
  }

  async getTrustServices(tenantId: string): Promise<SOC2TrustService[]> {
    return this.getOrCreateServices(tenantId)
  }

  async getTrustService(tenantId: string, serviceName: string): Promise<SOC2TrustService | null> {
    const services = this.getOrCreateServices(tenantId)
    return services.find((s) => s.name === serviceName) ?? null
  }

  async getReadinessSummary(tenantId: string) {
    const services = this.getOrCreateServices(tenantId)
    const overallScore = Math.round(services.reduce((sum, s) => sum + s.score, 0) / services.length)
    const overallStatus =
      overallScore >= 80 ? "compliant" : overallScore >= 60 ? "needs_improvement" : "non_compliant"

    return {
      tenantId,
      overallScore,
      overallStatus,
      trustServices: services.map((s) => ({
        name: s.name,
        score: s.score,
        status: s.status,
        criteriaCount: s.criteria.length,
        implemented: s.criteria.filter((c) => c.status === "implemented").length,
        partial: s.criteria.filter((c) => c.status === "partial").length,
        missing: s.criteria.filter((c) => c.status === "missing").length,
      })),
      generatedAt: new Date().toISOString(),
    }
  }

  async triggerAudit(tenantId: string): Promise<SOC2AuditReport> {
    const services = this.getOrCreateServices(tenantId)
    const overallScore = Math.round(services.reduce((sum, s) => sum + s.score, 0) / services.length)
    const overallStatus =
      overallScore >= 80 ? "compliant" : overallScore >= 60 ? "needs_improvement" : "non_compliant"

    const gaps: { service: string; criteria: string[] }[] = []
    const remediation: { priority: "high" | "medium" | "low"; action: string; dueDate: string }[] = []

    for (const service of services) {
      const missingCriteria = service.criteria
        .filter((c) => c.status === "missing" || c.status === "partial")
        .map((c) => c.id)
      if (missingCriteria.length > 0) {
        gaps.push({ service: service.name, criteria: missingCriteria })
        missingCriteria.forEach((cId) => {
          remediation.push({
            priority: "high",
            action: `Address ${cId} in ${service.name}: implement controls and collect evidence`,
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          })
        })
      }
    }

    remediation.push(
      {
        priority: "medium",
        action: "Update SOC2 evidence repository with latest artifacts",
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      },
      {
        priority: "medium",
        action: "Conduct SOC2 readiness walkthrough with auditor",
        dueDate: new Date(Date.now() + 45 * 86400000).toISOString(),
      },
      {
        priority: "low",
        action: "Review all trust service descriptions for accuracy",
        dueDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      },
    )

    return {
      tenantId,
      overallScore,
      overallStatus,
      trustServices: services,
      gaps,
      remediation,
      generatedAt: new Date().toISOString(),
    }
  }

  async getEvidenceStatus(tenantId: string): Promise<EvidenceItem[]> {
    const existing = this.evidenceStore.get(tenantId)
    if (existing) return existing

    const evidence: EvidenceItem[] = [
      {
        id: "EVD-001",
        control: "CC6.1",
        description: "Access control policy document",
        collected: true,
        collectedAt: "2026-05-10T10:00:00.000Z",
        collectedBy: "juan.perez@consultingos.com",
        url: "s3://evidence/cc6.1/policy_v5.pdf",
        expiresAt: "2027-05-10T10:00:00.000Z",
      },
      {
        id: "EVD-002",
        control: "CC6.2",
        description: "User provisioning workflow documentation",
        collected: true,
        collectedAt: "2026-04-15T09:00:00.000Z",
        collectedBy: "maria.garcia@consultingos.com",
        url: "s3://evidence/cc6.2/provisioning_workflow.pdf",
        expiresAt: "2027-04-15T09:00:00.000Z",
      },
      {
        id: "EVD-003",
        control: "CC6.5",
        description: "Vulnerability scan results",
        collected: true,
        collectedAt: "2026-06-01T14:00:00.000Z",
        collectedBy: "carlos.lopez@consultingos.com",
        url: "s3://evidence/cc6.5/nessus_scan_2026_06.pdf",
        expiresAt: "2026-07-01T14:00:00.000Z",
      },
      {
        id: "EVD-004",
        control: "CC7.2",
        description: "Incident response plan",
        collected: true,
        collectedAt: "2026-03-20T11:00:00.000Z",
        collectedBy: "ana.rodriguez@consultingos.com",
        url: "s3://evidence/cc7.2/ir_plan_v4.pdf",
        expiresAt: "2027-03-20T11:00:00.000Z",
      },
      {
        id: "EVD-005",
        control: "A1.3",
        description: "Disaster recovery plan",
        collected: true,
        collectedAt: "2026-05-15T08:00:00.000Z",
        collectedBy: "pedro.martinez@consultingos.com",
        url: "s3://evidence/a1.3/drp_2026_v3.pdf",
        expiresAt: "2027-05-15T08:00:00.000Z",
      },
      {
        id: "EVD-006",
        control: "A1.4",
        description: "BCP workshop attendance records",
        collected: false,
      },
      {
        id: "EVD-007",
        control: "PI1.3",
        description: "Error handling procedure documentation",
        collected: false,
      },
      {
        id: "EVD-008",
        control: "C1.4",
        description: "Data masking implementation report",
        collected: false,
      },
      {
        id: "EVD-009",
        control: "P2.1",
        description: "Consent management system audit",
        collected: true,
        collectedAt: "2026-02-28T16:00:00.000Z",
        collectedBy: "laura.sanchez@consultingos.com",
        url: "s3://evidence/p2.1/consent_audit.pdf",
        expiresAt: "2027-02-28T16:00:00.000Z",
      },
      {
        id: "EVD-010",
        control: "C1.2",
        description: "Encryption audit report",
        collected: true,
        collectedAt: "2026-06-10T09:00:00.000Z",
        collectedBy: "juan.perez@consultingos.com",
        url: "s3://evidence/c1.2/encryption_audit.pdf",
        expiresAt: "2027-06-10T09:00:00.000Z",
      },
    ]

    this.evidenceStore.set(tenantId, evidence)
    return evidence
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async checkEvidenceHealth() {
    this.logger.log("Running SOC2 evidence health check...")
    const tenants = ["tenant_default", "tenant_demo"]

    for (const tenantId of tenants) {
      try {
        const evidence = await this.getEvidenceStatus(tenantId)
        const expired = evidence.filter(
          (e) => e.expiresAt && new Date(e.expiresAt) < new Date(),
        )
        const missing = evidence.filter((e) => !e.collected)

        if (expired.length > 0) {
          this.logger.warn(`[${tenantId}] ${expired.length} evidence items expired`)
        }
        if (missing.length > 0) {
          this.logger.warn(`[${tenantId}] ${missing.length} evidence items not yet collected`)
        }
        this.logger.log(
          `[${tenantId}] Evidence health check complete: ${evidence.length} total, ${expired.length} expired, ${missing.length} missing`,
        )
      } catch (error) {
        this.logger.error(
          `Evidence health check failed for ${tenantId}: ${(error as Error).message}`,
        )
      }
    }
  }
}
