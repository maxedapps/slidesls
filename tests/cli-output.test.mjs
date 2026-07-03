import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { agentCommandRecipes } from "../src/cli/agent-instructions.mjs";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");

test("root and key command help include AI-agent guidance", async () => {
  const root = (await run([bin, "--help"])).stdout;
  assert.match(root, /For AI agents:/);
  assert.match(root, /slidesls skill show --all/);
  assert.match(root, /slidesls skill install <your-agent-skill-dir>\/create-slides-with-slidesls/);
  assert.match(root, /Example for Claude Code project-local skills:/);
  assert.match(root, /slidesls catalog --starter --json/);
  assert.match(root, /slidesls catalog --json/);
  assert.match(root, /slidesls inspect <item> --json/);
  assert.match(root, /agent-browser open http:\/\/127\.0\.0\.1:4321\/\?export=1/);
  assert.match(root, /agent-browser set viewport 1600 900/);
  assert.match(root, /agent-browser wait --load networkidle/);
  assert.match(root, /agent-browser screenshot \.\/slides-visual-check\.png/);

  const catalog = (await run([bin, "catalog", "--help"])).stdout;
  assert.match(catalog, /For AI agents:/);
  assert.match(catalog, /catalog --type preset --tag theme --json/);

  const add = (await run([bin, "add", "--help"])).stdout;
  assert.match(add, /does not edit HTML/);

  const validate = (await run([bin, "validate", "--help"])).stdout;
  assert.match(validate, /Unknown ls-\* classes warn/);
});

test("add --dry-run text output reports planned copies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-cli-"));
  await run([bin, "init", root, "--template", "minimal"]);

  const { stdout } = await run([bin, "add", "components/card", "--dir", root, "--dry-run"]);
  assert.match(stdout, /Would copy \d+ file\(s\)/);
  assert.doesNotMatch(stdout, /undefined/);
});

test("catalog --json returns an agent-friendly result envelope", async () => {
  const { stdout } = await run([bin, "catalog", "--json"]);
  assert.ok(
    Buffer.byteLength(stdout) < 12_000,
    `brief catalog is ${Buffer.byteLength(stdout)} bytes`,
  );
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(typeof result.data.count, "number");
  assert.ok(Array.isArray(result.data.agentInstructions.nextCommands));
  assert.ok(result.data.items.some((item) => item.name === "core/base"));
  const layout = result.data.items.find((item) => item.name === "utilities/layout");
  assert.ok(layout);
  assert.equal(layout.authoring, undefined);
  assert.ok(result.data.groups.some((group) => group.type === "ls:utility"));

  const rich = JSON.parse((await run([bin, "catalog", "--api", "--json"])).stdout);
  const richLayout = rich.data.items.find((item) => item.name === "utilities/layout");
  assert.ok(
    richLayout.authoring.classGroups.some((group) => group.modifiers?.includes("ls-grid--4")),
  );
  assert.equal(richLayout.agentLevel, "recommended");
  assert.equal(
    result.data.items.some((item) => item.name.startsWith("layouts/")),
    false,
  );
});

test("catalog --recommended returns only recommended items", async () => {
  const { stdout } = await run([bin, "catalog", "--recommended", "--json"]);
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.ok(result.data.items.length > 0);
  assert.equal(
    result.data.items.every((item) => ["starter", "recommended"].includes(item.agentLevel)),
    true,
  );
  assert.ok(result.data.items.some((item) => item.name === "utilities/layout"));
  assert.ok(result.data.items.some((item) => item.name === "components/panel"));
  assert.ok(result.data.items.some((item) => item.name === "templates/split"));
});

test("inspect returns snippet HTML for requested templates and components", async () => {
  const template = JSON.parse((await run([bin, "inspect", "templates/split", "--json"])).stdout);
  const requested = template.data.items.find((item) => item.name === "templates/split");
  assert.match(requested.snippets[0].html, /<section class="ls-slide"/);
  assert.ok(requested.dependencyOrder.includes("core/base"));
  assert.ok(requested.load.links.some((link) => /core\/base\/slide\.css/.test(link)));
  assert.equal(requested.dependencies, undefined);

  const withDependencies = JSON.parse(
    (await run([bin, "inspect", "templates/split", "--with-dependencies", "--json"])).stdout,
  );
  assert.ok(withDependencies.data.items[0].dependencies.some((item) => item.name === "core/base"));
  assert.equal(withDependencies.data.items[0].dependencies[0].authoring, undefined);

  const withDependencyApi = JSON.parse(
    (await run([bin, "inspect", "templates/split", "--with-dependencies", "--api", "--json"]))
      .stdout,
  );
  assert.ok(withDependencyApi.data.items[0].dependencies[0].authoring);

  const readme = JSON.parse(
    (await run([bin, "inspect", "templates/split", "--readme", "--json"])).stdout,
  );
  assert.match(readme.data.items[0].readme, /split/i);

  const multi = JSON.parse(
    (await run([bin, "inspect", "templates/split", "components/card", "--json"])).stdout,
  );
  assert.equal(multi.data.items.length, 2);
  assert.notDeepEqual(multi.data.items[0].dependencyOrder, multi.data.items[1].dependencyOrder);

  const component = JSON.parse((await run([bin, "inspect", "components/card", "--json"])).stdout);
  assert.ok(Array.isArray(template.data.agentInstructions.nextCommands));
  assert.match(component.data.items.at(-1).snippets[0].html, /class="ls-card"/);
  assert.equal(
    component.data.items.find((item) => item.name === "components/card").authoring,
    undefined,
  );
  const componentApi = JSON.parse(
    (await run([bin, "inspect", "components/card", "--api", "--json"])).stdout,
  );
  assert.ok(
    componentApi.data.items
      .find((item) => item.name === "components/card")
      .authoring.classGroups.some((group) => group.base === "ls-card"),
  );
});

test("add without init uses explicit copy mode", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-copy-"));
  const dryRun = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.data.root, root);
  assert.equal(dryRun.data.configFound, false);
  assert.equal(dryRun.data.mode, "copy");
  assert.equal(dryRun.data.baseDir, "slidesls");
  assert.ok(Array.isArray(dryRun.data.agentInstructions.nextCommands));
  assert.ok(Array.isArray(dryRun.data.agentInstructions.longRunningCommands));

  const real = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", root, "--base-dir", "vendor/slides", "--json"]))
      .stdout,
  );
  assert.equal(real.ok, true);
  assert.equal(real.data.mode, "copy");
  assert.equal(real.data.baseDir, "vendor/slides");
  assert.equal(real.data.links.length > 0, true);
});

test("add --dir does not inherit ancestor config", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "slidesls-parent-"));
  const child = path.join(parent, "child");
  await mkdir(child);
  await run([bin, "init", parent, "--template", "blank"]);

  const result = JSON.parse(
    (await run([bin, "add", "core/base", "--dir", child, "--dry-run", "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.equal(result.data.root, child);
  assert.equal(result.data.mode, "copy");
});

test("catalog --type uses exact normalized type matching", async () => {
  const component = JSON.parse(
    (await run([bin, "catalog", "--type", "component", "--json"])).stdout,
  );
  assert.ok(component.data.items.length > 0);
  assert.equal(
    component.data.items.every((item) => item.type === "ls:component"),
    true,
  );

  const prefixed = JSON.parse(
    (await run([bin, "catalog", "--type", "ls:component", "--json"])).stdout,
  );
  assert.deepEqual(prefixed.data.items, component.data.items);

  const suffix = JSON.parse((await run([bin, "catalog", "--type", "e", "--json"])).stdout);
  assert.equal(suffix.data.items.length, 0);
});

test("add collisions do not partially copy earlier files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-add-collision-"));
  const collision = path.join(root, "slidesls", "registry", "components", "card", "card.css");
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "modified");

  await assert.rejects(run([bin, "add", "components/card", "--dir", root]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Refusing to overwrite/);
    return true;
  });
  await assert.rejects(
    access(path.join(root, "slidesls", "registry", "core", "base", "tokens.css")),
  );
});

test("init collisions do not write config first", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-init-collision-"));
  const collision = path.join(root, "slidesls", "registry", "core", "base", "tokens.css");
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "modified");

  await assert.rejects(run([bin, "init", root, "--template", "blank"]), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Refusing to overwrite/);
    return true;
  });
  await assert.rejects(access(path.join(root, "slidesls.json")));
});

test("add accepts existing identical files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-identical-"));
  const target = path.join(root, "slidesls", "registry", "core", "base", "tokens.css");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await readFile(path.resolve("registry/core/base/tokens.css"), "utf8"));

  const result = JSON.parse((await run([bin, "add", "core/base", "--dir", root, "--json"])).stdout);
  assert.equal(result.ok, true);
});

test("template add plans dependencies but not snippet files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-template-"));
  await run([bin, "init", root, "--template", "minimal"]);
  const result = JSON.parse(
    (await run([bin, "add", "templates/split", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.ok(result.data.dependencyOrder.includes("templates/split"));
  assert.equal(
    result.data.files.some((file) => file.targetPath?.endsWith("snippet.html")),
    false,
  );
});

test("init and validate JSON include agentInstructions without removing existing fields", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-agent-json-"));
  const init = JSON.parse((await run([bin, "init", root, "--template", "blank", "--json"])).stdout);
  assert.equal(init.ok, true);
  assert.equal(init.data.entry, "index.html");
  assert.ok(Array.isArray(init.data.nextSteps));
  assert.ok(Array.isArray(init.data.agentInstructions.nextCommands));
  assert.ok(Array.isArray(init.data.agentInstructions.longRunningCommands));

  const validation = JSON.parse((await run([bin, "validate", root, "--json"])).stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.data.valid, true);
  assert.ok(Array.isArray(validation.data.errors));
  assert.ok(Array.isArray(validation.data.warnings));
  assert.ok(Array.isArray(validation.data.agentInstructions.nextCommands));
  assert.ok(Array.isArray(validation.data.agentInstructions.longRunningCommands));
});

test("validate text shows no-warning guidance on a valid minimal deck", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-valid-text-"));
  await run([bin, "init", root, "--template", "minimal"]);
  const { stdout } = await run([bin, "validate", root]);
  assert.match(stdout, /slidesls validate: ok/);
  assert.doesNotMatch(stdout, /missing_registry_item_for_class/);
  assert.match(stdout, /For AI agents:/);
});

test("catalog and inspect text include AI-agent guidance", async () => {
  const catalog = (await run([bin, "catalog", "--recommended"])).stdout;
  assert.match(catalog, /For AI agents:/);
  assert.match(catalog, /Do not invent ls-\*/);

  const inspect = (await run([bin, "inspect", "utilities/layout"])).stdout;
  assert.match(inspect, /Authoring: add --api for details/);
  assert.match(inspect, /For AI agents:/);
});

test("documented agent command recipes execute with placeholder substitutions", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-recipe-"));
  await run([bin, "init", root, "--template", "blank", "--json"]);
  const substitutions = {
    "<item>": "templates/split",
    "<items...>": "utilities/layout",
    "<deck-or-project>": root,
    "<deck>": root,
  };
  const emittedRecipes = [
    ...Object.values(agentCommandRecipes),
    ...JSON.parse((await run([bin, "catalog", "--json"])).stdout).data.agentInstructions
      .nextCommands,
    ...JSON.parse((await run([bin, "inspect", "templates/split", "--json"])).stdout).data
      .agentInstructions.nextCommands,
    ...JSON.parse((await run([bin, "validate", root, "--json"])).stdout).data.agentInstructions
      .nextCommands,
  ];

  for (const recipe of emittedRecipes) {
    const command = substitute(recipe, substitutions);
    if (!command.startsWith("slidesls ")) continue;
    if (command.includes("skill install") || command.includes("skill link")) continue;
    if (command.includes(" preview ")) continue;
    await run(commandToArgs(command));
  }
  await run([bin, "validate", root, "--json"]);
});

test("removed --registry option fails with a usage error", async () => {
  await assert.rejects(run([bin, "catalog", "--registry", "foo"]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, /--registry has been removed/);
    assert.match(error.stderr, /--registry-root <path> or --registry-url <url>/);
    return true;
  });
});

test("canonical help and docs do not mention removed --registry option", async () => {
  const { stdout } = await run([bin, "catalog", "--help"]);
  const docs = await readFile(path.resolve("docs/cli.md"), "utf8");
  assert.doesNotMatch(stdout, /--registry(?!-(?:root|url))/);
  assert.doesNotMatch(docs, /--registry(?!-(?:root|url))/);
});

function commandToArgs(command) {
  const parts = command.split(" ");
  assert.equal(parts.shift(), "slidesls");
  return [bin, ...parts];
}

function substitute(recipe, substitutions) {
  let command = recipe;
  for (const [placeholder, value] of Object.entries(substitutions)) {
    command = command.replaceAll(placeholder, value);
  }
  return command;
}

async function run(args) {
  return execFileAsync(process.execPath, args, { cwd: path.resolve("."), maxBuffer: 1024 * 1024 });
}

test("agent guidance avoids stale primary commands", async () => {
  const { stdout } = await execFileAsync(
    "git",
    ["ls-files", "src/**/*.mjs", "docs/**/*.md", "skills/**/*.md", "README.md"],
    {
      cwd: path.resolve("."),
    },
  );
  for (const file of stdout.trim().split(/\n/).filter(Boolean)) {
    const text = await readFile(path.resolve(file), "utf8");
    assert.doesNotMatch(text, /inspect <item> --readme --json/);
    assert.doesNotMatch(text, /catalog --recommended --json/);
    for (const match of text.matchAll(/skill show --all/g)) {
      const start = Math.max(0, match.index - 120);
      const end = Math.min(text.length, match.index + 120);
      const nearby = text.slice(start, end).toLowerCase();
      assert.match(
        nearby,
        /fallback|export/,
        `${file} uses skill show --all without fallback/export wording`,
      );
    }
  }
});
