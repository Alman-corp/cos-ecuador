# Contributing to COS

## Conventional Commits

```
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Formato, punto y coma, etc
refactor: Reestructuración de código
test:     Agregar o corregir tests
chore:    Cambios en build, CI, dependencias
perf:     Mejora de rendimiento
```

## Branching Strategy

- `main` — producción, protegida
- `staging` — pre-producción
- `feat/<descripcion>` — features nuevas
- `fix/<descripcion>` — correcciones
- `hotfix/<descripcion>` — fixes urgentes

## Definición de "Done"

- [ ] Código funciona localmente
- [ ] Tests pasan (`npm test`)
- [ ] Lint pasa (`npm run lint`)
- [ ] Type-check pasa (`npm run typecheck`)
- [ ] Documentación actualizada si aplica
- [ ] PR revisado y aprobado
- [ ] CI pipeline verde

## Code Review

- Todo PR requiere al menos 1 aprobación
- PRs >500 líneas deben dividirse
- Squash merge para historial limpio