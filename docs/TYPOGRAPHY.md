# Typography (Avoid Clipping)

- Prefer `ThemedText` default styles (safe lineHeight + padding)
- Avoid setting tight `lineHeight` (keep ≥ 1.25× fontSize)
- Add `paddingVertical` when customizing titles/subtitles
- Do not crop text containers: avoid fixed heights; allow wrapping
- On Galaxy Tab S10 FE, avoid overriding lineHeight for titles; rely on defaults

Applied:
- Home screen: removed tight lineHeight on title/subtitle/button labels
