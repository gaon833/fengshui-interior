# Fengshui Interior maintenance rules

This project is maintained with a minimal-change, root-cause-first workflow inspired by Ponytail.

## Before editing
- Read the full call/style path for the feature before changing it.
- Reuse existing components, utilities, CSS tokens, and installed dependencies before adding anything.
- Prefer changing the shared source of truth once instead of patching each caller.
- Keep public appearance, responsive behavior, admin behavior, content shape, and URLs unchanged unless the task explicitly asks for a change.

## Change rules
- Root cause over symptom patches. Search all callers/selectors before touching shared code.
- Deletion or consolidation over another override. Avoid duplicate media-query patches when an existing rule can be corrected.
- Do not add dependencies for behavior supported by Next.js, React, TypeScript, CSS, or browser APIs already in use.
- Avoid version-suffixed replacement files (V8, V9, final2). Improve the current role-based file instead.
- Keep CSS responsibilities clear: tokens -> reset -> layout -> navigation -> project -> admin -> responsive -> delete-mode.
- Preserve accessibility, validation, security boundaries, error handling, and data-loss protections.

## Required checks
For non-trivial changes run the smallest relevant checks, then before release run:

```bash
npm run check
```

If dependencies are unavailable, at minimum run `npm run validate` and document why type/build checks could not run.

## Protected production features — DO NOT simplify/remove

The following are intentional production features and are outside cleanup/refactor scope unless the owner explicitly requests a functional change:

- Browser-side image optimization before upload.
- Preserve aspect ratio; only downscale oversized originals; never upscale small originals.
- Long-edge image cap of 1920px.
- WebP output at quality 87% with high-quality image smoothing/resampling.
- 30MB source-image upload safety limit.
- Upload/store only the optimized web image in Cloudflare R2 rather than duplicating the original.
- Cloudflare R2 image storage and its upload/delete/replacement cleanup flows.
- Cloudflare D1 as the structured content/data store.
- localStorage compatibility/fallback cache behavior.
- Image cleanup when managed images/projects are permanently deleted or replaced; static /images assets remain outside that cleanup.
- Above-the-fold / first-project priority loading behavior.
- Lazy loading for non-critical images.
- Asynchronous image decoding.
- content-visibility and related rendering/performance optimizations.

### Refactor guardrail
Cleanup work must treat the items above as behavior contracts, not dead code or accidental complexity.
Do not remove, merge away, rename semantically, or replace these paths merely to reduce line count.
When touching adjacent code, preserve observable behavior and storage lifecycle.
If a cleanup would require changing one of these contracts, stop and request explicit approval first.

