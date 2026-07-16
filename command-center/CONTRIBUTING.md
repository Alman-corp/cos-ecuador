# Contributing — COS Command Center

## Branch Naming Convention

| Branch pattern | Source | Description |
|---|---|---|
| `main` | — | Producción estable |
| `develop` | — | Integración continua |
| `feature/<id>-<description>` | `develop` | Nueva funcionalidad |
| `hotfix/<id>-<description>` | `main` | Corrección urgente |

## Merge Rules

| Target | Requirements |
|---|---|
| `feature/*` → `develop` | PR + **1 approval** + CI verde |
| `develop` → `main` | PR + **2 approvals** + CI verde |

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`

Examples:
- `feat(dashboard): add EBITDA trend chart`
- `fix(valuation): correct DCF terminal value calc`
- `chore(deps): upgrade next to 16.2.9`

## Code Review Checklist

1. No secrets or credentials in code
2. TypeScript compiles without errors (`npm run typecheck`)
3. Lint passes (`npm run lint`)
4. Tests pass (`npm test`)
5. New components follow existing patterns (same libraries, same styling)
6. Hardcoded data is flagged with a TODO or migrated to a data source
7. Error states are handled (loading, empty, error)
8. Mobile/responsive layout is considered
9. No `console.log` debugging artifacts
10. PR description clearly states what and why

## PR Template

See `.github/PULL_REQUEST_TEMPLATE.md`.
