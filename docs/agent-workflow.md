# Agent workflow

## Prepare the active CLI and skill

Use the installed package or local checkout:

```sh
npx -y @maxedapps/slidesls@latest --help
node /absolute/path/to/ls_slides/bin/slidesls.mjs --help
```

Runtime-neutral no-install path for the bundled skill:

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

1. Clarify deck purpose, audience, tone, slide count, visual constraints, target folder, and whether the user wants static or animated slides.
2. Use a dedicated deck folder. From inside that folder run `slidesls init --template minimal`, or initialize an explicit path such as `slidesls init ./slides/my-deck --template minimal`.
3. Inspect `slidesls.json` and the configured entry file for existing decks.
4. Use `slidesls catalog --recommended --json` to choose from the agent-safe set.
5. Use `slidesls inspect templates/<name> --json` for full slide skeletons and `slidesls inspect components/<name> --json` for component snippets.
6. Unless the user asks for static slides, copy/load `animations/reveal` plus one subtle variant such as `animations/slide-up` or `animations/fade`, then use `.ls-reveal` with `data-step` or `data-ls-reveal-sequence`.
7. Run `slidesls add ... --dry-run --json`, review planned files and load tags, then run without `--dry-run`.
8. Paste/edit snippet HTML directly; add returned `<link>` and `<script>` tags to the entry HTML when needed.
9. Run `slidesls validate <dir> --json` and fix errors.
10. Run `slidesls preview <dir> --host 127.0.0.1 --port 4321` as a long-running process and use `agent-browser` screenshots/browser checks for visual review unless intentionally skipped:

    ```sh
    agent-browser open http://127.0.0.1:4321/?export=1
    agent-browser set viewport 1600 900
    agent-browser wait --load networkidle
    agent-browser screenshot ./slides-visual-check.png
    ```

11. Run `slidesls doctor --dir <dir> --json` for environment/config issues.

Prefer templates, utilities, and standalone components. Do not introduce structural layout macros, a framework, bundler, Tailwind, or runtime package dependency unless the user explicitly asks for one. Generated decks should remain standalone plain HTML/CSS/JS.
