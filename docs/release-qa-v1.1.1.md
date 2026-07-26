# 1.1.1 Stable Patch QA

Every section is required before creating `v1.1.1`.

## 1. Release identity

- Package, lockfile, build marker, README badge, release notes, and system check say `1.1.1`.
- `npm run check:release-version` passes.

## 2. Automated gate

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

Pass only when strict TypeScript, data validation, shared-world parity, all tests, all stability simulations, the Pages build, and every bundle budget pass.

## 3. Traditional Chinese context

- Confirm `改善关系并签订条约` renders as `改善關係並簽訂條約`.
- Confirm `持续干旱，等待复苏` renders as `持續乾旱，等待復甦`.
- Confirm `亚得里亚海 · 里昂 · 亚拉里克` renders as `亞得里亞海 · 里昂 · 亞拉里克`.
- Confirm `补给系统 · 发掘古物 · 家里` renders as `補給系統 · 發掘古物 · 家裡`.

## 4. Browser regression

- Verify the launch marker and Dashboard system check show `1.1.1`.
- At 390 × 844, confirm no horizontal page overflow and “全部頁面” remains reachable.
- Confirm no browser console errors.

## 5. Publication

- Merge only a green PR into `main`.
- Wait for the matching Pages deployment.
- Verify the public build before creating annotated tag `v1.1.1`.
- Publish a non-prerelease GitHub Release from `release-notes-v1.1.1.md`.
