# Imperium Aeternum 1.1.0

1.1.0 is the first stable release of Imperium Aeternum: a complete browser strategy game centered on governing a state across years, not merely painting the map.

## Play now

https://lunora-gather.github.io/Imperium-Aeternum/

## What makes 1.1.0 stable

- A complete loop from campaign selection, annual planning, action and events through annual review, victory, and continued legacy play.
- Nine campaign presets, 319 events, multiple victory routes, national missions, crisis chains, diplomacy with memory, war planning, and deterministic AI turns.
- Multi-slot local saves with migration and repair, plus five private cloud slots after sign-in.
- Verified accounts, authoritative shared worlds, player discovery, friend requests, profile cards, world chat, private chat, unread indicators, and image messages.
- Simplified Chinese, Traditional Chinese, and English throughout the launch, governance, report, event, save, account, shared-world, and social flows.
- A six-step primer and a first-campaign journey that teach the actual governing loop.

## Experience and safety improvements

- Event choices use aligned, comparable cards with immediate and longer-term consequences.
- Returning to the lobby never silently replaces an active local campaign.
- Shared-world exits explain server persistence and avoid misleading local-save actions.
- The mobile “All pages” directory keeps every screen reachable at 390 px without page overflow.
- Operation feedback remains reliable in long sessions even after the bounded history rolls over or the same warning repeats.
- Traditional Chinese fallback now covers event and campaign data without relaxing the bundle budget.
- Hugging Face diplomacy briefings are optional presentation: authoritative game rules and outcomes remain local/Appwrite-controlled and fall back safely.

## Verification

The release must pass:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

The gate covers strict TypeScript, game-data validation, Appwrite shared-engine parity, all automated tests, long-run simulations, the Pages build, and bundle budgets. The versioned browser checklist is in [`release-qa-v1.1.0.md`](release-qa-v1.1.0.md).

## Online-service boundary

Single-player works without an account. Accounts, cloud saves, shared worlds, and social features require the configured Appwrite Cloud project. AI summit prose may be unavailable when Hugging Face is unavailable; local structured advice remains usable.

## Upgrade notes

- Existing local saves are retained and continue through the versioned migration/repair boundary.
- The game-state save schema remains independent from the application release version.
- The previous immutable preview release remains available as `v1.0.0-preview`.
