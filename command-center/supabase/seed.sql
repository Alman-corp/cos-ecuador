-- ============================================================
-- SEED DATA — Due Diligence Demo
-- ============================================================
-- Ejecutar después de aplicar migraciones en un entorno de dev.
-- NOTA: Los UUIDs son fijos para que las relaciones sean
-- deterministas entre ejecuciones.
-- ============================================================

-- 1. COMPANY (tenant)
insert into public.companies (id, name, slug, logo_url)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Infinity Capital Corp',
  'infinity-capital',
  'https://via.placeholder.com/200'
)
on conflict (id) do nothing;

-- 2. USUARIOS (requiere auth.users existente — estos son IDs de ejemplo)
-- NOTA: En un entorno real, crear primero los usuarios en auth.users
-- y luego ejecutar este seed. El trigger on_auth_user_created insertará
-- los profiles automáticamente. Estos inserts son de respaldo.
insert into public.profiles (id, company_id, full_name, role)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Ana López',
    'analyst'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Carlos Ruiz',
    'admin'
  )
on conflict (id) do nothing;

-- 3. DD ENGAGEMENTS (3 estados distintos)
insert into public.dd_engagements (id, company_id, user_id, company_name, industry, fiscal_year, currency, description, scope, status)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'TechStartup S.A.',
    'technology',
    2025,
    'USD',
    'Due diligence financiero para ronda Serie A. Evaluación de estados financieros, métricas de crecimiento y proyecciones.',
    '{financial,legal,tax,operational}',
    'draft'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'GreenEnergy Corp',
    'energy',
    2024,
    'USD',
    'Due diligence para adquisición de activos renovables. Revisión de contratos PPA, estructura de deuda y compliance ambiental.',
    '{financial,legal,environmental}',
    'in_progress'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'HealthTech Innovations',
    'healthcare',
    2024,
    'EUR',
    'Due diligence completado para fusión con grupo hospitalario. Todos los hallazgos documentados y aprobados.',
    '{financial,legal,regulatory,it}',
    'completed'
  )
on conflict (id) do nothing;

-- 4. DD REPORTS
insert into public.dd_reports (id, engagement_id, user_id, sections, notes, status, file_url)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    '{executive_summary,financial_analysis,legal_review,risk_assessment}',
    'Pendiente revisión legal final. Los múltiplos de EBITDA están dentro del rango esperado.',
    'generating',
    null
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    '{executive_summary,financial_analysis,legal_review,regulatory_compliance,it_assessment,recommendations}',
    'DD completado sin hallazgos críticos. Se recomienda proceder con la fusión sujeto a los puntos menores detallados en el anexo.',
    'ready',
    'https://storage.example.com/reports/healthtech-dd-final.pdf'
  )
on conflict (id) do nothing;

-- 5. DD DOCUMENTS
insert into public.dd_documents (id, engagement_id, user_id, name, file_type, file_size, file_url, category, status)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Estados Financieros 2024.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    245760,
    'https://storage.example.com/docs/fs-2024.xlsx',
    'financial',
    'ready'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Contratos PPA.pdf',
    'application/pdf',
    1048576,
    'https://storage.example.com/docs/ppa-contracts.pdf',
    'legal',
    'processing'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    'Due Diligence Report - Final.pdf',
    'application/pdf',
    5242880,
    'https://storage.example.com/docs/healthtech-dd-final.pdf',
    'report',
    'ready'
  )
on conflict (id) do nothing;
