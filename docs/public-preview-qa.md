# Public Preview QA Script

This script is the minimum manual QA pass before calling a build public-preview ready.

## Build marker

Expected marker for this release-hardening pass:

- `V47 release-hardening`

## 1. Launch

1. Open https://lunora-gather.github.io/Imperium-Aeternum/
2. Confirm the page is not blank.
3. Confirm the app shell and navigation are visible.
4. Start a new game or load an existing save.

Pass criteria:

- No blank screen.
- No immediate crash.
- Dashboard is reachable.

## 2. Dashboard command stack

Open Dashboard and verify these sections are visible in order or near the top:

1. Target Coach / 目标教练.
2. Strategic HQ / 帝国总参.
3. Pre-turn Risk Center / 推进前风险中枢.
4. Economy Advisor / 经济内政顾问.
5. Diplomacy Advisor / 外交顾问.
6. War Opportunity / 战争机会.

Pass criteria:

- Every section renders readable text.
- Clicking a recommended action changes to the expected tab when a tab is provided.

## 3. Economy and province loop

1. Open the economy or province-related recommendation from the Dashboard.
2. Build or inspect an economic improvement if available.
3. Return to Dashboard.

Pass criteria:

- No crash when navigating.
- Economy advisor updates or remains coherent.

## 4. Diplomacy loop

1. Open the Diplomacy advisor recommendation.
2. Inspect at least one nation card.
3. Try a trade/improve/alliance action only if resources allow.

Pass criteria:

- Diplomacy page loads.
- Nation cards are readable.
- No crash after a diplomatic action.

## 5. Military and war preview loop

1. Open the War Opportunity recommendation or Military tab.
2. Confirm Military War Opportunity Advisor is visible.
3. Select a candidate.
4. Confirm War Preview opens.
5. Do not declare war unless the preview is acceptable.

Pass criteria:

- War Preview shows win chance, readiness, risks, and advice.
- Candidate selection does not crash.

## 6. Turn advancement

1. If the Pre-turn Risk Center reports blockers, resolve or acknowledge them.
2. Save the game.
3. Advance one year.
4. Read the annual report.
5. Return to Dashboard.

Pass criteria:

- Turn advancement completes.
- Annual report renders.
- Dashboard still works after the turn.

## 7. Save/load

1. Save the game.
2. Reload the page.
3. Load the saved game.
4. Confirm Dashboard state remains usable.

Pass criteria:

- Save exists.
- Load succeeds.
- No blank screen after load.

## 8. Release decision

Mark the preview as ready only if all sections pass.

If any section fails, create a bug issue with:

- Build marker.
- Browser.
- Steps to reproduce.
- Screenshot if possible.
- Console error if available.
