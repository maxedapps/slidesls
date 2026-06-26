# Plan: Agent-primary skill and registry usability pass

Date: 2026-06-26
Status: Final
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

- [ ] Run baseline validation:

  ```sh
  pnpm check
  ```

- [ ] Review current `PROJECT.md`, `README.md`, `registry/README.md`, `skills/README.md`, `docs/primitive-expansion.md`, and `registry/core/base/README.md`.
- [ ] Update `PROJECT.md` to state:
  - AI agents are the primary audience.
  - Human-readable files exist to support agent operations and review, not as the primary product surface.
  - The repo is not a library, runtime package, CLI generator, or clone-first dependency.
  - The primary consumption path is: Agent Skill → discover remote/local registry → fetch/copy selected files → compose downstream deck → preview locally.
  - Future docs-site work is secondary and should not displace agent references.
- [ ] Update root `README.md` to briefly match the agent-primary framing.
- [ ] Update `skills/README.md` to introduce project-local skills and point to `skills/ls-slides/` once created.

### Phase 2 — Extract the real runtime/deck contract from source

Before writing references, ground them in source files rather than memory.

- [ ] Inspect and summarize:
  - `registry/core/base/slide.css`,
  - `registry/core/base/slide-runtime.js`,
  - `registry/core/base/README.md`,
  - all current example `index.html` files.
- [ ] Document the required shell contract:
  - `<body class="ls-page">`,
  - `.ls-stage`,
  - `.ls-deck[data-ls-deck]`,
  - `.ls-slide`,
  - `.ls-slide__inner`,
  - `.ls-slide__body` where applicable,
  - `data-ls-export` / `?export=1` behavior where applicable.
- [ ] Document reveal contract:
  - `.ls-reveal`,
  - `data-step`,
  - runtime-generated `data-ls-step` and `data-ls-reveal-state`,
  - `data-ls-reveal-sequence`,
  - `data-ls-sequence-skip`,
  - animation variant load order after `animations/reveal`.
- [ ] Document optional icon contract:
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

- [ ] Valid Agent Skill frontmatter:
  - `name: ls-slides`
  - concise, trigger-friendly `description` under 1024 characters,
  - optional `compatibility` noting Node.js 22+ for bundled dependency-free ESM scripts and optional network access for remote registry fetching.
- [ ] Description should trigger on:
  - creating/editing web slide decks with `ls_slides`,
  - discovering/copying/fetching/wiring registry items,
  - composing vanilla HTML/CSS/JS decks from the registry,
  - running local deck preview.
- [ ] Description should avoid false triggers for:
  - PowerPoint/Keynote/Google Slides,
  - React/reveal.js/other slide frameworks unless the user explicitly wants to copy `ls_slides` primitives into plain HTML,
  - publishing or installing `ls_slides` as a package.
- [ ] Body should include:
  - when to use / not use,
  - default workflow,
  - available scripts,
  - reference files and when to read them,
  - hard constraints and gotchas.
- [ ] Keep `SKILL.md` lean; do not paste the full primitive catalog into it.

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

- [ ] Decide whether to create `skills/ls-slides/scripts/lib/registry-source.mjs` or keep utilities duplicated in simple scripts.
- [ ] Support two source modes everywhere:
  - local: `--registry-root <path>`,
  - remote: `--registry-url <raw-base-url>`.
- [ ] Default remote base should point to the canonical raw GitHub root once confirmed:

  ```txt
  https://raw.githubusercontent.com/maxedapps/slidesls/main
  ```

- [ ] For remote mode, fetch:
  - `registry.json`,
  - listed `registry-item.json` files,
  - item docs when requested,
  - implementation files during copy.
- [ ] For local mode, read from disk.
- [ ] Normalize errors so agents can self-correct:
  - invalid URL,
  - 404/missing file,
  - malformed JSON,
  - unknown item,
  - network unavailable.
- [ ] Keep structured data on stdout and diagnostics on stderr.

### Phase 5 — Add registry discovery and catalog scripts

All scripts should be dependency-free Node ESM, live under `skills/ls-slides/scripts/`, support `--help`, and print diagnostics to stderr.

#### `list-items.mjs`

Purpose: let agents discover items without manually parsing many files.

Required behavior:

- [ ] Args:
  - `--registry-root <path>` optional local source,
  - `--registry-url <url>` optional remote source, defaulting to canonical raw URL,
  - `--type <ls:layout|ls:component|ls:animation|ls:preset|ls:core>` optional,
  - `--query <text>` optional search across name/description/type/docs summary if available,
  - `--json` for machine-readable output,
  - `--limit <n>` optional.
- [ ] Output compact item summaries:
  - name,
  - derived display label from name,
  - type,
  - description,
  - dependencies,
  - docs path,
  - files.
- [ ] Do not assume a `title` field exists.
- [ ] Exit non-zero with clear errors when registry source is invalid.

#### `inspect-item.mjs`

Purpose: inspect one or more selected items deeply.

Required behavior:

- [ ] Args:
  - `--registry-root <path>` optional,
  - `--registry-url <url>` optional,
  - `--item <name>` repeatable or comma-separated,
  - `--include-readme` optional,
  - `--json` optional.
- [ ] Resolve dependencies and include ordered dependency list.
- [ ] Include README path/content when requested.
- [ ] Include copyable file paths and suggested load-order notes.
- [ ] Do not assume a `title` field exists.

#### `generate-catalog.mjs`

Purpose: produce `references/catalog.md` from registry metadata to minimize drift.

Required behavior:

- [ ] Args:
  - `--registry-root <path>` optional,
  - `--registry-url <url>` optional,
  - `--output <path>` defaulting to `skills/ls-slides/references/catalog.md`,
  - `--check` to verify the generated file is up to date without writing.
- [ ] Group items by core, layouts, components, animations, and presets.
- [ ] Include name, derived display label, type, description, dependencies, files, and docs path.
- [ ] Keep output deterministic.
- [ ] Do not manually curate a second catalog source.

### Phase 6 — Add safe copy/fetch script

Create `skills/ls-slides/scripts/copy-items.mjs`.

Purpose: fetch/copy selected registry items and dependencies into arbitrary target folders safely.

Required behavior:

- [ ] Args:
  - `--registry-root <path>` optional local source,
  - `--registry-url <url>` optional remote source, defaulting to canonical raw URL,
  - `--target <path>`,
  - `--items <name,name,...>` or repeatable `--item <name>`,
  - `--base-dir <relative>` default `ls-slides`,
  - `--include-docs` optional,
  - `--dry-run`,
  - `--force` for overwrites,
  - `--json`.
- [ ] Resolve dependencies recursively and deterministically.
- [ ] Fetch/copy implementation files preserving registry-relative category paths under target base dir.
- [ ] Optionally copy `README.md` and `registry-item.json` for traceability.
- [ ] Write a target manifest such as `ls-slides/manifest.json` with:
  - copied items,
  - source mode and source URL/root,
  - copied files,
  - dependency order.
- [ ] Omit timestamps from manifest unless there is a strong reason; deterministic output is better for checks.
- [ ] Refuse to write outside target root.
- [ ] Refuse overwrites unless `--force`.
- [ ] Support dry-run JSON plan for agent review before mutation.
- [ ] If remote fetch fails, provide a clear suggestion to retry with `--registry-root <local-repo>` only as a fallback.

### Phase 7 — Add agent references

Create concise references under `skills/ls-slides/references/`. Keep them operational and agent-focused.

#### `registry-contract.md`

- [ ] Explain source-of-truth files:
  - `registry.json`,
  - per-item `registry-item.json`,
  - item `README.md`,
  - implementation files.
- [ ] Explain item types:
  - `ls:core`, `ls:layout`, `ls:component`, `ls:animation`, `ls:preset`.
- [ ] Explain dependency semantics:
  - `registryDependencies` are registry items, not npm packages,
  - `dependencies`/`devDependencies` are expected to stay empty unless a future item explicitly requires otherwise,
  - `core/base` must load first,
  - animation variants generally require `animations/reveal` first.
- [ ] Document CSS/JS load-order contract based on Phase 2 source extraction.
- [ ] State that no registry item should force a framework or root package install.
- [ ] State that item metadata has no `title`; agents should use `name`/description.

#### `copy-workflow.md`

- [ ] Explain remote default and local override:
  - default `--registry-url`,
  - optional `--registry-root` for local development.
- [ ] Explain the safe copy algorithm:
  - resolve selected items,
  - recursively resolve dependencies,
  - topologically order them,
  - fetch/copy implementation files,
  - optionally copy READMEs/metadata for traceability,
  - refuse overwrite unless explicit.
- [ ] Recommend target structure for generated decks, e.g.:

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

- [ ] Explain how to link copied CSS/JS files from `index.html`.
- [ ] Include path-safety and overwrite rules.

#### `deck-authoring.md`

- [ ] Provide agent-first deck shell guidance extracted from Phase 2:
  - required `<link>` order,
  - `.ls-page`, `.ls-stage`, `.ls-deck[data-ls-deck]`, `.ls-slide`, `.ls-slide__inner`, `.ls-slide__body`,
  - runtime module script,
  - reveal usage with `.ls-reveal`, `data-step`, and sequencing attributes,
  - export mode query/attribute behavior.
- [ ] Include optional icon guidance:
  - use Lucide CDN script only if using `data-lucide`,
  - prefer inline SVG/text for dependency-free/offline decks.
- [ ] Include compact slide recipes by intent:
  - title/opening,
  - comparison,
  - dashboard,
  - timeline/process,
  - code explainer,
  - quote/editorial,
  - annotated visual.
- [ ] Point agents to example decks as visual references, but do not make examples the source of truth.

#### `catalog.md`

- [ ] Generated by `generate-catalog.mjs`; do not manually maintain.
- [ ] Include for each item:
  - name,
  - derived display label,
  - type,
  - one-line description/use case,
  - dependencies,
  - implementation files,
  - docs path.
- [ ] Keep it compact enough for agents to read when needed.

#### `preview-validation.md`

- [ ] Explain how agents should run the deck server.
- [ ] Explain live preview checks:
  - open slide 1,
  - navigate with keyboard,
  - test reveal steps,
  - test `data-ls-reveal-sequence` when used,
  - test dense slides,
  - test export mode if applicable,
  - inspect browser console when possible.
- [ ] Include common failure modes:
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

- [ ] Args:
  - `--root <path>` required or default current working directory,
  - `--entry <file>` default `index.html`,
  - `--host <host>` default `127.0.0.1`,
  - `--port <port>` default `4173`,
  - `--json` to print machine-readable server info,
  - `--help`.
- [ ] Serve static files only from `--root`.
- [ ] Prevent path traversal.
- [ ] Serve `/` as the entry document or redirect to it.
- [ ] Support common MIME types already used by `serve-examples.mjs`.
- [ ] Print stable URL for agents.
- [ ] No live reload required.
- [ ] Factor shared static-server logic only if it remains simple; intentional duplication with `serve-examples.mjs` is acceptable to keep the skill self-contained.

Add optional root script only if useful for repo validation:

```json
"serve:deck": "node skills/ls-slides/scripts/serve-deck.mjs"
```

This root alias is convenient for repo validation, but consumers can still run the skill script directly.

### Phase 9 — Add a minimal deck shell asset if it improves reliability

Consider adding `skills/ls-slides/assets/minimal-deck.html`.

If added:

- [ ] Keep it minimal and copyable.
- [ ] Use relative paths matching `copy-items.mjs` default target structure.
- [ ] Include two slides and one reveal step.
- [ ] Include comments that agents should remove after customization.
- [ ] Include no optional Lucide dependency by default.
- [ ] Do not make it a generator template with many knobs.

If not added:

- [ ] Put a compact shell snippet in `deck-authoring.md` instead.

### Phase 10 — Integrate validation

- [ ] Add a skill/catalog validation script if useful:

  ```json
  "validate:skills": "node skills/ls-slides/scripts/generate-catalog.mjs --registry-root . --check"
  ```

- [ ] Consider extending `pnpm check` to include skill/catalog validation once stable.
- [ ] Validate Agent Skill format if tooling is available:

  ```sh
  npx -y skills-ref validate skills/ls-slides
  ```

- [ ] If `skills-ref` is unavailable or flaky, manually validate:
  - directory name matches `name`,
  - `name` is lowercase/kebab-case and under 64 chars,
  - `description` is under 1024 chars,
  - scripts support `--help`,
  - references are linked from `SKILL.md` with shallow relative paths.

### Phase 11 — End-to-end dogfood test

Create a temporary deck outside the repo, e.g. `/tmp/ls-slides-skill-dogfood`.

- [ ] Use remote default mode first, not `--registry-root`:

  ```sh
  node skills/ls-slides/scripts/list-items.mjs --json
  node skills/ls-slides/scripts/inspect-item.mjs --item layouts/title-hero --include-readme --json
  node skills/ls-slides/scripts/copy-items.mjs --target /tmp/ls-slides-skill-dogfood --items layouts/title-hero,components/badge,animations/reveal --dry-run --json
  node skills/ls-slides/scripts/copy-items.mjs --target /tmp/ls-slides-skill-dogfood --items layouts/title-hero,components/badge,animations/reveal --include-docs
  ```

- [ ] Repeat key commands with `--registry-root .` to validate local development mode.
- [ ] Author `index.html` in the temp folder using copied files.
- [ ] Run:

  ```sh
  node skills/ls-slides/scripts/serve-deck.mjs --root /tmp/ls-slides-skill-dogfood --entry index.html --host 127.0.0.1 --port 4173 --json
  ```

- [ ] Use curl smoke tests.
- [ ] Use browser automation/screenshots if available to confirm deck displays and reveal navigation works.
- [ ] Delete temp artifacts after validation unless needed for debugging.

### Phase 12 — Documentation cleanup and consistency pass

- [ ] Remove or rephrase remaining human-docs-primary language where it conflicts with agent-primary framing.
- [ ] Ensure references point to source-of-truth files rather than duplicating too much item-specific documentation.
- [ ] Ensure `registry/README.md` remains concise and source-of-truth for registry mechanics.
- [ ] Ensure `docs/primitive-expansion.md` still explains primitive strategy but does not imply human docs are the main consumption path.
- [ ] Ensure no generated screenshots/logs/temp decks are committed.

### Phase 13 — Peer review, fixes, and commit

- [ ] Run full validation:

  ```sh
  pnpm fmt
  pnpm check
  node --check skills/ls-slides/scripts/list-items.mjs
  node --check skills/ls-slides/scripts/inspect-item.mjs
  node --check skills/ls-slides/scripts/generate-catalog.mjs
  node --check skills/ls-slides/scripts/copy-items.mjs
  node --check skills/ls-slides/scripts/serve-deck.mjs
  ```

- [ ] Run any new npm scripts added for skill/catalog validation.
- [ ] Run end-to-end dogfood test in remote default mode and local override mode.
- [ ] Run fresh peer review focused on:
  - skill triggering and false positives,
  - no-clone remote consumption,
  - agent workflow clarity,
  - script safety,
  - Lucide/icon dependency guidance,
  - preservation of copyable registry model,
  - whether `PROJECT.md` accurately reflects agent-primary goals.
- [ ] Address blocking feedback.
- [ ] Commit with a concise message such as:

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

## Peer review summary

A fresh draft review found the plan direction strong but required four corrections before finalization:

- Make remote/no-clone registry consumption first-class instead of deferring it.
- Remove reliance on a non-existent `title` metadata field.
- Extract the actual deck/runtime/reveal contract from source before writing references.
- Document Lucide/icon behavior so agents do not create decks with missing icons or hidden assumptions.

This final plan incorporates those corrections. A follow-up review flagged private-repo raw fetching as the only blocker; the user confirmed the repo will become public before the skill ships, so the plan intentionally keeps unauthenticated raw GitHub fetching as the default future distribution path while preserving local `--registry-root` validation during implementation.
