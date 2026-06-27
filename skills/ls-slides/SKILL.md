---
name: ls-slides
description: Use this skill when creating, editing, previewing, or validating vanilla HTML slide decks with ls_slides; when discovering, inspecting, fetching, copying, or wiring ls_slides registry primitives; or when an agent needs a no-clone workflow for composing web presentation decks. Do not use for PowerPoint, Keynote, Google Slides, React/reveal.js decks, or installing/publishing ls_slides as a package unless the user explicitly wants plain HTML primitives copied into a deck.
compatibility: Requires Node.js 22+ for bundled dependency-free ESM scripts. Remote registry fetching requires network access; use --registry-root for local development or private-repo fallback.
---

# ls_slides

## Goal

Build copyable vanilla HTML/CSS/JS slide decks from the `ls_slides` registry without treating the repo as a runtime package, framework, generator, or clone-first dependency.

## When to use

- The user wants a web slide deck using `ls_slides` primitives.
- You need to discover, inspect, fetch, copy, or wire registry items into another folder.
- You need to preview a generated deck locally and validate reveal/export behavior.

Do not use this skill for native PowerPoint/Keynote/Google Slides work, framework slide systems, or package installation workflows unless the user explicitly asks to adapt `ls_slides` primitives into plain HTML.

## Default workflow

1. Confirm the target folder, deck purpose, and whether remote fetching or local `--registry-root` should be used.
2. Discover items with `scripts/list-items.mjs` or read `references/catalog.md`.
3. Inspect selected items and dependencies with `scripts/inspect-item.mjs --include-readme`.
4. Plan copying with `scripts/copy-items.mjs --dry-run`; review paths before writing.
5. Copy selected items and dependencies into the target folder.
6. Author or edit `index.html` using the deck shell contract in `references/deck-authoring.md`.
7. Preview with `scripts/serve-deck.mjs --root <target> --entry index.html`.
8. Use browser/screenshot review when available; check reveal steps, dense layouts, export mode, and console errors.

## Scripts

Run scripts from the repository or copied skill folder with Node.js:

- `scripts/list-items.mjs` — list/search registry items.
- `scripts/inspect-item.mjs` — inspect metadata, dependencies, files, and READMEs.
- `scripts/copy-items.mjs` — safely copy/fetch selected items plus dependencies into a target deck.
- `scripts/generate-catalog.mjs` — regenerate/check `references/catalog.md` from registry metadata.
- `scripts/serve-deck.mjs` — static preview server for any target deck folder.

All scripts support `--help`. Prefer `--json` for machine-readable planning and `--dry-run` before copy operations.

## References

- `references/registry-contract.md` — registry metadata, dependency, load-order, and item-type rules.
- `references/copy-workflow.md` — safe remote/local copy workflow and target structure.
- `references/deck-authoring.md` — required HTML shell, reveal contract, icons, and slide recipes.
- `references/catalog.md` — generated compact registry catalog; do not edit manually.
- `references/preview-validation.md` — preview server and visual validation checklist.

## Hard constraints

- Keep outputs vanilla HTML/CSS/JS.
- Do not add framework, Tailwind, charting, GSAP, or runtime dependencies unless a copied registry item explicitly documents one.
- Preserve `ls-` class and attribute conventions.
- Treat `registryDependencies` as files to copy, not npm packages to install.
- Use Lucide CDN only when using `data-lucide`; prefer inline SVG or text markers for fully offline decks.
