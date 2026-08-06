# Protected Optimization & Storage Features

These features are intentionally excluded from structural cleanup.

## Image upload pipeline
- High-resolution originals may be selected by the administrator.
- Optimize in the browser before upload.
- Keep aspect ratio.
- Maximum long edge: 1920px.
- Do not upscale smaller images.
- Output: WebP, quality 87%.
- Use high-quality image smoothing/resampling.
- Source upload safety limit: 30MB.
- Store the optimized result in R2; do not duplicate the original.

## Storage architecture
- R2: managed image files.
- D1: structured site/content data.
- localStorage: fallback/compatibility cache, not the primary store.
- Replaced/permanently deleted managed images should be cleaned from R2.
- Static `/images` assets are not part of managed R2 cleanup.

## Front-end performance
- Prioritize critical/first-view imagery where implemented.
- Preserve lazy loading for non-critical imagery.
- Preserve asynchronous image decoding.
- Preserve `content-visibility` and related rendering optimizations.

## Refactoring rule
These are behavior contracts. Structural cleanup may reorganize unrelated code, but must not remove or weaken these behaviors without explicit owner approval.
