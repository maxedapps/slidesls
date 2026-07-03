# slidesls

Agent-primary slide authoring CLI and copyable registry for plain HTML/CSS/JS decks.

`slidesls` helps agents and humans initialize deck folders, inspect recommended templates/snippets, copy registry primitives, validate decks, preview them locally, and install/link the bundled agent skill. The package is an authoring tool only; generated decks remain editable vanilla files with no runtime package dependency.

Package: `@maxedapps/slidesls` (binary: `slidesls`).

## Quickstart

After publishing/installing from npm:

```sh
npx -y @maxedapps/slidesls@latest init ./my-deck --template minimal --theme executive-blue --title "My Deck"
cd my-deck
npx -y @maxedapps/slidesls@latest catalog --starter
npx -y @maxedapps/slidesls@latest validate
npx -y @maxedapps/slidesls@latest preview
```

Local repo checkout, from a dedicated deck folder:

```sh
mkdir my-deck
cd my-deck
node /absolute/path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
node /absolute/path/to/ls_slides/bin/slidesls.mjs catalog --starter
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
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill show
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill link <your-agent-skill-dir>/create-slides-with-slidesls
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill info --json
```

For local-only agent work, `skill link` is usually best because the target project points at the current checkout skill. Choose the target directory required by your agent runtime. Claude Code project-local example:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill install ./.claude/skills/create-slides-with-slidesls
```

After installing or linking, agents should fully read the installed `SKILL.md` and relevant `references/` files before authoring.

Optional local tarball workflow:

```sh
cd /path/to/ls_slides
npm pack
cd /path/to/other-project
npm install /path/to/ls_slides/maxedapps-slidesls-*.tgz
npx -y @maxedapps/slidesls@latest init --template minimal --title "My Deck"
```

Use the packed tarball for pre-publish smoke tests and release-candidate installs.

## Commands

CLI help and key text outputs include explicit `For AI agents:` blocks. JSON outputs for discovery/editing commands include additive `agentInstructions` with rules and next command recipes.

- `slidesls init [dir]` — initialize a deck in the current directory, or in `[dir]` if supplied.
- `slidesls catalog --starter` / `slidesls catalog --json` — list brief item summaries for incremental discovery; add `--api` for public `authoring` metadata.
- `slidesls inspect <items...>` — show snippet HTML and aggregate load tags; add `--api` for public `authoring` metadata and `--with-dependencies` for dependency details.
- `slidesls add <items...>` — copy registry items into an initialized deck or any existing project in copy mode, and print load tags.
- `slidesls skill info|show|install|link` — inspect, copy, or symlink the bundled agent skill. Use `slidesls skill show --reference catalog` for the generated public class/style/API catalog.
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
- `clean-light` — bright product, teaching, and print-friendly decks.
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

`slidesls validate` is a lightweight static check, not a full browser render or complete HTML parser. It now catches common registry contract issues such as broken custom progress markup, raw timeline shorthand, reveal animation conflicts, and unknown copied classes, but it does not prove visual fit. After creating or materially editing slides, use `slidesls preview` for manual or agent-browser review of representative slides; it serves until the process is stopped.

Deck URLs support optional deep links in the form `#slide=2&step=1` (`slide` is 1-based, `step` is 0-based). New decks get this behavior through copied `slide-runtime.js`; existing decks must recopy/update that owned asset to opt in.

`snapshot` is intentionally deferred to keep the base package lightweight.
