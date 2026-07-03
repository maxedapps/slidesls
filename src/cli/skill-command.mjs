import path from "node:path";
import { parseArgs, usageError } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import {
  performSkillInstall,
  performSkillLink,
  readAllSkillMarkdown,
  readSkillMarkdown,
  readSkillReference,
  skillInfo,
} from "../skill/agent-skill.mjs";

export async function skillCommand(argv) {
  const args = parseArgs(argv, {
    boolean: ["json", "help", "dry-run", "force", "all"],
    value: ["reference"],
  });
  const subcommand = args._[0] || "info";
  const targetDir = args._[1] ? path.resolve(args._[1]) : undefined;

  if (args.help)
    return ok({
      help: `Usage:
  slidesls skill info [--json]
  slidesls skill show [--reference <name>] [--all]
  slidesls skill install <dir> [--dry-run] [--force] [--json]
  slidesls skill link <dir> [--force] [--json]

Target directory:
  Choose the skill directory required by your agent runtime.
  Runtime-neutral no-install option: slidesls skill show
  Full export fallback: slidesls skill show --all

Example for Claude Code project-local skills:
  slidesls skill install ./.claude/skills/create-slides-with-slidesls

Local checkout/dev example:
  node /path/to/ls_slides/bin/slidesls.mjs skill link <your-agent-skill-dir>/create-slides-with-slidesls

References:
  slidesls skill show --reference catalog
  slidesls skill show --reference deck-authoring
  slidesls skill show --reference copy-workflow
  slidesls skill show --reference preview-validation
  slidesls skill show --reference registry-contract

For AI agents:
  Install or link the skill before authoring.
  Use slidesls skill show for workflow docs.
  Use slidesls skill show --reference catalog for the generated class/style/API catalog.`,
    });

  switch (subcommand) {
    case "info":
      return ok(await skillInfo());
    case "show":
      if (args.all) return ok({ markdown: await readAllSkillMarkdown() });
      if (args.reference) return ok({ markdown: await readSkillReference(args.reference) });
      return ok({ markdown: await readSkillMarkdown() });
    case "install":
      return ok(
        await performSkillInstall({
          targetDir,
          dryRun: args["dry-run"],
          force: args.force,
        }),
      );
    case "link":
      if (args["dry-run"])
        throw usageError(
          "slidesls skill link does not support --dry-run",
          "Use skill install --dry-run.",
        );
      return ok(await performSkillLink({ targetDir, force: args.force }));
    default:
      throw usageError(`Unknown skill subcommand: ${subcommand}`, "Run slidesls skill --help.");
  }
}
