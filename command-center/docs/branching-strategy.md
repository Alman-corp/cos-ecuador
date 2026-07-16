# Branching Strategy — COS Command Center

## Estructura
- `main` — producción, solo merge desde develop vía PR aprobado
- `develop` — integración, feature branches se mergean aquí
- `feature/*` — features nuevas, desde develop
- `hotfix/*` — bugs críticos, desde main, se mergea a main y develop

## Reglas
- PR a main requiere: build verde + 2 approvals + tests pasando
- PR a develop requiere: build verde + 1 approval
- Commits siguen Conventional Commits (feat:, fix:, chore:, docs:)
