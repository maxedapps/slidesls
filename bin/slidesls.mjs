#!/usr/bin/env node
import { usageError } from "../src/shared/args.mjs";
import { fail, printJson } from "../src/shared/result.mjs";
import { help, runCommand, textFor } from "../src/cli/commands.mjs";

process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith("--") ? argv[0] : "help";
const commandArgs = command === argv[0] ? argv.slice(1) : argv;

function parseGlobalFlags() {
  return { json: commandArgs.some((arg) => arg === "--json" || arg.startsWith("--json=")) };
}

function validateRootOptions() {
  if (command !== "help") return;
  for (const arg of commandArgs) {
    if (arg === "--" || arg === "--help" || arg === "--json") continue;
    if (arg.startsWith("--help=") || arg.startsWith("--json=")) continue;
    if (arg.startsWith("--")) throw usageError(`Unknown option ${arg.split("=", 1)[0]}`);
  }
}

try {
  validateRootOptions();
  if (command === "help" && (commandArgs.length === 0 || commandArgs.includes("--help"))) {
    process.stdout.write(help);
    process.exit(0);
  }
  const result = await runCommand(command, commandArgs);
  const parsed = parseGlobalFlags();
  if (parsed.json) printJson(result);
  else process.stdout.write(textFor(command, result));
  if (result.data && (result.data.valid === false || result.data.ok === false)) process.exit(1);
} catch (error) {
  const parsed = (() => {
    try {
      return parseGlobalFlags();
    } catch {
      return {};
    }
  })();
  const result = fail(error);
  if (parsed.json) printJson(result);
  else
    console.error(
      `${result.error.code}: ${result.error.message}${result.error.hint ? `\nHint: ${result.error.hint}` : ""}`,
    );
  process.exit(error.exitCode || 1);
}
