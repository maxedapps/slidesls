# Plan: Local Cross-Project Agent Skill Usability for slidesls

## Summary

Improve `slidesls` so it is easy and reliable to use from other local projects before the repo is public or the npm package is published. The core addition is a self-documenting `slidesls skill` command that lets an agent show, install, or link the latest bundled slidesls agent skill from the active local CLI. The plan also updates skill/docs/help to make current-directory initialization, local checkout usage, and downstream agent workflows clear.

This plan does **not** publish the package, does **not** depend on a public GitHub repo, and does **not** add runtime dependencies to generated decks.

## Confirmed requirements

- Current use is local-only on this machine, from arbitrary other projects.
- Future public GitHub/npm publishing should be prepared for, but not activated now.
- Generated decks must remain plain HTML/CSS/JS with no `slidesls` runtime dependency.
- CLI should provide a command to quickly get or update the latest agent skill.
- CLI help should make agent-oriented usage discoverable.
- `slidesls init` should initialize the current directory by default; an optional path argument must remain supported.
- No implementation changes should be made until this plan is approved.

## Current-state findings

### CLI

- `src/cli/commands.mjs` already implements current-directory init:

  ```js
  const projectRoot = path.resolve(args._[0] || ".");
  ```

  So `slidesls init` already initializes the current working directory.

- The documentation and skill examples currently emphasize `slidesls init deck`, which nudges agents toward subfolder creation.
- The bundled registry already resolves relative to the package/repo root via `import.meta.dirname`, not the caller's current working directory. This means local cross-project CLI usage already works with:

  ```sh
  node /path/to/ls_slides/bin/slidesls.mjs init
  ```

  from another project.

- Root help does not mention agent skill installation/update.
- There is no `slidesls skill` command.
- `preview --open` is parsed but not implemented.

### Skills

Existing skill files:

```txt
skills/slidesls/SKILL.md
skills/slidesls/references/catalog.md
skills/slidesls/references/copy-workflow.md
skills/slidesls/references/deck-authoring.md
skills/slidesls/references/preview-validation.md
skills/slidesls/references/registry-contract.md
```

Strengths:

- Useful basic workflow.
- Covers catalog/inspect/add/validate/preview.
- Includes deck shell, reveal contract, icon caveats, and registry contract.
- Included in `npm pack --dry-run` package contents.

Weaknesses:

- Assumes `slidesls` is globally available.
- Points to root `docs/*`, which will not exist after copying the skill into another project.
- Does not provide a clear local-checkout command form.
- Does not mention how to update the skill from the active CLI.
- Does not strongly distinguish dedicated deck folder usage from initializing inside a larger unrelated project.

### Package/public status

- `package.json` is currently `private: true`; publishing is intentionally blocked.
- `npm pack --dry-run` works, and local tarball installation remains possible even with `private: true`.
- `DEFAULT_REGISTRY_URL` points to a future public raw GitHub URL, but remote mode should be treated as non-functional until the repo is public.

## Chosen implementation strategy

Implement a minimal, local-first `slidesls skill` command group and update skill/help/docs around it.

Recommended command surface:

```txt
slidesls skill info [--json]
slidesls skill show
slidesls skill install [dir] [--dry-run] [--force] [--json]
slidesls skill link [dir] [--force] [--json]
```

Rationale:

- `skill info` gives agents machine-readable metadata.
- `skill show` prints the current bundled `SKILL.md`.
- `skill install` copies the bundled skill into another project or global agent skill directory.
- `skill link` is especially valuable for local-only use: downstream projects can symlink to the local checkout and always use the latest skill without repeated updates.
- This is additive, does not require npm publishing, and remains compatible with future package usage.

## Alternatives considered

### Only update docs

Rejected. Docs alone do not give another agent a reliable command to fetch/update the current skill.

### Standalone script under `scripts/`

Rejected. Less discoverable and not self-documenting through `slidesls --help`.

### Separate `export` and `update` subcommands

Rejected for now. `install` can be idempotent create-or-update behavior. Separate `update` adds command complexity without enough benefit in the local-first phase.

### Copy-only skill distribution

Rejected as the sole path. Copying can become stale. For local-only use, symlinking is often better because it points directly at the checked-out latest skill.

### Make `init` pathless only

Rejected. `slidesls init` should be the primary guidance, but `slidesls init path/to/deck` is useful and already supported.

### Publish now

Rejected per current project constraint.

## Detailed implementation plan

### Phase 1: Add skill file discovery helpers

Create a small helper module, likely:

```txt
src/skill/agent-skill.mjs
```

Responsibilities:

- Resolve bundled skill source path:

  ```txt
  <package-root>/skills/slidesls
  ```

  using `import.meta.dirname` / package-relative resolution, not `process.cwd()`.

- Recursively enumerate files under the skill directory.
- Only include files, not directories.
- Produce relative POSIX-style paths such as:

  ```txt
  SKILL.md
  references/catalog.md
  references/copy-workflow.md
  ```

- Hash file contents with existing `sha256Text` / `sha256File` helpers.
- Copy files to a target directory while preserving relative paths.
- Support dry-run plans.
- Support symlink creation for `skill link`.

Important implementation note:

- Existing helpers in `src/shared/fs.mjs` do **not** currently include recursive directory walking or copying. This should be treated as required new functionality, not incidental work.
- Do **not** use `assertSafeRelativePath` on the user-provided target directory. The target may be absolute and may intentionally be outside the current project, e.g. `~/.claude/skills/slidesls`.
- Use path safety for source-relative paths only.

Potential exported functions:

```js
bundledSkillRoot();
listSkillFiles();
planSkillInstall({ targetDir });
performSkillInstall({ targetDir, force });
performSkillLink({ targetDir, force });
skillInfo();
```

### Phase 2: Add `slidesls skill` command group

Update `src/cli/commands.mjs` and `bin/slidesls.mjs` as needed.

Root command:

```sh
slidesls skill [subcommand] [options]
```

Subcommands:

#### `slidesls skill info [--json]`

Human output should summarize:

- skill name
- CLI version
- bundled source path
- file count
- suggested local usage

JSON output should use the existing result envelope:

```json
{
  "ok": true,
  "data": {
    "name": "slidesls",
    "cliVersion": "0.1.0",
    "source": "/path/to/ls_slides/skills/slidesls",
    "files": [{ "path": "SKILL.md", "sha256": "..." }],
    "recommendedTargets": [".claude/skills/slidesls"]
  }
}
```

Note: Be careful with `recommendedTargets`; do not overclaim support for every agent runtime. For now, mention `.claude/skills/slidesls` as a common project-local Claude Code skill path and allow explicit custom targets.

#### `slidesls skill show`

Print `skills/slidesls/SKILL.md` to stdout.

Use cases:

```sh
node /path/to/ls_slides/bin/slidesls.mjs skill show
```

Agents can inspect the authoritative current skill without knowing repo paths.

#### `slidesls skill install [dir] [--dry-run] [--force] [--json]`

Copy the bundled skill folder to a target directory.

Recommended default behavior:

- If `[dir]` is omitted, use project-local `.claude/skills/slidesls` under the current working directory.
- If `[dir]` is supplied, resolve it normally with `path.resolve()`.
- Create parent directories as needed.
- Copy `SKILL.md` and `references/**`.
- If files already exist and differ:
  - without `--force`, fail with a clear message.
  - with `--force`, overwrite.
- If files are identical, report unchanged.

For this local-first phase, avoid complex three-way modified-file detection unless a manifest is added. A simple safe model is acceptable:

- identical => unchanged
- missing => created
- different + no `--force` => conflict
- different + `--force` => updated

Optional future enhancement:

- Add `.slidesls-skill.json` in the target for true baseline tracking.

Example:

```sh
node /path/to/ls_slides/bin/slidesls.mjs skill install ./.claude/skills/slidesls
```

#### `slidesls skill link [dir] [--force] [--json]`

Create a symlink from the target directory to the bundled local skill directory.

This is especially useful now because the repo is local-only:

```sh
node /path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
```

Behavior:

- Default target if omitted: `.claude/skills/slidesls` in current working directory.
- If target does not exist, create parent dirs and symlink.
- If target is already the correct symlink, report unchanged.
- If target exists and `--force` is not set, fail.
- If target exists and `--force` is set, remove/replace carefully.

Caveat:

- Symlink behavior can differ on Windows; if Windows support is important, either document copy fallback or implement platform-aware handling.

### Phase 3: Make CLI help self-documenting

Update root help in `src/cli/commands.mjs`:

```txt
skill            Show, install, or link the bundled agent skill
```

Add a compact agent block:

```txt
Agent usage:
  slidesls skill install ./.claude/skills/slidesls
  slidesls catalog --json
  slidesls inspect <item> --readme --json
  slidesls add <items...> --dry-run --json
```

Update `slidesls skill --help`:

```txt
Usage:
  slidesls skill info [--json]
  slidesls skill show
  slidesls skill install [dir] [--dry-run] [--force] [--json]
  slidesls skill link [dir] [--force] [--json]

Defaults:
  [dir] defaults to ./.claude/skills/slidesls in the current project.

Local checkout example:
  node /path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
```

Update `slidesls init --help`:

```txt
Usage: slidesls init [dir] ...
Initializes the current directory by default. If [dir] is supplied, initializes that directory.
```

Also adjust root command description:

```txt
init [dir]       Initialize a deck in the current directory, or in [dir]
```

### Phase 4: Correct init guidance without encouraging unsafe project-root clutter

The desired behavior is current-directory-first, but the documentation should be precise:

Preferred for a dedicated deck folder:

```sh
mkdir my-deck
cd my-deck
node /path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
```

Optional direct path:

```sh
node /path/to/ls_slides/bin/slidesls.mjs init ./slides/my-deck --template minimal --title "My Deck"
```

Important caveat:

- `slidesls init` writes `slidesls.json`, `index.html`, and `slidesls/` into the target directory.
- In a large existing project, prefer a dedicated deck folder such as `slides/my-deck/` unless the project root itself is meant to be the deck.

This preserves current-directory semantics while avoiding accidental clutter in unrelated project roots.

### Phase 5: Make the bundled skill portable

Update `skills/slidesls/SKILL.md`.

Required changes:

- Remove or rewrite references to root `docs/*` paths that will not exist after export/link in another project.
- Point to bundled `references/*.md` for skill-local guidance.
- Tell agents to use CLI commands for current docs/metadata:

  ```sh
  slidesls --help
  slidesls catalog --json
  slidesls inspect <item> --readme --json
  ```

- Add local checkout command pattern:

  ```sh
  node /path/to/ls_slides/bin/slidesls.mjs <command>
  ```

- Add future npm pattern, explicitly marked as future:

  ```sh
  # Once published:
  npx -y @maxedapps/slidesls@latest <command>
  ```

- Update init examples to current-directory-first.
- Add downstream local workflow:

  1. Run `slidesls --help` or `node /path/to/ls_slides/bin/slidesls.mjs --help`.
  2. Install/link the latest skill if needed.
  3. Use a dedicated deck folder.
  4. Run `init` in that folder or pass an explicit path.
  5. Run `catalog --json`.
  6. Run `inspect <item> --readme --json` for candidates.
  7. Run `add ... --dry-run --json` before copying.
  8. Run `add ...`.
  9. Edit plain HTML/CSS/JS.
  10. Run `validate --json`.
  11. Run `preview` and optionally use browser tooling.

- Add prohibitions:
  - Do not add React/Vite/Tailwind unless explicitly requested.
  - Do not make generated decks depend on `slidesls` at runtime.
  - Do not assume Lucide icons work without loading Lucide.
  - Do not skip validation.
  - Do not edit package registry source when the intent is to customize a deck; edit copied deck assets instead.

### Phase 6: Update only the highest-value docs now

Keep this phase focused to avoid over-documenting speculative future publish behavior.

Update `README.md`:

- Add a section: "Local use from other projects before publishing".
- Include direct local checkout usage:

  ```sh
  node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
  node /absolute/path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
  node /absolute/path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "My Deck"
  ```

- Include optional local tarball workflow:

  ```sh
  cd /path/to/ls_slides
  npm pack
  cd /path/to/other-project
  npm install /path/to/ls_slides/maxedapps-slidesls-0.1.0.tgz
  npx slidesls init --template minimal --title "My Deck"
  ```

- Make clear `private: true` blocks npm publishing but does not block `npm pack` local testing.
- Reword quickstart to current-directory-first.

Update `docs/cli.md`:

- Add the `skill` command.
- Reword `init [dir]`.
- Add local checkout examples.

Update `docs/agent-workflow.md`:

- Add skill install/link workflow.
- Add current-directory-first but dedicated-folder guidance.

Defer larger docs rewrites until publishing is actually near.

### Phase 7: Decide what to do with `preview --open`

Because `preview --open` is currently parsed but not implemented, choose one small cleanup:

Option A: Remove `open` from parsed/global boolean options and help until implemented.

Option B: Implement it using a small platform-aware opener.

Recommendation for this phase: Option A, unless `--open` is immediately needed. Keeping a parsed no-op flag weakens CLI trust and self-documentation.

### Phase 8: Tests

Add focused tests, likely in a new file:

```txt
tests/skill-command.test.mjs
```

Test cases:

- `slidesls --help` includes `skill`.
- `slidesls skill --help` lists `info`, `show`, `install`, `link`.
- `slidesls skill info --json` returns file metadata including `SKILL.md`.
- `slidesls skill show` includes frontmatter with `name: slidesls`.
- `slidesls skill install <tmp>` creates `SKILL.md` and references.
- `slidesls skill install <tmp>` twice reports unchanged on second run.
- `slidesls skill install <tmp> --dry-run --json` reports planned writes without writing.
- Existing different file without `--force` fails.
- Existing different file with `--force` updates.
- `slidesls skill link <tmp-target>` creates a symlink where supported.
- `slidesls skill link` handles existing target safely.

Add cross-project regression tests:

- Spawn CLI from a temp directory, not from repo root.
- Run local checkout CLI path:

  ```sh
  node /path/to/repo/bin/slidesls.mjs skill info --json
  node /path/to/repo/bin/slidesls.mjs init --template minimal
  node /path/to/repo/bin/slidesls.mjs catalog --json
  node /path/to/repo/bin/slidesls.mjs validate --json
  ```

This proves bundled registry and bundled skill resolution are package-root based, not cwd based.

Update `scripts/test-cli-smoke.mjs`:

- Include `skill --help`.
- Include `skill info --json`.
- Install skill to temp dir and verify files.
- Optionally link skill where symlinks are available.

### Phase 9: Verification

Run:

```sh
pnpm fmt
pnpm check
npm pack --dry-run
```

Manual local cross-project test:

```sh
tmp=$(mktemp -d)
cd "$tmp"
node /path/to/ls_slides/bin/slidesls.mjs --help
node /path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
mkdir deck
cd deck
node /path/to/ls_slides/bin/slidesls.mjs init --template minimal --title "Local Agent Test"
node /path/to/ls_slides/bin/slidesls.mjs catalog --json
node /path/to/ls_slides/bin/slidesls.mjs inspect components/card --readme --json
node /path/to/ls_slides/bin/slidesls.mjs add components/card --dry-run --json
node /path/to/ls_slides/bin/slidesls.mjs add components/card
node /path/to/ls_slides/bin/slidesls.mjs validate --json
```

Optional packed local test:

```sh
cd /path/to/ls_slides
npm pack
cd "$tmp"
npm init -y
npm install /path/to/ls_slides/maxedapps-slidesls-0.1.0.tgz
npx slidesls skill install ./.claude/skills/slidesls
mkdir packed-deck
cd packed-deck
npx slidesls init --template minimal --title "Packed Local Test"
npx slidesls validate --json
```

## Files likely to change

- `src/cli/commands.mjs`
- `bin/slidesls.mjs`
- new `src/skill/agent-skill.mjs`
- possibly `src/shared/fs.mjs` for generic recursive file listing/copy helpers
- `skills/slidesls/SKILL.md`
- `skills/slidesls/references/copy-workflow.md`
- `skills/slidesls/references/deck-authoring.md`
- `skills/slidesls/references/preview-validation.md`
- `README.md`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `tests/skill-command.test.mjs`
- `scripts/test-cli-smoke.mjs`

## Interface changes

New command group:

```txt
slidesls skill info [--json]
slidesls skill show
slidesls skill install [dir] [--dry-run] [--force] [--json]
slidesls skill link [dir] [--force] [--json]
```

Updated help wording:

```txt
init [dir]       Initialize a deck in the current directory, or in [dir]
skill            Show, install, or link the bundled agent skill
```

No generated deck API/runtime changes.

## Backward compatibility

- Existing `slidesls init my-deck` remains supported.
- Existing `slidesls init` behavior remains supported.
- Existing registry, add, validate, preview commands remain unchanged.
- Skill command is additive.
- Future npm usage can reuse the same command surface.

## Risks and mitigations

### Risk: Exported copied skill becomes stale

Mitigation: provide `skill link` for local-only use; copied `skill install` remains available when symlinks are undesirable.

### Risk: Wrong target path for agent runtime

Mitigation: default to project-local `.claude/skills/slidesls`, document that custom agents may require a custom target, and make `[dir]` explicit/overrideable.

### Risk: Overwriting customized skill files

Mitigation: default copy behavior refuses differing existing files unless `--force`. Defer full baseline manifest/three-way merge until needed.

### Risk: Symlink portability

Mitigation: document copy fallback; write tests that skip symlink assertions when unsupported.

### Risk: Help becomes too verbose

Mitigation: keep root help compact and put detailed examples under `slidesls skill --help` and docs.

### Risk: Current-directory init creates clutter in unrelated project roots

Mitigation: docs should say current-directory init is ideal inside a dedicated deck folder; use explicit path like `slides/my-deck` inside larger projects.

## Deferred follow-up work

After this plan is implemented, the next high-impact improvements are:

1. Registry snippets: add paste-ready HTML snippets and expose them through `inspect --json` / `add --dry-run --json`.
2. Stronger schema validation for config, manifest, and registry item metadata.
3. Optional browser validation/snapshot/export workflows.
4. Future public/npm publishing metadata and release workflow.
5. Remote registry URL validation once the repo is public.

## Review notes

This plan incorporates an external critique pass. Key changes from the initial draft:

- Added `skill link` because local symlinked skills are better than stale copied skills for current local-only use.
- Replaced separate `export`/`update` commands with simpler idempotent `install`.
- Corrected target guidance from invented `.agents/skills/slidesls` to project-local `.claude/skills/slidesls` while still allowing custom targets.
- Made recursive skill file enumeration/copying an explicit implementation task.
- Avoided unsafe use of registry path helpers for user-provided absolute target dirs.
- Added cross-cwd regression testing.
- Made init guidance more careful: current-directory-first inside a dedicated deck folder, optional path for larger projects.
- Added a decision point for the parsed-but-unimplemented `preview --open` flag.
