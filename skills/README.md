# Project skills

Project-local skills expose the agent-facing workflow for slidesls.

- `slidesls/` — create, inspect, add registry items to, validate, and preview plain HTML/CSS/JS decks with the `slidesls` CLI.

Agents should load `skills/slidesls/SKILL.md` when a task involves building or validating a slidesls deck.

From another local project, install or link the current bundled skill through the CLI:

```sh
node /path/to/ls_slides/bin/slidesls.mjs skill link ./.claude/skills/slidesls
# or copy instead of symlink:
node /path/to/ls_slides/bin/slidesls.mjs skill install ./.claude/skills/slidesls
```
