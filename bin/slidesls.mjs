#!/usr/bin/env node
import { parseArgs } from "../src/shared/args.mjs";
import { fail, printJson } from "../src/shared/result.mjs";
import { help, runCommand, textFor } from "../src/cli/commands.mjs";

const argv = process.argv.slice(2);
const command =
  argv[0] && !argv[0].startsWith("--") ? argv[0] : argv.includes("--help") ? "help" : "help";
const commandArgs = command === argv[0] ? argv.slice(1) : argv;

try {
  if (command === "help" && (commandArgs.length === 0 || commandArgs.includes("--help"))) {
    process.stdout.write(help);
    process.exit(0);
  }
  const result = await runCommand(command, commandArgs);
  const parsed = parseArgs(commandArgs, {
    boolean: [
      "json",
      "help",
      "force",
      "dry-run",
      "strict",
      "include-docs",
      "open",
      "readme",
      "check",
    ],
  });
  if (parsed.json) printJson(result);
  else process.stdout.write(textFor(command, result));
  if (result.data && (result.data.valid === false || result.data.ok === false)) process.exit(1);
} catch (error) {
  const parsed = (() => {
    try {
      return parseArgs(commandArgs, {
        boolean: [
          "json",
          "help",
          "force",
          "dry-run",
          "strict",
          "include-docs",
          "open",
          "readme",
          "check",
        ],
      });
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
