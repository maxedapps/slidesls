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

- `slidesls init [dir] --template blank|minimal --title <text> [--registry-root <path> | --registry-url <url>]` — initialize a deck in the current directory, or in `[dir]` if supplied.
- `slidesls add <items...> --dir <project> [--base-dir <relative>] [--registry-root <path> | --registry-url <url>]` — copy registry items into a deck project or any existing project. If no `slidesls.json` exists in `--dir`, `add` uses copy mode and writes assets under `--base-dir` or `slidesls`.
- `slidesls catalog [--recommended] [--type <type>] [--tag <tag>] [--query <text>] [--limit <n>] [--registry-root <path> | --registry-url <url>]` — list items; use `--recommended` for the agent-safe set.
- `slidesls inspect <items...> [--readme] [--registry-root <path> | --registry-url <url>]` — show metadata, load guidance, and snippet HTML for requested items.
- `slidesls skill info [--json]` — show bundled agent skill metadata.
- `slidesls skill show` — print the bundled agent `SKILL.md`.
- `slidesls skill install [dir] [--dry-run] [--force]` — copy the bundled skill to `[dir]` or `./.claude/skills/slidesls`.
- `slidesls skill link [dir] [--force]` — symlink the bundled skill to `[dir]` or `./.claude/skills/slidesls`.
- `slidesls validate [dir] [--strict]` — validate deck config, entry markup, local assets, and manifest files. `--strict` also treats copied-file hash drift as an error.
- `slidesls preview [dir] [--host <host>] [--port <port>]` — serve a local preview until the process is stopped.
- `slidesls doctor [--dir <project>] [--registry-root <path> | --registry-url <url>]` — check Node/package/config/registry/project health.
- `slidesls validate-registry [--registry-root <path> | --registry-url <url>]` — repo/package registry validation.
- `slidesls validate-examples` — repo example/template validation.
- `slidesls generate-catalog [--registry-root <path> | --registry-url <url>] [--check]` — internal agent catalog generation/check.

All commands support `--help`. Agent-facing commands support `--json` where useful.

## Init target guidance

Use a dedicated deck folder. From inside that folder:

```sh
slidesls init --template minimal --title "My Deck"
```

Inside a larger project, prefer an explicit path:

```sh
slidesls init ./slides/my-deck --template minimal --title "My Deck"
```

`init` writes `slidesls.json`, the configured entry file, and copied registry assets into the target directory.

## Copy mode without init

`init` is optional for copying registry assets. Use `add` directly when you want slidesls primitives inside an existing project without scaffolding a full deck:

```sh
slidesls add components/card utilities/layout --dir ./existing-project --base-dir vendor/slidesls
```

When `--dir` has no `slidesls.json`, `add` uses copy mode, writes under the selected base directory, creates/updates that base directory's `manifest.json`, and reports `mode: "copy"` in JSON output. If `--dir` is supplied, config discovery is limited to that exact directory; ancestor configs are not inherited.

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
slidesls catalog --recommended --json
slidesls inspect templates/split --json
slidesls inspect components/card --json
slidesls add utilities/layout components/panel components/card --dry-run --json
```

## Naming

Prefer:

- `--dir` for deck/project directory.
- `--registry-root` for a local registry checkout.
- `--registry-url` for a raw remote registry source.

The default remote registry URL targets the future public repository; until the repo is public, use bundled/local registry mode. Remote registry requests have per-request timeouts, so a slow registry fails with a bounded error instead of hanging indefinitely.

`snapshot` is intentionally post-MVP; browser screenshot workflows should remain optional and must not add a mandatory Playwright/Puppeteer dependency to the base package.
