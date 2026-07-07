export const agentCommandRecipes = {
  skillShowAll: "slidesls skill show --all", // full export fallback only
  skillInstall: "slidesls skill install <your-agent-skill-dir>/create-slides-with-slidesls",
  skillLink: "slidesls skill link <your-agent-skill-dir>/create-slides-with-slidesls",
  catalogStarterJson: "slidesls catalog --starter --json",
  catalogJson: "slidesls catalog --json",
  catalogApiJson: "slidesls catalog --api --json",
  catalogComponentsJson: "slidesls catalog --type component --json",
  catalogLayoutsJson: "slidesls catalog --type layout --json",
  catalogStylesJson: "slidesls catalog --type style --json",
  inspectJson: "slidesls inspect <item> --json",
  inspectApiJson: "slidesls inspect <item> --api --json",
  inspectLayoutApiJson: "slidesls inspect layouts/core --api --json",
  inspectPrimitiveJson: "slidesls inspect layouts/core components/surface components/list --json",
  addDryRunJson: "slidesls add <items...> --dir <deck-or-project> --dry-run --json",
  iconsSyncJson: "slidesls icons sync --dir <deck> --json",
  iconsListJson: "slidesls icons list --json",
  validateJson: "slidesls validate <deck> --json",
  preview: "slidesls preview <deck> --host 127.0.0.1 --port 4321",
  visualQaEval: "slidesls visual-qa --eval",
  visualQaAnalyze: "slidesls visual-qa --analyze --input <collected.json> --json",
  skillShow: "slidesls skill show",
  skillShowCatalog: "slidesls skill show --reference catalog",
};

export function agentHelpBlock() {
  return `For AI agents:
  1. Skill first: install/link the bundled skill, then fully read SKILL.md.
     ${agentCommandRecipes.skillInstall}
     Runtime-neutral fallback: ${agentCommandRecipes.skillShow}
     Full export fallback only: ${agentCommandRecipes.skillShowAll}
     Example for Claude Code project-local skills:
     slidesls skill install ./.claude/skills/create-slides-with-slidesls
  2. Pick ONE style per deck (init --style <name> wires fonts + activation):
     ${agentCommandRecipes.catalogStylesJson}
  3. Incremental discovery:
     Complete lightweight inventory: ${agentCommandRecipes.catalogJson}
     Content components: ${agentCommandRecipes.catalogComponentsJson}
     Slide-body layouts: ${agentCommandRecipes.catalogLayoutsJson}
  4. Inspect exact snippets and load tags:
     ${agentCommandRecipes.inspectJson}
     Layout system API: ${agentCommandRecipes.inspectLayoutApiJson}
     Advanced API detail: ${agentCommandRecipes.inspectApiJson}
  5. Copy safely:
     ${agentCommandRecipes.addDryRunJson}
  6. Icons come from the inline sprite (never emoji, never CDN):
     ${agentCommandRecipes.iconsListJson}
     After adding/removing <use href="#ls-i-*"> references: ${agentCommandRecipes.iconsSyncJson}
  7. Motion is on by default (slide transitions + staggered entrances).
     Add data-step reveals only where sequence carries meaning; review motion
     in the live preview with ArrowRight, never from export screenshots.
  8. Validate after editing:
     ${agentCommandRecipes.validateJson}
  9. Preview and visually inspect representative slides unless the user opts out.
     Keep preview running while browser commands execute:
     ${agentCommandRecipes.preview}
     agent-browser open http://127.0.0.1:4321/?export=1
     agent-browser set viewport 1600 900
     agent-browser wait --load networkidle
     agent-browser screenshot ./slides-visual-check.png`;
}

export function catalogAgentInstructions({ api = false } = {}) {
  return {
    purpose: "Discover registry items before choosing exact snippets or authoring APIs.",
    notes: [
      api
        ? "Full authoring metadata is included."
        : "This is the complete lightweight inventory. Full authoring metadata: add --api.",
      "Use --type filters (style, layout, component, font) for focused discovery; --starter is the smallest fast-start set.",
    ],
    rules: [
      "Use useCases, intent, agentLevel, type, and tags to choose candidate items.",
      "Check useWhen/avoidWhen before choosing an item; when avoidWhen matches your content, use the item its alternatives point to.",
      "Do not invent ls-* classes; inspect snippets first and use --api only for low-level class details.",
      "Inspect items for exact snippets and load tags before copying markup.",
    ],
    nextCommands: [
      agentCommandRecipes.catalogComponentsJson,
      agentCommandRecipes.catalogLayoutsJson,
      agentCommandRecipes.inspectJson,
      agentCommandRecipes.inspectLayoutApiJson,
      agentCommandRecipes.addDryRunJson,
      agentCommandRecipes.validateJson,
    ],
  };
}

export function inspectAgentInstructions(requestedItems = ["<item>"], { api = false } = {}) {
  const items = requestedItems.length ? requestedItems.join(" ") : "<item>";
  return {
    purpose: "Use selected registry items as source-of-truth for snippets and load tags.",
    notes: [
      "Dependency details: add --with-dependencies; full authoring: add --api.",
      api
        ? "Authoring metadata is included for requested items."
        : "Default inspect output is snippet-focused.",
    ],
    rules: [
      "Use snippets[].html as source-of-truth markup for requested items.",
      "Check composition.useWhen/avoidWhen before using an item; composition.alternatives names better-fitting items.",
      "After copying assets, add returned load.links and load.scripts to the deck entry HTML when needed.",
      "Use --api authoring metadata instead of guessing classes or attributes.",
    ],
    nextCommands: [
      `slidesls add ${items} --dir <deck-or-project> --dry-run --json`,
      agentCommandRecipes.validateJson,
    ],
  };
}

export function addAgentInstructions({ dryRun = false, root = "<deck-or-project>" } = {}) {
  return {
    purpose: "Copy registry assets safely; add does not rewrite deck HTML.",
    rules: [
      "Run a dry run before copying when possible.",
      "Insert returned links/scripts into the entry HTML manually when needed.",
      "Inspect components/layouts for exact snippet HTML.",
      "Validate after editing markup or copied assets.",
      "Preview and visually inspect representative slides after material slide edits unless the user opts out; agents should use agent-browser screenshots/browser checks.",
    ],
    nextCommands: [
      dryRun
        ? "Repeat the add command without --dry-run when the plan is correct."
        : `slidesls validate ${root} --json`,
      agentCommandRecipes.inspectJson,
    ],
    longRunningCommands: [`slidesls preview ${root}`],
  };
}

export function initAgentInstructions(root = "<deck>") {
  const nextCommands = [
    agentCommandRecipes.catalogJson,
    agentCommandRecipes.catalogComponentsJson,
    agentCommandRecipes.inspectPrimitiveJson,
    `slidesls validate ${root} --json`,
  ];
  return {
    purpose: "Continue from a newly initialized slidesls deck.",
    rules: [
      "Pick exactly one style per deck (init --style <name>); styles carry fonts, palette, texture, and the motion signature.",
      "Use catalog --json as the complete lightweight inventory before adding classes.",
      "Compose slide bodies with layouts/core (ls-layout--*) and fill regions with components; inspect items for exact markup first.",
      "Icons come only from the inline sprite (icons sync); never emoji or ad-hoc glyphs in icon slots.",
      "Motion is on by default; add data-step reveals only where sequence carries meaning.",
      "Validate after edits; preview is a long-running server command and should be checked visually with agent-browser unless the user opts out.",
    ],
    nextCommands,
    longRunningCommands: [`slidesls preview ${root}`],
  };
}

export function validateAgentInstructions(root = "<deck>") {
  return {
    purpose: "Fix static validation feedback after editing a slidesls deck.",
    rules: [
      "Fix errors first; review warnings even when the deck is otherwise valid.",
      "Design-lint warnings are advisory composition pointers; fix or explicitly justify them.",
      "Use --strict when you need stricter checks for CI or registry drift.",
      "Use catalog and inspect before changing ls-* classes or snippets.",
      "Static validation does not replace rendered review; run slidesls visual-qa against a live preview for per-slide composition findings.",
    ],
    nextCommands: [
      agentCommandRecipes.catalogApiJson,
      agentCommandRecipes.inspectJson,
      `slidesls add <item> --dir ${root} --dry-run --json`,
      agentCommandRecipes.visualQaAnalyze,
    ],
    longRunningCommands: [`slidesls preview ${root}`],
  };
}
