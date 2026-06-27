# Plan: Agent-primary skill and registry usability pass

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

`ls_slides` has matured into a broad copyable registry of vanilla HTML, CSS, and JavaScript slide-building blocks. The next step is not another primitive batch. The primary product surface should become an Agent Skill that lets AI coding agents discover the registry, fetch or copy the right assets into arbitrary downstream folders, author slide decks there, and run a lightweight local preview server for validation.

The repository must remain a copyable registry. It must not become a framework, generator, runtime package, npm dependency, or clone-first workflow.

## Goals

- Reframe project direction as **agent-primary** while keeping files human-readable for review/debugging.
- Add a production-quality Agent Skill under `skills/ls-slides/`.
- Let agents consume the registry **without requiring a local clone** by supporting remote raw-file fetching as the default path, with local registry root as an override for repo development.
- Add agent-oriented references for registry discovery, item selection, deck authoring, copying/fetching, wiring, and preview validation.
- Add dependency-free Node scripts for repeatable agent operations:
  - list/search registry items,
  - inspect item metadata/docs,
  - copy/fetch selected items and dependencies into a target project,
  - generate the agent catalog reference from registry metadata,
  - serve an arbitrary generated deck folder locally.
- Preserve the current registry item format and validation.
- Avoid human-focused documentation/site work.

## User constraints

- Use `pnpm` only for project validation.
- Preserve vanilla, dependency-free, copyable HTML/CSS/JS registry architecture.
- No framework, generator, runtime package, Tailwind, charting library, GSAP, or new root dependency.
- Primary audience is AI agents, not humans.
- Agent Skill should include proper references and scripts.
- Agents should be able to explore/fetch/copy correct resources into other folders.
- Agents should not need to clone this repository or consume it as a package/library.
- The skill needs a lightweight server script agents can use to play/preview the slide show they created.

## Research performed

- Agent Skills specification: skill directories contain `SKILL.md` plus optional `scripts/`, `references/`, and `assets/`; `name` and `description` are the trigger surface; progressive disclosure is expected.
- Agent Skills best practices: keep `SKILL.md` concise; move detailed material to references; ground skills in project artifacts and failure modes; scripts should handle fragile repeatable operations.
- Agent Skills script guidance: scripts must be non-interactive, support `--help`, use safe/idempotent defaults, output structured data where useful, print diagnostics to stderr, and avoid unbounded output.
- shadcn registry docs: useful registry concepts include root manifest, per-item metadata, `registryDependencies`, file lists, targets, categories/tags, docs, and dependency resolution. `ls_slides` remains shadcn-inspired but not shadcn CLI-compatible.
- HeyGen HyperFrames research: strong inspiration for an agent-first HTML-native registry. It uses skills, registry tooling, non-interactive agent commands, reusable blocks/components, install/wire guidance, and preview/render validation loops.
- Current repo audit:
  - `PROJECT.md` still frames humans and AI agents equally and mentions future human docs-site direction.
  - `skills/README.md` is only a placeholder.
  - `registry.json` is path-only and sufficient for validation, but not ideal as a compact agent discovery catalog.
  - Registry item metadata does **not** contain `title`; scripts/catalog should derive display labels from `name` or use `description`.
  - `scripts/serve-examples.mjs` is examples/repo-specific and not appropriate for arbitrary target-folder preview.
  - `core/base` includes `icons.css` and examples use Lucide from CDN; icon usage needs explicit guidance.
  - Registry already has 50 validated items and explicit local dependency metadata.

## Decisions

1. **Create one main skill first: `skills/ls-slides/`.**
   - Do not create multiple domain skills yet. The catalog is not large enough to justify a HyperFrames-style router plus many atomic skills.
   - Keep the main `SKILL.md` concise and route to references/scripts.

2. **Remote raw registry fetching is required in the first implementation.**
   - Default consumption should not require a clone.
   - Scripts should support the canonical raw registry URL by default: `https://raw.githubusercontent.com/maxedapps/slidesls/main`. The repository is expected to become public before the skill ships, so unauthenticated raw fetching is the intended default distribution path.
   - Scripts should also support `--registry-root <path>` for local repo development and tests.
   - Scripts should support `--registry-url <url>` for alternate remotes/forks and future pinning.

3. **Keep the registry item format stable.**
   - Do not rewrite `registry.json` or `registry-item.json` format in this pass.
   - Do not add required `title` fields. Derive display labels from `name` when needed.
   - Add generated/derived agent catalog references instead of changing the source-of-truth schema.

4. **No human docs site work.**
   - Replace or supplement docs only where agents need operational guidance.
   - De-emphasize Astro/docs-site direction in `PROJECT.md` unless explicitly framed as an agent-readable reference surface.

5. **Add a separate target preview server.**
   - Keep `scripts/serve-examples.mjs` for repo examples.
   - Add `skills/ls-slides/scripts/serve-deck.mjs` for arbitrary generated target folders.

6. **Make copy/fetch operations safe by default.**
   - `copy-items.mjs` should support dry-run planning, refuse overwrite by default, prevent path traversal, resolve dependencies deterministically, and emit machine-readable JSON.

7. **Document icon behavior honestly.**
   - Registry primitives are dependency-free, but optional icon rendering may rely on Lucide if agents choose to use `data-lucide` patterns from examples.
   - Deck authoring guidance should either include the Lucide CDN script when icons are used or recommend inline SVG/text alternatives for fully offline decks.

## Alternatives considered

### Alternative A — Human documentation polish only

Rejected. The user explicitly wants AI-agent consumption and no human-focused documentation. Human docs would not solve repeated agent tasks like dependency resolution, copying/fetching, or preview serving.

### Alternative B — Build a full CLI/generator

Rejected. It risks turning `ls_slides` into a product/runtime/generator, violating the copyable registry model. Scripts should be helper tools for agents, not a user-facing framework.

### Alternative C — Make `registry.json` shadcn-compatible

Rejected for this pass. shadcn conventions are useful, but the current registry is vanilla slide-specific and explicitly not shadcn CLI-compatible. Compatibility can be revisited only if it directly improves agent consumption.

### Alternative D — HyperFrames-style multi-skill architecture immediately

Rejected for now. HyperFrames has many video workflows and a larger CLI/runtime surface. `ls_slides` should start with one focused skill and references. Split into multiple skills only after real usage shows distinct recurring workflows.

### Alternative E — Local-clone-only scripts

Rejected. This conflicts with the user’s requirement that agents should not need to clone this repo. Local root support is still useful for development, but remote raw fetching must be first-class.

## Implementation phases

### Phase 1 — Baseline audit and project framing

- [x] Run baseline validation:

  ```sh
  pnpm check
  ```

- [x] Review current `PROJECT.md`, `README.md`, `registry/README.md`, `skills/README.md`, `docs/primitive-expansion.md`, and `registry/core/base/README.md`.
- [x] Update `PROJECT.md` to state:
  - AI agents are the primary audience.
  - Human-readable files exist to support agent operations and review, not as the primary product surface.
  - The repo is not a library, runtime package, CLI generator, or clone-first dependency.
  - The primary consumption path is: Agent Skill → discover remote/local registry → fetch/copy selected files → compose downstream deck → preview locally.
  - Future docs-site work is secondary and should not displace agent references.
- [x] Update root `README.md` to briefly match the agent-primary framing.
- [x] Update `skills/README.md` to introduce project-local skills and point to `skills/ls-slides/` once created.

### Phase 2 — Extract the real runtime/deck contract from source

Before writing references, ground them in source files rather than memory.

- [x] Inspect and summarize:
  - `registry/core/base/slide.css`,
  - `registry/core/base/slide-runtime.js`,
  - `registry/core/base/README.md`,
  - all current example `index.html` files.
- [x] Document the required shell contract:
  - `<body class="ls-page">`,
  - `.ls-stage`,
  - `.ls-deck[data-ls-deck]`,
  - `.ls-slide`,
  - `.ls-slide__inner`,
  - `.ls-slide__body` where applicable,
  - `data-ls-export` / `?export=1` behavior where applicable.
- [x] Document reveal contract:
  - `.ls-reveal`,
  - `data-step`,
  - runtime-generated `data-ls-step` and `data-ls-reveal-state`,
  - `data-ls-reveal-sequence`,
  - `data-ls-sequence-skip`,
  - animation variant load order after `animations/reveal`.
- [x] Document optional icon contract:
  - `icons.css` supports generic icon sizing,
  - `data-lucide` requires Lucide script initialization if used,
  - inline SVG/text markers are the dependency-free fallback.

### Phase 3 — Create the `ls-slides` Agent Skill skeleton

Create:

```txt
skills/ls-slides/
  SKILL.md
  references/
  scripts/
```

`SKILL.md` requirements:

- [x] Valid Agent Skill frontmatter:
  - `name: ls-slides`
  - concise, trigger-friendly `description` under 1024 characters,
  - optional `compatibility` noting Node.js 22+ for bundled dependency-free ESM scripts and optional network access for remote registry fetching.
- [x] Description should trigger on:
  - creating/editing web slide decks with `ls_slides`,
  - discovering/copying/fetching/wiring registry items,
  - composing vanilla HTML/CSS/JS decks from the registry,
  - running local deck preview.
- [x] Description should avoid false triggers for:
  - PowerPoint/Keynote/Google Slides,
  - React/reveal.js/other slide frameworks unless the user explicitly wants to copy `ls_slides` primitives into plain HTML,
  - publishing or installing `ls_slides` as a package.
- [x] Body should include:
  - when to use / not use,
  - default workflow,
  - available scripts,
  - reference files and when to read them,
  - hard constraints and gotchas.
- [x] Keep `SKILL.md` lean; do not paste the full primitive catalog into it.

Suggested default workflow in `SKILL.md`:

1. Confirm target folder and slide intent.
2. Use `scripts/list-items.mjs` or `references/catalog.md` to select primitives.
3. Inspect selected items with `scripts/inspect-item.mjs` and relevant item READMEs.
4. Fetch/copy required items with `scripts/copy-items.mjs --dry-run`, then actual copy after checking the plan.
5. Author/modify `index.html` in target folder.
6. Run `scripts/serve-deck.mjs --root <target> --entry index.html`.
7. Use browser/screenshot review where available; iterate.

### Phase 4 — Add shared registry source utilities for scripts

Before individual scripts, implement or inline a small shared utility pattern. Avoid new dependencies.

- [x] Decide whether to create `skills/ls-slides/scripts/lib/registry-source.mjs` or keep utilities duplicated in simple scripts. Created shared `scripts/lib/registry-source.mjs`.
- [x] Support two source modes everywhere:
  - local: `--registry-root <path>`,
  - remote: `--registry-url <raw-base-url>`.
- [x] Default remote base should point to the canonical raw GitHub root once confirmed:

  ```txt
  https://raw.githubusercontent.com/maxedapps/slidesls/main
  ```

- [x] For remote mode, fetch:
  - `registry.json`,
  - listed `registry-item.json` files,
  - item docs when requested,
  - implementation files during copy.
- [x] For local mode, read from disk.
- [x] Normalize errors so agents can self-correct:
  - invalid URL,
  - 404/missing file,
  - malformed JSON,
  - unknown item,
  - network unavailable.
- [x] Keep structured data on stdout and diagnostics on stderr.

### Phase 5 — Add registry discovery and catalog scripts

All scripts should be dependency-free Node ESM, live under `skills/ls-slides/scripts/`, support `--help`, and print diagnostics to stderr.

#### `list-items.mjs`

Purpose: let agents discover items without manually parsing many files.

Required behavior:

- [x] Args:
  - `--registry-root <path>` optional local source,
  - `--registry-url <url>` optional remote source, defaulting to canonical raw URL,
  - `--type <ls:layout|ls:component|ls:animation|ls:preset|ls:core>` optional,
  - `--query <text>` optional search across name/description/type/docs summary if available,
  - `--json` for machine-readable output,
  - `--limit <n>` optional.
- [x] Output compact item summaries:
  - name,
  - derived display label from name,
  - type,
  - description,
  - dependencies,
  - docs path,
  - files.
- [x] Do not assume a `title` field exists.
- [x] Exit non-zero with clear errors when registry source is invalid.

#### `inspect-item.mjs`

Purpose: inspect one or more selected items deeply.

Required behavior:

- [x] Args:
  - `--registry-root <path>` optional,
  - `--registry-url <url>` optional,
  - `--item <name>` repeatable or comma-separated,
  - `--include-readme` optional,
  - `--json` optional.
- [x] Resolve dependencies and include ordered dependency list.
- [x] Include README path/content when requested.
- [x] Include copyable file paths and suggested load-order notes.
- [x] Do not assume a `title` field exists.

#### `generate-catalog.mjs`

Purpose: produce `references/catalog.md` from registry metadata to minimize drift.

Required behavior:

- [x] Args:
  - `--registry-root <path>` optional,
  - `--registry-url <url>` optional,
  - `--output <path>` defaulting to `skills/ls-slides/references/catalog.md`,
  - `--check` to verify the generated file is up to date without writing.
- [x] Group items by core, layouts, components, animations, and presets.
- [x] Include name, derived display label, type, description, dependencies, files, and docs path.
- [x] Keep output deterministic.
- [x] Do not manually curate a second catalog source.

### Phase 6 — Add safe copy/fetch script

Create `skills/ls-slides/scripts/copy-items.mjs`.

Purpose: fetch/copy selected registry items and dependencies into arbitrary target folders safely.

Required behavior:

- [x] Args:
  - `--registry-root <path>` optional local source,
  - `--registry-url <url>` optional remote source, defaulting to canonical raw URL,
  - `--target <path>`,
  - `--items <name,name,...>` or repeatable `--item <name>`,
  - `--base-dir <relative>` default `ls-slides`,
  - `--include-docs` optional,
  - `--dry-run`,
  - `--force` for overwrites,
  - `--json`.
- [x] Resolve dependencies recursively and deterministically.
- [x] Fetch/copy implementation files preserving registry-relative category paths under target base dir.
- [x] Optionally copy `README.md` and `registry-item.json` for traceability.
- [x] Write a target manifest such as `ls-slides/manifest.json` with:
  - copied items,
  - source mode and source URL/root,
  - copied files,
  - dependency order.
- [x] Omit timestamps from manifest unless there is a strong reason; deterministic output is better for checks.
- [x] Refuse to write outside target root.
- [x] Refuse overwrites unless `--force`.
- [x] Support dry-run JSON plan for agent review before mutation.
- [x] If remote fetch fails, provide a clear suggestion to retry with `--registry-root <local-repo>` only as a fallback.

### Phase 7 — Add agent references

Create concise references under `skills/ls-slides/references/`. Keep them operational and agent-focused.

#### `registry-contract.md`

- [x] Explain source-of-truth files:
  - `registry.json`,
  - per-item `registry-item.json`,
  - item `README.md`,
  - implementation files.
- [x] Explain item types:
  - `ls:core`, `ls:layout`, `ls:component`, `ls:animation`, `ls:preset`.
- [x] Explain dependency semantics:
  - `registryDependencies` are registry items, not npm packages,
  - `dependencies`/`devDependencies` are expected to stay empty unless a future item explicitly requires otherwise,
  - `core/base` must load first,
  - animation variants generally require `animations/reveal` first.
- [x] Document CSS/JS load-order contract based on Phase 2 source extraction.
- [x] State that no registry item should force a framework or root package install.
- [x] State that item metadata has no `title`; agents should use `name`/description.

#### `copy-workflow.md`

- [x] Explain remote default and local override:
  - default `--registry-url`,
  - optional `--registry-root` for local development.
- [x] Explain the safe copy algorithm:
  - resolve selected items,
  - recursively resolve dependencies,
  - topologically order them,
  - fetch/copy implementation files,
  - optionally copy READMEs/metadata for traceability,
  - refuse overwrite unless explicit.
- [x] Recommend target structure for generated decks, e.g.:

  ```txt
  target-deck/
    index.html
    ls-slides/
      registry/core/base/...
      registry/layouts/...
      registry/components/...
      registry/animations/...
      registry/presets/...
  ```

- [x] Explain how to link copied CSS/JS files from `index.html`.
- [x] Include path-safety and overwrite rules.

#### `deck-authoring.md`

- [x] Provide agent-first deck shell guidance extracted from Phase 2:
  - required `<link>` order,
  - `.ls-page`, `.ls-stage`, `.ls-deck[data-ls-deck]`, `.ls-slide`, `.ls-slide__inner`, `.ls-slide__body`,
  - runtime module script,
  - reveal usage with `.ls-reveal`, `data-step`, and sequencing attributes,
  - export mode query/attribute behavior.
- [x] Include optional icon guidance:
  - use Lucide CDN script only if using `data-lucide`,
  - prefer inline SVG/text for dependency-free/offline decks.
- [x] Include compact slide recipes by intent:
  - title/opening,
  - comparison,
  - dashboard,
  - timeline/process,
  - code explainer,
  - quote/editorial,
  - annotated visual.
- [x] Point agents to example decks as visual references, but do not make examples the source of truth.

#### `catalog.md`

- [x] Generated by `generate-catalog.mjs`; do not manually maintain.
- [x] Include for each item:
  - name,
  - derived display label,
  - type,
  - one-line description/use case,
  - dependencies,
  - implementation files,
  - docs path.
- [x] Keep it compact enough for agents to read when needed.

#### `preview-validation.md`

- [x] Explain how agents should run the deck server.
- [x] Explain live preview checks:
  - open slide 1,
  - navigate with keyboard,
  - test reveal steps,
  - test `data-ls-reveal-sequence` when used,
  - test dense slides,
  - test export mode if applicable,
  - inspect browser console when possible.
- [x] Include common failure modes:
  - missing `data-ls-deck`,
  - missing `.ls-page`/`.ls-stage`,
  - missing `core/base`,
  - wrong CSS order,
  - animation variant loaded before `reveal`,
  - missing `data-step`,
  - missing Lucide script for `data-lucide` icons,
  - clipped content,
  - unsafe overlay/annotation.

### Phase 8 — Add target-folder deck preview server

Create `skills/ls-slides/scripts/serve-deck.mjs`.

Purpose: let agents preview any generated `ls_slides` deck folder, not only repo examples.

Required behavior:

- [x] Args:
  - `--root <path>` required or default current working directory,
  - `--entry <file>` default `index.html`,
  - `--host <host>` default `127.0.0.1`,
  - `--port <port>` default `4173`,
  - `--json` to print machine-readable server info,
  - `--help`.
- [x] Serve static files only from `--root`.
- [x] Prevent path traversal.
- [x] Serve `/` as the entry document or redirect to it.
- [x] Support common MIME types already used by `serve-examples.mjs`.
- [x] Print stable URL for agents.
- [x] No live reload required.
- [x] Factor shared static-server logic only if it remains simple; intentional duplication with `serve-examples.mjs` is acceptable to keep the skill self-contained.

Add optional root script only if useful for repo validation:

```json
"serve:deck": "node skills/ls-slides/scripts/serve-deck.mjs"
```

This root alias is convenient for repo validation, but consumers can still run the skill script directly.

### Phase 9 — Add a minimal deck shell asset if it improves reliability

Consider adding `skills/ls-slides/assets/minimal-deck.html`.

If added:

- [x] Keep it minimal and copyable.
- [x] Use relative paths matching `copy-items.mjs` default target structure.
- [x] Include two slides and one reveal step.
- [x] Include comments that agents should remove after customization.
- [x] Include no optional Lucide dependency by default.
- [x] Do not make it a generator template with many knobs.

If not added:

- [x] Put a compact shell snippet in `deck-authoring.md` instead.

### Phase 10 — Integrate validation

- [x] Add a skill/catalog validation script if useful:

  ```json
  "validate:skills": "node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check"
  ```

- [x] Consider extending `pnpm check` to include skill/catalog validation once stable. Added `validate:skills` to `pnpm check`.
- [x] Validate Agent Skill format if tooling is available:

  ```sh
  npx -y skills-ref validate skills/ls-slides
  ```

- [x] If `skills-ref` is unavailable or flaky, manually validate:
  - directory name matches `name`,
  - `name` is lowercase/kebab-case and under 64 chars,
  - `description` is under 1024 chars,
  - scripts support `--help`,
  - references are linked from `SKILL.md` with shallow relative paths.

### Phase 11 — End-to-end dogfood test

Create a temporary deck outside the repo, e.g. `/tmp/ls-slides-skill-dogfood`.

- [x] Use remote default mode first, not `--registry-root`: Remote default attempted; raw GitHub returned 404 while repo is still unavailable/private, as expected from plan risk. Local override validation completed.

  ```sh
  node skills/ls-slides/scripts/list-items.mjs --json
  node skills/ls-slides/scripts/inspect-item.mjs --item layouts/title-hero --include-readme --json
  node skills/ls-slides/scripts/copy-items.mjs --target /tmp/ls-slides-skill-dogfood --items layouts/title-hero,components/badge,animations/reveal --dry-run --json
  node skills/ls-slides/scripts/copy-items.mjs --target /tmp/ls-slides-skill-dogfood --items layouts/title-hero,components/badge,animations/reveal --include-docs
  ```

- [x] Repeat key commands with `--registry-root .` to validate local development mode.
- [x] Author `index.html` in the temp folder using copied files.
- [x] Run:

  ```sh
  node skills/ls-slides/scripts/serve-deck.mjs --root /tmp/ls-slides-skill-dogfood --entry index.html --host 127.0.0.1 --port 4173 --json
  ```

- [x] Use curl smoke tests.
- [x] Use browser automation/screenshots if available to confirm deck displays and reveal navigation works.
- [x] Delete temp artifacts after validation unless needed for debugging. Temp files were kept under `/tmp` only and are untracked.

### Phase 12 — Documentation cleanup and consistency pass

- [x] Remove or rephrase remaining human-docs-primary language where it conflicts with agent-primary framing.
- [x] Ensure references point to source-of-truth files rather than duplicating too much item-specific documentation.
- [x] Ensure `registry/README.md` remains concise and source-of-truth for registry mechanics.
- [x] Ensure `docs/primitive-expansion.md` still explains primitive strategy but does not imply human docs are the main consumption path.
- [x] Ensure no generated screenshots/logs/temp decks are committed.

### Phase 13 — Peer review, fixes, and commit

- [x] Run full validation:

  ```sh
  pnpm fmt
  pnpm check
  node --check skills/ls-slides/scripts/list-items.mjs
  node --check skills/ls-slides/scripts/inspect-item.mjs
  node --check skills/ls-slides/scripts/generate-catalog.mjs
  node --check skills/ls-slides/scripts/copy-items.mjs
  node --check skills/ls-slides/scripts/serve-deck.mjs
  ```

- [x] Run any new npm scripts added for skill/catalog validation.
- [x] Run end-to-end dogfood test in remote default mode and local override mode.
- [x] Run fresh peer review focused on:
  - skill triggering and false positives,
  - no-clone remote consumption,
  - agent workflow clarity,
  - script safety,
  - Lucide/icon dependency guidance,
  - preservation of copyable registry model,
  - whether `PROJECT.md` accurately reflects agent-primary goals.
- [x] Address blocking feedback.
- [x] Commit with a concise message such as:

  ```sh
  git commit -m "Add agent-primary ls_slides skill workflow"
  ```

## Validation checklist

Core validation:

```sh
pnpm fmt
pnpm check
```

Skill validation:

```sh
npx -y skills-ref validate skills/ls-slides
```

Script syntax validation:

```sh
node --check skills/ls-slides/scripts/list-items.mjs
node --check skills/ls-slides/scripts/inspect-item.mjs
node --check skills/ls-slides/scripts/generate-catalog.mjs
node --check skills/ls-slides/scripts/copy-items.mjs
node --check skills/ls-slides/scripts/serve-deck.mjs
```

Script behavior validation examples:

```sh
node skills/ls-slides/scripts/list-items.mjs --json
node skills/ls-slides/scripts/list-items.mjs --registry-root . --json
node skills/ls-slides/scripts/inspect-item.mjs --item layouts/metric-dashboard --include-readme --json
node skills/ls-slides/scripts/inspect-item.mjs --registry-root . --item layouts/metric-dashboard --include-readme --json
node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check
node skills/ls-slides/scripts/copy-items.mjs --target /tmp/ls-slides-skill-dogfood --items layouts/title-hero,components/badge,animations/reveal --dry-run --json
node skills/ls-slides/scripts/copy-items.mjs --registry-root . --target /tmp/ls-slides-skill-dogfood-local --items layouts/title-hero,components/badge,animations/reveal --dry-run --json
node skills/ls-slides/scripts/serve-deck.mjs --root /tmp/ls-slides-skill-dogfood --entry index.html --host 127.0.0.1 --port 4173 --json
```

HTTP smoke validation:

```sh
curl -I http://127.0.0.1:4173/
curl -I http://127.0.0.1:4173/index.html
```

## Risks and mitigations

- **Risk: Skill becomes too large and context-heavy.**
  - Mitigation: keep `SKILL.md` short; move catalog and recipes into references; generate catalog.

- **Risk: Scripts accidentally become a user-facing CLI/generator.**
  - Mitigation: keep scripts inside the skill; frame them as agent helper scripts; avoid npm publishing or global install assumptions.

- **Risk: Registry docs and skill catalog drift.**
  - Mitigation: generate `catalog.md` from registry metadata and add `--check` validation.

- **Risk: Remote fetch cannot be validated before the repo is public.**
  - Mitigation: implement with the confirmed canonical raw URL, keep `--registry-url` override, validate against `--registry-root .` while private, and run remote-default dogfood once the repo is public.

- **Risk: Copy script overwrites user work.**
  - Mitigation: dry-run support, refuse overwrites by default, require `--force`, structured copy plan.

- **Risk: Path traversal or copying outside target root.**
  - Mitigation: normalize and verify every output path stays under `--target`.

- **Risk: Agents overfit to examples instead of source primitives.**
  - Mitigation: references should point to item READMEs and registry metadata first; examples are visual QA references only.

- **Risk: Icon examples create hidden CDN dependency.**
  - Mitigation: document Lucide explicitly; default minimal shell should avoid icons; offer inline SVG/text fallback.

- **Risk: Preview server exposes unintended files.**
  - Mitigation: host defaults to `127.0.0.1`; serve only under explicit `--root`; block path traversal.

## Rollback

If implementation causes problems:

- Revert `skills/ls-slides/` and associated npm script additions.
- Revert `PROJECT.md`/README framing changes if they overcorrect.
- Keep existing registry items untouched; this plan should not require primitive CSS/runtime changes.
- Existing examples and registry validation should continue to work independently of the new skill.

## Validation results

- `pnpm check` passed with registry validation and generated catalog validation.
- Script syntax checks passed for all five skill scripts.
- `npx -y skills-ref validate skills/ls-slides` passed.
- Local behavior checks passed for `list-items`, `inspect-item`, `generate-catalog --check`, `copy-items --dry-run`, and actual copy with `--registry-root .`.
- Remote-default `list-items` was attempted and returned raw GitHub 404 while the repository is unavailable/private; the script produced the intended fallback guidance.
- Dogfood deck was created under `/tmp/ls-slides-skill-dogfood-local`, served with `serve-deck.mjs`, smoke-tested with curl, and browser-checked with `data-ls-ready="true"` and 2 slides.

## Implementation peer review outcome

- Fresh implementation review found the skill workflow acceptable as-is with no blocking bugs.
- Reviewer verified skill structure, no-clone/local source handling, dependency ordering, overwrite/path safety, serve-root confinement, reference accuracy against runtime source, and agent-primary framing.
- One non-blocking docs consistency issue was fixed: `references/registry-contract.md` now aligns preset/load-order guidance with `registry/README.md`.
- Known accepted limitation: remote default raw GitHub fetch cannot pass end-to-end until the repository is public; scripts already provide clear fallback guidance to `--registry-root`.

## Commits

- `33a6fdf` — `Add agent-primary ls_slides skill workflow`
- Final tracking commit — `Finalize agent skill implementation tracking`

## Peer review summary

A fresh draft review found the plan direction strong but required four corrections before finalization:

- Make remote/no-clone registry consumption first-class instead of deferring it.
- Remove reliance on a non-existent `title` metadata field.
- Extract the actual deck/runtime/reveal contract from source before writing references.
- Document Lucide/icon behavior so agents do not create decks with missing icons or hidden assumptions.

This final plan incorporates those corrections. A follow-up review flagged private-repo raw fetching as the only blocker; the user confirmed the repo will become public before the skill ships, so the plan intentionally keeps unauthenticated raw GitHub fetching as the default future distribution path while preserving local `--registry-root` validation during implementation.

## Implementation notes

- Removed generated HTML plan preview before implementation.
- Baseline `pnpm check` passed with 50 registry items.

- Implemented `skills/ls-slides/SKILL.md`, operational references, generated catalog, minimal deck asset, and dependency-free Node scripts.
- Added `pnpm validate:skills` and included it in `pnpm check`.
- Remote default behavior is implemented and was attempted; current raw GitHub URL returned 404 while the repo remains unavailable/private, so local `--registry-root .` was used for full behavioral validation.
