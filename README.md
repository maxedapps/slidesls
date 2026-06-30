# slidesls

Agent-primary slide authoring CLI and copyable registry for plain HTML/CSS/JS decks.

`slidesls` helps agents and humans initialize deck folders, inspect recommended templates/snippets, copy registry primitives, validate decks, preview them locally, and install/link the bundled agent skill. The package is an authoring tool only; generated decks remain editable vanilla files with no runtime package dependency.

Package: `@maxedapps/slidesls` (binary: `slidesls`). Publishing remains manual until explicitly approved.

## Quickstart

Local repo checkout, from a dedicated deck folder:

```sh
mkdir my-deck
cd my-deck
node /absolute/path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
node /absolute/path/to/ls_slides/bin/slidesls.mjs catalog --recommended
node /absolute/path/to/ls_slides/bin/slidesls.mjs inspect templates/split --json
node /absolute/path/to/ls_slides/bin/slidesls.mjs add utilities/layout components/panel components/card
node /absolute/path/to/ls_slides/bin/slidesls.mjs validate
node /absolute/path/to/ls_slides/bin/slidesls.mjs preview
```

Inside a larger project, prefer an explicit deck path:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs init ./slides/my-deck --template minimal --title "My Deck"
```

`slidesls init` writes `slidesls.json`, `index.html`, and `slidesls/` into the target directory, so only run it at a project root when that root is meant to be the deck.

`init` is optional for copying primitives into an existing project. To use slidesls as a copyable component registry without scaffolding a deck, run:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs add components/card utilities/layout --dir ./existing-project --base-dir vendor/slidesls
```

If `--dir` has no `slidesls.json`, `add` uses copy mode and writes assets under the selected base directory.

## Local use from other projects before publishing

Direct local checkout usage:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill info --json
```

For local-only agent work, `skill link` is usually best because the target project points at the current checkout skill. Use `skill install` instead when a copy is preferred:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill install ./.claude/skills/slidesls
```

Optional local tarball workflow:

```sh
cd /path/to/ls_slides
npm pack
cd /path/to/other-project
npm install /path/to/ls_slides/maxedapps-slidesls-0.1.0.tgz
npx slidesls init --template minimal --title "My Deck"
```

`private: true` blocks npm publishing, but it does not block `npm pack` or local tarball installation.

## Commands

- `slidesls init [dir]` — initialize a deck in the current directory, or in `[dir]` if supplied.
- `slidesls catalog --recommended` — list agent-safe recommended items; JSON output includes each item’s public `authoring` API.
- `slidesls inspect <items...>` — show metadata, public `authoring` API, dependencies, load guidance, READMEs, and snippet HTML.
- `slidesls add <items...>` — copy registry items into an initialized deck or any existing project in copy mode, and print load tags.
- `slidesls skill info|show|install|link` — inspect, copy, or symlink the bundled agent skill.
- `slidesls validate [dir]` — static deck validation.
- `slidesls preview [dir]` — serve a deck locally.
- `slidesls doctor [--dir <project>]` — check CLI/project health.
- `slidesls validate-registry` / `validate-examples` — repo/package checks.

Most agent-facing commands support `--json`.

## Registry

Registry items live under `registry/` and are copied into downstream decks. The clean v1 registry is organized around:

- `core/` — base shell, tokens, runtime.
- `utilities/` — layout utilities that work anywhere.
- `components/` — standalone visual/content primitives.
- `templates/` — paste-ready slide snippets composed from utilities and components.
- `animations/` and `presets/` — optional enhancements, including fonts and themes.

Generated projects use `slidesls/` as the default copied asset directory and may freely edit those files. Default validation accepts those edits; `validate --strict` is available when you want copied-file hash drift to fail.

## Theming

Themes are visual presets under `presets/themes/*`. They are not templates: templates define slide structure, while themes remap canonical tokens for colors, surfaces, borders, radii, shadows, code blocks, status colors, and progress bars.

Use a theme during initialization:

```sh
slidesls init ./my-deck --template minimal --theme executive-blue --title "My Deck"
```

Or copy a theme into an existing project and apply it manually:

```sh
slidesls add presets/themes/technical-deep --dir ./existing-project
```

```html
<html lang="en" data-ls-theme="technical-deep"></html>
```

Initial themes:

- `executive-blue` — balanced professional/product decks.
- `boardroom-navy` — formal strategy, executive, and reporting decks.
- `technical-deep` — engineering, architecture, and code-heavy decks.
- `playful-ink` — friendlier workshop/community/product decks.

Themes intentionally avoid heavy decorative gradients and glow effects. Font presets remain separate and optional.

The default remote registry URL points at the future public repository; until the repo is public, use bundled/local registry mode.

## Validation

```sh
pnpm check
npm pack --dry-run
```

`slidesls validate` is a lightweight static check, not a full browser render or complete HTML parser. Use `slidesls preview` for manual or agent-browser review; it serves until the process is stopped.

`snapshot` is intentionally deferred to keep the base package lightweight.
