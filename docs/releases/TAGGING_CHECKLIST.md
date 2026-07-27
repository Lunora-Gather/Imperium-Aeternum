# Tagging and GitHub Release Checklist

Use this checklist only after `docs/releases/FINAL_QA.md` and the current versioned release QA pass.

## 1. Confirm the release source

- The worktree is clean.
- `main` is checked out and matches `origin/main`.
- `package.json` contains the intended package version.
- `src/buildInfo.ts` contains the intended public build marker.
- The latest `Deploy Pages` workflow for `main` is green.

## 2. Confirm the release tag

List the existing tag before creating anything:

```bash
git tag --list "v*"
git rev-list -n 1 <tag>
git rev-parse origin/main
```

Release tags are immutable records. Never move or overwrite an already-published tag. If a
published tag points to an older commit, create the next version tag instead.

For a new immutable release tag:

```bash
git tag -a <tag> -m "<release title>" origin/main
git push origin <tag>
```

## 3. Publish the GitHub release

- Target the newly created tag.
- Mark only preview builds as prereleases; stable releases must not use the prerelease flag.
- Use the corresponding versioned notes, such as `docs/releases/release-notes-v1.1.1.md`.
- Include the public Pages URL.
- Do not attach local saves, credentials, `.env` files, or generated secrets.

Verify the result:

```bash
gh release view <tag> --json tagName,isPrerelease,targetCommitish,url
```

## 4. Post-release verification

- Open the public Pages URL in a fresh tab.
- Confirm the expected build marker.
- Start or load a campaign.
- Open at least one lazy-loaded screen.
- Save, reload, and load the campaign.
- Confirm the release URL and notes are public.

If any verification fails, keep the tag unchanged, fix `main`, publish Pages again, and use a
new version tag when a new immutable release snapshot is required.
