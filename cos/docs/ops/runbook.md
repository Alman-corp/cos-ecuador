# Runbook de Incidentes — COS Platform

## 📋 Índice

- [Incidente: Caída de Base de Datos](#incidente-caída-de-base-de-datos)
- [Incidente: Error 503 / Feature Disabled](#incidente-error-503--feature-disabled)
- [Incidente: Latencia Alta (>5s)](#incidente-latencia-alta-5s)
- [Incidente: Error en Parsing de Estados Financieros](#incidente-error-en-parsing-de-estados-financieros)
- [Incidente: Problemas de Autenticación](#incidente-problemas-de-autenticación)
- [Incidente: Reporte PDF no se Genera](#incidente-reporte-pdf-no-se-genera)
- [Procedimiento de Rollback](#procedimiento-de-rollback)
- [Procedimiento de Restauración de DB](#procedimiento-de-restauración-de-db)
- [Contactos](#contactos)

---

## Incidente: Caída de Base de Datos

**Síntomas:** Health check falla, errores de conexión a BD, página en blanco.

**Severidad:** CRÍTICA

**Pasos:**
1. Verificar estado del servicio: `systemctl status postgresql` (Linux) o `Get-Service postgres*` (Windows)
2. Revisar logs: `journalctl -u postgresql -n 50` o `Get-EventLog -LogName Application -Source PostgreSQL`
3. Intentar restart: `sudo systemctl restart postgresql`
4. Si no revive, restaurar desde backup más reciente (ver [Restauración de DB](#procedimiento-de-restauración-de-db))
5. Notificar a usuarios por email/Slack

**Tiempo target de resolución:** <30 min

---

## Incidente: Error 503 / Feature Disabled

**Síntomas:** Usuarios ven error 503 con `FEATURE_DISABLED`.

**Severidad:** MEDIA

**Pasos:**
1. Ir al admin panel: `/admin/flags`
2. Verificar si el feature flag correspondiente está desactivado
3. Si fue accidental, activarlo desde la UI
4. Si fue intencional por mantenimiento, verificar si el mantenimiento terminó

---

## Incidente: Latencia Alta (>5s)

**Síntomas:** Reportes tardan más de 5 segundos en generarse, usuarios se quejan.

**Severidad:** ALTA

**Pasos:**
1. Revisar métricas en `/api/metrics` — verificar avgResponseTimeMs
2. Identificar qué endpoint está lento desde los logs (Pino)
3. Verificar uso de CPU/memoria en el servidor
4. Si es un endpoint específico, considerar rate limiting más agresivo
5. Si es general, escalar horizontalmente (más instancias)

---

## Incidente: Error en Parsing de Estados Financieros

**Síntomas:** Usuario sube Excel y recibe error.

**Severidad:** MEDIA

**Pasos:**
1. Verificar el archivo subido (formato, columnas requeridas)
2. Revisar logs en busca de `parse error` o `XLSX`
3. Si el error es por formato, enviar plantilla al usuario: `/api/due-diligence/template`
4. Si el error es del sistema, reportar bug en GitHub Issues

---

## Incidente: Problemas de Autenticación

**Síntomas:** Usuarios no pueden iniciar sesión, JWT inválido.

**Severidad:** ALTA

**Pasos:**
1. Verificar que la DB de auth esté corriendo
2. Revisar logs de JWT: buscar `token error` o `auth`
3. Si es error de expiración, pedir al usuario que refresque
4. Si es error general, desactivar temporalmente auth checks via feature flag

---

## Incidente: Reporte PDF no se Genera

**Síntomas:** Botón de descarga falla, PDF en blanco o error 500.

**Severidad:** BAJA

**Pasos:**
1. Verificar que el reporte en pantalla se vea correctamente
2. Revisar logs: buscar `pdf` o `renderToStream`
3. Si es un error de `@react-pdf/renderer`, verificar que no haya caracteres especiales en los datos
4. Como workaround, permitir al usuario copiar desde la vista web

---

## Procedimiento de Rollback

1. Identificar el deploy problemático (último cambio)
2. Revertir el merge en GitHub:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. El CI/CD desplegará automáticamente la versión anterior
4. Verificar health check en `/api/health`
5. Notificar a usuarios que el issue está resuelto

**Tiempo target:** <15 min

---

## Procedimiento de Restauración de DB

1. Identificar el backup más reciente:
   ```powershell
   Get-ChildItem C:\backups\cos -Filter "cos_*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
   ```

2. Restaurar usando pg_restore:
   ```powershell
   pg_restore -h localhost -U postgres -d cos --clean $backupFile
   ```

3. Verificar integridad:
   ```powershell
   psql -h localhost -U postgres -d cos -c "SELECT count(*) FROM information_schema.tables"
   ```

4. Reiniciar la aplicación:
   ```bash
   npm run build && npm start
   ```

**RPO:** <1 hora (backups cada hora)
**RTO:** <4 horas

---

## Contactos

| Rol | Nombre | Contacto |
|---|---|---|
| DevOps / Arq. Principal | Carlos | carlos@cos-platform.com |
| Backend Lead | — | — |
| Product Owner | — | — |

**Escalation si no hay respuesta en 15 min:** Llamar al número de emergencia.

---

## Post-Mortem Template

Después de cada incidente severo, llenar:

```markdown
# Post-Mortem: [Título del Incidente]
- **Fecha:** 
- **Duración:** 
- **Severidad:** 
- **Impacto:** 
- **Causa Raíz:** 
- **Solución:** 
- **Acciones Preventivas:** 
- **Responsable:** 
- **Deadline:** 
```
