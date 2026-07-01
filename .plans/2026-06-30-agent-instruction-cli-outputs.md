# Plan: Add explicit AI-agent instructions to slidesls CLI outputs

## Summary

Make slidesls command output explicitly instructive for AI agents. The CLI should not only expose JSON data; it should tell agents exactly how to get the bundled skill, how to discover valid public classes/styles/layout APIs, how to inspect snippets/docs, how to copy safely, and how to validate after edits.

This plan intentionally trims scope after Claude review: prioritize the highest-value surfaces first instead of adding repetitive instructions everywhere.

## Confirmed requirements and assumptions

- slidesls is agent-primary, so explicit `For AI agents:` output is appropriate.
- Instructions must be concrete command recipes, not vague tips.
- Existing generated decks remain plain HTML/CSS/JS and dependency-free.
- Existing CLI commands/options remain backward compatible.
- JSON changes should be additive.
- Current `catalog --json` already exposes rich per-item `authoring` metadata.
- Current `inspect --json` already exposes `authoring`, load tags, snippets, and optional README content.
- Current generated `skills/slidesls/references/catalog.md` already contains the full human-readable class/style/API catalog.
- Validate already emits stable warning/error codes such as `unknown_ls_class`, `missing_registry_item_for_class`, `missing_asset`, etc.
- Theme/font metadata is available through preset registry metadata and/or `authoring.attributes` such as `data-ls-theme` / `data-ls-font`.

## Current-state findings

### Existing useful surfaces

- `slidesls --help` has a short `Agent usage:` block.
- `slidesls catalog --json` exposes item metadata and `authoring` for all registry items.
- `slidesls inspect <item> --readme --json` exposes snippets, docs, load tags, dependencies, and authoring metadata.
- `skills/slidesls/references/catalog.md` is a generated full registry catalog with classes, modifiers, data attributes, CSS variables, files, snippets, and docs.
- `skills/slidesls/SKILL.md` includes a good workflow and tells agents not to invent `ls-*` classes.

### Gaps to address

1. Root help is not explicit enough.
   - It should tell agents that a good first step is to install/link the bundled skill.
   - It should say why: the skill contains workflow docs and catalog references.
   - It should name `catalog --json` as the public authoring API source of truth.

2. JSON command outputs expose data but not procedural guidance.
   - Agents should receive structured `agentInstructions` and path-aware `nextCommands`.

3. The full generated catalog is not easily retrievable through CLI.
   - `skill show` prints only `SKILL.md`.
   - Agents should be able to run `slidesls skill show --reference catalog`.

4. Text `catalog` output is a likely first human/agent discovery surface.
   - It should include a concise `For AI agents:` block pointing to JSON authoring metadata and `inspect`.

5. `validate` output should guide remediation.
   - JSON warnings/errors should include actionable `hint` or command suggestions where reliable.
   - Text output should show warnings, not hide them on valid decks.

6. Instructions can drift.
   - Tests should execute or validate the referenced commands so CLI guidance does not become false.

## Chosen strategy

Implement a focused, low-maintenance version first:

1. Expand root help with explicit AI-agent onboarding.
2. Add concise `For AI agents:` guidance to the most important text outputs: root help, catalog text, init/add/validate where actionable.
3. Add structured `agentInstructions` to key JSON outputs: catalog, inspect, add, init, validate.
4. Add `skill show --reference <name>` and optionally `--all` so agents can retrieve bundled detailed docs.
5. Add drift tests that execute command recipes referenced by instructions.
6. Defer or reduce `catalog --api`; prefer existing `catalog --json` + `skill show --reference catalog` first.

## Deliberately deferred / reduced scope

### Defer full `catalog --api` unless still needed after skill-reference retrieval

Claude correctly noted that:

- `catalog --json` already exposes `authoring`.
- `skills/slidesls/references/catalog.md` already gives a generated readable full API catalog.
- `skill show --reference catalog` would make that catalog directly retrievable.

So the first implementation should not add a large parallel `catalog --api` renderer. If agents still need a machine-flattened index later, add it as a JSON-only feature built from existing `src/validation/authoring-api.mjs` helpers, not as a separate source of truth.

### Do not add repetitive agent blocks to every command help in v1

Add detailed instructions where they matter most:

- root help
- `catalog --help`
- `inspect --help`
- `add --help`
- `validate --help`
- `skill --help`

Keep `preview`, `doctor`, internal commands lighter unless there is a specific workflow problem.

### Do not solve preview `--json` blocking in this plan

`preview` is a long-running server. Agent guidance should say it must be spawned/managed as a long-running process. Do not imply `preview --json` is a normal exit-producing command unless that behavior is redesigned in a separate change.

## Implementation plan

## Phase 1 — Add reusable but simple instruction constants

Likely files:

- `src/cli/commands.mjs`
- optionally new `src/cli/agent-instructions.mjs` only if `commands.mjs` becomes too noisy

Tasks:

1. Add a small set of static command recipe constants/functions.
2. Avoid over-abstraction: prefer a few plain helpers over many one-line builders.
3. Recommended core instruction blocks:

```txt
For AI agents:
  1. Install or link the bundled skill before authoring:
     slidesls skill install ./.claude/skills/slidesls
     slidesls skill link ./.claude/skills/slidesls   # local checkout/dev workflow
  2. Discover valid public classes, modifiers, themes, fonts, data attributes, and CSS variables:
     slidesls catalog --recommended --json
     slidesls catalog --json
  3. Inspect exact snippets, load tags, and docs:
     slidesls inspect <item> --readme --json
  4. Copy safely:
     slidesls add <items...> --dir <deck-or-project> --dry-run --json
  5. Validate after editing:
     slidesls validate <deck> --json
```

4. JSON shape should be stable and simple:

```json
"agentInstructions": {
  "purpose": "Use catalog authoring metadata before writing slidesls markup.",
  "rules": [
    "Do not invent ls-* classes.",
    "Use snippets[].html as source-of-truth markup.",
    "Run validate after editing."
  ],
  "nextCommands": [
    "slidesls inspect <item> --readme --json",
    "slidesls add <items...> --dir <deck-or-project> --dry-run --json"
  ]
}
```

5. Keep `agentInstructions` inside command `data`, not `_meta`, because instructions are command-specific.

## Phase 2 — Expand root and important command help

Likely files:

- `src/cli/commands.mjs`
- `tests/cli-output.test.mjs`

Tasks:

1. Expand root `help`.
2. Replace/expand current short `Agent usage:` block with an explicit `For AI agents:` sequence.
3. Include both skill install and skill link:

```txt
slidesls skill install ./.claude/skills/slidesls
slidesls skill link ./.claude/skills/slidesls
```

4. Explain the reason:
   - bundled skill contains workflow docs and generated catalog references.
5. Root help must mention:
   - `slidesls catalog --recommended --json`
   - `slidesls catalog --json`
   - `slidesls inspect <item> --readme --json`
   - `slidesls add <items...> --dry-run --json`
   - `slidesls validate <deck> --json`
6. Improve key command help:

### `catalog --help`

Should say:

- use before authoring markup/classes
- JSON includes public `authoring` metadata
- use `catalog --recommended --json` for agent-safe starting set
- use `catalog --json` for full registry API
- use `catalog --type preset --tag theme --json` for themes
- use `inspect <item> --readme --json` for snippets/docs

### `inspect --help`

Should say:

- use after catalog for exact markup
- JSON includes `authoring`, `load.links`, `load.scripts`, `snippets[].html`, optional `readme`

### `add --help`

Should say:

- always run `--dry-run --json` first
- `add` copies files and updates manifest but does not edit HTML
- add returned load tags to entry HTML when needed
- inspect templates first for snippet HTML
- no `slidesls.json` means copy mode into any project

### `validate --help`

Should say:

- run after every edit
- unknown `ls-*` classes warn by default and error with `--strict`
- use `catalog --json` for valid classes and `inspect` for snippets

### `skill --help`

Should say:

- install/link before authoring
- `skill show` shows workflow
- `skill show --reference catalog` shows the generated full catalog

Tests:

- Root help contains `For AI agents:`.
- Root help contains `skill install`, `skill link`, `catalog --json`, `inspect <item> --readme --json`.
- Key command help contains command-specific agent guidance.
- Existing removed `--registry` test still passes.

## Phase 3 — Add structured `agentInstructions` to key JSON outputs

Likely files:

- `src/cli/commands.mjs`
- `tests/cli-output.test.mjs`

Commands to update:

### `catalog --json`

Add:

- purpose: discover registry items and public authoring API
- rules:
  - use `item.authoring`
  - do not invent `ls-*`
  - inspect for snippets/docs
- next commands:
  - `slidesls inspect <item> --readme --json`
  - `slidesls add <items...> --dir <deck-or-project> --dry-run --json`
  - `slidesls validate <deck> --json`

### `inspect --json`

Add:

- purpose: deep detail for selected items
- rules:
  - use `snippets[].html` as source-of-truth markup
  - use `load.links` and `load.scripts` after copying assets
  - read `readme` when requested
- next commands:
  - path-generic `slidesls add <requested-items> --dir <deck-or-project> --dry-run --json`
  - `slidesls validate <deck> --json`

### `add --json`

Add:

- purpose: safe asset copying
- rules:
  - dry run first
  - `add` does not rewrite HTML
  - insert returned tags manually
  - inspect templates/components for snippets
- dynamic next commands:
  - if dry run: same command without `--dry-run` where practical, or generic instruction
  - `slidesls validate <root> --json`
  - `slidesls preview <root>`

### `init --json`

Add:

- purpose: new deck bootstrap
- dynamic next commands with actual root:
  - `slidesls catalog --recommended --json`
  - `slidesls inspect templates/split --readme --json`
  - `slidesls validate <root> --json`
  - `slidesls preview <root>`

### `validate --json`

Add:

- purpose: fix feedback after editing
- rules:
  - fix errors first
  - warnings should still be reviewed
  - use `--strict` for stricter checks
- generic next commands:
  - `slidesls catalog --json`
  - `slidesls inspect <item> --readme --json`
  - `slidesls add <item> --dir <root> --dry-run --json`

Tests:

- JSON outputs include `agentInstructions` with stable keys.
- `nextCommands` is an array.
- Existing command result data remains intact.

## Phase 4 — Add remediation hints to validation findings

Likely files:

- `src/cli/commands.mjs`
- tests in `tests/html-validation.test.mjs`

Tasks:

1. Add `hint` and optionally `command` to common warnings/errors.
2. Good candidates:

### `unknown_ls_class`

```json
{
  "code": "unknown_ls_class",
  "message": "ls-grdi is not listed in the slidesls authoring API catalog",
  "hint": "Run slidesls catalog --json to see valid public ls-* classes."
}
```

### `missing_registry_item_for_class`

```json
{
  "code": "missing_registry_item_for_class",
  "message": "components/card should be added when using its classes in HTML",
  "hint": "Run slidesls add components/card --dir <deck> --dry-run --json."
}
```

Use the actual root path where available if appropriate.

### `missing_runtime`

Hint to add/copy `core/base` and include returned script tag.

### `missing_asset`

Hint that local `href`/`src` paths are resolved relative to entry HTML.

3. Keep hints concise and stable.
4. Do not add speculative commands where the correct item/path is unknown.

Tests:

- Unknown class warning includes hint.
- Missing registry item warning includes hint/command.

## Phase 5 — Improve key text outputs

Likely files:

- `src/cli/commands.mjs` (`textFor`)
- tests in `tests/cli-output.test.mjs`

Tasks:

### `catalog` text

Append:

```txt
For AI agents:
  Use `slidesls catalog --recommended --json` or `slidesls catalog --json` to read item.authoring metadata.
  Use `slidesls inspect <item> --readme --json` for snippets, load tags, and docs.
  Do not invent `ls-*` classes; use listed authoring classes/modifiers.
```

### `inspect` text

Add compact authoring summary per item:

- class groups
- standalone classes
- data attributes
- attributes
- CSS variables
- usage

Append:

```txt
For AI agents:
  Copy assets with `slidesls add <items...> --dir <deck-or-project> --dry-run --json`.
  Add returned load tags to the entry HTML.
  Run `slidesls validate <deck> --json` after editing.
```

### `add` text

Keep load tags. Append:

```txt
For AI agents:
  `add` copied/planned files only; it does not edit HTML.
  Add the returned load tags to the deck entry HTML if missing.
  For exact markup, run `slidesls inspect <item> --readme --json`.
  Then run `slidesls validate <dir> --json`.
```

### `init` text

Make next steps JSON-first and path-aware where possible:

```txt
slidesls catalog --recommended --json
slidesls inspect templates/split --readme --json
slidesls validate <root> --json
slidesls preview <root>
```

### `validate` text

- Show warnings even when valid.
- If warnings/errors exist, append specific AI-agent remediation block.
- On clean success, suggest preview for visual review.

Example:

```txt
slidesls validate: ok with 2 warning(s) (<root>)
- warning: components/card should be added when using its classes in HTML

For AI agents:
  Unknown `ls-*` class? Run `slidesls catalog --json`.
  Missing registry item? Run `slidesls add <item> --dir <deck> --dry-run --json`.
```

Tests:

- `catalog` text contains `For AI agents:`.
- `inspect utilities/layout` text includes authoring classes such as `ls-grid--4`.
- `add --dry-run` text says add does not edit HTML and recommends validate.
- `validate` text shows warnings on a valid-with-warnings deck.

## Phase 6 — Add `skill show --reference`

Likely files:

- `src/skill/agent-skill.mjs`
- `src/cli/commands.mjs`
- tests in `tests/skill-command.test.mjs`

Tasks:

1. Extend `slidesls skill show` while preserving current behavior:

```sh
slidesls skill show
slidesls skill show --reference catalog
slidesls skill show --reference deck-authoring
slidesls skill show --reference copy-workflow
slidesls skill show --reference preview-validation
slidesls skill show --reference registry-contract
```

2. Optional but useful:

```sh
slidesls skill show --all
```

3. Reference aliases:

- `catalog` -> `references/catalog.md`
- `deck-authoring` -> `references/deck-authoring.md`
- `copy-workflow` -> `references/copy-workflow.md`
- `preview-validation` -> `references/preview-validation.md`
- `registry-contract` -> `references/registry-contract.md`

4. Unknown reference should fail with a usage error listing valid names.
5. Update `skill --help` with these examples.
6. Consider adding friendly reference names to `skill info --json`, though current file list is already useful.

Tests:

- `skill show --reference catalog` prints `# slidesls Agent Catalog`.
- `skill show --reference deck-authoring` prints deck-authoring docs.
- Unknown reference errors and lists valid references.
- `skill show` without reference still prints `SKILL.md`.

## Phase 7 — Add command-drift tests for instructions

Likely files:

- `tests/cli-output.test.mjs`
- maybe new `tests/agent-instructions.test.mjs`

Tasks:

1. Add tests that execute key commands referenced in help/instructions:

```sh
slidesls skill info --json
slidesls skill show
slidesls skill show --reference catalog
slidesls catalog --recommended --json
slidesls catalog --json
slidesls catalog --type preset --tag theme --json
slidesls inspect templates/split --readme --json
```

2. For commands needing paths, use temp dirs:

```sh
slidesls init <tmp> --template minimal --json
slidesls add utilities/layout --dir <tmp> --dry-run --json
slidesls validate <tmp> --json
```

3. Assert they exit successfully and parse as JSON where applicable.
4. Assert `agentInstructions.nextCommands` is an array for relevant JSON commands.
5. This prevents docs/help from recommending commands that do not exist.

## Phase 8 — Update skill docs and public docs

Likely files:

- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/deck-authoring.md`
- `skills/slidesls/references/copy-workflow.md`
- `skills/slidesls/references/preview-validation.md`
- `README.md`
- `docs/cli.md`

Tasks:

1. Add a compact “Need X? Run Y” section to `SKILL.md`:

```md
## Fast discovery map

- Need the workflow? `slidesls skill show`
- Need the full class/style/data-attribute catalog? `slidesls skill show --reference catalog`
- Need machine-readable public APIs? `slidesls catalog --json`
- Need recommended building blocks? `slidesls catalog --recommended --json`
- Need themes? `slidesls catalog --type preset --tag theme --json`
- Need exact markup and docs? `slidesls inspect <item> --readme --json`
- Need copied files/load tags? `slidesls add <items> --dry-run --json`
- Need validation/fix feedback? `slidesls validate <deck> --json`
```

2. Update docs to describe:
   - explicit `For AI agents:` CLI blocks
   - `agentInstructions` JSON field
   - `skill show --reference`
3. Do not regenerate catalog unless metadata changes require it.

## Testing and verification

Run:

```sh
pnpm lint
pnpm fmt:check
pnpm test
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
pnpm cli:smoke
pnpm check
```

Targeted tests:

- Root help contains explicit AI-agent onboarding.
- Key help outputs contain concrete agent commands.
- `catalog --json`, `inspect --json`, `add --json`, `init --json`, `validate --json` include `agentInstructions`.
- `validate` findings include actionable hints for unknown classes and missing registry item warnings.
- `catalog` text and `inspect` text include useful agent guidance.
- `skill show --reference catalog` works.
- Referenced command recipes execute successfully.

## Backward compatibility

- Existing command names/options remain.
- Existing JSON fields remain; `agentInstructions` is additive.
- Text outputs become intentionally more verbose because the project is agent-primary.
- `skill show` without flags remains unchanged.

## Risks and mitigations

### Risk: Output becomes too noisy

Mitigation:

- Add detailed blocks only to high-value surfaces.
- Keep instructions command-focused.
- Put long docs behind `skill show --reference` and `inspect --readme --json`.

### Risk: Instructions drift from real commands

Mitigation:

- Add tests that execute referenced commands.
- Centralize repeated command recipes in a small constants section/helper.

### Risk: JSON consumers dislike extra fields

Mitigation:

- Add fields only.
- Keep existing data shape intact.

### Risk: Future flattened API duplicates validation logic

Mitigation:

- Defer `catalog --api` for now.
- If implemented later, build from existing `src/validation/authoring-api.mjs` helpers.

## Claude review notes incorporated

Claude reviewed the draft plan and recommended trimming scope. Incorporated changes:

- Defer broad `catalog --api` implementation because `catalog --json` and generated catalog already expose the data.
- Prioritize root help, catalog guidance, JSON `agentInstructions`, and `skill show --reference`.
- Avoid duplicating instructions across too many command surfaces.
- Add tests that execute referenced commands to prevent stale guidance.
- Treat preview `--json` as a long-running-server contract rather than pretending it exits normally.
- Reuse existing authoring helpers if a flattened API is added later.

## Open questions

No blocking open questions.

Recommended first implementation slice:

1. Root/help explicit AI-agent onboarding.
2. `agentInstructions` for catalog/inspect/add/init/validate JSON.
3. `skill show --reference catalog`.
4. Validate warning hints and text warning visibility.
5. Drift tests for referenced commands.
