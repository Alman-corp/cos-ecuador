# Sentry Guidelines — COS Command Center

## Habilitar Sentry en desarrollo local

1. Copiar `.env.example` a `.env.local` (si no existe):
   ```
   cp .env.example .env.local
   ```
2. Configurar las siguientes variables:

   ```
   NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   SENTRY_ORG=<org-slug>
   SENTRY_PROJECT=<project-slug>
   SENTRY_AUTH_TOKEN=<token>
   ```

3. En desarrollo, Sentry corre con `tracesSampleRate: 0.1` y `debug: true`. Los errores se envían localmente si `NEXT_PUBLIC_SENTRY_DSN` está configurado.

## Configurar DSN por entorno

| Entorno      | Variable                 | DSN recomendado                       |
|-------------|--------------------------|---------------------------------------|
| Desarrollo  | `NEXT_PUBLIC_SENTRY_DSN` | DSN del proyecto `cos-command-center-dev` |
| Staging     | `NEXT_PUBLIC_SENTRY_DSN` | DSN del proyecto `cos-command-center-stg` |
| Producción  | `NEXT_PUBLIC_SENTRY_DSN` | DSN del proyecto `cos-command-center`     |

- El servidor usa `SENTRY_DSN` con fallback a `NEXT_PUBLIC_SENTRY_DSN`.
- `SENTRY_AUTH_TOKEN` solo es necesario para subir source maps durante el build.

## Verificar errores en el dashboard de Sentry

1. Ir a [sentry.io](https://sentry.io) > Projects > `cos-command-center`.
2. Sección **Issues**: muestra errores agrupados por tipo y stack trace.
3. Sección **Performance**: trazas de transacciones para identificar cuellos de botella.
4. Sección **Replays**: sesiones grabadas con errores para depuración visual.
5. Filtrar por `environment` (development, staging, production) en la barra superior.

## Agregar contexto adicional

Para enriquecer errores con datos del tenant o usuario, usar `Sentry.setTag` o `Sentry.setContext`:

### En Server Components / API Routes

```ts
import * as Sentry from "@sentry/nextjs";

export async function GET(req: Request) {
  Sentry.setTag("tenant_id", "tenant-123");
  Sentry.setContext("user", { id: "user-456", email: "user@example.com" });
  // ... resto del handler
}
```

### En Client Components

```tsx
"use client";
import * as Sentry from "@sentry/nextjs";

useEffect(() => {
  Sentry.setTag("tenant_id", tenantId);
  Sentry.setUser({ id: userId, email: userEmail });
}, [tenantId, userId]);
```

### Tags recomendados

| Tag           | Descripción                          |
|---------------|--------------------------------------|
| `tenant_id`   | ID del tenant activo en la request   |
| `user_id`     | ID del usuario autenticado           |
| `environment` | Se asigna automáticamente via config |

> Los source maps se suben automáticamente durante `next build` (vía `widenClientFileUpload: true`) y no se exponen al cliente (`hideSourceMaps: true`).
