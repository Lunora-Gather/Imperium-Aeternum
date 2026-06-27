# GitHub Release Draft — Imperium Aeternum 1.0 Public Preview

## Release title

```text
Imperium Aeternum 1.0 Public Preview
```

## Suggested tag

```text
v1.0.0-preview
```

## Target branch

```text
main
```

## Release body

Imperium Aeternum reaches its first public preview milestone: a historical grand-strategy simulation focused on long-term statecraft, internal stability, diplomacy, war risk, and annual planning.

This release is not just a feature demo. It includes a release-candidate dashboard, stability checks, save/load migration support, and a unified release gate.

### Play online

https://lunora-gather.github.io/Imperium-Aeternum/

### Highlights

- Dashboard command grouping with collapsible sections
- Governor Advisor route planner
- Release Readiness center
- Strategic HQ planning
- Turn Risk Center
- Economy Advisor
- Diplomacy Advisor
- War assessment and war opportunity preview
- Onboarding Coach for guided next steps
- Annual turn processing with reports and history
- Multi-slot save/load with migration normalization
- GitHub Pages deployment workflow
- Unified release gate: `VITE_BASE=/Imperium-Aeternum/ npm run rc:check`

### Stability coverage

The release gate checks:

- TypeScript typecheck
- data validation
- annual turn stability tests
- persistence roundtrip tests
- Dashboard advisor smoke tests
- targeted advisor, economy, diplomacy, war, and AI tests
- Pages-compatible build

### Known limitations

- Browser-level automated e2e tests are not yet included.
- Governor Advisor is advisory only and does not automatically execute actions.
- Long-game balance still needs manual multi-decade playtesting.
- GitHub connector status checks may not always show push-triggered Pages runs immediately.

### Manual verification before publishing

Before publishing this release, complete `docs/FINAL_QA.md` and confirm that the Pages build shows the final build marker.

## Release asset policy

No binary assets are required for this preview release. The canonical public artifact is the GitHub Pages deployment.
