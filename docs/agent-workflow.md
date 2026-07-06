# Agent workflow

## Prepare the active CLI and skill

Use the installed package or local checkout:

```sh
npx -y @maxedapps/slidesls@latest --help
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
```

Runtime-neutral no-install path for the bundled skill:

```sh
slidesls skill show
```

Full export fallback only:

```sh
slidesls skill show --all
```

For local-only work, link the bundled skill into the skill directory required by the active agent runtime so it stays current with this checkout:

```sh
node /absolute/path/to/ls_slides/bin/slidesls.mjs skill link <your-agent-skill-dir>/create-slides-with-slidesls
```

Use `skill install` instead if a copied skill is preferred. Claude Code project-local example only:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

After installing or linking, fully read the installed `SKILL.md` and relevant `references/` before authoring.

## Deck workflow

1. Clarify deck purpose, audience, tone, slide count, visual constraints, target folder, whether the user wants static or animated slides, and whether composition should be template-first or primitive-first.
2. Choose visual direction independently: default base tokens/no theme, exactly one theme preset, or custom token overrides in `@layer tokens`.
3. Use a dedicated deck folder. Fast/template path: `slidesls init --template minimal`. Primitive/custom path: `slidesls init --template blank` and add only the needed utilities/components.
4. Inspect `slidesls.json` and the configured entry file for existing decks.
5. Use `slidesls catalog --json` for the complete lightweight inventory; use `slidesls catalog --starter --json` only for the smallest fast-start set. Use filtered catalog commands for focused selection, for example `slidesls catalog --type component --json`, `slidesls catalog --type template --json`, and `slidesls catalog --type preset --tag theme --json`.
6. Use `slidesls inspect templates/<name> --json` for full slide skeleton snippets, `slidesls inspect components/<name> --json` for component snippets, and `slidesls inspect utilities/layout --api --json` for primitive layout classes; add `--api` only for low-level authoring metadata.
7. Match layouts to content density (the skill's decision table) and check each item's `avoidWhen` guidance before committing to it.
8. Unless the user asks for static slides, copy/load `animations/reveal` plus one subtle variant such as `animations/slide-up` or `animations/fade`, then use `.ls-reveal` with `data-step` or `data-ls-reveal-sequence`.
9. Run `slidesls add ... --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
10. Paste/edit snippet HTML directly; add returned `<link>` and `<script>` tags to the entry HTML when needed.
11. Run `slidesls validate <dir> --json` and fix errors; design-lint warnings are advisory composition pointers to resolve or justify.
12. Run the per-slide visual QA loop with `slidesls preview <dir>` (long-running) plus `slidesls visual-qa`, screenshotting flagged slides via their deep links. The full agent-browser recipe and checklist live in the bundled skill: `references/preview-validation.md` (also via `slidesls skill show --reference preview-validation`).
13. Run `slidesls doctor --dir <dir> --json` for environment/config issues.

Prefer templates, utilities, and standalone components. Templates are optional convenience snippets; utilities/components are first-class building blocks. Do not introduce structural layout macros, a framework, bundler, Tailwind, or runtime package dependency unless the user explicitly asks for one. Generated decks should remain standalone plain HTML/CSS/JS.
