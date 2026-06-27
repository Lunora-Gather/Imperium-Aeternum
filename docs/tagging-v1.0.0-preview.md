# v1.0.0-preview Tagging Checklist

Use this checklist immediately before creating the `v1.0.0-preview` tag.

## 1. Confirm source

Release source must be:

```text
main
```

Do not tag from old optimization branches.

## 2. Confirm build marker

Expected build marker:

```text
1.0.0-public-preview
```

## 3. Run release candidate checks

```bash
npm ci
npm run rc:check
```

This must complete:

- TypeScript check.
- Data validation.
- Stability tests.
- Targeted advisor/command tests.
- Pages-compatible build.

## 4. Deploy Pages

Use GitHub Actions:

```text
Deploy Pages
```

Then open:

```text
https://lunora-gather.github.io/Imperium-Aeternum/
```

## 5. Manual QA

Run:

- `docs/public-preview-qa.md`
- `docs/release-checklist.md`

The release must not be tagged if any critical smoke test fails.

## 6. Create tag

After checks pass:

```bash
git checkout main
git pull
git tag v1.0.0-preview
git push origin v1.0.0-preview
```

## 7. Release notes

Use:

```text
docs/release-notes-v1.0.0-preview.md
```

## 8. Post-tag verification

After the tag is pushed:

- Confirm GitHub shows the tag.
- Confirm Pages still loads.
- Confirm no release-critical issue is open.
