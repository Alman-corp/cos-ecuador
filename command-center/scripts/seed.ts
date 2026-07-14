import { createClient } from "@supabase/supabase-js"

const APP_ENV = process.env.APP_ENV || "dev"
const MULTIPLIER: Record<string, number> = { dev: 100, staging: 10, prod: 0 }
const COUNT = MULTIPLIER[APP_ENV] ?? 100

if (COUNT === 0) {
  console.log("APP_ENV=prod — skipping seed")
  process.exit(0)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function upsertCompany(name: string, slug: string) {
  const { data: existing } = await sb
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) return existing

  const { data, error } = await sb
    .from("companies")
    .insert({ name, slug })
    .select("id")
    .single()

  if (error) throw new Error(`Company insert failed: ${error.message}`)
  return data
}

async function upsertUser(
  email: string,
  password: string,
  fullName: string,
  companyId: string,
  role: string
) {
  const { data: existing } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_id: companyId, full_name: fullName, role },
  })

  if (existing?.user) return existing.user

  const { data: list } = await sb.auth.admin.listUsers()
  const found = list?.users.find((u) => u.email === email)
  if (found) {
    const { data: prof } = await sb
      .from("profiles")
      .select("id")
      .eq("id", found.id)
      .single()
    if (prof) return found
  }

  throw new Error(`User not created and not found: ${email}`)
}

async function upsertEngagement(
  companyId: string,
  userId: string,
  companyName: string,
  industry: string,
  fiscalYear: number
) {
  const { data: existing } = await sb
    .from("dd_engagements")
    .select("id")
    .eq("company_name", companyName)
    .eq("company_id", companyId)
    .single()

  if (existing) return existing

  const { data, error } = await sb
    .from("dd_engagements")
    .insert({
      company_id: companyId,
      user_id: userId,
      company_name: companyName,
      industry,
      fiscal_year: fiscalYear,
      currency: "USD",
      status: "draft",
    })
    .select("id")
    .single()

  if (error) throw new Error(`Engagement insert failed: ${error.message}`)
  return data
}

async function upsertDocument(
  companyId: string,
  title: string,
  fileType: string,
  status: string
) {
  const { data: existing } = await sb
    .from("documents")
    .select("id")
    .eq("title", title)
    .eq("company_id", companyId)
    .single()

  if (existing) return existing

  const { data, error } = await sb
    .from("documents")
    .insert({
      company_id: companyId,
      title,
      file_type: fileType,
      file_url: `https://storage.example.com/${title.toLowerCase().replace(/\s+/g, "-")}`,
      status,
    })
    .select("id")
    .single()

  if (error) throw new Error(`Document insert failed: ${error.message}`)
  return data
}

async function main() {
  console.log(`Seeding with count multiplier: ${COUNT} (APP_ENV=${APP_ENV})`)

  // 2 companies
  const companies = await Promise.all([
    upsertCompany("Infinity Capital EC", "infinity-capital"),
    upsertCompany("Consultora Tributaria Cía. Ltda.", "consultora-tributaria"),
  ])
  console.log(`  ✓ ${companies.length} companies`)

  // 5 users (distributed across companies)
  const usersData = [
    { email: "admin@infinity.com", pw: "Test1234!", name: "Admin Infinity", ci: companies[0].id, role: "admin" },
    { email: "analyst@infinity.com", pw: "Test1234!", name: "Ana Analista", ci: companies[0].id, role: "analyst" },
    { email: "viewer@infinity.com", pw: "Test1234!", name: "Victor Viewer", ci: companies[0].id, role: "viewer" },
    { email: "admin@consultora.com", pw: "Test1234!", name: "Admin Consultora", ci: companies[1].id, role: "admin" },
    { email: "auditor@consultora.com", pw: "Test1234!", name: "Alicia Auditora", ci: companies[1].id, role: "auditor" },
  ]

  const users = await Promise.all(
    usersData.map((u) => upsertUser(u.email, u.pw, u.name, u.ci, u.role))
  )
  console.log(`  ✓ ${users.length} users`)

  // 10 clients (dd_engagements)
  const industries = ["Retail", "Manufacturing", "Tech", "Oil & Gas", "Banking", "Agri", "Pharma", "Logistics", "Mining", "Construcción"]
  const engagements = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      upsertEngagement(
        companies[i % 2].id,
        users[i % users.length].id,
        `Cliente ${i + 1} - ${industries[i]}`,
        industries[i],
        2025 - Math.floor(i / 3)
      )
    )
  )
  console.log(`  ✓ ${engagements.length} clients (dd_engagements)`)

  // 20 documents
  const docTypes = ["pdf", "xlsx", "docx", "csv"]
  const docStatuses = ["ready", "pending", "processing", "error"]
  const docTitles = [
    "Balance General", "Estado Resultados", "Flujo Caja", "Notas EEFF",
    "Declaración IVA", "Declaración IR", "ATS Exportación",
    "Contrato Social", "Acta Junta", "Escritura Constitución",
    "Informe Auditoría 2024", "Informe Auditoría 2025",
    "Planilla IESS", "RUC Actualizado", "Certificado Bancario",
    "Política Contable", "Manual de Crédito", "Análisis Vertical",
    "Due Diligence Report", "Carta Representación",
  ]

  const documents = await Promise.all(
    docTitles.map((title, i) =>
      upsertDocument(
        companies[i % 2].id,
        title,
        docTypes[i % docTypes.length],
        docStatuses[i % docStatuses.length]
      )
    )
  )
  console.log(`  ✓ ${documents.length} documents`)

  console.log("\nSeed complete.")
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
