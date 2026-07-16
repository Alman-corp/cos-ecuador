import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CIMDocument, type CIMData } from "@/lib/reports/cim-template"

const CIMRequestSchema = z.object({
  clientId: z.string().uuid(),
  valuationData: z.object({
    enterpriseValue: z.number(),
    equityValue: z.number(),
    dcf: z.object({ wacc: z.number(), terminalGrowth: z.number() }),
    multiples: z.object({ evEbitda: z.number(), peRatio: z.number() }),
  }),
  investmentThesis: z.string(),
  highlights: z.array(z.string()),
  risks: z.array(z.object({ title: z.string(), description: z.string(), severity: z.enum(["critical", "high", "medium", "low"]) })),
  opportunities: z.array(z.object({ title: z.string(), value: z.number(), description: z.string() })),
})

export async function POST(req: NextRequest) {
  const body = CIMRequestSchema.parse(await req.json())
  const companyId = req.headers.get("x-company-id")!

  const client = await prisma.clientCompany.findFirst({
    where: { id: body.clientId, companyId },
    include: { invoices: { take: 5, orderBy: { issueDate: "desc" } } },
  })

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const firm = await prisma.company.findUnique({ where: { id: companyId } })

  const cimData: CIMData = {
    company: {
      name: client.name,
      industry: client.industry ?? "N/A",
      foundedYear: new Date(client.createdAt).getFullYear(),
      country: "CO",
      employees: 50,
      description: `Empresa líder en el sector de ${client.industry ?? "servicios"}.`,
    },
    consultingFirm: { name: firm?.name ?? "COS Consulting" },
    financials: {
      years: (client.invoices ?? []).map((inv) => ({
        year: new Date(inv.issueDate).getFullYear(),
        revenue: inv.total,
        ebitda: inv.total * 0.3,
        netIncome: inv.total * 0.15,
        totalAssets: inv.total * 2,
        totalEquity: inv.total * 1.2,
      })),
    },
    valuation: body.valuationData,
    investment: {
      thesis: body.investmentThesis,
      highlights: body.highlights,
      risks: body.risks,
      opportunities: body.opportunities,
    },
    reference: `CIM-${Date.now()}`,
    preparedAt: new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }),
  }

  return NextResponse.json(cimData)
}
