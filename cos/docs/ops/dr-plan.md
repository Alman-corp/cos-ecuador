# Plan de Disaster Recovery — COS Platform

## Objetivos

| Métrica | Target |
|---|---|
| Recovery Time Objective (RTO) | <4 horas |
| Recovery Point Objective (RPO) | <1 hora |
| Availability SLA | 99.5% (~3.65h downtime/mes) |

## Estrategias por Componente

### Base de Datos (PostgreSQL)

| Aspecto | Detalle |
|---|---|
| Backup automático | Script `scripts/backup-db.ps1` via cron / Task Scheduler |
| Frecuencia | Cada hora |
| Retention | 30 días |
| Método | pg_dump en formato custom (-Fc) |
| Almacenamiento | Disco local + S3 (opcional) |
| Restauración | pg_restore con --clean |

### Archivos y Documentos

| Aspecto | Detalle |
|---|---|
| Almacenamiento primario | MinIO (S3-compatible) en docker-compose |
| Backup | S3 sync a bucket secundario |
| Retention | 90 días |
| Restauración | aws s3 sync (o mc cp para MinIO) |

### Código Fuente

| Aspecto | Detalle |
|---|---|
| Repositorio | GitHub |
| Backup | GitHub es responsable de la disponibilidad |
| Local | Clonar repositorio semanalmente |
| Restauración | git clone + npm install + npm run build |

### Configuración

| Aspecto | Detalle |
|---|---|
| Variables de entorno | `.env.production` en secretería |
| Feature flags | DB + runtime (ver feature-flags service) |

## Procedimiento de DR Completo (Fallo Total)

1. **Evaluar daño** (5 min): Determinar si es fallo de DB, app, o infraestructura
2. **Provisionar nuevo servidor** (30 min): Docker compose up en instancia nueva
3. **Restaurar DB** (30 min): pg_restore desde backup más reciente
4. **Restaurar archivos** (15 min): sync desde S3/MinIO
5. **Configurar variables de entorno** (10 min): Cargar .env
6. **Verificar health check** (5 min): GET /api/health
7. **Habilitar features una por una** (15 min): feature flags → ON
8. **Notificar reactivación** (5 min): Email/Slack a usuarios

## Pruebas de DR

| Frecuencia | Prueba | Responsable |
|---|---|---|
| Mensual | Restauración de backup en entorno staging | DevOps |
| Trimestral | Simulación de fallo completo (Game Day) | Todo el equipo |
| Semestral | Disaster recovery drill completo con corte real | DevOps + Producto |
