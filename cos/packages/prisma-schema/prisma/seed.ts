import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

const ID = () => randomUUID()

async function main() {
  console.log("Seeding COS database...")

  // A01 new models
  await prisma.usageRecord.deleteMany()
  await prisma.creditPackage.deleteMany()
  await prisma.creditConsumption.deleteMany()
  await prisma.notificationDelivery.deleteMany()
  await prisma.notificationTemplate.deleteMany()
  await prisma.notificationPreference.deleteMany()
  await prisma.notificationChannel.deleteMany()
  await prisma.deliverableVersion.deleteMany()
  await prisma.deliverableSection.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.deliverableTemplate.deleteMany()
  await prisma.industryReport.deleteMany()
  await prisma.marketTrend.deleteMany()
  await prisma.competitorPrice.deleteMany()
  await prisma.marketSignal.deleteMany()
  await prisma.competitor.deleteMany()
  await prisma.contractAmendment.deleteMany()
  await prisma.contractSignature.deleteMany()
  await prisma.legalDocument.deleteMany()
  await prisma.legalProceeding.deleteMany()
  await prisma.legalObligation.deleteMany()
  await prisma.contractClause.deleteMany()
  await prisma.legalContract.deleteMany()
  await prisma.taxPayment.deleteMany()
  await prisma.taxAnnex.deleteMany()
  await prisma.fiscalObligation.deleteMany()
  await prisma.sriRetention.deleteMany()
  await prisma.taxWithholding.deleteMany()
  await prisma.taxDeclaration.deleteMany()
  // Pre-A01 models
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.workflowStepResult.deleteMany()
  await prisma.workflowInstance.deleteMany()
  await prisma.workflowTrigger.deleteMany()
  await prisma.workflowDefinition.deleteMany()
  await prisma.ruleExecution.deleteMany()
  await prisma.ruleDefinition.deleteMany()
  await prisma.recommendation.deleteMany()
  await prisma.decision.deleteMany()
  await prisma.knowledgeRelation.deleteMany()
  await prisma.knowledgeNode.deleteMany()
  await prisma.promptVersion.deleteMany()
  await prisma.promptTemplate.deleteMany()
  await prisma.aiCostLog.deleteMany()
  await prisma.aiTrace.deleteMany()
  await prisma.aiMessage.deleteMany()
  await prisma.aiConversation.deleteMany()
  await prisma.aiAgent.deleteMany()
  await prisma.keyResult.deleteMany()
  await prisma.clientObjective.deleteMany()
  await prisma.clientIssue.deleteMany()
  await prisma.meetingAgreement.deleteMany()
  await prisma.clientMeetingAttendee.deleteMany()
  await prisma.clientMeeting.deleteMany()
  await prisma.clientInteraction.deleteMany()
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.kpiValue.deleteMany()
  await prisma.kpiDefinition.deleteMany()
  await prisma.ratioValue.deleteMany()
  await prisma.ratioDefinition.deleteMany()
  await prisma.financialStatement.deleteMany()
  await prisma.documentChunk.deleteMany()
  await prisma.documentVersion.deleteMany()
  await prisma.document.deleteMany()
  await prisma.projectRisk.deleteMany()
  await prisma.taskDependency.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMilestone.deleteMany()
  await prisma.project.deleteMany()
  await prisma.clientContractVersion.deleteMany()
  await prisma.clientContract.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.clientShareholder.deleteMany()
  await prisma.clientLegalRep.deleteMany()
  await prisma.clientContact.deleteMany()
  await prisma.client.deleteMany()
  await prisma.leadActivity.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.department.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.domainEvent.deleteMany()
  await prisma.configEntry.deleteMany()
  await prisma.featureFlag.deleteMany()
  await prisma.pluginInstallation.deleteMany()
  await prisma.plugin.deleteMany()
  await prisma.integrationSyncJob.deleteMany()
  await prisma.integrationWebhook.deleteMany()
  await prisma.integrationConnection.deleteMany()
  await prisma.job.deleteMany()
  await prisma.billingInvoice.deleteMany()
  await prisma.billingSubscription.deleteMany()
  await prisma.billingPlan.deleteMany()
  await prisma.company.deleteMany()
  console.log("  Cleared existing data")

  // Companies
  const companies = [
    { name: "Exportadora Guayaquil S.A.", slug: "exportadora-gye", taxId: "1790012345001", email: "info@exportadoragye.com", phone: "+593 4 259 8000", country: "EC" },
    { name: "Corporación Financiera Quito", slug: "corp-financiera-quito", taxId: "1790012345002", email: "contacto@corpfinquito.com", phone: "+593 2 299 4000", country: "EC" },
    { name: "Grupo Logístico del Pacífico", slug: "grupo-logistico-pacifico", taxId: "1790012345003", email: "ops@grupologistico.com", phone: "+593 4 372 1000", country: "EC" },
  ]
  const companyIds = companies.map(() => ID())
  const branchIds = companies.map(() => [ID(), ID()])
  const deptIds = companies.map(() => [ID(), ID(), ID(), ID()])
  const roleIds = companies.map(() => [ID(), ID(), ID(), ID()])
  const userIds = companies.map(() => [ID(), ID(), ID(), ID()])

  for (let c = 0; c < companies.length; c++) {
    const comp = companies[c]
    const company = await prisma.company.create({
      data: {
        id: companyIds[c],
        name: comp.name,
        slug: comp.slug,
        taxId: comp.taxId,
        email: comp.email,
        phone: comp.phone,
        country: comp.country,
      },
    })

    await prisma.companySettings.create({
      data: { companyId: company.id, defaultCurrency: "USD", timezone: "America/Guayaquil" },
    })

    await prisma.branch.createMany({
      data: [
        { id: branchIds[c][0], companyId: company.id, name: "Matriz", city: c === 0 ? "Guayaquil" : c === 1 ? "Quito" : "Guayaquil", isHeadquarters: true },
        { id: branchIds[c][1], companyId: company.id, name: "Oficina Secundaria", city: c === 0 ? "Quito" : c === 1 ? "Guayaquil" : "Manta", isHeadquarters: false },
      ],
    })

    await prisma.department.createMany({
      data: [
        { id: deptIds[c][0], companyId: company.id, branchId: branchIds[c][0], name: "Finanzas" },
        { id: deptIds[c][1], companyId: company.id, branchId: branchIds[c][0], name: "Tributario" },
        { id: deptIds[c][2], companyId: company.id, branchId: branchIds[c][0], name: "Legal" },
        { id: deptIds[c][3], companyId: company.id, branchId: branchIds[c][1], name: "Operaciones" },
      ],
    })

    const roleNames = ["admin", "director", "consultant", "viewer"]
    const rolePerms: Record<string, string[]> = {
      admin: ["*"],
      director: ["clients:read", "clients:write", "projects:read", "projects:write", "reports:read", "team:read", "finance:read"],
      consultant: ["clients:read", "clients:write", "projects:read", "projects:write", "documents:read", "documents:write"],
      viewer: ["clients:read", "projects:read", "reports:read", "documents:read"],
    }
    for (let r = 0; r < roleNames.length; r++) {
      await prisma.role.create({
        data: {
          id: roleIds[c][r],
          companyId: company.id,
          name: roleNames[r],
          isSystem: true,
          permissions: rolePerms[roleNames[r]],
        },
      })
    }

    const users = [
      { email: `carlos${c + 1}@consultora.com`, firstName: "Carlos", lastName: "Alman", deptIdx: 0, roleIdx: 0 },
      { email: `ana${c + 1}@consultora.com`, firstName: "Ana", lastName: "Martínez", deptIdx: 1, roleIdx: 2 },
      { email: `pedro${c + 1}@consultora.com`, firstName: "Pedro", lastName: "Gómez", deptIdx: 2, roleIdx: 2 },
      { email: `maria${c + 1}@consultora.com`, firstName: "María", lastName: "López", deptIdx: 3, roleIdx: 1 },
    ]
    for (let u = 0; u < users.length; u++) {
      const usr = users[u]
      await prisma.user.create({
        data: {
          id: userIds[c][u],
          email: usr.email,
          firstName: usr.firstName,
          lastName: usr.lastName,
          companyId: company.id,
          branchId: branchIds[c][usr.deptIdx <= 1 ? 0 : 1],
          departmentId: deptIds[c][usr.deptIdx],
          position: usr.roleIdx === 0 ? "CEO" : usr.roleIdx === 1 ? "Director" : "Consultor Senior",
        },
      })
      await prisma.userRole.create({
        data: { userId: userIds[c][u], roleId: roleIds[c][usr.roleIdx] },
      })
    }
  }

  console.log(`  Companies: ${companies.length} (${companies.map(c => c.name).join(", ")})`)
  console.log(`  Users: ${userIds.flat().length}`)

  // Clients per company
  const clientNames = [
    "Corporación Comercial del Pacífico Cía. Ltda.", "Industrias Alimenticias Ecuador S.A.",
    "Constructora del Sur S.A.", "Servicios Logísticos Integrales Cía. Ltda.",
    "Tecnología Avanzada del Ecuador S.A.", "Agroexportadora Banano Verde Cía. Ltda.",
    "Farmacéutica Ecuatoriana S.A.", "Minera Andina del Ecuador S.A.",
    "Hoteles y Resorts del Pacífico Cía. Ltda.", "Transportes Pesados del Ecuador S.A.",
    "Energía Renovable Ecuador S.A.", "Telecomunicaciones del Sur Cía. Ltda.",
    "Seguros y Reaseguros del Ecuador S.A.", "Inmobiliaria Desarrollo Urbano Cía. Ltda.",
    "Pesquera Industrial del Pacífico S.A.", "Laboratorios Químicos Ecuador S.A.",
    "Automotriz del Ecuador S.A.", "Acero y Metales Industriales Cía. Ltda.",
    "Plásticos y Empaques Ecuador S.A.", "Consultoría Estratégica Empresarial Cía. Ltda.",
  ]
  const clientCount = [8, 7, 5]
  const allClients: string[] = []
  for (let c = 0; c < companies.length; c++) {
    const startIdx = clientCount.slice(0, c).reduce((a, b) => a + b, 0)
    for (let i = 0; i < clientCount[c]; i++) {
      const idx = startIdx + i
      const clientId = ID()
      allClients.push(clientId)
      await prisma.client.create({
        data: {
          id: clientId,
          companyId: companyIds[c],
          name: clientNames[idx],
          industry: ["comercio", "manufactura", "construcción", "servicios", "tecnología"][i % 5],
          segment: i % 3 === 0 ? "corporate" : "pyme",
          status: "active",
          score: 50 + Math.floor(Math.random() * 50),
          email: `contacto@cliente${idx + 1}.com`,
          phone: `+593 9 ${String(9000000 + idx * 100).padStart(7, "0")}`,
        },
      })

      await prisma.clientContact.create({
        data: {
          clientId,
          firstName: ["Juan", "María", "Roberto", "Carmen", "Diego"][i % 5],
          lastName: ["Pérez", "García", "Rodríguez", "López", "Martínez"][i % 5],
          email: `contacto@cliente${idx + 1}.com`,
          position: ["CFO", "CEO", "Gerente General", "Directora Financiera", "COO"][i % 5],
          isPrimary: true,
        },
      })
    }
  }
  console.log(`  Clients: ${allClients.length}`)

  // Documents per client
  let docCount = 0
  for (const clientId of allClients) {
    const docTypes = ["BALANCE_SHEET", "INCOME_STATEMENT", "CASH_FLOW", "TAX_RETURN", "CONTRACT", "REPORT", "INVOICE", "OTHER"]
    const numDocs = 2 + Math.floor(Math.random() * 4)
    for (let d = 0; d < numDocs; d++) {
      await prisma.document.create({
        data: {
          id: ID(),
          companyId: companyIds[Math.floor(Math.random() * companies.length)],
          clientId,
          title: `Documento ${docTypes[d % docTypes.length]} ${2024 + Math.floor(d / 2)}`,
          documentType: docTypes[d % docTypes.length],
          fileUrl: `/documents/${clientId}/${docTypes[d % docTypes.length]}_${d}.pdf`,
          fileSize: 10000 + Math.floor(Math.random() * 500000),
          status: d % 5 === 0 ? "pending" : "processed",
          uploadedBy: ID(),
        },
      })
      docCount++
    }
  }
  console.log(`  Documents: ${docCount}`)

  // Financial statements for some clients
  let fsCount = 0
  for (let i = 0; i < Math.min(allClients.length, 10); i++) {
    const clientId = allClients[i]
    const periods = [
      { start: new Date("2024-01-01"), end: new Date("2024-12-31") },
      { start: new Date("2025-01-01"), end: new Date("2025-12-31") },
    ]
    for (const period of periods) {
      await prisma.financialStatement.create({
        data: {
          id: ID(),
          companyId: companyIds[0],
          clientId,
          periodStart: period.start,
          periodEnd: period.end,
          statementType: "balance_sheet",
          data: {
            current_assets: 500000 + Math.floor(Math.random() * 2000000),
            cash: 100000 + Math.floor(Math.random() * 500000),
            accounts_receivable: 200000 + Math.floor(Math.random() * 500000),
            inventory: 100000 + Math.floor(Math.random() * 500000),
            total_assets: 1000000 + Math.floor(Math.random() * 5000000),
            current_liabilities: 300000 + Math.floor(Math.random() * 1000000),
            long_term_debt: 500000 + Math.floor(Math.random() * 2000000),
            equity: 500000 + Math.floor(Math.random() * 3000000),
            revenue: 800000 + Math.floor(Math.random() * 3000000),
            cogs: 400000 + Math.floor(Math.random() * 1500000),
            gross_profit: 300000 + Math.floor(Math.random() * 1500000),
            ebitda: 100000 + Math.floor(Math.random() * 800000),
            net_income: 50000 + Math.floor(Math.random() * 400000),
          },
          createdBy: userIds[0][0],
        },
      })
      fsCount++
    }
  }
  console.log(`  Financial Statements: ${fsCount}`)

  // Workflow definitions
  for (let c = 0; c < companies.length; c++) {
    const wfTemplates = [
      { name: "Onboarding de Cliente", category: "onboarding", steps: [{ key: "welcome", type: "notification" }, { key: "data_collection", type: "form" }, { key: "review", type: "approval" }] },
      { name: "Auditoría Financiera", category: "audit", steps: [{ key: "request_docs", type: "notification" }, { key: "analyze", type: "task" }, { key: "report", type: "document" }] },
      { name: "Aprobación de Crédito", category: "credit", steps: [{ key: "evaluate", type: "task" }, { key: "committee", type: "approval" }, { key: "notify", type: "notification" }] },
    ]
    for (const tmpl of wfTemplates) {
      await prisma.workflowDefinition.create({
        data: {
          id: ID(),
          companyId: companyIds[c],
          name: tmpl.name,
          category: tmpl.category,
          steps: tmpl.steps,
          createdBy: userIds[c][0],
        },
      })
    }
  }
  console.log(`  Workflow Definitions: ${3 * companies.length}`)

  // Rules
  for (let c = 0; c < companies.length; c++) {
    const rules = [
      { name: "Alerta de Liquidez Baja", event: "financial_statement.created", conditions: [{ field: "current_ratio", operator: "lt", value: 1.2 }], actions: [{ type: "notify", config: { channel: "slack", role: "director" } }] },
      { name: "Score Alto → Prioridad", event: "client.updated", conditions: [{ field: "score", operator: "gte", value: 80 }], actions: [{ type: "assign_priority", config: { priority: "high" } }] },
    ]
    for (const rule of rules) {
      await prisma.ruleDefinition.create({
        data: {
          id: ID(),
          companyId: companyIds[c],
          name: rule.name,
          event: rule.event,
          conditions: rule.conditions,
          logicOp: "AND",
          actions: rule.actions,
          createdBy: userIds[c][0],
        },
      })
    }
  }
  console.log(`  Rule Definitions: ${2 * companies.length}`)

  // AI conversations
  for (let c = 0; c < companies.length; c++) {
    const agent = await prisma.aiAgent.create({
      data: {
        id: ID(),
        companyId: companyIds[c],
        name: "Analista Financiero",
        agentType: "financial_analyst",
        model: "gpt-4",
        config: { temperature: 0.3, maxTokens: 4096 },
        createdBy: userIds[c][0],
      },
    })

    for (let u = 0; u < 2; u++) {
      const convId = ID()
      await prisma.aiConversation.create({
        data: {
          id: convId,
          companyId: companyIds[c],
          agentId: agent.id,
          userId: userIds[c][u],
          title: `Análisis de estados financieros Q${u + 1}`,
          totalTokens: 500 + Math.floor(Math.random() * 2000),
          totalCost: (0.005 + Math.random() * 0.02).toFixed(6),
        },
      })
      await prisma.aiMessage.createMany({
        data: [
          { id: ID(), conversationId: convId, role: "user", content: "Analiza el ratio de liquidez de la compañía.", tokens: 15, cost: 0.0003 },
          { id: ID(), conversationId: convId, role: "assistant", content: "El ratio de liquidez actual es de 1.45, lo que indica una posición saludable...", tokens: 250, cost: 0.005 },
        ],
      })
    }
  }
  console.log(`  AI Conversations: ${2 * companies.length}`)

  // Billing plans
  await prisma.billingPlan.createMany({
    data: [
      { id: ID(), name: "Free", slug: "free", priceMonthly: 0, features: ["1 usuario", "5 clientes", "100 MB almacenamiento", "50 créditos IA"], limits: { maxUsers: 1, maxClients: 5, maxStorageMb: 100, maxAiCredits: 50 } },
      { id: ID(), name: "Starter", slug: "starter", priceMonthly: 497, features: ["3 usuarios", "50 clientes", "5 GB almacenamiento", "500 créditos IA", "Workflows básicos"], limits: { maxUsers: 3, maxClients: 50, maxStorageMb: 5000, maxAiCredits: 500 } },
      { id: ID(), name: "Professional", slug: "professional", priceMonthly: 1297, features: ["10 usuarios", "Clientes ilimitados", "50 GB almacenamiento", "2500 créditos IA", "Workflows avanzados", "Reglas de negocio", "API"], limits: { maxUsers: 10, maxClients: -1, maxStorageMb: 50000, maxAiCredits: 2500 } },
      { id: ID(), name: "Enterprise", slug: "enterprise", priceMonthly: 3497, features: ["Usuarios ilimitados", "Clientes ilimitados", "500 GB almacenamiento", "Créditos IA ilimitados", "Todo incluido", "Soporte prioritario", "On-premise"], limits: { maxUsers: -1, maxClients: -1, maxStorageMb: 500000, maxAiCredits: -1 } },
    ],
  })
  console.log("  Billing Plans: 4")

  // Domain events
  for (let c = 0; c < companies.length; c++) {
    await prisma.domainEvent.createMany({
      data: [
        { id: ID(), companyId: companyIds[c], aggregateId: ID(), aggregateType: "company", eventType: "company.created", data: { companyId: companyIds[c] } },
        { id: ID(), companyId: companyIds[c], aggregateId: userIds[c][0], aggregateType: "user", eventType: "user.created", data: { userId: userIds[c][0] } },
      ],
    })
  }
  console.log(`  Domain Events: ${2 * companies.length}`)

  // Audit logs
  for (let c = 0; c < companies.length; c++) {
    await prisma.auditLog.createMany({
      data: [
        { id: ID(), companyId: companyIds[c], userId: userIds[c][0], action: "SEED_INIT", entity: "seed", entityId: "init-001" },
        { id: ID(), companyId: companyIds[c], userId: userIds[c][0], action: "COMPANY_CREATED", entity: "company", entityId: companyIds[c] },
        { id: ID(), companyId: companyIds[c], userId: userIds[c][0], action: "USERS_CREATED", entity: "user", entityId: userIds[c].join(",") },
        { id: ID(), companyId: companyIds[c], userId: userIds[c][1], action: "CLIENT_IMPORTED", entity: "client", entityId: allClients.slice(0, 3).join(",") },
      ],
    })
  }
  console.log(`  Audit Logs: ${4 * companies.length}`)

  // ============================================================
  // EXPANSION: KPI Definitions, IFRS Concepts, Benchmarks
  // ============================================================
  let kpiSeeded = 0, ifrsSeeded = 0, benchSeeded = 0

  try {
    const { kpiCatalog } = await import("../../../apps/web/src/core/knowledge/kpis/catalog")
    const records = kpiCatalog.map((kpi: any) => ({
      id: ID(), companyId: companyIds[0], name: kpi.name,
      description: kpi.description?.slice(0, 500), category: kpi.domain,
      formula: kpi as any, unit: kpi.unit, isSystem: true,
      createdBy: userIds[0][0],
    }))
    await prisma.kpiDefinition.createMany({ data: records })
    kpiSeeded = records.length
    console.log(`  KPI Definitions: ${kpiSeeded} (system catalog)`)
  } catch { console.log(`  KPI Definitions: skipped (import unavailable)`) }

  try {
    const { ifrsConcepts } = await import("../../../apps/web/src/core/knowledge/ifrs/concepts")
    const records = ifrsConcepts.map((c: any) => ({
      id: ID(), companyId: companyIds[0], type: "ifrs_concept",
      title: c.name, description: c.definition?.slice(0, 1000),
      properties: { code: c.code, type: c.type, balance: c.balance, periodType: c.periodType, parentCode: c.parentCode, references: c.references, calculationWeight: c.calculationWeight, isAbstract: c.isAbstract, nillable: c.nillable },
      metadata: { source: "ifrs" }, createdBy: userIds[0][0],
    }))
    await prisma.knowledgeNode.createMany({ data: records })
    ifrsSeeded = records.length
    console.log(`  IFRS Concepts: ${ifrsSeeded}`)
  } catch { console.log(`  IFRS Concepts: skipped (import unavailable)`) }

  try {
    const { industryBenchmarks } = await import("../../../apps/web/src/core/knowledge/benchmarks/data")
    const records = industryBenchmarks.map((b: any) => ({
      id: ID(), companyId: companyIds[0], scope: "benchmark", key: b.industry,
      value: b as any, description: `${b.industry} (${b.industryCode}) — ${b.sampleSize} empresas`,
      isSystem: true, createdBy: userIds[0][0],
    }))
    await prisma.configEntry.createMany({ data: records })
    benchSeeded = records.length
    console.log(`  Industry Benchmarks: ${benchSeeded}`)
  } catch { console.log(`  Industry Benchmarks: skipped (import unavailable)`) }

  // ============================================================
  // A01: TRIBUTARIO SEED
  // ============================================================
  let taxDecCount = 0, taxWithCount = 0, sriCount = 0, fiscalOblCount = 0, taxAnnexCount = 0, taxPayCount = 0
  const mainClients = allClients.slice(0, 8)
  const lastYear = 2025

  // Tax Declarations (IVA mensual + Sociedades anual)
  for (const clientId of mainClients) {
    for (let y = lastYear - 2; y <= lastYear; y++) {
      // IVA monthly
      for (let m = 1; m <= 12; m += 2) {
        const baseTax = 2500 + Math.floor(Math.random() * 8000)
        await prisma.taxDeclaration.create({
          data: {
            id: ID(), companyId: companyIds[0], clientId,
            declarationType: "iva", periodYear: y, periodMonth: m,
            formCode: "104", dueDate: new Date(y, m, 28),
            filedAt: new Date(y, m, 25), totalTax: baseTax,
            totalPaid: baseTax, status: "filed",
            createdBy: userIds[0][0],
          },
        })
        taxDecCount++
      }
      // Sociedades annual
      await prisma.taxDeclaration.create({
        data: {
          id: ID(), companyId: companyIds[0], clientId,
          declarationType: "income", periodYear: y, formCode: "101",
          dueDate: new Date(y + 1, 3, 31), filedAt: new Date(y + 1, 2, 15),
          totalTax: 15000 + Math.floor(Math.random() * 60000),
          totalPaid: 15000 + Math.floor(Math.random() * 60000),
          status: "filed", createdBy: userIds[0][0],
        },
      })
      taxDecCount++
    }
  }
  console.log(`  Tax Declarations: ${taxDecCount}`)

  // Withholdings
  for (const clientId of mainClients.slice(0, 5)) {
    for (let y = lastYear - 1; y <= lastYear; y++) {
      for (let q = 0; q < 3; q++) {
        await prisma.taxWithholding.create({
          data: {
            id: ID(), companyId: companyIds[0], clientId,
            withholdingType: ["renta", "iva"][q % 2],
            certificateNumber: `CERT-${y}-${String(clientId.slice(0, 4)).padEnd(4, "X")}-${q}`,
            beneficiaryName: clientNames[mainClients.indexOf(clientId)],
            grossValue: 5000 + Math.floor(Math.random() * 30000),
            percentage: q % 2 === 0 ? 10 : 30,
            withheldAmount: 500 + Math.floor(Math.random() * 3000),
            fiscalPeriod: `${y}-Q${q + 1}`, issuedAt: new Date(y, q * 3 + 2, 15),
            status: "active", createdBy: userIds[0][0],
          },
        })
        taxWithCount++
      }
    }
  }
  console.log(`  Tax Withholdings: ${taxWithCount}`)

  // SRI Retentions (linked to withholdings)
  for (let c = 0; c < Math.min(taxWithCount, 8); c++) {
    await prisma.sriRetention.create({
      data: {
        id: ID(), companyId: companyIds[0],
        retentionType: c % 2 === 0 ? "renta" : "iva",
        sequential: `001-001-${String(1000000 + c).slice(-9)}`,
        accessKey: `${String(10000000000000000000n + BigInt(c)).slice(-49)}`,
        authorizationDate: new Date(2025, 0, 15 + c),
        issuerName: "COS Consultoria S.A.",
        issuerRuc: "1790012345001",
        beneficiaryName: clientNames[c % clientNames.length],
        beneficiaryRuc: `1790012345${String(100 + c).slice(-3)}`,
        baseAmount: 3000 + Math.floor(Math.random() * 15000),
        percentage: c % 2 === 0 ? 10 : 30,
        value: 300 + Math.floor(Math.random() * 1500),
        fiscalPeriod: `2025-M${(c % 12) + 1}`,
        status: "active", createdAt: new Date(Date.now() - c * 86400000),
      },
    })
    sriCount++
  }
  console.log(`  SRI Retentions: ${sriCount}`)

  // Fiscal Calendar (obligations)
  for (let y = lastYear; y <= lastYear + 1; y++) {
    const obligations = [
      { code: "IVA-MENSUAL", name: "Declaración IVA Mensual", frequency: "monthly" },
      { code: "ATS", name: "Anexo Transaccional Simplificado", frequency: "monthly" },
      { code: "SOC-ANUAL", name: "Declaración Sociedades", frequency: "annual" },
      { code: "REOC", name: "Anexo REOC", frequency: "quarterly" },
      { code: "RENTA-ANT", name: "Anticipo Impuesto Renta", frequency: "annual" },
    ]
    for (const obl of obligations) {
      for (let m = 1; m <= (obl.frequency === "monthly" ? 12 : obl.frequency === "quarterly" ? 4 : 1); m++) {
        const dueD = new Date(y, m * (obl.frequency === "annual" ? 3 : 1), ["IVA-MENSUAL", "ATS"].includes(obl.code) ? 28 : 31)
        await prisma.fiscalObligation.create({
          data: {
            id: ID(), companyId: companyIds[0],
            obligationCode: obl.code, name: obl.name,
            frequency: obl.frequency, periodYear: y,
            periodMonth: obl.frequency === "annual" ? undefined : m,
            dueDate: dueD,
            maxExtensionDate: new Date(dueD.getTime() + 3 * 86400000),
            status: dueD < new Date() ? "completed" : "pending",
            completedAt: dueD < new Date() ? new Date(dueD.getTime() - 86400000 * 3) : undefined,
            createdBy: userIds[0][0],
          },
        })
        fiscalOblCount++
      }
    }
  }
  console.log(`  Fiscal Obligations: ${fiscalOblCount}`)

  // Tax Annexes
  for (let y = lastYear - 1; y <= lastYear; y++) {
    for (let m = 1; m <= 6; m += 3) {
      await prisma.taxAnnex.create({
        data: {
          id: ID(), companyId: companyIds[0],
          annexType: ["ats", "reoc", "dividendo"][m % 3],
          periodYear: y, periodMonth: m, fiscalPeriod: `${y}-M${m}`,
          status: "filed", filedAt: new Date(y, m + 1, 20),
          dueDate: new Date(y, m + 1, 28),
          recordCount: 10 + Math.floor(Math.random() * 100),
          totalValue: 50000 + Math.floor(Math.random() * 200000),
          createdBy: userIds[0][0],
        },
      })
      taxAnnexCount++
    }
  }
  console.log(`  Tax Annexes: ${taxAnnexCount}`)

  // Tax Payments
  for (const clientId of mainClients.slice(0, 6)) {
    for (let y = lastYear - 1; y <= lastYear; y++) {
      await prisma.taxPayment.create({
        data: {
          id: ID(), companyId: companyIds[0], clientId,
          taxType: ["iva", "renta", "retencion"][y % 3],
          periodDescription: `${y}-${["Q1", "Q2", "Q3"][y % 3]}`,
          amount: 3000 + Math.floor(Math.random() * 20000),
          paymentDate: new Date(y, (y % 12) + 1, 15),
          paymentMethod: "transferencia",
          receiptNumber: `REC-${y}-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`,
          createdBy: userIds[0][0],
        },
      })
      taxPayCount++
    }
  }
  console.log(`  Tax Payments: ${taxPayCount}`)

  // ============================================================
  // A01: LEGAL SEED
  // ============================================================
  let legContractCount = 0, clauseCount = 0, legOblCount = 0
  let proceedingCount = 0, sigCount = 0, amendCount = 0

  const contractTemplates = [
    { type: "prestacion_servicios", clauses: ["Objeto", "Alcance", "Honorarios", "Plazos", "Confidencialidad", "Terminación"] },
    { type: "confidencialidad", clauses: ["Definiciones", "Obligaciones", "Excepciones", "Vigencia", "Jurisdicción"] },
    { type: "consultoria", clauses: ["Objeto", "Metodología", "Entregables", "Honorarios", "Propiedad Intelectual", "Confidencialidad", "Resolución"] },
  ]
  for (const clientId of mainClients.slice(0, 6)) {
    const tmpl = contractTemplates[Math.floor(Math.random() * contractTemplates.length)]
    const startDate = new Date(2024, Math.floor(Math.random() * 12), 1)
    const endDate = new Date(startDate.getFullYear() + 1 + Math.floor(Math.random() * 2), startDate.getMonth(), 1)
    const contract = await prisma.legalContract.create({
      data: {
        id: ID(), companyId: companyIds[0], clientId,
        title: `Contrato de ${tmpl.type === "prestacion_servicios" ? "Servicios Profesionales" : tmpl.type === "confidencialidad" ? "Confidencialidad" : "Consultoría"} - ${clientNames[mainClients.indexOf(clientId)].slice(0, 20)}`,
        contractType: tmpl.type,
        status: Math.random() > 0.3 ? "active" : "signed",
        description: `Contrato para servicios de consultoría empresarial`,
        effectiveDate: startDate, expirationDate: endDate,
        autoRenewal: Math.random() > 0.5, noticePeriodDays: 30,
        signedByCompany: true, signedByCounterparty: Math.random() > 0.2,
        signedAt: new Date(startDate.getTime() + 7 * 86400000),
        createdBy: userIds[0][0],
      },
    })
    legContractCount++

    // Clauses
    for (let cl = 0; cl < tmpl.clauses.length; cl++) {
      await prisma.contractClause.create({
        data: {
          id: ID(), contractId: contract.id,
          clauseNumber: cl + 1, title: tmpl.clauses[cl],
          content: `Cláusula ${cl + 1} - ${tmpl.clauses[cl]}. [Descripción detallada de la cláusula de ${tmpl.clauses[cl].toLowerCase()} para el contrato de ${tmpl.type}.]`,
          category: cl < 2 ? "general" : cl < 4 ? "comercial" : "legal",
          isNegotiable: cl > 1,
          createdBy: userIds[0][0],
        },
      })
      clauseCount++
    }

    // Obligations
    const obls = [
      { title: "Presentar informe mensual", type: "reporting", dueDate: new Date(2025, 11, 31) },
      { title: "Renovar póliza de responsabilidad", type: "insurance", dueDate: new Date(2025, 6, 1) },
      { title: "Actualizar datos de contacto", type: "administrative", dueDate: new Date(2025, 3, 1) },
    ]
    for (const obl of obls) {
      await prisma.legalObligation.create({
        data: {
          id: ID(), companyId: companyIds[0], contractId: contract.id, clientId,
          title: obl.title, obligationType: obl.type,
          frequency: "one_time", dueDate: obl.dueDate,
          status: obl.dueDate < new Date() ? "completed" : "pending",
          reminderDays: 15, createdBy: userIds[0][0],
        },
      })
      legOblCount++
    }

    // Signature records
    for (const side of ["company", "counterparty"]) {
      await prisma.contractSignature.create({
        data: {
          id: ID(), contractId: contract.id,
          signerName: side === "company" ? "Carlos Alman" : clientNames[mainClients.indexOf(clientId)],
          signerEmail: side === "company" ? "carlos1@consultora.com" : `contacto@cliente${mainClients.indexOf(clientId) + 1}.com`,
          signerRole: side === "company" ? "CEO" : "Representante Legal",
          signatureType: "electronic",
          signedAt: new Date(startDate.getTime() + (side === "company" ? 7 : 10) * 86400000),
          isCompanySide: side === "company",
          createdAt: new Date(Date.now() - 30 * 86400000),
        },
      })
      sigCount++
    }

    // Amendments
    if (Math.random() > 0.6) {
      await prisma.contractAmendment.create({
        data: {
          id: ID(), contractId: contract.id,
          amendmentNumber: 1, title: "Primera Modificación",
          description: "Actualización de tarifas y alcance",
          effectiveDate: new Date(2025, 0, 1),
          signedAt: new Date(2025, 0, 1),
          createdBy: userIds[0][0],
        },
      })
      amendCount++
    }
  }
  console.log(`  Legal Contracts: ${legContractCount} (${clauseCount} clauses, ${sigCount} signatures, ${amendCount} amendments)`)
  console.log(`  Legal Obligations: ${legOblCount}`)

  // Legal Proceedings
  const proceedings = [
    { type: "laboral", plaintiff: "Exempleado", defendant: clientNames[0] },
    { type: "contractual", plaintiff: clientNames[1], defendant: clientNames[2] },
    { type: "tributario", plaintiff: "SRI", defendant: clientNames[3] },
  ]
  for (let p = 0; p < proceedings.length; p++) {
    const proc = proceedings[p]
    await prisma.legalProceeding.create({
      data: {
        id: ID(), companyId: companyIds[0],
        clientId: p < mainClients.length ? mainClients[p] : mainClients[0],
        title: `Caso ${proc.type} - ${proc.defendant}`,
        proceedingType: proc.type,
        court: "Unidad Judicial", caseNumber: `JU-${2024}-${String(1000 + p)}`,
        plaintiff: proc.plaintiff, defendant: proc.defendant,
        status: p === 2 ? "active" : "resolved",
        startDate: new Date(2024, 0, 15 + p * 30),
        estimatedEndDate: new Date(2025, 6 + p, 1),
        resolvedAt: p < 2 ? new Date(2025, 3 + p * 2, 15) : undefined,
        probability: p === 2 ? 40 : undefined,
        potentialLiability: p === 2 ? 50000 : 0,
        legalCosts: 3000 + p * 2000,
        assignedTo: userIds[0][1],
        createdBy: userIds[0][0],
      },
    })
    proceedingCount++
  }
  console.log(`  Legal Proceedings: ${proceedingCount}`)

  // ============================================================
  // A01: MARKET INTELLIGENCE SEED
  // ============================================================
  let compCount = 0, signalCount = 0, priceCount = 0, trendCount = 0

  const competitors = [
    { name: "Deloitte Ecuador", industry: "consulting", segment: "enterprise", website: "deloitte.com/ec" },
    { name: "PwC Ecuador", industry: "consulting", segment: "enterprise", website: "pwc.com/ec" },
    { name: "KPMG Ecuador", industry: "consulting", segment: "enterprise", website: "kpmg.com/ec" },
    { name: "Ernst & Young Ecuador", industry: "consulting", segment: "enterprise", website: "ey.com/ec" },
    { name: "Grant Thornton Ecuador", industry: "consulting", segment: "mid_market", website: "gt.com/ec" },
  ]
  for (const c of competitors) {
    const comp = await prisma.competitor.create({
      data: {
        id: ID(), companyId: companyIds[0],
        name: c.name, industry: c.industry, segment: c.segment,
        website: c.website, country: "EC",
        marketShare: 5 + Math.floor(Math.random() * 20),
        annualRevenue: 1000000 + Math.floor(Math.random() * 5000000),
        strengths: ["Marca global", "Talento certificado", "Metodologías"],
        weaknesses: ["Costos altos", "Burocracia"],
        createdBy: userIds[0][0],
      },
    })
    compCount++

    // Prices
    for (const svc of ["auditoria", "consultoria", "tax"]) {
      await prisma.competitorPrice.create({
        data: {
          id: ID(), competitorId: comp.id,
          product: c.name, service: svc,
          price: 150 + Math.floor(Math.random() * 350),
          currency: "USD", billingFreq: "hourly",
          effectiveDate: new Date(2025, 0, 1),
          source: "website", confidence: 70 + Math.floor(Math.random() * 20),
          createdBy: userIds[0][0],
        },
      })
      priceCount++
    }
  }
  console.log(`  Competitors: ${compCount} (${priceCount} prices)`)

  // Market Signals
  const compsFromDb = await prisma.competitor.findMany({ take: 5 })
  const signalTypes = ["merger", "regulation", "expansion", "layoff", "partnership"]
  for (let s = 0; s < 10; s++) {
    await prisma.marketSignal.create({
      data: {
        id: ID(), companyId: companyIds[0],
        competitorId: s < compsFromDb.length ? compsFromDb[s].id : undefined,
        signalType: signalTypes[s % signalTypes.length],
        title: `Señal de mercado #${s + 1}: ${["Fusión", "Nueva regulación", "Expansión", "Despidos", "Alianza"][s % 5]}`,
        description: `Descripción de la señal de mercado detectada en el sector de consultoría.`,
        source: "noticias", sourceUrl: `https://ejemplo.com/noticia${s}`,
        relevance: 30 + Math.floor(Math.random() * 70),
        detectedAt: new Date(Date.now() - s * 7 * 86400000),
        createdBy: userIds[0][0],
      },
    })
    signalCount++
  }
  console.log(`  Market Signals: ${signalCount}`)

  // Market Trends
  for (let t = 0; t < 5; t++) {
    await prisma.marketTrend.create({
      data: {
        id: ID(), companyId: companyIds[0],
        trendType: ["technology", "regulation", "economic", "social", "competitive"][t],
        title: ["Adopción de IA en consultoría", "Regulación tributaria digital", "Crecimiento sector servicios", "Trabajo remoto", "Competencia global"][t],
        description: `Tendencia observada en el mercado ecuatoriano de consultoría.`,
        industry: "consulting", region: "LATAM",
        impact: ["high", "medium", "medium", "low", "high"][t],
        direction: ["growing", "growing", "growing", "stable", "growing"][t],
        strength: 0.5 + Math.random() * 0.5,
        source: "industry_report",
        detectedAt: new Date(Date.now() - t * 30 * 86400000),
        createdBy: userIds[0][0],
      },
    })
    trendCount++
  }
  console.log(`  Market Trends: ${trendCount}`)

  // ============================================================
  // A01: DELIVERABLES SEED
  // ============================================================
  let tmplCount = 0, delCount = 0, delSecCount = 0, delVerCount = 0

  // Templates
  const delTemplates = [
    { name: "CIM Completo", type: "cim", sections: ["Resumen Ejecutivo", "Análisis Financiero", "Diagnóstico", "Recomendaciones"] },
    { name: "Informe de Due Diligence", type: "due_diligence", sections: ["Resumen", "Hallazgos", "Riesgos", "Conclusión"] },
    { name: "Plan Estratégico", type: "strategic_plan", sections: ["Análisis FODA", "Objetivos", "Iniciativas", "KPIs"] },
    { name: "Reporte Trimestral", type: "quarterly_report", sections: ["Resultados", "Análisis", "Proyecciones"] },
  ]
  for (const tmpl of delTemplates) {
    await prisma.deliverableTemplate.create({
      data: {
        id: ID(), companyId: companyIds[0],
        name: tmpl.name, deliverableType: tmpl.type,
        description: `Plantilla para ${tmpl.name.toLowerCase()}`,
        structure: tmpl.sections.map((s, i) => ({ sectionNumber: i + 1, title: s })),
        variables: ["cliente_nombre", "fecha", "periodo"],
        isPublic: true, createdBy: userIds[0][0],
      },
    })
    tmplCount++
  }
  console.log(`  Deliverable Templates: ${tmplCount}`)

  // Deliverables (CIMs for main clients)
  const cimTemplates = await prisma.deliverableTemplate.findMany({ take: 2 })
  for (let i = 0; i < Math.min(mainClients.length, 5); i++) {
    const del = await prisma.deliverable.create({
      data: {
        id: ID(), companyId: companyIds[0], clientId: mainClients[i],
        templateId: cimTemplates[i % cimTemplates.length].id, title: `CIM - ${clientNames[i].slice(0, 25)}`,
        deliverableType: "cim", status: i < 3 ? "completed" : "draft",
        description: `Customer Information Memorandum completo para ${clientNames[i].slice(0, 25)}`,
        content: { summary: "Resumen ejecutivo del cliente", financials: { revenue: 1000000, ebitda: 200000 } },
        fileUrl: `/deliverables/cim_${mainClients[i]}.pdf`,
        fileSize: 50000 + Math.floor(Math.random() * 200000),
        generatedBy: userIds[0][2],
        generatedAt: new Date(Date.now() - (5 - i) * 30 * 86400000),
        deliveredAt: i < 3 ? new Date(Date.now() - (5 - i) * 25 * 86400000) : undefined,
        createdBy: userIds[0][0],
      },
    })
    delCount++

    // Sections
    const sections = ["Resumen Ejecutivo", "Análisis Financiero", "Evaluación", "Recomendaciones"]
    for (let s = 0; s < sections.length; s++) {
      await prisma.deliverableSection.create({
        data: {
          id: ID(), deliverableId: del.id,
          sectionNumber: s + 1, title: sections[s],
          content: { text: `Contenido de ${sections[s]} para ${clientNames[i].slice(0, 20)}...`, version: 1 },
          contentType: "markdown", wordCount: 250 + s * 100,
          status: i < 3 ? "completed" : "draft",
          createdBy: userIds[0][2],
        },
      })
      delSecCount++
    }

    // Version
    await prisma.deliverableVersion.create({
      data: {
        id: ID(), deliverableId: del.id,
        version: 1, content: del.content as any,
        fileUrl: `/deliverables/cim_${mainClients[i]}_v1.pdf`,
        fileSize: 50000, changeLog: "Versión inicial",
        createdBy: userIds[0][2],
      },
    })
    delVerCount++
  }
  console.log(`  Deliverables: ${delCount} (${delSecCount} sections, ${delVerCount} versions)`)

  // ============================================================
  // A01: NOTIFICATIONS ENHANCED SEED
  // ============================================================
  let notifChanCount = 0, notifPrefCount = 0, notifTmplCount = 0, notifDelCount = 0

  // Channels
  const channels = [
    { type: "in_app", name: "Notificaciones en App", config: { maxDaily: 50 } },
    { type: "email", name: "Correo Electrónico", config: { smtpHost: "smtp.sendgrid.net" } },
    { type: "slack", name: "Slack", config: { workspace: "cosconsultoria" } },
    { type: "whatsapp", name: "WhatsApp Business", config: { phoneNumber: "+593999000000" } },
  ]
  for (const ch of channels) {
    await prisma.notificationChannel.create({
      data: {
        id: ID(), companyId: companyIds[0],
        channelType: ch.type, name: ch.name,
        config: ch.config, isActive: true,
        priority: ch.type === "in_app" ? 0 : 1,
        lastTestedAt: new Date(), createdBy: userIds[0][0],
      },
    })
    notifChanCount++
  }
  console.log(`  Notification Channels: ${notifChanCount}`)

  // Preferences
  for (const usr of userIds[0]) {
    for (const ch of ["in_app", "email", "slack"]) {
      await prisma.notificationPreference.create({
        data: {
          id: ID(), companyId: companyIds[0], userId: usr,
          channel: ch, notificationType: "all",
          isEnabled: true,
          quietHoursStart: ch === "slack" ? 22 : undefined,
          quietHoursEnd: ch === "slack" ? 7 : undefined,
        },
      })
      notifPrefCount++
    }
  }
  console.log(`  Notification Preferences: ${notifPrefCount}`)

  // Templates
  const notifTemplates = [
    { type: "client_added", channel: "in_app", subject: "Nuevo cliente agregado", body: "El cliente {{client_name}} ha sido agregado al sistema." },
    { type: "task_assigned", channel: "in_app", subject: "Tarea asignada", body: "Se te ha asignado la tarea: {{task_title}}." },
    { type: "project_completed", channel: "email", subject: "Proyecto completado", body: "El proyecto {{project_name}} ha sido completado exitosamente." },
    { type: "deadline_reminder", channel: "slack", subject: "Recordatorio de vencimiento", body: "La obligación {{obligation_name}} vence en {{days_remaining}} días." },
  ]
  for (const tmpl of notifTemplates) {
    await prisma.notificationTemplate.create({
      data: {
        id: ID(), companyId: companyIds[0],
        templateType: tmpl.type, channel: tmpl.channel,
        name: `Template ${tmpl.type}`, subject: tmpl.subject,
        body: tmpl.body, variables: ["client_name", "task_title", "project_name"],
        isSystem: true, createdBy: userIds[0][0],
      },
    })
    notifTmplCount++
  }
  console.log(`  Notification Templates: ${notifTmplCount}`)

  // Delivery log for existing notifications
  const existingNotifs = await prisma.notification.findMany({ take: 10 })
  for (const n of existingNotifs) {
    await prisma.notificationDelivery.create({
      data: {
        id: ID(), notificationId: n.id,
        companyId: n.companyId, userId: n.userId,
        channel: n.channel, status: "delivered",
        sentAt: new Date(n.createdAt.getTime() + 1000),
        deliveredAt: new Date(n.createdAt.getTime() + 3000),
        externalId: `ext-${n.id.slice(0, 8)}`,
        createdAt: n.createdAt,
      },
    })
    notifDelCount++
  }
  console.log(`  Notification Deliveries: ${notifDelCount}`)

  // ============================================================
  // A01: BILLING ENHANCED SEED
  // ============================================================
  let creditConsCount = 0, creditPkgCount = 0, usageCount = 0

  // Credit Packages
  const creditPackages = [
    { name: "Créditos IA 500", creditType: "ai", credits: 500, price: 49.99 },
    { name: "Créditos IA 2000", creditType: "ai", credits: 2000, price: 179.99 },
    { name: "Análisis 10", creditType: "analysis", credits: 10, price: 99.99 },
    { name: "Due Diligence 5", creditType: "due_diligence", credits: 5, price: 499.99 },
  ]
  for (const pkg of creditPackages) {
    await prisma.creditPackage.create({
      data: {
        id: ID(), companyId: companyIds[0],
        name: pkg.name, creditType: pkg.creditType,
        credits: pkg.credits, price: pkg.price,
        isActive: true, validDays: 365,
      },
    })
    creditPkgCount++
  }
  console.log(`  Credit Packages: ${creditPkgCount}`)

  // Credit Consumption
  for (let i = 0; i < 15; i++) {
    const types = ["ai", "ai", "ai", "analysis", "due_diligence"]
    const refTypes = ["conversation", "conversation", "analysis", "document", "report"]
    await prisma.creditConsumption.create({
      data: {
        id: ID(), companyId: companyIds[0],
        creditType: types[i % types.length],
        amount: types[i % types.length] === "ai" ? (Math.floor(Math.random() * 10) + 1) / 1000 : 1,
        unit: types[i % types.length] === "ai" ? "tokens" : "credits",
        balanceBefore: 100 - i * 5,
        balanceAfter: 100 - (i + 1) * 5,
        source: "api", referenceId: ID(), referenceType: refTypes[i % refTypes.length],
        metadata: { model: "gpt-4", tokens: Math.floor(Math.random() * 500) },
        createdBy: userIds[0][0],
      },
    })
    creditConsCount++
  }
  console.log(`  Credit Consumptions: ${creditConsCount}`)

  // Usage Records
  const usageTypes = ["api_call", "document_process", "analysis_run", "export", "login"]
  for (let i = 0; i < 20; i++) {
    const ut = usageTypes[i % usageTypes.length]
    const clientId = i < mainClients.length ? mainClients[i] : undefined
    await prisma.usageRecord.create({
      data: {
        id: ID(), companyId: companyIds[0], clientId,
        usageType: ut,
        quantity: ut === "login" ? 1 : Math.floor(Math.random() * 50) + 1,
        unit: ut === "login" ? "count" : ut === "api_call" ? "requests" : "operations",
        cost: ut === "login" ? undefined : Math.random() * 0.5,
        recordedAt: new Date(Date.now() - i * 2 * 86400000),
        referenceId: ID(), referenceType: ut,
        metadata: { duration: Math.floor(Math.random() * 5000), success: Math.random() > 0.1 },
        createdBy: userIds[0][0],
      },
    })
    usageCount++
  }
  console.log(`  Usage Records: ${usageCount}`)

  console.log("\nSeed complete!")
  console.log(`  Summary: ${companies.length} empresas · ${userIds.flat().length} usuarios · ${allClients.length} clientes · ${docCount} docs · ${fsCount} EEFF · ${kpiSeeded} KPI · ${ifrsSeeded} IFRS · ${benchSeeded} benchmarks · ${taxDecCount} decl. tributarias · ${taxWithCount} retenciones · ${sriCount} SRI · ${fiscalOblCount} oblig. fiscales · ${taxAnnexCount} anexos · ${taxPayCount} pagos · ${legContractCount} contratos legales · ${legOblCount} oblig. legales · ${proceedingCount} procesos · ${compCount} competidores · ${signalCount} señales · ${trendCount} tendencias · ${tmplCount} plantillas · ${delCount} deliverables · ${notifChanCount} canales · ${notifPrefCount} preferencias · ${notifTmplCount} templates · ${notifDelCount} deliveries · ${creditPkgCount} paq. créditos · ${creditConsCount} consumos · ${usageCount} registros uso`)
  console.log("  Login credentials (placeholder — Supabase auth pending):")
  for (let c = 0; c < companies.length; c++) {
    console.log(`  ${companies[c].name}: carlos${c + 1}@consultora.com / pedro${c + 1}@consultora.com`)
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
