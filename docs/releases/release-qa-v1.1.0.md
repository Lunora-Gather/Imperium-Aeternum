# 1.1.0 Stable Release QA

Every section is required before creating `v1.1.0`.

## 1. Release identity

- `package.json` and the root of `package-lock.json` say `1.1.0`.
- `src/buildInfo.ts`, the launch badge, footer, README badge, and release notes say `1.1.0`.
- `npm run check:release-version` passes.
- `main` is clean and matches `origin/main`.

## 2. Automated release gate

Run:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

Pass only when typecheck, validation, shared-world parity, all tests, all three stability simulations, the Pages build, and every bundle budget pass.

## 3. Launch and onboarding

- Open the public URL in a fresh tab.
- Confirm all three languages and four themes can be selected.
- Start “Mediterranean Dawn”.
- Confirm the six-step primer and first-campaign journey are readable and dismissible.

## 4. Core annual loop

- Follow the Dashboard primary recommendation.
- Perform one valid domestic or diplomatic action.
- Open next-turn forecast; resolve any hard blocker.
- Save, advance, inspect the annual report, and return to the previous page.
- Confirm an event choice applies once and the next queued event remains usable.

## 5. Save and campaign safety

- Save to a manual slot, reload, and load it.
- Confirm the save-health preview is not broken.
- Open “Choose another campaign”; confirm Continue is the safe default.
- Cancel with Escape and confirm focus returns to the trigger.
- Confirm save-and-return and explicit discard are separate choices.

## 6. Shared world and online boundaries

- Confirm the shared-world lobby can list and enter an available world.
- Confirm actions are server-validated and the ready state does not bypass pending events.
- Confirm leaving a shared world explains automatic server persistence.
- If Appwrite is unavailable, confirm single-player remains playable and the error is understandable.

## 7. Social experience

- Discover only players relevant to the current world before friendship.
- Open a player card from the avatar and send a direct friend request.
- After acceptance, confirm direct chat remains available outside that world.
- Verify world chat, direct chat, unread badge, floating dock, image failure recovery, and logout under network loss.

## 8. Responsive and accessibility checks

- At 390 × 844, confirm no horizontal page overflow and “All pages” is visible.
- Open the event, account, social, campaign-exit, and mobile-navigation dialogs.
- Confirm focus stays inside each modal, Escape closes where safe, and focus returns.
- Confirm important buttons have accessible names and operation feedback exposes a polite status region.

## 9. Long-session feedback

- Produce more than 31 operation messages.
- Confirm message 32 and later still create a toast.
- Repeat the same warning twice and confirm both actions are represented.
- Confirm no console errors.

## 10. Final publication

- Merge only a green PR into `main`.
- Wait for the matching `Deploy Pages` run to succeed.
- Verify the public build marker is `1.1.0`.
- Create immutable annotated tag `v1.1.0`.
- Publish a non-prerelease GitHub Release using `release-notes-v1.1.0.md`.
