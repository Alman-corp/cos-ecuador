# ADR-0001 — Auth Strategy: Clerk (Fase 0-4) → Keycloak (Fase 5)

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Carlos Alman Vidal (thesis owner), Architect rein, with input from `devops-sre` (compliance) and `nextjs-backend` (integration)
- **Plan task:** [T1.2] Fase 1 — *Clerk setup + connection (o Keycloak si se justifica)*
- **Related plan tasks:** T0.21 (Secret Management), T1.0 (LOPDP Ecuador), T1.3 (Onboarding wizard multi-tenant), T5.x (ISO 27001 cert)
- **Modules affected:** M1 Identidad, M2 Clientes, M13/M14/M15 (the 3 portals)

---

## Context

COS needs authentication and identity from day one of the first paying client (Fase 3, week 19-26). The auth layer must support:

1. **Multi-tenant from the start.** Every JWT must carry `companyId` (the consulting firm that owns the data). Supabase RLS policies read this claim to enforce tenant isolation.
2. **3 portals with different access models.** M13 Portal Cliente (clients see only their data), M14 Portal Consultor (workforce, RBAC-driven), M15 Portal Director (C-level only). Same auth provider, different sessions/claims.
3. **M1 RBAC.** The blueprint already defines `roles`, `permissions`, `role_permissions`, `user_roles` tables (~25 identity tables). The auth provider must integrate cleanly with this.
4. **LOPDP Ecuador (Fase 1, mandatory).** Consent flow at first login, auditable consent receipts, right-to-be-forgotten must propagate to the auth provider. LOPDP Art. 7 and Art. 9 are explicit.
5. **SSO is a future requirement** (per blueprint: *"Usuarios: Profiles, autenticación, 2FA, SSO (Keycloak)"*). Enterprise tier will demand SAML/OIDC against client IdPs.
6. **ISO 27001 certification target Fase 5.** A.9 (Access Control) and A.9.4 (System and Application Access Control) require documented auth, ideally with self-hosted identity for cert auditability.
7. **2FA / MFA** is a blueprint requirement for the Director portal at minimum.
8. **The team is small** (Carlos solo + 1-2 subcontratados in early phases, scaling to 5 in Fase 3). Building auth from scratch is high-risk, slow, and pulls focus from the 10 specialized AI agents that are the actual differentiator.

The plan's buy-vs-build table (Sección 3.3 of `PLAN_MAESTRO_100_PORCIENTO_v2.0.md`) already decided: **Auth/SSO = Buy (Clerk MVP, Keycloak Fase 5) | Commodity, alto riesgo construirlo**.

---

## Decision

We will adopt a **two-phase auth strategy** that maps to the plan's phases:

### Phase A — Clerk (Fase 0 through Fase 4, weeks 1-36)

Use **Clerk** as the managed identity provider for everything in MVP.

- **Hosting:** Clerk's managed service (clerk.com).
- **Auth methods:** Email + password, magic link, Google OAuth, Microsoft OAuth (for enterprise clients in Latam).
- **MFA:** TOTP 2FA enabled by default for M15 Director portal, optional for M14 Consultor, off for M13 Cliente.
- **Sessions:** Short-lived JWT (15 min) + refresh token, validated by the Next.js backend and each NestJS service.
- **Custom claims:** `companyId`, `roles[]`, `portal` (`cliente|consultor|director`).
- **LOPDP integration:** Clerk Organizations map 1:1 to consulting firms. Webhook on `user.created` writes a `consent_record` row. Webhook on `user.deleted` triggers the `right-to-be-forgotten` pipeline that anonymizes PII in our DB.
- **Multi-tenant enforcement:** Supabase RLS policies read `auth.jwt() ->> 'company_id'`. Clerk's session token is mapped to Supabase's JWT via a Clerk → Supabase JWT template.
- **Cost:** Free tier up to 10K MAU; Pro plan ~$25/mo + $0.02/MAU. Stays well under budget through Fase 4 (< 100 clients).

### Phase B — Keycloak (Fase 5, weeks 37-44, before ISO 27001 cert)

Migrate to a **self-hosted Keycloak** instance for ISO 27001 certification.

- **Why migrate:** ISO 27001 auditors want documented, self-hosted identity with full data-residency control. Clerk managed = third-party processor = extra DPA paperwork and audit surface.
- **Migration scope:** all users, organizations, roles, permissions, sessions, audit logs.
- **Trigger:** the moment we sign the first 5-clientes-pagando contract (>= 5 paying clients), we begin the migration in parallel with Fase 5 work, not before — Keycloak ops overhead isn't justified earlier.
- **No LOPDP regression:** the migration must preserve all consent records and right-to-be-forgotten semantics. LOPDP Art. 9 (data portability) and Art. 18 (right to be forgotten) are non-negotiable.
- **What Clerk gave us that we keep:** all the integration patterns (Next.js middleware, NestJS guards, the JWT claim shape). Keycloak implements the same OIDC contract, so app code barely changes.

---

## Consequences

### Positive

- **Ship in 24h, not 24 weeks.** T1.2 in the plan is budgeted at 24h; building auth from scratch would eat the entire Fase 1 budget and miss the M1-M3 launch window.
- **Multi-tenant works from day 1.** Clerk Organizations + custom claims give us `companyId` in the JWT without writing a session layer.
- **LOPDP consent flow integrates cleanly** via Clerk webhooks. We don't reinvent session management.
- **Enterprise-ready auth methods** (OAuth, MFA, passkeys) come for free. Critical for closing enterprise deals in Latam.
- **Two-phase strategy defers Keycloak ops cost** (~30-40h/year of SRE work) until the business justifies it.
- **Migration path is well-trodden** — Clerk's data export + Keycloak's user federation import are both first-class. No custom ETL.

### Negative

- **Vendor lock-in for 36 weeks.** All session, user, and org logic is shaped by Clerk's API. Migrating to Keycloak in Fase 5 is non-trivial (~80-120h of work).
- **Data residency for LOPDP.** Clerk is hosted in the US (with EU region available). Ecuadorian data crossing borders requires a DPA and an LOPDP-compatible cross-border transfer mechanism (Resolution SPDP-2024-NNN). **Mitigation:** the DPA is part of T1.0b (DPA con proveedores cloud), and we document the cross-border decision in the LOPDP Art. 26 register of international transfers.
- **Clerk as a third-party processor increases ISO 27001 audit surface.** The cert auditor will ask for Clerk's SOC 2 report. Clerk has one. We attach it to the A.15 supplier register. **Mitigation:** captured in the Fase 5 supplier register.
- **Cost scales with MAU.** Pro plan is cheap until ~500 clients. **Mitigation:** at that point, we're already in Keycloak per Phase B.

### Neutral

- **Custom claims live in the JWT template.** When Clerk changes their template format, we update the template (low-frequency event, but worth a CI check).
- **Multi-tenant RBAC needs an extra layer** (M1's `roles`/`permissions` tables still own the fine-grained permissions, even though Clerk owns the auth). The split is correct, but the boundary needs an ADR of its own later (candidate: ADR-0002 RBAC model).

---

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| **Supabase Auth** (we already pay for Supabase) | Lacks first-class Organizations, MFA setup is more manual, OAuth provider list smaller, enterprise SSO not in the free tier. |
| **NextAuth.js / Auth.js self-hosted** | We save the cost but inherit the ops burden: session storage, password hashing, OAuth app management, MFA implementation, account recovery flows. Not worth the 200-300h of building. |
| **Keycloak from Fase 0** | Keycloak is a beast. 4-8 weeks to a stable multi-tenant setup, plus ongoing ops. We don't have that runway. |
| **Build from scratch (custom auth)** | Highest risk, longest path, no upside. Even Stripe, Notion, and Linear started with a hosted provider. |
| **AWS Cognito** | Decent for AWS-native shops, but we're Vercel + Supabase + Fly.io. Adding AWS as a fourth cloud vendor for one service is more friction than value. |
| **Auth0** | Mature but expensive at scale. Same as Clerk in capability, less generous free tier. |

---

## Migration plan (Clerk → Keycloak, Fase 5)

1. **Week 37:** Provision Keycloak cluster (self-hosted on Fly.io or Hetzner, both have EU regions). Configure realm, themes, identity providers.
2. **Week 38:** Set up user federation. Export users + orgs from Clerk, import to Keycloak. Test on a staging tenant.
3. **Week 39:** Wire Next.js middleware to Keycloak (OIDC). Each NestJS service validates Keycloak JWTs.
4. **Week 40:** Cutover. Run Clerk and Keycloak in parallel for 1 week. Read-only traffic to Clerk, all writes to Keycloak.
5. **Week 41:** Decommission Clerk. Archive the data export as required by LOPDP Art. 9 (data portability) and our own retention policy.
6. **Week 42-44:** ISO 27001 A.9 controls get the documented evidence (Keycloak's audit log, our RLS policies, the LOPDP consent trail).

**Total: ~120h of work + devops-sre + architect oversight.** Budgeted in Fase 5 hours.

---

## References

- `COS_BLUEPRINT.md` §3 — M1 Identidad Corporativa, *"Usuarios: Profiles, autenticación, 2FA, SSO (Keycloak)"*
- `PLAN_MAESTRO_100_PORCIENTO_v2.0.md` §3.3 — Buy vs Build table (Auth/SSO row)
- `PLAN_MAESTRO_100_PORCIENTO_v2.0.md` §4.1 — Fase 1, T1.2 (Clerk setup)
- `PLAN_MAESTRO_100_PORCIENTO_v2.0.md` §4.1 — T1.0 (LOPDP Ecuador)
- `PLAN_MAESTRO_100_PORCIENTO_v2.0.md` §4.5 — Fase 5 ISO 27001 cert
- `PRE0_DISCOVERY_KIT.md` §0 — Discovery-first principle (don't over-build before validation)
- LOPDP Ecuador — Art. 7 (consent), Art. 9 (data portability), Art. 18 (right to be forgotten), Art. 26 (international transfers)
- ISO 27001:2022 — A.9 Access Control, A.9.4 System and Application Access Control, A.15 Supplier Relationships

---

## Supersedes

None. This is the first ADR for COS.

## Superseded by

None yet. Candidate successor: **ADR-0002 RBAC model** (M1 fine-grained permissions) and **ADR-0003 Multi-tenant JWT claim shape** (the actual JWT payload contract).
