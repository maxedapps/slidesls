# slidesls bundled skill

Bundled skill name: `create-slides-with-slidesls`.

Runtime-neutral no-install path:

```sh
slidesls skill show
```

Full export fallback only:

```sh
slidesls skill show --all
```

Install or link to the skill directory required by the active agent runtime:

```sh
node /path/to/ls_slides/bin/slidesls.mjs skill link <your-agent-skill-dir>/create-slides-with-slidesls
# or copy instead of symlink:
node /path/to/ls_slides/bin/slidesls.mjs skill install <your-agent-skill-dir>/create-slides-with-slidesls
```

Example for Claude Code project-local skills only:

```sh
slidesls skill install ./.claude/skills/create-slides-with-slidesls
```

After installing or linking, agents should fully read `SKILL.md` and relevant files in `references/` before authoring slides.
