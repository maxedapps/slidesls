import { CONFIG_FILE } from "../deck/config.mjs";
import { agentCommandRecipes } from "./agent-instructions.mjs";

function formatCounts(counts = {}) {
  const entries = Object.entries(counts);
  if (!entries.length) return "";
  return `${entries.map(([status, count]) => `${status}: ${count}`).join(", ")}\n`;
}

function formatFinding(entry, severity) {
  const hint = entry.hint ? `\n  hint: ${entry.hint}` : "";
  return `- ${severity}: ${entry.message}${hint}`;
}

function agentTextBlock(lines) {
  return `\nFor AI agents:\n${lines.map((line) => `  ${line}`).join("\n")}\n`;
}

export function textFor(command, result) {
  if (command === "help" || result.data?.help) return `${result.data.help}\n`;
  if (command === "catalog")
    return (
      result.data.items
        .map((item) => `${item.name.padEnd(36)} ${item.type.padEnd(13)} ${item.description || ""}`)
        .join("\n") +
      agentTextBlock([
        `Use \`${agentCommandRecipes.catalogRecommendedJson}\` or \`${agentCommandRecipes.catalogJson}\` to read item.authoring metadata.`,
        `Use \`${agentCommandRecipes.inspectReadmeJson}\` for snippets, load tags, and docs.`,
        "Do not invent ls-* classes; use listed authoring classes/modifiers.",
      ])
    );
  if (command === "inspect")
    return (
      result.data.items
        .map((item) => {
          const snippets = (item.snippets || [])
            .map((snippet) => `${snippet.label}: ${snippet.path}`)
            .join("\n    ");
          const theme = item.themeAttribute
            ? `\n  Theme: set data-ls-theme="${item.themeAttribute}" on <html>`
            : "";
          const authoring = item.authoring ? "\n  Authoring: available in --json output" : "";
          return `${item.name}\n  ${item.description || ""}${theme}${authoring}\n  Files: ${(item.files || []).map((file) => file.path).join(", ") || "none"}\n  Snippets:\n    ${snippets || "none"}\n  Links:\n    ${(item.load.links || []).join("\n    ")}\n  Scripts:\n    ${(item.load.scripts || []).join("\n    ")}`;
        })
        .join("\n\n") +
      agentTextBlock([
        "Use --json for full authoring metadata, snippets, and load tags.",
        "Copy assets with `slidesls add <items...> --dir <deck-or-project> --dry-run --json`.",
        "Add returned load tags to the entry HTML, then run `slidesls validate <deck> --json`.",
      ])
    );
  if (command === "skill") {
    if (result.data.markdown) return result.data.markdown;
    if (!result.data.action) {
      const examples = (result.data.exampleTargets || [])
        .map((target) => `Example target (${target.runtime}): ${target.path}`)
        .join("\n");
      return `slidesls skill: ${result.data.source}\nFiles: ${result.data.files?.length || 0}\n${examples ? `${examples}\n` : ""}${result.data.runtimeNeutralInstruction || ""}\n`;
    }
    const warnings = result.data.warnings?.length
      ? `\nWarnings:\n${result.data.warnings.map((warning) => `- ${warning}`).join("\n")}\n`
      : "";
    const next = result.data.postInstallInstructions?.length
      ? `\nNext for agents:\n- Fully read: ${result.data.skillPath}\n- Then read relevant references in ${result.data.referencesPath}/\n- If your agent runtime did not auto-load it, run: slidesls skill show --all\n`
      : "";
    return `slidesls skill ${result.data.action}: ${result.data.target}\n${result.data.status ? `status: ${result.data.status}\n` : ""}${formatCounts(result.data.counts)}${warnings}${next}`;
  }
  if (command === "validate") {
    const warnings = result.data.warnings || [];
    const errors = result.data.errors || [];
    const findings = [
      ...errors.map((entry) => formatFinding(entry, "error")),
      ...warnings.map((entry) => formatFinding(entry, "warning")),
    ].join("\n");
    const summary = result.data.valid
      ? warnings.length
        ? `slidesls validate: ok with ${warnings.length} warning(s) (${result.data.root})`
        : `slidesls validate: ok (${result.data.root})`
      : `slidesls validate: failed (${errors.length} error(s), ${warnings.length} warning(s))`;
    const guidance = findings
      ? agentTextBlock([
          `Unknown ls-* class? Run \`${agentCommandRecipes.catalogJson}\`.`,
          "Missing registry item? Run `slidesls add <item> --dir <deck> --dry-run --json`.",
          "Use `slidesls inspect <item> --readme --json` for exact snippets.",
        ])
      : agentTextBlock([
          "No static issues found. Static validation does not replace preview.",
          "Run `slidesls preview <deck>` and use agent-browser or another browser to inspect representative title/section, dense-content, table/timeline/progress/code slides unless intentionally skipped.",
        ]);
    return `${summary}\n${findings ? `${findings}\n` : ""}${guidance}`;
  }
  if (command === "add") {
    const links = result.data.links || [];
    const scripts = result.data.scripts || [];
    const count = result.data.dryRun ? result.data.files.length : result.data.copied;
    const action = result.data.dryRun ? "Would copy" : "Copied";
    const copyModeNote =
      result.data.mode === "copy"
        ? `No ${CONFIG_FILE} found; using copy mode and writing assets under ./${result.data.baseDir}.\n`
        : "";
    const themeNote = result.data.applyTheme
      ? `Apply theme by setting data-ls-theme="${result.data.applyTheme.themeAttribute}" on the <html> element.\n`
      : "";
    return `${copyModeNote}${action} ${count} file(s). Add these tags if needed:\n${[...links, ...scripts].join("\n")}\n${themeNote}${agentTextBlock(
      [
        "`add` copied/planned files only; it does not edit HTML.",
        "Add returned load tags to the deck entry HTML if missing.",
        `For exact markup, run \`${agentCommandRecipes.inspectReadmeJson}\`.`,
        "Then run `slidesls validate <dir> --json`.",
      ],
    )}`;
  }
  if (command === "init")
    return `Initialized ${result.data.root}${result.data.theme ? ` with theme ${result.data.theme}` : ""}\nNext steps:\n${result.data.nextSteps.map((s) => `  ${s}`).join("\n")}\n${agentTextBlock(
      [
        `Use \`${agentCommandRecipes.catalogRecommendedJson}\` before adding classes or presets.`,
        "Use `slidesls inspect templates/split --readme --json` for exact markup.",
        `Run \`slidesls validate ${result.data.root} --json\` after editing.`,
      ],
    )}`;
  if (command === "preview") return `Serving ${result.data.root} at ${result.data.url}\n`;
  if (command === "doctor")
    return result.data.ok
      ? `slidesls doctor: ok (${result.data.root})\n${result.data.warnings.map((w) => `- warning: ${w.message}`).join("\n")}${result.data.warnings.length ? "\n" : ""}`
      : `slidesls doctor: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "validate-registry")
    return result.data.valid
      ? `slidesls validate-registry: ok (${result.data.itemCount} item(s))\n`
      : `slidesls validate-registry: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "validate-examples")
    return result.data.valid
      ? `slidesls validate-examples: ok (${result.data.checkedExamples} example(s))\n`
      : `slidesls validate-examples: failed (${result.data.errors.length} error(s))\n${result.data.errors.map((e) => `- ${e.message}`).join("\n")}\n`;
  if (command === "generate-catalog")
    return `${result.data.checked ? "Catalog is up to date" : "Wrote catalog"}: ${result.data.output}\n`;
  return `${JSON.stringify(result.data, null, 2)}\n`;
}
