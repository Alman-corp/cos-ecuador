# DATA ARCHITECTURE

## Estrategia de datos multi-capa

Consulting OS maneja tipos de datos muy diferentes que requieren soluciones de almacenamiento especializadas. Una sola base de datos no es suficiente.

```
┌────────────────────────────────────────────────────────────────────┐
│                        DATA ARCHITECTURE                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  POSTGRESQL       │  │  DATA LAKE   │  │  VECTOR DB           │ │
│  │  (Prisma ORM)     │  │  (MinIO)      │  │  (pgvector / Pinecone)│ │
│  │                   │  │              │  │                      │ │
│  │  Datos transac-   │  │  Archivos    │  │  Embeddings          │ │
│  │  cionales         │  │  Logs        │  │  Búsqueda semántica  │ │
│  │  Relaciones       │  │  Eventos     │  │  Knowledge Graph     │ │
│  │  Usuarios         │  │  Backups     │  │  Memoria IA          │ │
│  └──────────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  WAREHOUSE        │  │  CACHE       │  │  SEARCH              │ │
│  │  (futuro)         │  │  (Redis)     │  │  (futuro)            │ │
│  │                   │  │              │  │                      │ │
│  │  BI / OLAP       │  │  Sesiones    │  │  Full-text search    │ │
│  │  Reportes agreg.  │  │  Rate limit  │  │  Faceted search      │ │
│  │  Historico        │  │  Job queue   │  │  Autocomplete        │ │
│  │  Analítica        │  │  Cache IA    │  │  Documentos          │ │
│  └──────────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 1. PostgreSQL (Base transaccional)

### Rol
Fuente de verdad para todos los datos transaccionales del sistema.

### Estrategia de modelo
```
Prisma ORM → PostgreSQL 16
Pool: PgBouncer (transaction mode)
```

### Tipos de datos almacenados
```
Categoría              │ Ejemplos                              │ Tamaño estimado
───────────────────────┼───────────────────────────────────────┼──────────────────
Identity               │ Empresas, usuarios, roles, permisos   │ 1-5 GB
CRM                    │ Leads, prospectos, oportunidades      │ 1-3 GB
Clientes               │ Clientes, contactos, contratos        │ 2-10 GB
Documentos metadata    │ Nombres, tipos, relaciones            │ 0.5-2 GB
Proyectos              │ Proyectos, tareas, hitos, riesgos    │ 1-5 GB
Financiero             │ Estados financieros, ratios          │ 2-20 GB
Workflows              │ Definiciones, instancias, resultados  │ 1-5 GB
Notificaciones         │ Templates, notificaciones enviadas   │ 1-3 GB
Auditoría              │ Audit logs                           │ 5-50 GB
```

### Políticas de retención
```
Dato                    │ Retención activa │ Archive │ Delete
────────────────────────┼──────────────────┼─────────┼────────
Audit logs              │ 90 días          │ 1 año   │ 3 años
Notifications           │ 30 días          │ 1 año   │ 2 años
Workflow instances      │ 1 año            │ 3 años  │ 5 años
Financial statements    │ Indefinido       │ -       │ -
Documents               │ Indefinido       │ -       │ -
Client data             │ Indefinido       │ -       │ -
```

### Indexación
```
Índices obligatorios:
- companyId en todas las tablas tenant-scoped
- (companyId + created_at) para time-series
- (userId, is_read) para notificaciones
- (clientCompanyId, occurred_at) para timeline
- (companyId, status) para workflows

Índices compuestos para consultas frecuentes:
- (companyId, period_start) para financial_statements
- (clientCompanyId, documentType) para documentos
- (userId, isRead, createdAt) para notificaciones
```

---

## 2. Data Lake (MinIO / S3-compatible)

### Rol
Almacenamiento de objetos para archivos grandes y datos no estructurados.

### Estructura de buckets
```
consultingos/
├── tenants/
│   └── {companyId}/
│       ├── documents/          ← Documentos subidos por clientes
│       │   └── {clientCompanyId}/
│       │       └── {documentId}.pdf
│       ├── reports/            ← Informes generados
│       │   └── {projectId}/
│       │       └── informe_{date}.pdf
│       ├── contracts/          ← Contratos firmados
│       ├── avatars/            ← Fotos de perfil
│       └── exports/            ← Exportaciones temporales
├── system/
│   ├── backups/               ← Backups de PostgreSQL
│   ├── logs/                   ← Logs de eventos
│   └── templates/             ← Plantillas (PDF, Excel)
└── public/
    ├── landing/               ← Assets landing page
    └── docs/                  ← Documentación
```

### Políticas de ciclo de vida
```
Tipo          │ Almacenamiento │ Archive (Glacier) │ Delete
──────────────┼────────────────┼───────────────────┼─────────
Documents     │ Hot (1 año)    │ Cool (3 años)     │ 5 años
Reports       │ Hot (6 meses)  │ Cool (2 años)     │ 5 años
Exports       │ Hot (24h)      │ —                 │ 24h
Logs          │ Hot (7 días)   │ Cool (30 días)    │ 90 días
Backups       │ Hot (7 días)   │ Cool (30 días)    │ 90 días
Avatars       │ Hot            │ —                 │ —
```

---

## 3. Vector DB (pgvector / Pinecone)

### Rol
Búsqueda semántica, memoria de IA, recomendaciones basadas en similitud.

### Qué se vectoriza
```
Entidad              │ Dimensión │ Modelo embedding        │ Uso
─────────────────────┼───────────┼────────────────────────┼────────────────
Documentos           │ 1536      │ text-embedding-3-small │ Búsqueda semántica
Knowledge nodes      │ 1536      │ text-embedding-3-small │ Recomendaciones
Consultas IA         │ 1536      │ text-embedding-3-small │ Memoria de conversación
Clientes             │ 768       │ custom                 │ Clientes similares
Problemas            │ 1536      │ text-embedding-3-small │ Diagnóstico similar
```

### Estrategia de implementación
```
Fase 1 (MVP):  pgvector (PostgreSQL extension)
               + Mismo stack, sin servicio extra
               + Suficiente para < 1M vectores

Fase 2 (Scale): Pinecone / Weaviate
                + Escalado horizontal
                + Híbrido (keyword + semantic)
                + Filtros por tenant
```

---

## 4. Cache Layer (Redis)

### Rol
Caching, sesiones, colas de trabajo, rate limiting.

### Namespaces
```
cos:{tenant}:{entity}:{id}     ← Cache de datos
cos:session:{token}             ← Sesiones de usuario
cos:queue:{queueName}           ← Bull queues
cos:ratelimit:{key}             ← Rate limiting
cos:lock:{resource}             ← Distributed locks
```

### Cache patterns
```
Cache-Aside:
  1. Buscar en Redis
  2. Si miss → buscar en PostgreSQL
  3. Poblar Redis con TTL
  4. Devolver dato

Invalidación por evento:
  Evento: "documento.actualizado"
  → Eliminar clave: cos:{tenant}:cliente:{id}:documentos
  → Siguiente request: cache miss → refresh

TTL por tipo:
  Sesión:          24h
  Consultas IA:    1h (cache de respuestas repetitivas)
  Clientes:        5min
  Config:          5min
  Rate limit:      1min
```

### Job queues (Bull)
```
Queue                    │ Procesa           │ Prioridad
─────────────────────────┼───────────────────┼───────────
document.processing      │ IA extrae datos   │ Alta
document.classification  │ Clasifica doc     │ Alta
report.generation        │ Genera PDF        │ Media
notification.send        │ Envía notificación│ Baja
workflow.execute         │ Ejecuta paso BPM  │ Media
knowledge.index          │ Indexa en KG      │ Baja
```

---

## 5. Data Warehouse (futuro)

### Rol
Analítica, BI, reportes históricos agregados. Cuando PostgreSQL no sea suficiente.

### Estrategia
```
ETL:      pg_dump → transform → warehouse
          También eventos del Event Bus

Herramientas:  ClickHouse / DuckDB (embebido para reportes)
               dbt para transformaciones
               Metabase / Superset para BI

Modelo estrella:
  fact_consulting_hours
  fact_documents_processed
  fact_invoices
  dim_clients
  dim_consultants
  dim_time
  dim_projects
```

### Cuándo migrar
```
Indicadores de necesidad:
- > 100M registros en financial_statements
- Reportes que tardan > 5s
- Queries analíticas impactan DB transaccional
- Necesidad de histórico > 3 años
```

---

## 6. Flujo de datos crítico

### Ciclo de vida de un documento
```
1. Cliente sube PDF
   → MinIO: tenants/{companyId}/documents/{clientId}/{docId}.pdf
   → PostgreSQL: INSERT client_document (metadata)

2. Evento: document.uploaded
   → Redis queue: document.processing

3. Worker procesa:
   → OCR (si escaneado)
   → Extracción estructurada (tablas → JSON)
   → Clasificación (tipo, período, moneda)
   → Validación (consistencia)
   → Vectorización → pgvector
   → Actualizar PostgreSQL: status=ready, data=JSON

4. Evento: document.processed
   → Notificar al consultor
   → Actualizar dashboard
   → Alimentar Knowledge Graph

5. IA usa el documento:
   → Consulta embedding similar en pgvector
   → Contexto para análisis
   → Generación de informe
```

---

## 7. Backup & Disaster Recovery

### Estrategia
```
PostgreSQL:
  pg_dump diario → MinIO (retención 30 días)
  WAL archiving continuo → PITR (point-in-time recovery)
  RPO: < 5 minutos
  RTO: < 1 hora

MinIO:
  Replicación a bucket secundario (otra región)
  RPO: < 15 minutos
  RTO: < 2 horas

Redis:
  Persistencia RDB + AOF
  Backup cada 6 horas → MinIO
```

### Plan de recuperación
```
Escenario                │ RTO   │ Acción
─────────────────────────┼───────┼───────────────────────────
Data corruption          │ 1h    │ PITR a minuto antes
DB failure               │ 1h    │ Restore de snapshot + WAL
Full region outage       │ 4h    │ Restore en región secundaria
Accidental delete        │ 30min │ Restore de objeto en MinIO
```
