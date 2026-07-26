# Changelog

All notable player-facing changes are recorded here. Version numbers follow semantic versioning.

## [1.1.1] - 2026-07-26

### Fixed

- Added context-aware Traditional Chinese correction after the compact character fallback.
- Corrected diplomacy and event wording such as `關係`, `簽訂`, `乾旱`, `復甦`, and `動盪`.
- Preserved historic and transliterated names such as `亞得里亞海`, `里昂`, and `亞拉里克`.
- Protected unrelated words such as `系統`, `發掘`, and `家裡` from overcorrection.

### Validation

- Added focused context, proper-name, and overcorrection regression tests.
- 499 automated tests across 95 test files.
- Kept every initial-route bundle limit unchanged; the bounded locale data raises only the total inventory cap from 1169 KiB to 1171 KiB.

## [1.1.0] - 2026-07-26

### Added

- Nine campaign presets ranging from the guided Mediterranean opening to regional, world, random, and survival campaigns.
- National missions, escalating crisis chains, diplomatic memory, summit briefings, post-victory legacy play, and a richer event library.
- Appwrite-backed verified accounts, private cloud saves, authoritative shared worlds, player discovery, friend requests, profile cards, world chat, direct chat, and image messages.
- Complete Simplified Chinese, Traditional Chinese, and English interface coverage with an in-game first-campaign journey.

### Improved

- Rebuilt the launch hub, Dashboard command center, annual review, event choices, player cards, chat surfaces, mobile navigation, and responsive shell.
- Added next-turn forecasting, release/readiness diagnostics, save recovery, war previews, clear action rationale, and safe campaign-exit choices.
- Centralized navigation metadata so desktop navigation, mobile navigation, shortcuts, and help targets cannot drift apart.
- Expanded Traditional Chinese generation to cover event and campaign data, then compressed the mapping to keep the existing bundle budget.
- Turned the previously orphaned release-readiness module into a compact, expandable system-health panel on the Dashboard.

### Fixed

- Prevented duplicate event resolution and hardened long-run event invariants.
- Restored shared-world snapshot loading and hardened cloud-save, realtime chat, inbox recovery, logout, and offline behavior.
- Preserved navigation context through annual reports and prevented accidental campaign replacement.
- Kept operation feedback working after the bounded log rolls over, including repeated identical messages.

### Validation

- 496 automated tests across 95 test files.
- Classic, regional, and full-world stability simulations.
- Shared-world engine parity, data validation, strict TypeScript, Pages production build, and bundle budgets.
- Desktop and 390 px browser verification of the long-session feedback path.

## [1.0.0-preview] - 2026-06-27

- First public preview of the playable governance, war, diplomacy, event, report, and save/load loop.

[1.1.1]: https://github.com/Lunora-Gather/Imperium-Aeternum/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Lunora-Gather/Imperium-Aeternum/compare/v1.0.0-preview...v1.1.0
[1.0.0-preview]: https://github.com/Lunora-Gather/Imperium-Aeternum/releases/tag/v1.0.0-preview
