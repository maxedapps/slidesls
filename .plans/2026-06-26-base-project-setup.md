# Plan: Base Project Setup

Date: 2026-06-26
Status: Implemented
Project: ls_slides

## Context

This repository will become a copyable registry of vanilla HTML/CSS/JS slide-building blocks: core CSS contracts, layouts, components, presets, and GSAP animation recipes. It is not a slide generator, framework, or component library package.

The agreed repository model is:

- `registry/` contains copyable/installable building blocks.
- `docs/` will be an Astro-based discovery/documentation site.
- `examples/`, `skills/`, and `scripts/` support the registry but are not registry items.

## Goals

- Set up only the base project scaffolding.
- Use pnpm for package/project management.
- Use pnpm workspaces only; no Turborepo, Nx, Rush, Changesets, or other monorepo tooling.
- Use Oxlint for linting.
- Use Oxfmt for formatting.
- Configure pnpm with conservative, supply-chain-aware settings.
- Avoid creating actual slide components, registry item files, docs pages, or scripts in this phase.

## User constraints

- pnpm only for package management.
- No other monorepo tools.
- Oxlint for linting.
- Oxfmt for formatting.
- Research pnpm safe settings from docs.
- No actual code/components yet.
- No bunch of empty files.
- Only base folder structure in this phase.

## Research performed

Sources checked:

- pnpm settings: `https://pnpm.io/settings`
- pnpm workspaces: `https://pnpm.io/workspaces`
- pnpm package.json docs: `https://pnpm.io/package_json`
- pnpm supply-chain security: `https://pnpm.io/supply-chain-security`
- pnpm v11 release notes: `https://pnpm.io/blog/releases/11.0`
- Oxlint quickstart/config docs: `https://oxc.rs/docs/guide/usage/linter/quickstart`, `https://oxc.rs/docs/guide/usage/linter/config`
- Oxfmt quickstart/CLI docs: `https://oxc.rs/docs/guide/usage/formatter/quickstart.html`, `https://oxc.rs/docs/guide/usage/formatter/cli`

Relevant findings:

- pnpm v11 stores most project settings in `pnpm-workspace.yaml`; `.npmrc` is mainly for auth/registry settings.
- A `pnpm-workspace.yaml` is useful even before multiple package manifests exist because it stores project-level pnpm config.
- pnpm v11 already defaults to several safe behaviors, including `minimumReleaseAge: 1440`, `blockExoticSubdeps: true`, `strictDepBuilds: true`, `dangerouslyAllowAllBuilds: false`, `verifyStoreIntegrity: true`, and `strictStorePkgContentCheck: true`.
- pnpm recommends blocking risky dependency lifecycle scripts via explicit `allowBuilds`, preventing exotic transitive dependencies via `blockExoticSubdeps`, delaying fresh releases via `minimumReleaseAge`, and using `trustPolicy: no-downgrade` for stronger trust checks.
- pnpm v11 replaces old package-manager strictness settings with `pmOnFail`.
- Oxlint docs recommend `pnpm add -D oxlint`, scripts `lint` and `lint:fix`, and either `.oxlintrc.json` or `oxlint.config.ts`.
- Oxfmt docs recommend `pnpm add -D oxfmt`, scripts `fmt` and `fmt:check`, and `.oxfmtrc.json` via `oxfmt --init`.
- Use JSON configs for Oxlint/Oxfmt initially to avoid TypeScript config runtime constraints and keep setup simple.

Local environment observed:

```sh
node -v   # v26.1.0
pnpm -v   # 11.1.1
```

## Decisions

### 1. Use a single pnpm-managed root project initially

Create a root `package.json` with:

- `private: true`
- `type: module`
- `packageManager: pnpm@11.1.1`
- `engines.node: >=22.18.0`
- root scripts for linting, formatting, and checks

Do not create a `docs/package.json` yet. The `docs/` folder can become a workspace package later when the Astro site is actually initialized.

### 2. Keep `pnpm-workspace.yaml`, but omit `packages` for now

Use `pnpm-workspace.yaml` for project-level pnpm config.

Do not add `packages: ["docs"]` until `docs/` has its own `package.json`. Otherwise pnpm may treat it as a workspace candidate without a manifest.

### 3. Use a small, intentional pnpm safety config

Avoid restating every pnpm default. Too many default restatements increase maintenance and typo risk.

Recommended `pnpm-workspace.yaml` settings for phase 1:

```yaml
# No workspace packages yet. Add packages when docs/ becomes an actual package.

# Explicitly document the 24-hour dependency freshness delay.
minimumReleaseAge: 1440

# Stronger than pnpm's default: fail if package trust evidence downgrades.
trustPolicy: no-downgrade

# Fail if the running pnpm version does not match packageManager.
pmOnFail: error
```

Optional extra explicit defaults may be added only if desired for documentation:

```yaml
# Defaults in pnpm v11, documented here only if we want extra visibility.
# blockExoticSubdeps: true
# strictDepBuilds: true
# dangerouslyAllowAllBuilds: false
```

Do not set these in phase 1 unless there is a strong reason:

- `minimumReleaseAgeIgnoreMissingTime: false` — stricter but can make installs fragile with registries/packages missing publish-time metadata.
- `resolutionMode: time-based` — overlaps with `minimumReleaseAge` and can make transitive resolution less intuitive.
- `nodeLinker`, `shamefullyHoist`, `publicHoistPattern`, `linkWorkspacePackages`, `saveWorkspaceProtocol` — current defaults are fine and need not be restated.

### 4. Use Oxlint and Oxfmt at the root

Install as dev dependencies:

```sh
pnpm add -D oxlint oxfmt
```

Add root scripts:

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check",
    "check": "pnpm lint && pnpm fmt:check"
  }
}
```

Use `.oxlintrc.json` and `.oxfmtrc.json`, not TypeScript config files, for the initial setup.

### 5. Do not add GSAP as a root dependency now

GSAP is part of the future animation recipes consumed by downstream slide projects. Adding it to the root package would imply this repo is a runtime/package library, which conflicts with the copyable-registry model.

### 6. Make folder structure commit-friendly without empty filler files

Git does not track empty directories. To make the structure visible without `.gitkeep` filler, add concise `README.md` files only where they explain the purpose of a major folder.

This satisfies the “not a bunch of empty files” constraint better than empty placeholders.

## Alternatives considered

### Alternative A — Put `docs` in pnpm workspace immediately

Rejected for phase 1. `docs/` will not have a package manifest yet, so adding it to workspace packages is premature. Add it once Astro is initialized.

### Alternative B — Restate many pnpm defaults for maximum explicitness

Rejected. pnpm v11 already defaults to many safe settings. Restating all of them adds noise and risk of stale/misspelled config.

### Alternative C — Use `styles/base` instead of `registry/core`

Rejected in prior structure discussion. `registry/core` is the mandatory base registry item; presets are optional token remaps.

### Alternative D — Use `.gitkeep` files for empty folders

Rejected. `.gitkeep` files are pure placeholders. Short README files are more useful for humans and agents.

## Implementation phases

### Phase 1 — Create base structure

Create these directories:

```txt
registry/
  core/
  layouts/
  components/
  presets/
  animations/
examples/
skills/
docs/
scripts/
.plans/
```

Create concise README files only for meaningful root/section explanation:

```txt
README.md
registry/README.md
registry/core/README.md
registry/layouts/README.md
registry/components/README.md
registry/presets/README.md
registry/animations/README.md
examples/README.md
skills/README.md
docs/README.md
scripts/README.md
```

Do not create component files, registry metadata files, scripts, Astro files, or docs pages yet.

### Phase 2 — Initialize package management

Create root `package.json` with the agreed metadata and scripts.

Create `pnpm-workspace.yaml` with only intentional settings:

```yaml
minimumReleaseAge: 1440
trustPolicy: no-downgrade
pmOnFail: error
```

Create `.gitignore` for standard generated artifacts:

```gitignore
node_modules/
pnpm-lock.yaml.tmp
dist/
.astro/
.DS_Store
```

Keep `pnpm-lock.yaml` committed after install.

### Phase 3 — Add linting and formatting tools

Install:

```sh
pnpm add -D oxlint oxfmt
```

Create conservative config files:

```txt
.oxlintrc.json
.oxfmtrc.json
```

Prefer generated starter configs from:

```sh
pnpm exec oxlint --init
pnpm exec oxfmt --init
```

Then simplify if needed.

### Phase 4 — Validate the setup

Run:

```sh
pnpm install
pnpm config list
pnpm lint
pnpm fmt:check
pnpm check
```

Confirm:

- pnpm uses the pinned version or fails because of `pmOnFail: error`.
- `minimumReleaseAge`, `trustPolicy`, and `pmOnFail` appear in effective config.
- No unexpected dependency lifecycle build approval is required.
- If dependency build approval is required, add specific trusted packages to `allowBuilds`; never use `dangerouslyAllowAllBuilds`.
- Oxlint and Oxfmt commands run successfully.

## Implementation progress

- [x] Phase 1 — Created base folder structure and concise README files.
- [x] Phase 2 — Created root package metadata, pnpm workspace config, and `.gitignore`.
- [x] Phase 3 — Added Oxlint and Oxfmt dev dependencies plus starter configs.
- [x] Phase 4 — Validated setup with pnpm and tooling commands.

## Implementation notes

- `lint` and `lint:fix` include `--no-error-on-unmatched-pattern` because this phase intentionally has no JavaScript/TypeScript source files yet; otherwise Oxlint exits non-zero on an empty codebase.
- `.oxfmtrc.json` ignores `PROJECT.md` so formatting validation does not rewrite pre-existing agent/project metadata.

Validation run on 2026-06-26:

```sh
pnpm install          # passed
pnpm config list     # passed; includes minimumReleaseAge: 1440, trustPolicy: no-downgrade, pmOnFail: error
pnpm lint             # passed
pnpm fmt:check        # passed
pnpm check            # passed
find . -maxdepth 3 -type d -not -path './.git*' -not -path './node_modules*' | sort  # passed
```

## Validation

Expected validation commands after implementation:

```sh
pnpm install
pnpm config list
pnpm lint
pnpm fmt:check
pnpm check
```

Optional structure check:

```sh
find . -maxdepth 3 -type d | sort
```

## Risks / rollback

- Empty directories are not tracked by Git. Mitigation: use concise README files, not `.gitkeep`.
- `trustPolicy: no-downgrade` may reject some packages. Mitigation: review failures case-by-case and use `trustPolicyExclude` only for known safe packages/versions.
- `pmOnFail: error` requires contributors to use the pinned pnpm version. Mitigation: document the pnpm version and upgrade intentionally.
- Oxlint/Oxfmt are evolving tools. Mitigation: keep config minimal and use documented flags only.
- Future Astro setup may need its own package manifest. Mitigation: add `docs` to workspace packages only when initialized.

## Peer review summary

Initial planning peer review agreed with the structure and tooling choices and recommended these changes, which are incorporated above:

- Do not add `packages: ["docs"]` before `docs/package.json` exists.
- Do not restate every pnpm v11 default; keep only intentional settings.
- Avoid `minimumReleaseAgeIgnoreMissingTime: false` and `resolutionMode: time-based` for now.
- Use concise README files instead of empty folders or `.gitkeep`.
- Do not add GSAP as a root dependency.
- Add `pnpm config list` to validation to catch config mistakes.

## Implementation peer review

Claude reviewed commit `e5d977e` and accepted the setup as matching the plan. It suggested considering whether the generated `.plans/*.html` preview should be tracked. Follow-up commit removes that generated preview and keeps only the source plan Markdown.

Follow-up validation: `pnpm fmt` and `pnpm check` passed after removing the generated HTML preview.
