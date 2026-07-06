# slidesls

Agent-primary slide authoring CLI and copyable registry for plain HTML/CSS/JS decks.

`slidesls` helps agents and humans initialize deck folders, inspect recommended templates/snippets, copy registry primitives, validate decks, preview them locally, and install the bundled agent skill. It is an authoring tool only: generated decks remain editable vanilla files with no runtime package dependency.

NPM package: [`@maxedapps/slidesls`](https://www.npmjs.com/package/@maxedapps/slidesls)  
Binary: `slidesls`

## Quickstart

Run directly with `npx`:

```sh
npx -y @maxedapps/slidesls@latest init ./my-deck --template minimal --theme executive-blue --title "My Deck"
cd my-deck
npx -y @maxedapps/slidesls@latest catalog --starter
npx -y @maxedapps/slidesls@latest validate
npx -y @maxedapps/slidesls@latest preview
```

Or install it globally:

```sh
npm install -g @maxedapps/slidesls
slidesls init ./my-deck --template minimal --theme executive-blue --title "My Deck"
cd my-deck
slidesls validate
slidesls preview
```

`slidesls init` writes `slidesls.json`, `index.html`, and `slidesls/` into the target directory, so only run it at a project root when that root is meant to be the deck.

Inside a larger project, prefer an explicit deck path:

```sh
slidesls init ./slides/my-deck --template minimal --title "My Deck"
```

### Primitive composition without templates

Templates are optional. For custom slide structures, start from a blank deck, inspect layout/components, then copy only the primitives you need:

```sh
slidesls init ./slides/custom-deck --template blank --title "Custom Deck"
slidesls catalog --type component --json
slidesls inspect utilities/layout components/card components/panel --json
slidesls add utilities/layout components/card components/panel --dir ./slides/custom-deck --dry-run --json
```

## Use as a copyable component registry

`init` is optional. To copy primitives into an existing project without scaffolding a full deck, run:

```sh
npx -y @maxedapps/slidesls@latest add components/card utilities/layout --dir ./existing-project --base-dir vendor/slidesls
```

If `--dir` has no `slidesls.json`, `add` uses copy mode and writes assets under the selected base directory.

## Agent skill

The npm package includes a bundled agent skill for authoring slides with `slidesls`.

```sh
npx -y @maxedapps/slidesls@latest skill show
npx -y @maxedapps/slidesls@latest skill install <your-agent-skill-dir>/create-slides-with-slidesls
npx -y @maxedapps/slidesls@latest skill info --json
```

After installing, agents should fully read the installed `SKILL.md` and relevant `references/` files before authoring.

## Commands

CLI help and key text outputs include explicit `For AI agents:` blocks. JSON outputs for discovery/editing commands include additive `agentInstructions` with rules and next command recipes.

- `slidesls init [dir]` — initialize a deck in the current directory, or in `[dir]` if supplied.
- `slidesls catalog --starter` / `slidesls catalog --json` — list brief item summaries for incremental discovery (`--json` is the complete lightweight inventory; `--starter` is the smallest fast-start set); add `--api` for public `authoring` metadata.
- `slidesls inspect <items...>` — show snippet HTML and aggregate load tags; add `--api` for public `authoring` metadata and `--with-dependencies` for dependency details.
- `slidesls add <items...>` — copy registry items into an initialized deck or any existing project in copy mode, and print load tags.
- `slidesls skill info|show|install` — inspect or copy the bundled agent skill. Use `slidesls skill show --reference catalog` for the generated public class/style/API catalog.
- `slidesls validate [dir]` — static deck validation, including advisory design-lint composition warnings.
- `slidesls preview [dir]` — serve a deck locally; JSON output includes per-slide deep links.
- `slidesls visual-qa` — browser-fact visual QA: a dependency-free collector script plus per-slide composition findings.
- `slidesls doctor [--dir <project>]` — check CLI/project health.

Most agent-facing commands support `--json`.

## Registry

Registry items are bundled with the npm package and copied into downstream decks. The registry is organized around:

- `core/` — base shell, tokens, runtime.
- `utilities/` — layout utilities that work anywhere.
- `components/` — standalone visual/content primitives.
- `templates/` — paste-ready slide snippets composed from utilities and components.
- `animations/` and `presets/` — optional enhancements, including fonts and themes.

Generated projects use `slidesls/` as the default copied asset directory and may freely edit those files. Default validation accepts those edits; `validate --strict` is available when you want copied-file hash drift to fail.

## Theming

Themes are optional visual presets under `presets/themes/*`. They are not templates: templates define slide structure, while themes remap canonical tokens for colors, surfaces, borders, radii, shadows, code blocks, status colors, and progress bars. A deck without `data-ls-theme` still uses the default dark blue-accent base tokens from `core/base/tokens.css`; it is not unstyled.

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

## Validation and preview

`slidesls validate` is a lightweight static check, not a full browser render or complete HTML parser. It catches common registry contract issues such as broken custom progress markup, raw timeline shorthand, reveal animation conflicts, and unknown copied classes, plus advisory design-lint warnings for composition anti-patterns (stretched sparse card grids, wrapping card rows), but it does not prove visual fit.

After creating or materially editing slides, use `slidesls preview` for visual review; it serves until the process is stopped. For measured review, `slidesls visual-qa --eval` prints a dependency-free browser collector and `slidesls visual-qa --analyze` turns the collected geometry into per-slide findings (low card fill, sparse equal boxes, small body type) with deep links to the slides that need attention.

Deck URLs support optional deep links in the form `#slide=2&step=1` (`slide` is 1-based, `step` is 0-based). New decks get this behavior through copied `slide-runtime.js`; existing decks must recopy/update that owned asset to opt in.

`snapshot` is intentionally deferred to keep the base package lightweight.
