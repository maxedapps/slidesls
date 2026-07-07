# slidesls CLI

`slidesls` is an authoring CLI. It copies registry assets into a deck project; generated decks do not need the package at runtime.

Installed package usage: `npx -y @maxedapps/slidesls@latest <command>` (the `-y @maxedapps/...` form avoids resolving an unrelated unscoped package). Local checkout usage: `node /path/to/ls_slides/bin/slidesls.mjs <command>`.

All commands support `--help`. Agent-facing commands support `--json`; key text outputs include `For AI agents:` recipes, and JSON outputs carry additive `agentInstructions`. Registry source options are shared: `--registry-root <path>` for a local registry checkout, `--registry-url <url>` for a raw remote source; the bundled registry is the default.

## init

```txt
slidesls init [dir] [--template blank|minimal] [--style <style>] [--title <text>] [--registry-root <path>] [--registry-url <url>] [--force] [--json]
```

Initializes the current directory by default, or `[dir]` if supplied. Writes `slidesls.json`, the entry HTML, and copied assets under `slidesls/` — use a dedicated deck folder inside larger projects. `--style editorial` (or `terminal`, `gallery`, `boardroom`, `pop`) copies the art direction with its vendored fonts, links everything, and sets `data-ls-style` on the generated `<html>`. `--template minimal` scaffolds starter slides; `--template blank` scaffolds an empty shell for fully custom composition.

## add

```txt
slidesls add <items...> [--dir <project>] [--base-dir <relative>] [--registry-root <path>] [--registry-url <url>] [--include-docs] [--dry-run] [--force] [--json]
```

Copies registry items (resolving `registryDependencies`) into an initialized deck, or into any existing project in copy mode when `--dir` has no `slidesls.json` (assets go under `--base-dir`, default `slidesls`). `add` copies files and updates the manifest; it does not edit HTML — insert the returned load tags into the entry HTML when needed. Run with `--dry-run --json` first to review planned files and load tags.

## catalog

```txt
slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--intent <intent>] [--style <name>] [--query <text>] [--limit <n>] [--preview] [--registry-root <path>] [--registry-url <url>] [--json]
```

Lists registry items. JSON output is brief by default; add `--api` for public authoring metadata. Filters:

- `--type` — `style`, `archetype`, `component`, `layout`, `font`, `core`.
- `--intent` — narrative intent: `open`, `close`, `prove`, `compare`, `explain-process`, `teach`, `show-data`, `show-code`, `emphasize`.
- `--style` — keep only items compatible with one art direction (items with no style notes are compatible with all).
- `--preview` — include preview-status items, which are hidden by default.

`slidesls catalog --json` is the complete lightweight inventory; `--type style --json` picks the deck's art direction; `--type archetype --json` lists complete slide patterns with contracts.

## inspect

```txt
slidesls inspect <items...> [--brief] [--examples] [--api] [--with-dependencies] [--readme] [--registry-root <path>] [--registry-url <url>] [--json]
```

Shows metadata, load guidance, and snippets. Default JSON is snippet-focused (`snippets[].html`, `dependencyOrder`, `load.links`, `load.scripts`). `--brief` returns the decision payload only (purpose, use/avoid, contract, motion, load tags — no snippet HTML); `--examples` returns snippets only (label + html per variant); `--api` adds authoring metadata (classes, data attributes, CSS variables); `--with-dependencies` adds dependency details; `--readme` includes the item README.

Layout system API: `slidesls inspect layouts/core --api --json`.

## icons

```txt
slidesls icons <sync|list> [--dir <deck>] [--add <name,name>] [--registry-root <path>] [--registry-url <url>] [--json]
```

- `sync` — rewrites the deck's inline icon sprite to exactly the icons the entry HTML references via `<use href="#ls-i-<name>">` (plus any `--add` names), and writes the Lucide license to `slidesls/registry/icons/LICENSE`.
- `list` — shows the curated icon set.

`--add` resolves curated icons locally and falls back to the pinned `lucide-static` version on npm CDNs when online. Run `slidesls icons sync --dir <deck> --json` after adding or removing icon references.

## gallery

```txt
slidesls gallery [--out <dir>] [--registry-root <path>] [--registry-url <url>] [--json]
```

Generates `.gallery/` HTML pages rendering every registry snippet under every style and density (repo/dev review harness). Open pages with `?export=1` for stills; `scripts/visual-gate.mjs` measures and screenshots them.

## skill

```txt
slidesls skill info [--json]
slidesls skill show [--reference <name>] [--all]
slidesls skill install <dir> [--dry-run] [--force] [--json]
slidesls skill link <dir> [--force] [--json]
```

Distributes the bundled agent skill. `show` prints `SKILL.md` (the runtime-neutral no-install path); `show --reference <name>` prints one reference (`catalog`, `style-directions`, `archetypes`, `motion`, `customization`, `qa`); `show --all` is a full-export fallback only. `install` copies and `link` symlinks the skill into the skill directory required by the active agent runtime, for example Claude Code project-local skills:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

## validate

```txt
slidesls validate [dir] [--strict] [--report] [--registry-root <path>] [--registry-url <url>] [--use-manifest-registry] [--json]
```

Static deck validation (see [validation.md](./validation.md) for every code). Default validation is offline/deterministic and uses the bundled registry unless an explicit registry source is provided; `--use-manifest-registry` validates against the registry source recorded in the deck manifest. Unknown `ls-*` classes warn by default and error with `--strict`. `--report` adds the deck scorecard: per-slide archetype map, variety distribution, motion coverage, icon consistency, and the lint summary — necessary, never sufficient; rendered review still decides.

## preview

```txt
slidesls preview [dir] [--host <host>] [--port <port>] [--json]
```

Starts a local server, prints the URL, and keeps running until stopped. JSON output includes `exportUrl` (`?export=1`) and per-slide `slideLinks` deep links (`#slide=N`).

## visual-qa

```txt
slidesls visual-qa --eval
slidesls visual-qa --analyze [--input <collected.json>] [--json]
```

Browser-fact visual QA for a running preview. `--eval` prints a dependency-free browser collector script; `--analyze` turns its collected JSON into advisory per-slide findings with deep links. The loop:

1. Keep a preview running: `slidesls preview <deck> --host 127.0.0.1 --port 4321`
2. Open the export URL (`?export=1`) in agent-browser so every slide renders, then pipe the output of `slidesls visual-qa --eval` into an agent-browser eval call reading stdin and save the result as `collected.json`.
3. Analyze: `slidesls visual-qa --analyze --input collected.json --json`
4. Screenshot each slide listed in `summary.slidesToInspect` via its `deepLink`, fix, re-validate, and re-run until clean.

Findings are advisory; they point at slides to inspect, not hard failures.

## doctor

```txt
slidesls doctor [--dir <project>] [--registry-root <path>] [--registry-url <url>] [--json]
```

Checks CLI/project health: Node version, package metadata, config parse, entry existence, project writability, registry availability.

## Repo/maintenance commands

```txt
slidesls validate-registry [--registry-root <path>] [--registry-url <url>] [--json]
slidesls validate-examples [--dir <repo>] [--json]
slidesls generate-catalog [--registry-root <path>] [--registry-url <url>] [--output <path>] [--check] [--json]
```

- `validate-registry` — registry metadata/files/snippets/dependency validation.
- `validate-examples` — recursive repo example validation.
- `generate-catalog` — generates (or `--check`s) the agent catalog reference bundled with the skill.
