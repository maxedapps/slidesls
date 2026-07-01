# slidesls CLI

`slidesls` is an authoring CLI. It copies registry assets into a deck project, but generated decks do not need the package at runtime.

## Local checkout usage

Before public npm publishing, invoke the CLI from this checkout when working in another project:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
node /absolute/path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
```

If installed from a local tarball in the target project, use `npx slidesls ...`.

## Commands

- `slidesls init [dir] --template blank|minimal --theme <theme> --title <text> [--registry-root <path> | --registry-url <url>]` — initialize a deck in the current directory, or in `[dir]` if supplied. `--theme` accepts names such as `executive-blue` or `presets/themes/executive-blue`.
- `slidesls add <items...> --dir <project> [--base-dir <relative>] [--registry-root <path> | --registry-url <url>]` — copy registry items into a deck project or any existing project. If no `slidesls.json` exists in `--dir`, `add` uses copy mode and writes assets under `--base-dir` or `slidesls`.
- `slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path> | --registry-url <url>]` — list items and their public `authoring` API in JSON; use `--recommended` for the agent-safe set.
- `slidesls inspect <items...> [--readme] [--registry-root <path> | --registry-url <url>]` — show metadata, public `authoring` API, load guidance, and snippet HTML for requested items.
- `slidesls skill info [--json]` — show bundled agent skill metadata.
- `slidesls skill show [--reference <name>] [--all]` — print the bundled agent `SKILL.md`, a named reference such as `catalog`, or all bundled docs.
- `slidesls skill install [dir] [--dry-run] [--force]` — copy the bundled skill to `[dir]` or `./.claude/skills/slidesls`.
- `slidesls skill link [dir] [--force]` — symlink the bundled skill to `[dir]` or `./.claude/skills/slidesls`.
- `slidesls validate [dir] [--strict]` — validate deck config, entry markup, local assets, and manifest files. `--strict` also treats copied-file hash drift as an error.
- `slidesls preview [dir] [--host <host>] [--port <port>]` — serve a local preview until the process is stopped.
- `slidesls doctor [--dir <project>] [--registry-root <path> | --registry-url <url>]` — check Node/package/config/registry/project health.
- `slidesls validate-registry [--registry-root <path> | --registry-url <url>]` — repo/package registry validation.
- `slidesls validate-examples` — repo example/template validation.
- `slidesls generate-catalog [--registry-root <path> | --registry-url <url>] [--check]` — internal agent catalog generation/check.

All commands support `--help`. Agent-facing commands support `--json` where useful. Key text outputs include `For AI agents:` command recipes, and JSON outputs for `init`, `add`, `catalog`, `inspect`, and `validate` include additive `agentInstructions` data.

## Init target guidance

Use a dedicated deck folder. From inside that folder:

```sh
slidesls init --template minimal --title "My Deck"
```

Inside a larger project, prefer an explicit path:

```sh
slidesls init ./slides/my-deck --template minimal --title "My Deck"
```

`init` writes `slidesls.json`, the configured entry file, and copied registry assets into the target directory. With `--theme`, it also copies the theme preset, links its CSS, and sets `data-ls-theme` on the generated `<html>` element.

## Copy mode without init

`init` is optional for copying registry assets. Use `add` directly when you want slidesls primitives inside an existing project without scaffolding a full deck:

```sh
slidesls add components/card utilities/layout --dir ./existing-project --base-dir vendor/slidesls
```

When `--dir` has no `slidesls.json`, `add` uses copy mode, writes under the selected base directory, creates/updates that base directory's `manifest.json`, and reports `mode: "copy"` in JSON output. If `--dir` is supplied, config discovery is limited to that exact directory; ancestor configs are not inherited.

## Themes

Themes are optional visual presets. They are copied like any other registry item, but they only take effect when the deck opts in on the `<html>` element.

```sh
slidesls catalog --type preset --tag theme
slidesls add presets/themes/executive-blue --dir ./my-deck
```

```html
<html lang="en" data-ls-theme="executive-blue"></html>
```

For new decks, prefer `init --theme <theme>`:

```sh
slidesls init ./my-deck --template minimal --theme technical-deep --title "Architecture Review"
```

Available initial themes:

- `executive-blue` — balanced professional/product decks.
- `boardroom-navy` — formal strategy, executive, and reporting decks.
- `technical-deep` — engineering and code-heavy decks.
- `playful-ink` — friendlier workshop/community decks.

Font presets remain separate; use `data-ls-font` only when you want a font role remap.

## Agent skill workflow

For local-only development, link the skill so it always tracks the current checkout:

```sh
slidesls skill link ./.claude/skills/slidesls
```

Use a copy when symlinks are undesirable:

```sh
slidesls skill install ./.claude/skills/slidesls
```

Then use machine-readable discovery before editing decks or copy-mode projects:

```sh
slidesls skill show --reference catalog
slidesls catalog --recommended --json
slidesls catalog --json
slidesls catalog --type preset --tag theme --json
slidesls inspect templates/split --readme --json
slidesls inspect components/card --readme --json
slidesls add utilities/layout components/panel components/card --dry-run --json
```

Treat each item’s `authoring` metadata as the quick source of truth for public classes, modifiers, data attributes, theme/font attributes, and CSS variables. Use `inspect --json` when you need exact snippet markup or README details. Do not invent `ls-*` classes; validation warns for unknown `ls-*` classes and `--strict` errors.

## Naming

Prefer:

- `--dir` for deck/project directory.
- `--registry-root` for a local registry checkout.
- `--registry-url` for a raw remote registry source.

The default remote registry URL targets the future public repository; until the repo is public, use bundled/local registry mode. Remote registry requests have per-request timeouts, so a slow registry fails with a bounded error instead of hanging indefinitely.

`snapshot` is intentionally post-MVP; browser screenshot workflows should remain optional and must not add a mandatory Playwright/Puppeteer dependency to the base package.
