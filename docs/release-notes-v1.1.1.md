# Imperium Aeternum 1.1.1

1.1.1 is a focused language-quality patch for the stable 1.1 line.

## Play now

https://lunora-gather.github.io/Imperium-Aeternum/

## What changed

- Traditional Chinese fallback now applies a compact context-aware correction pass after character conversion.
- Diplomacy, events, technologies, buildings, and generated guidance now use correct forms such as `關係`, `簽訂`, `乾旱`, `復甦`, `動盪`, `鐵製`, and `彙編`.
- Historic and transliterated names retain semantic `里`, including `亞得里亞海`, `里昂`, `毛里塔尼亞`, and `亞拉里克`.
- Guard cases ensure that unrelated terms such as `系統`, `發掘`, and `家裡` remain correct.

## Performance

The context table adds about 1.2 KiB of raw JavaScript to the locale layer. Entry, App, account, diplomacy, largest-chunk, and CSS limits are unchanged. The total JavaScript inventory remains bounded at 1171 KiB.

## Verification

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

The release also requires the browser checks in [`release-qa-v1.1.1.md`](release-qa-v1.1.1.md).

The verified suite contains 499 tests across 95 test files, plus classic, regional, and full-world stability simulations.

## Compatibility

- Save schema remains `v7`; existing local and cloud saves require no migration.
- Appwrite shared worlds and Hugging Face briefing boundaries are unchanged.
- The immutable 1.1.0 release remains available as `v1.1.0`.
