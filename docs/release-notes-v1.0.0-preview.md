# Imperium Aeternum v1.0.0-preview Release Notes

This is the public preview candidate for Imperium Aeternum.

## Public URL

https://lunora-gather.github.io/Imperium-Aeternum/

## Release theme

This preview focuses on making the strategy loop readable and playable from the Dashboard:

```text
Target Coach
  → Strategic HQ
  → Release Readiness
  → Pre-turn Risk Center
  → Economy / Governor / Diplomacy / War advisors
  → Player action
  → Annual report
  → Save / load / continue
```

## Highlights

### Dashboard command stack

The Dashboard now acts as the main command center. It surfaces:

- Target Coach / 目标教练.
- Strategic HQ / 帝国总参.
- Release Readiness / 发布就绪.
- Pre-turn Risk Center / 推进前风险中枢.
- Economy Advisor / 经济内政顾问.
- Governor Advisor / 地方治理顾问.
- Diplomacy Advisor / 外交顾问.
- War Opportunity / 战争机会.

### War planning

- War opportunity scanning.
- War preview before declaring war.
- Win chance, readiness, logistics, diplomatic risk, and warnings.
- AI war planner integration backed by tests.

### Release stability

- Save/load health checks.
- Dashboard stability tests.
- Targeted advisor tests.
- Pages-compatible production build.
- Public preview QA script.

## Validation before tag

Run locally or in CI:

```bash
npm ci
npm run rc:check
```

Manual QA:

- Follow `docs/public-preview-qa.md`.
- Confirm `docs/release-checklist.md` has no open blocker.

## Known limitations

- This is a public preview, not the final balance pass.
- Numbers and AI behavior may still need tuning after longer playtests.
- Browser localStorage is the current save backend.

## Tag target

Recommended tag after checks pass:

```text
v1.0.0-preview
```
