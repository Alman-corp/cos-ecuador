# Release Checklist

## Pre-release
- [ ] Build verde (npm run build)
- [ ] Tests pasando (npm test)
- [ ] Lint verde (npm run lint)
- [ ] Typecheck verde (npm run typecheck)
- [ ] 0 vulnerabilidades críticas (npm audit)
- [ ] CHANGELOG.md revisado y actualizado

## Smoke Test List (pre-release)
- [ ] Dashboard carga sin errores y muestra KPIs correctos
- [ ] Agentes: envío de mensaje y respuesta del asistente
- [ ] Valuación: DCF, Monte Carlo y sinergias se renderizan
- [ ] Márgenes: tabla vs waterfall toggle funciona
- [ ] Stress Simulator: sliders actualizan proyección
- [ ] Data Hub: drag & drop de archivo .xlsx funcional
- [ ] RAG Playground: búsqueda híbrida devuelve resultados
- [ ] Knowledge Graph: grafo 3D se renderiza
- [ ] Security: cada tab (audit, API keys, SSO, RLS, secrets) carga
- [ ] Operations: cada tab (OTel, RUM, SLOs, etc.) carga
- [ ] Login: formulario de autenticación funcional
- [ ] Páginas 404 y error personalizadas se muestran correctamente

## Version Bump Guide

```
npm version patch  # 0.1.0 → 0.1.1 (bug fixes)
npm version minor  # 0.1.0 → 0.2.0 (new features, backwards compatible)
npm version major  # 1.0.0 → 2.0.0 (breaking changes)
```

After bump, update version in:
- `package.json` (auto)
- `CHANGELOG.md` (manual)
- Create annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`

## Changelog Format

Keep a `CHANGELOG.md` at the project root following [Keep a Changelog](https://keepachangelog.com/):

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Change description

### Fixed
- Bug fix description

### Deprecated
- Deprecation notice
```

## Rollback Procedure

1. **Revert the deploy**: `git revert <merge-commit>` or `git checkout main~1`
2. **Tag the broken release**: `git tag vX.Y.Z-broken`
3. **Push revert**: `git push origin main`
4. **Verify**: run smoke tests on production
5. **Fix forward**: create hotfix branch from the revert commit
6. **Communicate**: notify team in Slack/#ops with revert reason and ETA

## Release
- [ ] Version bump (npm version)
- [ ] CHANGELOG actualizado
- [ ] Tag creado (git tag vX.Y.Z)

## Post-release
- [ ] Smoke tests ejecutados en producción
- [ ] Sentry verifica sin errores nuevos
- [ ] Notificar al equipo
