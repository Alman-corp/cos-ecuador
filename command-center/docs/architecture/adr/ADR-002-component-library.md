# ADR-002: Component Library

## Context
El proyecto tiene una mezcla de estilos: componentes inline, clases Tailwind dispersas y algunos elementos de bibliotecas externas. No hay un sistema de diseño unificado, lo que provoca inconsistencia visual y duplicación de código.

## Decision
Se adopta **Shadcn/ui** como base del sistema de componentes.

| Aspecto           | Decisión                                  |
|--------------------|-------------------------------------------|
| Base               | Shadcn/ui (Radix UI + Tailwind CSS)       |
| Estilos            | Tailwind CSS v4                           |
| Iconos             | Lucide React (ya presente)                |

## Consequences
- **Positivas**: componentes accesibles (Radix UI), personalizables vía Tailwind, tree-shakeable (solo se instala lo que se usa).
- **Negativas**: requiere migración de componentes existentes.
- **Migración**: por batches, comenzando por componentes de formulario y layout.
- No se agregarán nuevas dependencias de UI sin pasar por este ADR.

## Status
Aceptado.
