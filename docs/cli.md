# slidesls CLI

`slidesls` is an authoring CLI. It copies registry assets into a deck project, but generated decks do not need the package at runtime.

## Local checkout usage

Invoke the CLI from this checkout when working in another project:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
node /absolute/path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
```

If the package is already installed in the target project, use `npx slidesls ...`. For one-off npm execution without prior install, use `npx -y @maxedapps/slidesls@latest ...` to avoid resolving an unrelated unscoped package.

## Commands

- `slidesls init [dir] --template blank|minimal --theme <theme> --title <text> [--registry-root <path> | --registry-url <url>]` — initialize a deck in the current directory, or in `[dir]` if supplied. `--theme` accepts names such as `executive-blue` or `presets/themes/executive-blue`.
- `slidesls add <items...> --dir <project> [--base-dir <relative>] [--registry-root <path> | --registry-url <url>]` — copy registry items into a deck project or any existing project. If no `slidesls.json` exists in `--dir`, `add` uses copy mode and writes assets under `--base-dir` or `slidesls`.
- `slidesls catalog [--starter] [--level <level>] [--recommended] [--api] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path> | --registry-url <url>]` — list brief item summaries by default; add `--api` for public `authoring` metadata.
- `slidesls inspect <items...> [--api] [--with-dependencies] [--readme] [--registry-root <path> | --registry-url <url>]` — show snippet HTML and aggregate load tags by default; add `--api` for public `authoring` metadata.
- `slidesls skill info [--json]` — show bundled agent skill metadata.
- `slidesls skill show [--reference <name>] [--all]` — print the bundled agent `SKILL.md`, a named reference such as `catalog`, or all bundled docs.
- `slidesls skill install <dir> [--dry-run] [--force]` — copy the bundled skill to the explicit skill directory required by your agent runtime.
- `slidesls skill link <dir> [--force]` — symlink the bundled skill to the explicit skill directory required by your agent runtime.
- `slidesls validate [dir] [--strict]` — validate deck config, entry markup, local assets, manifest files, and targeted component/reveal structure. `--strict` also treats copied-file hash drift and deck-level structural warnings as errors.
- `slidesls preview [dir] [--host <host>] [--port <port>]` — serve a local preview until the process is stopped.
- `slidesls doctor [--dir <project>] [--registry-root <path> | --registry-url <url>]` — check Node/package/config/registry/project health.
- `slidesls validate-registry [--registry-root <path> | --registry-url <url>]` — repo/package registry validation.
- `slidesls validate-examples` — recursive repo example/template validation.
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
- `clean-light` — bright product, teaching, and print-friendly decks.
- `boardroom-navy` — formal strategy, executive, and reporting decks.
- `technical-deep` — engineering and code-heavy decks.
- `playful-ink` — friendlier workshop/community decks.

Font presets remain separate; use `data-ls-font` only when you want a font role remap.

## Agent skill workflow

Runtime-neutral no-install path:

```sh
slidesls skill show
```

Full export fallback only:

```sh
slidesls skill show --all
```

For local-only development, link the skill so it always tracks the current checkout. Choose the skill directory required by your agent runtime:

```sh
slidesls skill link <your-agent-skill-dir>/create-slides-with-slidesls
```

Use a copy when symlinks are undesirable:

```sh
slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls
```

Example for Claude Code project-local skills:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

After installing or linking, agents should fully read the installed `SKILL.md` and relevant files in `references/`; use `slidesls skill show` if the runtime did not auto-load it, and `slidesls skill show --all` only as a full export fallback.

Then use incremental machine-readable discovery before editing decks or copy-mode projects:

```sh
slidesls catalog --starter --json
slidesls catalog --json
slidesls catalog --type preset --tag theme --json
slidesls inspect templates/split --json
slidesls inspect components/card --json
slidesls add utilities/layout components/panel components/card --dry-run --json
```

Use `catalog --api --json` or `inspect <item> --api --json` for low-level public classes, modifiers, data attributes, theme/font attributes, and CSS variables. Unless the user asks for static slides, copy/load `animations/reveal` plus one subtle variant such as `animations/slide-up` or `animations/fade` and use `.ls-reveal` with `data-step` or `data-ls-reveal-sequence`. Do not invent `ls-*` classes; validation warns for unknown `ls-*` classes and `--strict` errors. Static validation does not replace preview; after material slide edits, run `slidesls preview <deck>` and visually inspect representative slides unless intentionally skipped. Preview URLs can deep-link to normal-mode state with `#slide=2&step=1` (`slide` is 1-based; `step` is 0-based). Export mode still renders all slides/reveals and ignores the hash.

## Naming

Prefer:

- `--dir` for deck/project directory.
- `--registry-root` for a local registry checkout.
- `--registry-url` for a raw remote registry source.

The default remote registry URL targets the future public repository; until the repo is public, use bundled/local registry mode. Remote registry requests have per-request timeouts, so a slow registry fails with a bounded error instead of hanging indefinitely.

`snapshot` is intentionally post-MVP; browser screenshot workflows should remain optional and must not add a mandatory Playwright/Puppeteer dependency to the base package.
