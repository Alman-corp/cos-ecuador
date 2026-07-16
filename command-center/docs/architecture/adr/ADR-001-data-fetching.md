# ADR-001: Data Fetching Strategy

## Context
Actualmente los datos están hardcodeados en componentes y páginas, lo que dificulta el mantenimiento, testing y escalabilidad. No existe una capa de abstracción para fetching, caché o estado global.

## Decision
Se adopta **TanStack Query (React Query)** para la gestión de fetching, caché y sincronización de datos del servidor, y **Zustand** para el estado global del cliente.

| Capa               | Librería         | Responsabilidad                          |
|--------------------|------------------|------------------------------------------|
| Server state       | TanStack Query   | Fetching, caché, revalidación, mutación  |
| Client state       | Zustand          | UI state, preferencias, sesión           |

## Consequences
- **Positivas**: separación clara server/client state, deduplicación de requests, stale-while-revalidate out of the box.
- **Negativas**: curva de aprendizaje del equipo, necesidad de migrar código existente.
- **Migración**: gradual, componente por componente. No se requiere reescritura total.
- **StaleTime global**: 60s por defecto para datos no críticos.
- Se agregará `@tanstack/react-query` y `zustand` como dependencias.

## Status
Aceptado.
