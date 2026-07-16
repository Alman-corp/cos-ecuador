# PRODUCT ARCHITECTURE

## Arquitectura del producto: planes, características y monetización

Este documento define qué funciones existen, qué plan las habilita, qué dependencias tienen, cómo se licencian y cómo se monetizan. Es la capa que convierte el software en un negocio.

---

## 1. Planes de suscripción

```
                   │ Free        │ Starter       │ Professional  │ Enterprise
───────────────────┼─────────────┼───────────────┼───────────────┼────────────────
Precio             │ $0/mes      │ $497/mes      │ $1,297/mes    │ $3,497/mes
                   │             │ ($4,970/año)  │ ($12,970/año) │ ($34,970/año)
───────────────────┼─────────────┼───────────────┼───────────────┼────────────────
Usuarios           │ 1           │ 5             │ 15            │ Ilimitado
Clientes           │ 5           │ 50            │ 200           │ Ilimitado
Almacenamiento     │ 100 MB      │ 5 GB          │ 50 GB         │ 1 TB
Créditos IA/mes    │ 50          │ 1,000         │ 10,000        │ 100,000
Workflows          │ 3           │ 10            │ 50            │ Ilimitado
Reglas             │ 5           │ 20            │ 100           │ Ilimitado
API Calls/min      │ 100         │ 500           │ 2,000         │ 10,000
Soporte            │ Comunidad   │ Email         │ Email + Chat  │ Priority + 24/7
Trial              │ —           │ 14 días       │ 14 días       │ 30 días
```

---

## 2. Matriz de características por plan

### 2.1 Identity & Onboarding
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Registro empresa             │ ✅   │ ✅      │ ✅            │ ✅
Inicio de sesión             │ ✅   │ ✅      │ ✅            │ ✅
Perfil de usuario            │ ✅   │ ✅      │ ✅            │ ✅
Roles predefinidos           │ ✅   │ ✅      │ ✅            │ ✅
Roles personalizados         │ —    │ —       │ ✅            │ ✅
SSO / SAML                   │ —    │ —       │ —             │ ✅
Auditoría de accesos         │ ✅   │ ✅      │ ✅            │ ✅
API Keys                     │ —    │ ✅      │ ✅            │ ✅
```

### 2.2 CRM
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Gestión de leads             │ ✅   │ ✅      │ ✅            │ ✅
Pipeline de ventas           │ —    │ ✅      │ ✅            │ ✅
Oportunidades                │ —    │ ✅      │ ✅            │ ✅
Actividades CRM              │ —    │ ✅      │ ✅            │ ✅
Integración email            │ —    │ —       │ ✅            │ ✅
Integración WhatsApp         │ —    │ —       │ ✅            │ ✅
Automatización CRM           │ —    │ —       │ ✅            │ ✅
Reportes de ventas           │ —    │ ✅      │ ✅            │ ✅
```

### 2.3 Clientes
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Ficha de cliente             │ ✅   │ ✅      │ ✅            │ ✅
Contactos                    │ ✅   │ ✅      │ ✅            │ ✅
Documentos del cliente       │ ✅   │ ✅      │ ✅            │ ✅
Timeline                     │ ✅   │ ✅      │ ✅            │ ✅
Dashboard financiero         │ ✅   │ ✅      │ ✅            │ ✅
Portal del cliente           │ —    │ ✅      │ ✅            │ ✅
Contratos digitales          │ —    │ —       │ ✅            │ ✅
Firma electrónica            │ —    │ —       │ ✅            │ ✅
Segmentación avanzada        │ —    │ —       │ —             │ ✅
```

### 2.4 Documentos
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Subida de documentos         │ ✅   │ ✅      │ ✅            │ ✅
Clasificación IA             │ ✅   │ ✅      │ ✅            │ ✅
Extracción de datos IA       │ —    │ ✅      │ ✅            │ ✅
Validación automática        │ —    │ ✅      │ ✅            │ ✅
Versionado                   │ —    | ✅      | ✅            │ ✅
OCR (PDF escaneado)          │ —    │ —       | ✅            │ ✅
Búsqueda semántica           │ —    │ —       │ ✅            │ ✅
Exportación masiva           │ —    │ —       │ —             │ ✅
```

### 2.5 Financiero
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Estados financieros          │ ✅   │ ✅      │ ✅            │ ✅
Ratios automáticos           │ ✅   │ ✅      │ ✅            │ ✅
Ratios personalizados        │ —    │ ✅      │ ✅            │ ✅
Benchmark industria          │ —    │ —       │ ✅            │ ✅
Forecast 12 meses            │ —    | —       | ✅            │ ✅
Simulaciones                 │ —    │ —       │ —             │ ✅
Análisis histórico           │ 1 año│ 3 años  │ 5 años        │ Ilimitado
Reportes PDF/Excel           │ ✅   │ ✅      │ ✅            | ✅
```

### 2.6 IA
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Análisis financiero          │ ✅   │ ✅      │ ✅            │ ✅
Análisis tributario          │ —    │ ✅      │ ✅            │ ✅
Análisis de riesgos          │ —    │ ✅      │ ✅            │ ✅
Diagnóstico completo         │ —    │ —       │ ✅            │ ✅
Chat con IA                  │ ✅   │ ✅      | ✅            │ ✅
Orquestador multi-agente     │ —    │ —       │ ✅            │ ✅
Agentes personalizados       │ —    │ —       │ —             │ ✅
Memoria empresarial          │ —    │ —       │ ✅            │ ✅
Dashboard de costos IA       │ ✅   │ ✅      │ ✅            │ ✅
Límite de créditos/mes       │ 50   │ 1,000   │ 10,000        │ 100,000
Créditos adicionales         │ —    │ $10/100 │ $8/100        │ $5/100
```

### 2.7 Decision Engine
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Evaluación de factores       │ ✅   │ ✅      │ ✅            │ ✅
Score automático             │ ✅   │ ✅      │ ✅            │ ✅
Planes A/B/C                 │ —    │ ✅      │ ✅            │ ✅
Recomendaciones IA           │ —    │ ✅      │ ✅            │ ✅
Planes personalizados        │ —    │ —       │ —             │ ✅
Historial de decisiones      │ ✅   │ ✅      │ ✅            | ✅
```

### 2.8 Workflows & Reglas
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Workflows predefinidos       │ ✅   │ ✅      │ ✅            │ ✅
Editor visual BPM            │ —    │ —       │ ✅            │ ✅
Reglas predefinidas          │ ✅   │ ✅      │ ✅            │ ✅
Reglas personalizadas        │ —    │ —       │ ✅            │ ✅
Triggers (eventos)           │ —    │ —       │ ✅            | ✅
Triggers (schedule)          │ —    │ —       │ —             │ ✅
Reglas por cliente           │ —    │ —       | ✅            │ ✅
Monitoreo de instancias      │ ✅   │ ✅      │ ✅            │ ✅
```

### 2.9 Knowledge Graph
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Indexación automática        │ —    │ —       │ ✅            │ ✅
Búsqueda semántica           │ —    │ —       │ ✅            │ ✅
Recomendaciones IA           │ —    │ —       │ ✅            │ ✅
Visualización del grafo      │ —    │ —       │ —             │ ✅
API de conocimiento          │ —    │ —       │ —             │ ✅
Cross-tenant learning        │ —    │ —       │ —             | Opcional
```

### 2.10 Integraciones
```
Característica               │ Free │ Starter │ Professional │ Enterprise
─────────────────────────────┼──────┼─────────┼───────────────┼──────────
Webhooks salientes           │ ✅   │ ✅      │ ✅            │ ✅
API REST pública             | —    │ ✅      | ✅            │ ✅
Webhooks entrantes           │ —    │ —       │ ✅            │ ✅
Stripe                       │ —    │ ✅      │ ✅            │ ✅
Email (SMTP)                 │ —    │ ✅      │ ✅            │ ✅
Google Drive                 │ —    │ —       │ ✅            │ ✅
QuickBooks/Xero              │ —    │ —       │ —             │ ✅
WhatsApp Business            │ —    │ —       │ —             │ ✅
Plugins de terceros          │ —    │ —       │ —             │ ✅
```

---

## 3. Módulos opcionales (add-ons)

```
Módulo               │ Precio         │ Requisito       │ Descripción
─────────────────────┼────────────────┼─────────────────┼──────────────────────────────
Créditos IA extra    │ $5-10/100      │ Cualquier plan  │ Por cada 100 consultas adicionales
White Label          │ $5,000/mes     │ Enterprise       │ Marca propia, dominio propio
API dedicada         │ $2,000/mes     │ Enterprise       │ Endpoints dedicados, mayor rate limit
Plugin Development   │ $10,000 único  │ Enterprise       │ SDK para desarrollar plugins
Onboarding asistido  │ $2,500 único   │ Starter+         │ Setup + capacitación del equipo
Soporte 24/7         │ $1,000/mes     │ Professional+    │ SLA 4h, teléfono + chat
Data Migration       │ $500-5,000     │ Cualquier plan   │ Migración desde Excel/otro software
Entrenamiento IA     │ $3,000 único   │ Enterprise       │ Entrenar modelos con datos del cliente
```

---

## 4. Feature Flags (beta/early access)

```
Flag                     │ Default │ Plan mínimo │ Descripción
─────────────────────────┼─────────┼─────────────┼──────────────────────────────────
crm.enabled              │ true    │ Free        | CRM completo
ai.orchestrator.v2       │ false   │ Professional │ Nuevo orquestador multiagente
marketplace.enabled      │ false   │ Enterprise   │ Marketplace de plugins
simulation.engine        │ false   │ Enterprise   | Motor de simulación
knowledge.graph          │ false   │ Professional │ Knowledge Graph
white.label              │ false   │ Enterprise   │ Personalización de marca
data.lake                │ false   │ Enterprise   │ Data Lake integration
cross.tenant.learning    │ false   │ Enterprise   │ Aprendizaje anónimo entre tenants
```

---

## 5. Licenciamiento

### Modelo de licencia
```
Tipo: SaaS (Software as a Service)
Pago: Mensual o anual (2 meses gratis en plan anual)
Facturación: Stripe (automatizada)
Impuestos: IVA (según país del cliente)
Moneda: USD (default), COP/MXN opcional
```

### Política de cancelación
```
Cancelación: En cualquier momento, sin penalidad
Datos post-cancelación:
  - 30 días: acceso read-only + exportación
  - 31-90 días: solo exportación (bajo demanda)
  - > 90 días: eliminación irreversible
  - Obligación legal: retención mínima por ley (5 años EC)
```

### Up-sell triggers automáticos
```
Trigger                            │ Acción
───────────────────────────────────┼──────────────────────────────────────────
Usuarios activos = 80% del límite │ Notificación: "Estás cerca del límite"
Almacenamiento > 80% del plan     │ Sugerencia de upgrade
Créditos IA agotados              │ Oferta de recarga + upgrade
Churn risk > 50%                  │ Oferta de descuento por anual
Cliente nuevo sin upgrade > 30d   │ Email: "¿Listo para Professional?"
Utilización > 90% por 3 meses     │ Contacto comercial para Enterprise
```

---

## 6. Dependencias entre módulos

```
Módulo              │ Dependencias                        │ ¿Obligatorio?
────────────────────┼─────────────────────────────────────┼──────────────
Identity            │ —                                   │ ✅ Sí
CRM                 │ Identity                            │ ✅ Sí
Clients             │ Identity, CRM                       │ ✅ Sí
Documentos          │ Identity, Clients                   │ ✅ Sí
Financiero          │ Identity, Clients, Documentos       │ ✅ Sí
IA Básica           │ Identity, Clients, Documentos       │ ✅ Sí
Portal Cliente      │ Identity, Clients, Documentos       │ ❌ Opcional
Workflows           │ Identity, Clients                   │ ❌ Starter+
Reglas              │ Identity                            │ ❌ Starter+
Decision Engine     │ Identity, Clients, Financiero, IA   │ ❌ Professional+
Knowledge Graph     │ Identity, Clients, Documentos       │ ❌ Professional+
Simulaciones        │ Identity, Clients, Financiero       │ ❌ Enterprise
Marketplace         │ Identity, Plugins                   │ ❌ Enterprise
Integraciones       │ Identity                            │ ❌ Starter+
White Label         │ Identity, Branding                  │ ❌ Enterprise
```

---

## 7. Monetización total estimada por cliente

```
Escenario: Consultora con 15 empleados, plan Professional ($1,297/mes)

Revenue fijo anual:  $1,297 × 12 = $15,564

Revenue variable estimado:
├── Créditos IA extra:     $200/mes  → $2,400/año
├── Onboarding asistido:   $2,500 (único)
├── Integraciones premium: $500/mes  → $6,000/año (Enterprise upgrade)
└── Total variable:        ~$10,900/año

Revenue total cliente/año: ~$26,464
Gross margin (70%):        ~$18,525

LTV a 3 años (75% retención): ~$45,000
CAC máximo recomendado:        ~$15,000 (LTV/3)
Payback period:                ~11 meses
```
