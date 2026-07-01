export const agentCommandRecipes = {
  skillInstall: "slidesls skill install ./.claude/skills/slidesls",
  skillLink: "slidesls skill link ./.claude/skills/slidesls",
  catalogRecommendedJson: "slidesls catalog --recommended --json",
  catalogJson: "slidesls catalog --json",
  themeCatalogJson: "slidesls catalog --type preset --tag theme --json",
  inspectReadmeJson: "slidesls inspect <item> --readme --json",
  addDryRunJson: "slidesls add <items...> --dir <deck-or-project> --dry-run --json",
  validateJson: "slidesls validate <deck> --json",
  preview: "slidesls preview <deck>",
  skillShow: "slidesls skill show",
  skillShowCatalog: "slidesls skill show --reference catalog",
};

export function agentHelpBlock() {
  return `For AI agents:
  1. Install or link the bundled skill before authoring:
     ${agentCommandRecipes.skillInstall}
     ${agentCommandRecipes.skillLink}   # local checkout/dev workflow
  2. Discover valid public classes, modifiers, themes, fonts, data attributes, and CSS variables:
     ${agentCommandRecipes.catalogRecommendedJson}
     ${agentCommandRecipes.catalogJson}
  3. Inspect exact snippets, load tags, and docs:
     ${agentCommandRecipes.inspectReadmeJson}
  4. Copy safely:
     ${agentCommandRecipes.addDryRunJson}
  5. Validate after editing:
     ${agentCommandRecipes.validateJson}
  6. Preview and visually inspect representative slides unless the user opts out:
     ${agentCommandRecipes.preview}
     agent-browser screenshot ./slides-visual-check.png   # after opening the preview URL`;
}

export function catalogAgentInstructions() {
  return {
    purpose: "Discover registry items and public slidesls authoring APIs before writing markup.",
    rules: [
      "Use item.authoring for valid public classes, modifiers, data attributes, attributes, CSS variables, and usage rules.",
      "Do not invent ls-* classes.",
      "Inspect items for exact snippets, load tags, and README docs before copying markup.",
    ],
    nextCommands: [
      agentCommandRecipes.inspectReadmeJson,
      agentCommandRecipes.addDryRunJson,
      agentCommandRecipes.validateJson,
    ],
  };
}

export function inspectAgentInstructions(requestedItems = ["<item>"]) {
  const items = requestedItems.length ? requestedItems.join(" ") : "<item>";
  return {
    purpose:
      "Use selected registry items as source-of-truth for snippets, load tags, docs, and authoring APIs.",
    rules: [
      "Use snippets[].html as source-of-truth markup for requested items.",
      "After copying assets, add returned load.links and load.scripts to the deck entry HTML when needed.",
      "Use authoring metadata instead of guessing classes or attributes.",
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
      "Inspect templates/components for exact snippet HTML.",
      "Validate after editing markup or copied assets.",
      "Preview and visually inspect representative slides after material slide edits unless the user opts out; agents should use agent-browser screenshots/browser checks.",
    ],
    nextCommands: [
      dryRun
        ? "Repeat the add command without --dry-run when the plan is correct."
        : `slidesls validate ${root} --json`,
      agentCommandRecipes.inspectReadmeJson,
    ],
    longRunningCommands: [`slidesls preview ${root}`],
  };
}

export function initAgentInstructions(root = "<deck>") {
  return {
    purpose: "Continue from a newly initialized slidesls deck.",
    rules: [
      "Use the catalog before adding classes or visual presets.",
      "Inspect templates/components for exact markup before editing slides.",
      "Validate after edits; preview is a long-running server command and should be checked visually with agent-browser unless the user opts out.",
    ],
    nextCommands: [
      agentCommandRecipes.catalogRecommendedJson,
      "slidesls inspect templates/split --readme --json",
      `slidesls validate ${root} --json`,
    ],
    longRunningCommands: [`slidesls preview ${root}`],
  };
}

export function validateAgentInstructions(root = "<deck>") {
  return {
    purpose: "Fix static validation feedback after editing a slidesls deck.",
    rules: [
      "Fix errors first; review warnings even when the deck is otherwise valid.",
      "Use --strict when you need stricter checks for CI or registry drift.",
      "Use catalog and inspect before changing ls-* classes or snippets.",
      "Static validation does not replace preview; use agent-browser to inspect title/section, densest content, and table/timeline/progress/code slides.",
    ],
    nextCommands: [
      agentCommandRecipes.catalogJson,
      agentCommandRecipes.inspectReadmeJson,
      `slidesls add <item> --dir ${root} --dry-run --json`,
    ],
    longRunningCommands: [`slidesls preview ${root}`],
  };
}
