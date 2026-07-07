import { usageError } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import { agentHelpBlock } from "./agent-instructions.mjs";
import { addCommand, catalogCommand, initCommand, inspectCommand } from "./deck-commands.mjs";
import { galleryCommand } from "./gallery-command.mjs";
import { iconsCommand } from "./icons-command.mjs";
import { previewCommand } from "./preview-command.mjs";
import { skillCommand } from "./skill-command.mjs";
import { visualQaCommand } from "./visual-qa-command.mjs";
import {
  doctorCommand,
  generateCatalogCommand,
  validateCommand,
  validateExamplesCommand,
  validateRegistryCommand,
} from "./validation-commands.mjs";

export { addCommand, catalogCommand, initCommand, inspectCommand } from "./deck-commands.mjs";
export { galleryCommand } from "./gallery-command.mjs";
export { iconsCommand } from "./icons-command.mjs";
export { previewCommand } from "./preview-command.mjs";
export { skillCommand } from "./skill-command.mjs";
export { visualQaCommand } from "./visual-qa-command.mjs";
export { textFor } from "./text-output.mjs";
export {
  doctorCommand,
  generateCatalogCommand,
  validateCommand,
  validateExamplesCommand,
  validateRegistryCommand,
} from "./validation-commands.mjs";

export const help = `slidesls — plain HTML/CSS/JS slide authoring CLI

Usage:
  slidesls <command> [options]

Commands:
  init [dir]       Initialize a deck in the current directory, or in [dir]
  add <items...>   Copy registry items into a deck project
  catalog          List registry items, with --recommended for agent-safe items
  inspect <items>  Show metadata, load guidance, and snippets
  icons <action>   Manage the deck's inline icon sprite (sync, list)
  gallery          Generate the registry design-review gallery (repo/dev)
  skill            Show, install, or link the bundled agent skill
  validate [dir]           Static deck validation
  preview [dir]            Serve a deck locally
  visual-qa                Browser-fact visual QA (--eval collector, --analyze findings)
  doctor                   Check CLI/project health
  validate-registry        Validate registry metadata and files
  validate-examples        Validate repo example/template references
  generate-catalog         Generate/check agent catalog docs
  help                     Show help

${agentHelpBlock()}

Common options:
  --json           Machine-readable output
  --help           Command help
`;

export async function runCommand(command, argv) {
  switch (command) {
    case "init":
      return initCommand(argv);
    case "add":
      return addCommand(argv);
    case "catalog":
      return catalogCommand(argv);
    case "inspect":
      return inspectCommand(argv);
    case "icons":
      return iconsCommand(argv);
    case "gallery":
      return galleryCommand(argv);
    case "skill":
      return skillCommand(argv);
    case "validate":
      return validateCommand(argv);
    case "preview":
      return previewCommand(argv);
    case "visual-qa":
      return visualQaCommand(argv);
    case "doctor":
      return doctorCommand(argv);
    case "validate-registry":
      return validateRegistryCommand(argv);
    case "validate-examples":
      return validateExamplesCommand(argv);
    case "generate-catalog":
      return generateCatalogCommand(argv);
    case "help":
      return ok({ help });
    default:
      throw usageError(`Unknown command: ${command}`, "Run slidesls --help.");
  }
}
