# Tagging Checklist — 1.0 Public Preview

Use this checklist before creating the `v1.0.0-preview` tag.

## Required automated gate

Run locally or verify in CI:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

Do not tag if this command fails.

## Required manual QA

Complete `docs/FINAL_QA.md`.

Minimum required manual checks:

- Open the Pages build.
- Confirm the build marker is the final public preview marker.
- Start a classic scenario.
- Confirm Dashboard renders.
- Advance one year.
- Save to slot 1.
- Reload and load slot 1.
- Open Economy, Diplomacy, Military, Stats, Chronicle, and Save pages.
- Confirm no blank page appears.

## Files to finalize before tag

- `src/buildInfo.ts`
- `README.md`
- `docs/RELEASE_NOTES_DRAFT.md`
- `docs/GITHUB_RELEASE_DRAFT.md`
- `.github/workflows/deploy-preview-pages.yml`

## Version marker

Before tagging, change:

```ts
export const BUILD_MARK = 'V53 rc-check';
```

to a final marker such as:

```ts
export const BUILD_MARK = '1.0.0-public-preview';
```

Then update README and release notes to match.

## Suggested GitHub Release settings

```text
Tag: v1.0.0-preview
Target: main
Title: Imperium Aeternum 1.0 Public Preview
Prerelease: true
Latest release: false until manually verified
```

## Stop conditions

Do not tag if:

- Pages deployment is not visible.
- `rc:check` fails.
- Save/load fails.
- Dashboard fails to render.
- README and build marker disagree.
- There is an open high-risk integration PR.

## After tagging

- Publish GitHub Release using `docs/GITHUB_RELEASE_DRAFT.md`.
- Verify the online Pages link.
- Add any remaining issues to a post-1.0 balance backlog.
