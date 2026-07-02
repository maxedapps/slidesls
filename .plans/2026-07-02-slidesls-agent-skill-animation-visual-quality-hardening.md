# Plan: Harden slidesls agent skill distribution, animation guidance, visual QA, and title-hero composition

## Summary

Improve slidesls after npm publishing and dogfooding by addressing six connected issues:

1. Stop implying every agent should install a Claude Code skill in `.claude/skills/...`.
2. Rename the bundled skill to `create-slides-with-slidesls` and handle the user's existing global `create-slides` wrapper skill collision.
3. Make CLI output tell agents to fully read the installed/copied skill and references before authoring.
4. Promote built-in animations so agent-created decks are not unintentionally static.
5. Teach agents a complete `agent-browser` visual-review workflow and a concrete visual-quality checklist.
6. Fix the official `title-hero`/minimal title-slide composition that caused the Eve title slide’s awkward spacing and large empty right panel.

This plan keeps generated decks vanilla HTML/CSS/JS and does **not** add mandatory runtime, framework, Playwright, Puppeteer, or browser automation dependencies. `agent-browser` remains optional agent tooling for visual QA.

## Review status

Draft reviewed with Claude CLI using the requested Fable model family. `--model fable-5` was rejected by the local CLI as unavailable; `--model claude-fable-5` worked and produced the critique incorporated here.

Key Claude feedback incorporated:

- The main title-hero spacing root cause is `align-content: stretch` on grid containers, not just markup shape.
- Fix `.ls-center-start`, `.ls-center`, and `.ls-panel--center` first before adding new utilities.
- Reuse existing `.ls-panel--frame`; do not invent duplicate media-frame classes.
- Drop the proposed hierarchy-based `title_hero_sparse_stretch` validator because current validation infrastructure is flat and the CSS fix obsoletes the pattern.
- Add the five missed example decks using `ls-center-start` to the inventory.
- Address the real global skill collision at `~/.agents/skills/create-slides/SKILL.md` as a post-project migration step.
- Make `skill install/link` target decisions explicit rather than keeping a weak deprecation path.
- Improve visual QA guidance for long-running preview processes, pinned viewport, `?export=1`, and reveal-step screenshots.

## Confirmed requirements

- Do not implement yet; this is a plan.
- Generated decks remain vanilla HTML/CSS/JS.
- Different agent runtimes require skills in different locations; docs and CLI output must not imply `.claude/skills/...` is universally correct.
- CLI output that advertises skill installation must instruct agents to fully read the entire skill after installation.
- Bundled skill should be called `create-slides-with-slidesls`.
- Built-in animations should be actively advertised and easy for agents to use.
- Skill guidance should teach agents how to use `agent-browser` and what to look for when judging visual quality.
- The Eve deck at `~/development/playground/eve-slides/` is evidence for failure modes; do not modify it unless intentionally using it as a dogfood fixture.

## Current-state findings

### Skill naming and installation guidance

Files:

- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/README.md`
- `src/skill/agent-skill.mjs`
- `src/cli/agent-instructions.mjs`
- `src/cli/commands.mjs`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `README.md`
- `tests/skill-command.test.mjs`
- `tests/cli-output.test.mjs`
- `scripts/test-cli-smoke.mjs`

Findings:

- Bundled skill frontmatter currently uses `name: create-slides-with-slidesls`.
- `src/skill/agent-skill.mjs` hardcodes `DEFAULT_TARGET = ".claude/skills/create-slides-with-slidesls"`.
- Root CLI help and docs advertise:
  - `slidesls skill install ./.claude/skills/create-slides-with-slidesls`
  - `slidesls skill link ./.claude/skills/create-slides-with-slidesls`
- The skill includes a caveat: “Use a custom target if the active agent runtime expects skills elsewhere,” but the concrete examples still make Claude Code look like the default for every agent.
- Text output after `slidesls skill install`/`link` does not tell agents to read `SKILL.md`, references, or `slidesls skill show --all`.
- JSON output has no explicit `postInstallInstructions` / `readInstructions` field.

### Real global skill collision

File outside this repo:

- `/Users/maximilianschwarzmuller/.agents/skills/create-slides/SKILL.md`

Finding:

- The user's observed “create-slides” name is not the bundled repo skill; it is a personal/global bootstrapper skill that points agents to slidesls.
- If the package adds `create-slides-with-slidesls` but the old global `create-slides` remains active, two skills may compete for the same prompts.
- The repo plan should include package changes plus a follow-up migration recommendation for the global skill.

### Animation discoverability

Files:

- `registry/animations/*`
- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/deck-authoring.md`
- `skills/create-slides-with-slidesls/references/catalog.md`
- `src/deck/templates.mjs`
- `src/cli/commands.mjs`

Findings:

- Recommended catalog includes `animations/reveal`, `animations/fade`, `animations/slide-up`, and `animations/scale-in`.
- Animation guidance exists in `deck-authoring.md`, but it is not prominent in the top-level skill workflow.
- Animation registry items currently have no snippets, so snippet-driven agents may skip them.
- `src/deck/templates.mjs` minimal deck includes `.ls-reveal` markup but `minimalItems` only copies `core/base`, `utilities/layout`, `components/badge`, and `components/panel`.
- New minimal decks validate with a warning: `animations/reveal should be added when using its classes in HTML`.
- The current output is fail-open visually because `.ls-reveal` is fully visible without `reveal.css`, but the inconsistency teaches agents that animation is optional/forgettable.
- Eve deck confirms the failure mode: no `animations/*` CSS is loaded and no `.ls-reveal` / `data-step` markup is present.

### Visual QA and agent-browser

Files:

- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/preview-validation.md`
- `docs/validation.md`
- `src/cli/agent-instructions.mjs`
- `src/cli/commands.mjs`

Findings:

- Current skill says to use `agent-browser` and has a basic `open`/`wait`/`screenshot` command sequence.
- `preview-validation.md` lists things to check, but the top-level workflow does not force reading that reference.
- Root CLI help has an incomplete browser recipe: it shows `agent-browser screenshot` after preview but omits `agent-browser open` and `wait`.
- Guidance does not clearly say `slidesls preview` is long-running and must be started in the background/another terminal before browser commands.
- Guidance does not tell agents to use a pinned viewport for stable visual review.
- Guidance does not distinguish layout QA with all reveal content visible (`?export=1`) from interactive reveal-step QA.
- Guidance does not clearly tell agents to inspect screenshots and iterate, not merely capture files.

### Eve title slide and registry/style causes

Files inspected:

- `/Users/maximilianschwarzmuller/development/playground/eve-slides/index.html`
- `/Users/maximilianschwarzmuller/development/playground/eve-slides/slidesls/registry/core/base/slide.css`
- `/Users/maximilianschwarzmuller/development/playground/eve-slides/slidesls/registry/utilities/layout/layout.css`
- `/Users/maximilianschwarzmuller/development/playground/eve-slides/slidesls/registry/components/panel/panel.css`
- `registry/templates/title-hero/snippet.html`
- `registry/templates/title-hero/registry-item.json`
- Screenshot: `/var/folders/4v/7bbbwmbs74j24k0m0shppqb00000gn/T/pi-clipboard-00cbf0ec-69a7-4dc6-b224-c96b8246d68b.png`

Findings:

- Eve title slide uses almost exactly the official `templates/title-hero` pattern:

  ```html
  <div class="ls-grid ls-grid--wide-left ls-slide-fill">
    <header class="ls-stack ls-center-start ls-text-start">...</header>
    <div class="ls-panel ls-panel--accent ls-panel--center">...</div>
  </div>
  ```

- `slidesls validate ~/development/playground/eve-slides --json` reports valid with no warnings.
- Browser measurements showed the header and right panel both consumed full column height.
- `.ls-center-start` sets `display: grid; place-items: center start;` but does not set `align-content`.
- CSS Grid defaults `align-content` to `normal`/stretch-like behavior when there is surplus block space, so a full-height multi-row grid distributes the stack rows through the height. This is the root cause of the large gaps between badges, title, and subtitle.
- `.ls-center` has the same latent multi-child issue.
- `.ls-panel--center` also uses grid centering without `align-content`, causing short panel contents to float awkwardly inside a stretched panel.
- Separately, grid items stretch by default, so a short text-only right panel becomes full-height. That requires a fit/align-self solution in addition to the `align-content` fix.
- This is not merely agent misuse; the source-of-truth snippet and CSS encourage the result.

### Examples inventory affected by centering utilities

Files using `ls-center-start` and requiring review/re-screenshot after CSS/template changes:

- `examples/pi-coding-agent-boardroom-navy/index.html`
- `examples/pi-coding-agent-executive-blue/index.html`
- `examples/pi-coding-agent-playful-ink/index.html`
- `examples/pi-coding-agent-technical-deep/index.html`
- `examples/project-intro/index.html`
- likely `examples/template-gallery/index.html` / `examples/stress-gallery/index.html` depending on current snippets

## External research findings

Sources consulted:

- `https://agent-browser.dev/skills`
- `https://agent-browser.dev/commands`
- `https://agentskills.io/skill-creation/best-practices`
- `https://agentskills.io/skill-creation/optimizing-descriptions`

Relevant findings:

- agent-browser official docs recommend runtime-matched skill content via `agent-browser skills get core --full`; CLI-served skill content prevents stale instructions.
- agent-browser supports direct screenshot and interaction workflows: `open`, `wait --load networkidle`, `screenshot`, `press`, `snapshot`, and `eval --stdin`.
- Skill descriptions are the trigger surface; they should include user intent phrases like “create slides”, “make an HTML presentation”, and “turn this into a deck”.
- Skill bodies should use progressive disclosure: concise core instructions plus references for detailed workflows.
- Fragile sequences and validation gates should remain explicit in the main skill.

## Chosen strategy

Perform one coordinated hardening pass across skill packaging, CLI guidance, animations, visual QA docs, and registry template/style defaults.

Key decisions:

1. Rename the bundled skill to `create-slides-with-slidesls` and make its description intent-based.
2. Make `skill install` / `skill link` require an explicit target directory now, because `0.1.0` is new and the current default is misleading.
3. Keep `slidesls skill show --all` as the runtime-neutral no-install path.
4. Add post-install “fully read the skill” instructions to both text and JSON output.
5. Make minimal decks animation-consistent by copying/loading `animations/reveal` when they use `.ls-reveal`.
6. Fix title spacing primarily in CSS by adding `align-content: center` to centering utilities, then add a small explicit fit modifier for text-only panels.
7. Avoid broad brittle aesthetic validation; rely on targeted tests and browser dogfooding.

## Alternatives considered

### Alternative A — Keep bundled skill named `slidesls` and only improve descriptions

Rejected. It does not address the user’s requested `create-slides-with-slidesls` naming or trigger clarity.

### Alternative B — Keep `.claude/skills/...` as default and add caveats

Rejected. This still privileges one runtime and repeats the original problem.

### Alternative C — Add mandatory browser automation or visual regression dependencies

Rejected. It violates the project’s lightweight vanilla constraints. Browser checks remain optional agent workflow/tooling.

### Alternative D — Solve Eve slide aesthetics only with guidance

Rejected. The official CSS/snippet caused the failure. Agents should visually review, but the source-of-truth primitives must be safer.

### Alternative E — Add a hierarchy-aware visual/aesthetic validator now

Rejected. Current validation uses flat start-tag records, and a hierarchy-aware validator would add complexity or dependencies. The CSS fix obsoletes the known-bad pattern anyway.

## Implementation plan

### Phase 1 — Rename bundled skill and make install/link target explicit

#### 1. Rename skill directory and frontmatter

Files:

- `skills/create-slides-with-slidesls/**` → `skills/create-slides-with-slidesls/**`
- `skills/README.md`
- `src/skill/agent-skill.mjs`
- `tests/skill-command.test.mjs`
- `tests/cli-output.test.mjs`
- `scripts/test-cli-smoke.mjs`

Tasks:

- Rename folder to `skills/create-slides-with-slidesls`.
- Change frontmatter:

  ```yaml
  name: create-slides-with-slidesls
  description: Use this skill when the user wants to create slides, make an HTML presentation, turn content into a deck, edit/animate/preview/validate slides, or visually review plain HTML/CSS/JS slide decks with the slidesls CLI...
  ```

- Include explicit non-use boundaries for PowerPoint, Keynote, Google Slides, and non-slidesls framework decks.
- Update `bundledSkillRoot()` and `skillInfo()` to use the new directory/name.
- Update all tests expecting `name: create-slides-with-slidesls`.
- Ensure package `files` still ships the renamed skill directory through `skills`.
- Regenerate the catalog under the new skill path.

#### 2. Remove hardcoded Claude Code default target

Files:

- `src/skill/agent-skill.mjs`
- `src/cli/commands.mjs`
- `src/cli/agent-instructions.mjs`
- `README.md`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `skills/create-slides-with-slidesls/SKILL.md`
- tests

Tasks:

- Remove or stop exporting `defaultSkillTarget()` as a Claude-specific default.
- Make `[dir]` required for `slidesls skill install` and `slidesls skill link`.
- If omitted, fail with a usage error that explains:

  ```txt
  Choose the skill directory required by your agent runtime.
  Example for Claude Code project-local skills:
    slidesls skill install ./.claude/skills/create-slides-with-slidesls
  Runtime-neutral no-install option:
    slidesls skill show --all
  ```

- Update root `For AI agents:` help from concrete `.claude` commands to:

  ```sh
  slidesls skill show --all
  slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls
  ```

- Show `.claude/...` only under “Example for Claude Code”.
- Update `skillInfo()` JSON:
  - replace `recommendedTargets` with `exampleTargets`, e.g.

    ```json
    [
      {
        "runtime": "Claude Code project-local",
        "path": ".claude/skills/create-slides-with-slidesls"
      }
    ]
    ```

  - add `runtimeNeutralInstruction`.

- Update text formatter in `src/cli/commands.mjs` so `skill info` prints example targets without assuming `recommendedTargets[0]`.
- Update tests and smoke script to pass explicit temp skill target paths.

#### 3. Add installed-skill provenance/staleness metadata

Files:

- `src/skill/agent-skill.mjs`
- `skills/create-slides-with-slidesls/SKILL.md`
- tests

Tasks:

- Add package/version metadata to `skillInfo()` and optionally frontmatter metadata:

  ```yaml
  metadata:
    package: "@maxedapps/slidesls"
    skill-version-source: "package"
  ```

- Consider writing a small sidecar manifest during `skill install`, e.g. `.slidesls-skill.json`, containing:
  - package name;
  - package version;
  - skill name;
  - source path/package.
- Warn if the target parent contains an older likely slidesls skill directory such as `slidesls` or `create-slides` with matching provenance/content.
- Keep this warning non-fatal.

### Phase 2 — Force post-install skill reading

Files:

- `src/skill/agent-skill.mjs`
- `src/cli/commands.mjs`
- `src/cli/agent-instructions.mjs`
- `docs/cli.md`
- tests

Tasks:

- Add explicit post-install fields to `performSkillInstall()` and `performSkillLink()` result data:

  ```js
  postInstallInstructions: [
    "Fully read the installed SKILL.md before authoring slides.",
    "Read relevant bundled references, especially deck-authoring.md and preview-validation.md.",
    "If your runtime does not auto-load this skill, run slidesls skill show --all and read the full output.",
  ];
  ```

- Include the absolute installed `SKILL.md` path in text output:

  ```txt
  Next for agents:
  - Fully read: <target>/SKILL.md
  - Then read relevant references in <target>/references/
  - If your agent runtime did not auto-load it, run: slidesls skill show --all
  ```

- Add tests asserting text output includes:
  - `Fully read`
  - `SKILL.md`
  - `slidesls skill show --all`
- Add JSON tests asserting `postInstallInstructions` and `skillPath` are present.

### Phase 3 — Migrate or retire the user's global `create-slides` wrapper skill

Files outside repo:

- `/Users/maximilianschwarzmuller/.agents/skills/create-slides/SKILL.md`

Tasks:

- After repo changes land and with explicit user approval, update or replace the personal global skill.
- Preferred: retire `create-slides` or make it a minimal alias that defers to the installed `create-slides-with-slidesls` skill without competing trigger surfaces.
- Possible replacement:
  - name: `create-slides-with-slidesls`
  - or keep `create-slides` only if it clearly says “bootstrap only; immediately load/use create-slides-with-slidesls”.
- This is not part of the package implementation unless the user asks to modify global skills; it is a necessary environment cleanup to fully solve the observed naming collision.

Acceptance for this phase:

- Only one primary slidesls slide-creation skill should trigger in the user's environment.

### Phase 4 — Promote animations and fix minimal template consistency

#### 4.1 Make minimal template internally consistent

Files:

- `src/cli/commands.mjs`
- `src/deck/templates.mjs`
- tests

Tasks:

- Add `animations/reveal` to `minimalItems` because minimal markup uses `.ls-reveal`.
- Add the reveal stylesheet link for minimal templates:

  ```html
  <link rel="stylesheet" href="./slidesls/registry/animations/reveal/reveal.css" />
  ```

- Ensure ordering remains correct: base reset/tokens/theme/slide, component styles, animation styles, utilities if needed, runtime script.
- Update `init` tests so a fresh minimal deck validates without `missing_registry_item_for_class` warning for `animations/reveal`.
- Merge this work carefully with title-slide markup changes in Phase 6 because both edit `src/deck/templates.mjs`.

#### 4.2 Add animation-first authoring recipe

Files:

- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/deck-authoring.md`
- `src/cli/agent-instructions.mjs`
- `docs/cli.md`
- `README.md`

Tasks:

- Add top-level guidance:

  > Unless the user asks for a static deck, use progressive disclosure: copy/load `animations/reveal` and one subtle variant (`animations/slide-up` or `animations/fade`), then add `.ls-reveal` and `data-step` or `data-ls-reveal-sequence`.

- Add command recipe:

  ```sh
  slidesls add animations/reveal animations/slide-up --dir <deck> --dry-run --json
  slidesls add animations/reveal animations/slide-up --dir <deck>
  ```

- Add markup recipe:

  ```html
  <div data-ls-reveal-sequence>
    <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
    <article class="ls-card ls-reveal ls-reveal-slide-up">...</article>
  </div>
  ```

- Add usage rules:
  - use animation to reveal ideas, not decorate every element;
  - `slide-up` for cards/lists;
  - `fade` for captions/secondary notes;
  - `scale-in` sparingly for metrics/hero callouts;
  - do not stack transform variants.

#### 4.3 Add animation snippets or a dedicated animation recipe reference

Files:

- either `registry/animations/reveal/snippets/basic.html` and metadata updates;
- or `skills/create-slides-with-slidesls/references/animation-recipes.md`;
- `schemas/registry-item.schema.json` if schema needs snippet support clarification;
- registry validation tests.

Tasks:

- First verify current schema/validators accept `snippets` on `ls:animation` items.
- Preferred if supported: add snippets to `animations/reveal` and maybe variants, because agents treat snippets as source-of-truth.
- Use `data-ls-reveal-sequence` in the snippet to reduce hand-numbering mistakes.
- If snippets on animation items feel semantically odd, add `references/animation-recipes.md` and link it prominently from the top skill.
- Regenerate catalog.

### Phase 5 — Make agent-browser visual QA operational and design-focused

#### 5.1 Strengthen top-level visual QA workflow

Files:

- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/preview-validation.md`
- `src/cli/agent-instructions.mjs`
- `src/cli/commands.mjs`
- `docs/validation.md`
- `docs/agent-workflow.md`

Tasks:

- Explain that `slidesls preview` is long-running and should be started in the background/another terminal before browser commands.
- Add a pinned-viewport recipe:

  ```sh
  slidesls preview <deck> --host 127.0.0.1 --port 4321
  agent-browser --session slidesls-review open http://127.0.0.1:4321/?export=1
  agent-browser --session slidesls-review set viewport 1600 900
  agent-browser --session slidesls-review wait --load networkidle
  agent-browser --session slidesls-review screenshot ./slides-export-review.png
  ```

- For per-slide interactive review:

  ```sh
  agent-browser --session slidesls-review open http://127.0.0.1:4321
  agent-browser --session slidesls-review wait --load networkidle
  agent-browser --session slidesls-review screenshot ./slide-1-step-0.png
  agent-browser --session slidesls-review press ArrowRight
  agent-browser --session slidesls-review screenshot ./slide-1-step-1.png
  ```

- Clarify:
  - use `?export=1` for layout QA with all reveal content visible;
  - use normal mode for reveal-step coherence;
  - ArrowRight may advance reveal steps before changing slides.
- Include fallback if binary is unavailable:

  ```sh
  npx -y agent-browser ...
  ```

- Tell agents to inspect screenshots and iterate until visually acceptable.

#### 5.2 Add a concrete visual-quality checklist

Files:

- `skills/create-slides-with-slidesls/references/preview-validation.md`
- possibly `skills/create-slides-with-slidesls/references/visual-quality.md` if the checklist grows.

Checklist:

- no overflow, clipped text, or hidden essential content;
- no unintended centering;
- no giant empty panels/cards unless intentionally framing an image, code sample, diagram, or metric;
- title, subtitle, badges, and labels form coherent clusters rather than being stranded at extremes;
- columns align and have balanced optical weight;
- visual anchors are proportionate to their content;
- repeated cards have consistent rhythm, but not excessive empty height;
- code and tables are legible at the actual slide scale;
- contrast is readable;
- icons/fonts are loaded or gracefully absent;
- reveal steps produce meaningful intermediate states.

#### 5.3 Add optional browser eval fit checks

Files:

- `skills/create-slides-with-slidesls/references/preview-validation.md`

Tasks:

- Add optional check:

  ```sh
  agent-browser eval --stdin <<'EOF'
  JSON.stringify([...document.querySelectorAll('.ls-slide[data-active="true"] *')]
    .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
    .map((el) => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent.trim().slice(0, 80)
    })))
  EOF
  ```

- Explain this catches some fit issues but cannot judge aesthetic balance; screenshots remain authoritative.

#### 5.4 Fix incomplete root CLI browser recipe

Files:

- `src/cli/agent-instructions.mjs`
- `tests/cli-output.test.mjs`

Tasks:

- Replace incomplete `agent-browser screenshot` help with full sequence:

  ```txt
  slidesls preview <deck> --host 127.0.0.1 --port 4321
  agent-browser open http://127.0.0.1:4321/?export=1
  agent-browser set viewport 1600 900
  agent-browser wait --load networkidle
  agent-browser screenshot ./slides-visual-check.png
  ```

- Mention preview must be running while browser commands execute.

### Phase 6 — Fix title-hero/minimal composition defaults

#### 6.1 Fix centering utilities at the CSS root cause

Files:

- `registry/utilities/layout/layout.css`
- `registry/utilities/layout/README.md`
- `registry/utilities/layout/registry-item.json`
- `registry/components/panel/panel.css`
- `registry/components/panel/README.md`
- generated catalog
- tests / examples

Tasks:

- Update `.ls-center-start`:

  ```css
  .ls-center-start {
    display: grid;
    place-items: center start;
    align-content: center;
    min-inline-size: 0;
    min-block-size: 0;
  }
  ```

- Update `.ls-center` similarly:

  ```css
  align-content: center;
  ```

- Update `.ls-panel--center`:

  ```css
  align-content: center;
  ```

- Verify single-child behavior is visually unchanged while multi-child clusters tighten.
- Document that these utilities center the content cluster, not distribute children over the full block height.

#### 6.2 Add explicit panel fit modifier for text-only callouts

Files:

- `registry/components/panel/panel.css`
- `registry/components/panel/README.md`
- `registry/components/panel/registry-item.json`
- `registry/templates/title-hero/snippet.html`
- `src/deck/templates.mjs`
- generated catalog

Tasks:

- Reuse existing `.ls-panel--frame` for intentionally framed media/diagrams. Do not add a duplicate media-frame class.
- Add a narrow fit modifier only if needed after CSS centering fix:

  ```css
  .ls-panel--fit {
    align-self: center;
    block-size: auto;
  }
  ```

- Optional CSS variable:

  ```css
  min-block-size: var(--ls-panel-fit-min-block-size, auto);
  ```

- Update authoring metadata and docs:
  - `.ls-panel--fit`: text-only callouts/short key ideas.
  - `.ls-panel--frame`: screenshots, diagrams, code/media frames that should have visual mass.
- Keep default `.ls-panel` behavior unchanged for dashboards/grids where equal heights are useful.

#### 6.3 Update title-hero and minimal snippets

Files:

- `registry/templates/title-hero/snippet.html`
- `registry/templates/title-hero/registry-item.json`
- `registry/templates/title-hero/README.md`
- `src/deck/templates.mjs`

Tasks:

- Keep markup close to current pattern but add the safer fit modifier to text-only right panel:

  ```html
  <div class="ls-panel ls-panel--accent ls-panel--center ls-panel--fit"></div>
  ```

- Keep `.ls-center-start` after CSS fix; it should now create a tight cluster.
- If visual dogfood still shows poor balance, add a very small title-hero-specific utility or local CSS variable rather than a broad new layout API.
- Update authoring usage:
  - keep hero copy concise;
  - use `.ls-panel--fit` for short text;
  - use `.ls-panel--frame` for screenshots/diagrams/visual anchors.

#### 6.4 Update affected examples and dogfood screenshots

Files:

- `examples/pi-coding-agent-boardroom-navy/index.html`
- `examples/pi-coding-agent-executive-blue/index.html`
- `examples/pi-coding-agent-playful-ink/index.html`
- `examples/pi-coding-agent-technical-deep/index.html`
- `examples/project-intro/index.html`
- `examples/template-gallery/index.html`
- `examples/stress-gallery/index.html`

Tasks:

- Apply `.ls-panel--fit` where a stretched text-only panel is visually wrong.
- Leave `.ls-panel--frame` / tall panels where the content is a real visual frame.
- Re-run examples validation.
- Browser-review title-like slides at pinned 1600×900.

#### 6.5 Do not add a sparse-title structural validator in this pass

Rationale:

- Current validation infrastructure is flat (`startTagRecords`) and cannot reliably express parent/child/sibling relationships.
- After the CSS fix, the old pattern should no longer be inherently bad.
- Broad aesthetic validators risk false positives.

Optional future work:

- If a future lightweight parser exists, consider opt-in advisory validators for known layout anti-patterns.

### Phase 7 — Documentation, generated catalog, tests, and release

#### Docs and skill references

Files:

- `README.md`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `docs/validation.md`
- `skills/README.md`
- `skills/create-slides-with-slidesls/SKILL.md`
- `skills/create-slides-with-slidesls/references/*`

Tasks:

- Replace primary `.claude/...` instructions with runtime-neutral target placeholders.
- Show `.claude/...` only as a labeled Claude Code example.
- Add npm usage examples now that the package is published.
- Add an `Animation workflow` section.
- Add `Visual QA with agent-browser` section with concrete commands and checklist.
- Clarify that generated decks do not depend on agent-browser.

#### Generated catalog

Files:

- `skills/create-slides-with-slidesls/references/catalog.md`

Tasks:

- Run catalog generation/check after metadata/path changes:

  ```sh
  pnpm validate:skills
  ```

#### Tests

Update/add tests:

- `tests/skill-command.test.mjs`
  - skill info name is `create-slides-with-slidesls`.
  - `skill show` frontmatter includes new name.
  - `skill install`/`link` without target fails with runtime-neutral usage guidance.
  - `skill install`/`link` JSON includes `postInstallInstructions` and installed `skillPath`.
  - text output includes “Fully read”, `SKILL.md`, and `slidesls skill show --all`.
- `tests/cli-output.test.mjs`
  - root help uses runtime-neutral skill install guidance.
  - root help includes full agent-browser open/viewport/wait/screenshot sequence.
  - command recipes still execute after placeholder substitutions.
- `tests/html-validation.test.mjs`
  - fresh minimal init no longer warns for missing `animations/reveal`.
  - reveal-variant validation still works.
- `tests/authoring-api.test.mjs` / registry validation tests
  - new `.ls-panel--fit` metadata matches CSS.
  - animation snippets, if added, have dependency closure.
- `tests/catalog-doc.test.mjs`
  - animation section remains visible.
- `scripts/test-cli-smoke.mjs`
  - install skill to temp runtime-neutral target, e.g. `path.join(tmp, "agent-skills", "create-slides-with-slidesls")`.

#### Verification commands

Run:

```sh
pnpm fmt:check
pnpm test
pnpm validate:registry
pnpm validate:skills
pnpm validate:examples
pnpm check
npm pack --dry-run
```

Optional browser dogfood:

```sh
pnpm serve:examples
agent-browser open http://127.0.0.1:<port>/examples/template-gallery/?export=1
agent-browser set viewport 1600 900
agent-browser wait --load networkidle
agent-browser screenshot /tmp/slidesls-template-gallery.png
```

Fresh package smoke:

- Install packed package in a temp project.
- Run `npx slidesls init ./deck --template minimal --theme technical-deep`.
- Confirm validation has no missing animation warning.
- Install skill to an explicit temp runtime-neutral target.
- Confirm post-install output tells the agent to fully read the skill.
- Browser-review the generated title slide.

## File change inventory

Likely changed:

- `skills/create-slides-with-slidesls/**` renamed to `skills/create-slides-with-slidesls/**`
- `skills/README.md`
- `src/skill/agent-skill.mjs`
- `src/cli/agent-instructions.mjs`
- `src/cli/commands.mjs`
- `src/deck/templates.mjs`
- `registry/templates/title-hero/*`
- `registry/utilities/layout/*`
- `registry/components/panel/*`
- `registry/animations/*` metadata/snippets/docs if snippets are added
- `README.md`
- `docs/cli.md`
- `docs/agent-workflow.md`
- `docs/validation.md`
- affected examples listed above
- tests listed above
- `scripts/test-cli-smoke.mjs`

Possibly changed:

- `schemas/registry-item.schema.json` if animation snippet behavior needs schema clarification.
- `package.json` version if releasing as `0.2.0`.
- Global personal skill at `/Users/maximilianschwarzmuller/.agents/skills/create-slides/SKILL.md`, only with explicit user approval after repo work.

## Backward compatibility and rollout

- Generated decks remain plain files and do not depend on slidesls at runtime.
- Registry CSS/snippet changes only affect newly copied assets; existing decks own their copied CSS and remain unchanged unless users re-copy/update assets.
- Requiring explicit skill target changes CLI behavior. Because package is at `0.1.0` and newly published, release this as `0.2.0`.
- Existing installed `slidesls` skill directories may linger. Use docs/warnings/provenance to guide replacement.
- If users want no installation, `slidesls skill show --all` remains the runtime-neutral workflow.

## Risks and mitigations

### Risk: Skill rename creates duplicate active skills

Mitigation:

- Update bundled skill and docs.
- Add explicit follow-up migration for the user's global `create-slides` wrapper.
- Warn about older sibling skill dirs where feasible.

### Risk: Requiring install/link target hurts convenience

Mitigation:

- Error message includes examples.
- `skill show --all` works without a target.
- `0.2.0` semver communicates a workflow change.

### Risk: CSS centering change affects existing layouts

Mitigation:

- `align-content: center` is expected to improve multi-child centering while preserving single-child usage.
- Run examples and visual dogfood.
- Keep changes scoped to centering utilities/modifiers.

### Risk: `.ls-panel--fit` over-expands authoring API

Mitigation:

- Add only one explicit fit modifier.
- Reuse existing `.ls-panel--frame` for visual frames.
- Document clear usage boundaries.

### Risk: Animation defaults surprise users who want static decks

Mitigation:

- Animations remain subtle.
- Guidance says “unless the user asks for static slides”.
- Export mode shows all reveal content.

### Risk: agent-browser instructions become stale

Mitigation:

- Use stable commands only: `open`, `set viewport`, `wait`, `screenshot`, `press`, optional `eval --stdin`.
- Point to `agent-browser skills get core --full` for advanced/current usage.

## Acceptance criteria

- Bundled skill frontmatter name is `create-slides-with-slidesls`.
- No primary docs or CLI help instruct all agents to install into `.claude/skills/...`; Claude Code path appears only as a labeled example.
- `slidesls skill install` / `link` require an explicit target or otherwise no longer create a Claude-specific default path.
- `slidesls skill install` / `link` text and JSON outputs instruct agents to fully read the installed skill and references.
- Fresh `slidesls init --template minimal` validates without missing `animations/reveal` warnings.
- Top-level skill and CLI guidance actively advertise reveal animations.
- Top-level skill and CLI guidance include complete, runnable agent-browser preview commands with pinned viewport and `?export=1` layout QA guidance.
- `title-hero` official snippet and minimal title slide no longer produce Eve-style sparse vertical spacing or a giant empty text-only right panel by default.
- A pinned 1600×900 agent-browser screenshot of an Eve-like title slide confirms:
  - badges/title/subtitle form one tight visual cluster;
  - short right-panel text uses content-fit height or intentional visual-frame styling;
  - columns are optically balanced.
- Tests cover skill rename, explicit target guidance, post-install read instructions, animation default consistency, and metadata/CSS consistency.
- `pnpm check` and `npm pack --dry-run` pass.
