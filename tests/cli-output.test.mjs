import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { agentCommandRecipes } from "../src/cli/agent-instructions.mjs";
import { commandOptionSpecs } from "../src/cli/option-specs.mjs";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/slidesls.mjs");

test("root and key command help include AI-agent guidance", async () => {
  const root = (await run([bin, "--help"])).stdout;
  assert.match(root, /For AI agents:/);
  assert.match(root, /slidesls skill show --all/);
  assert.match(root, /slidesls skill install <your-agent-skill-dir>\/create-slides-with-slidesls/);
  assert.match(root, /Example for Claude Code project-local skills:/);
  assert.match(root, /slidesls catalog --type style --json/);
  assert.match(root, /slidesls catalog --json/);
  assert.match(root, /slidesls inspect <item> --json/);
  assert.match(root, /agent-browser open http:\/\/127\.0\.0\.1:4321\/\?export=1/);
  assert.match(root, /agent-browser set viewport 1600 900/);
  assert.match(root, /agent-browser wait --load networkidle/);
  assert.match(root, /agent-browser screenshot \.\/slides-visual-check\.png/);

  const catalog = (await run([bin, "catalog", "--help"])).stdout;
  assert.match(catalog, /For AI agents:/);
  assert.match(catalog, /catalog --type style --json/);
  assert.match(catalog, /catalog --type component --json/);

  const add = (await run([bin, "add", "--help"])).stdout;
  assert.match(add, /does not edit HTML/);

  const validate = (await run([bin, "validate", "--help"])).stdout;
  assert.match(validate, /Unknown ls-\* classes warn/);
});

test("add --dry-run text output reports planned copies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-cli-"));
  await run([bin, "init", root, "--template", "minimal"]);

  const { stdout } = await run([bin, "add", "components/surface", "--dir", root, "--dry-run"]);
  assert.match(stdout, /Would copy \d+ file\(s\)/);
  assert.doesNotMatch(stdout, /undefined/);
});

test("catalog --json returns an agent-friendly result envelope", async () => {
  const { stdout } = await run([bin, "catalog", "--json"]);
  // Budget: 38 items with brief fields, decision-critical useWhen/avoidWhen,
  // and archetype content contracts (contracts ARE the brief payload agents
  // write copy against). Keep the brief catalog inside one agent context page.
  assert.ok(
    Buffer.byteLength(stdout) < 40_000,
    `brief catalog is ${Buffer.byteLength(stdout)} bytes`,
  );
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(typeof result.data.count, "number");
  assert.ok(Array.isArray(result.data.agentInstructions.nextCommands));
  assert.ok(result.data.items.some((item) => item.name === "core/base"));
  const layout = result.data.items.find((item) => item.name === "layouts/core");
  assert.ok(layout);
  assert.equal(layout.authoring, undefined);
  const layoutGroup = result.data.groups.find((group) => group.type === "ls:layout");
  assert.ok(layoutGroup);
  assert.equal(layoutGroup.label, "Layouts");
  assert.match(layoutGroup.purpose, /alignment guarantees/);
  assert.equal(
    result.data.groups.reduce((sum, group) => sum + group.count, 0),
    result.data.count,
  );

  const rich = JSON.parse((await run([bin, "catalog", "--api", "--json"])).stdout);
  const richLayout = rich.data.items.find((item) => item.name === "layouts/core");
  assert.ok(
    richLayout.authoring.classGroups.some((group) => group.modifiers?.includes("ls-grid--4")),
  );
  assert.ok(richLayout.authoring.classGroups.some((group) => group.base === "ls-hero-media"));
  assert.ok(richLayout.authoring.classes.includes("ls-hero-copy"));
  const richFigure = rich.data.items.find((item) => item.name === "components/figure");
  assert.ok(
    richFigure.authoring.classGroups.some((group) =>
      group.modifiers?.includes("ls-figure--contain"),
    ),
  );
  assert.equal(richLayout.agentLevel, "recommended");
  const validTypes = new Set([
    "ls:core",
    "ls:layout",
    "ls:component",
    "ls:style",
    "ls:font",
    "ls:archetype",
    "ls:motion",
  ]);
  assert.equal(
    result.data.items.every((item) => validTypes.has(item.type)),
    true,
    "catalog must only expose the v2 vocabulary types",
  );
});

test("catalog --query searches structured intent fields without prose noise", async () => {
  const kpi = JSON.parse((await run([bin, "catalog", "--query", "kpi", "--json"])).stdout);
  assert.ok(kpi.data.items.some((item) => item.name === "components/stat"));

  const timeline = JSON.parse(
    (await run([bin, "catalog", "--query", "timeline", "--json"])).stdout,
  );
  assert.ok(timeline.data.items.some((item) => item.name === "components/list"));

  const diff = JSON.parse((await run([bin, "catalog", "--query", "diff", "--json"])).stdout);
  assert.ok(diff.data.items.some((item) => item.name === "components/code"));

  const screenshot = JSON.parse(
    (await run([bin, "catalog", "--query", "screenshot", "--json"])).stdout,
  );
  assert.ok(screenshot.data.items.some((item) => item.name === "components/media"));
  assert.ok(screenshot.data.items.some((item) => item.name === "components/figure"));

  // "restating" appears only in components/figure avoidWhen prose.
  const restating = JSON.parse(
    (await run([bin, "catalog", "--query", "restating", "--json"])).stdout,
  );
  assert.equal(
    restating.data.items.some((item) => item.name === "components/figure"),
    false,
    "query should not search composition.avoidWhen prose",
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
  assert.ok(result.data.items.some((item) => item.name === "layouts/core"));
  assert.ok(result.data.items.some((item) => item.name === "components/surface"));
  assert.ok(result.data.items.some((item) => item.name === "components/statement"));
});

test("inspect returns snippet HTML for requested layouts and components", async () => {
  const layout = JSON.parse((await run([bin, "inspect", "layouts/core", "--json"])).stdout);
  const requested = layout.data.items.find((item) => item.name === "layouts/core");
  assert.match(requested.snippets[0].html, /<section class="ls-slide"/);
  assert.ok(requested.dependencyOrder.includes("core/base"));
  assert.ok(requested.load.links.some((link) => /core\/base\/slide\.css/.test(link)));
  assert.equal(requested.dependencies, undefined);

  const withDependencies = JSON.parse(
    (await run([bin, "inspect", "layouts/core", "--with-dependencies", "--json"])).stdout,
  );
  assert.ok(withDependencies.data.items[0].dependencies.some((item) => item.name === "core/base"));
  assert.equal(withDependencies.data.items[0].dependencies[0].authoring, undefined);

  const withDependencyApi = JSON.parse(
    (await run([bin, "inspect", "layouts/core", "--with-dependencies", "--api", "--json"])).stdout,
  );
  assert.ok(withDependencyApi.data.items[0].dependencies[0].authoring);

  const readme = JSON.parse(
    (await run([bin, "inspect", "layouts/core", "--readme", "--json"])).stdout,
  );
  assert.match(readme.data.items[0].readme, /layout/i);

  const multi = JSON.parse(
    (await run([bin, "inspect", "layouts/core", "components/surface", "--json"])).stdout,
  );
  assert.equal(multi.data.items.length, 2);
  assert.notDeepEqual(multi.data.items[0].dependencyOrder, multi.data.items[1].dependencyOrder);

  const component = JSON.parse(
    (await run([bin, "inspect", "components/surface", "--json"])).stdout,
  );
  assert.ok(Array.isArray(layout.data.agentInstructions.nextCommands));
  assert.match(component.data.items.at(-1).snippets[0].html, /class="ls-surface"/);
  assert.equal(
    component.data.items.find((item) => item.name === "components/surface").authoring,
    undefined,
  );
  const componentApi = JSON.parse(
    (await run([bin, "inspect", "components/surface", "--api", "--json"])).stdout,
  );
  assert.ok(
    componentApi.data.items
      .find((item) => item.name === "components/surface")
      .authoring.classGroups.some((group) => group.base === "ls-surface"),
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
  const collision = path.join(root, "slidesls", "registry", "components", "surface", "surface.css");
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, "modified");

  await assert.rejects(run([bin, "add", "components/surface", "--dir", root]), (error) => {
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

test("layout add plans dependencies but not snippet files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-layout-add-"));
  await run([bin, "init", root, "--template", "blank"]);
  const result = JSON.parse(
    (await run([bin, "add", "layouts/core", "--dir", root, "--dry-run", "--json"])).stdout,
  );
  assert.equal(result.ok, true);
  assert.ok(result.data.dependencyOrder.includes("layouts/core"));
  assert.ok(result.data.dependencyOrder.includes("core/base"));
  assert.equal(
    result.data.files.some((file) => /snippets\//.test(file.targetPath ?? "")),
    false,
  );
});

test("init and validate JSON include context-aware agentInstructions without removing existing fields", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-agent-json-"));
  const init = JSON.parse((await run([bin, "init", root, "--template", "blank", "--json"])).stdout);
  assert.equal(init.ok, true);
  assert.equal(init.data.entry, "index.html");
  assert.ok(Array.isArray(init.data.nextSteps));
  assert.ok(
    init.data.agentInstructions.nextCommands.includes("slidesls catalog --type component --json"),
  );
  assert.ok(
    init.data.agentInstructions.nextCommands.includes(
      "slidesls inspect layouts/core components/surface components/list --json",
    ),
  );
  assert.ok(Array.isArray(init.data.agentInstructions.longRunningCommands));

  const minimalRoot = await mkdtemp(path.join(os.tmpdir(), "slidesls-agent-minimal-json-"));
  const minimal = JSON.parse(
    (await run([bin, "init", minimalRoot, "--template", "minimal", "--json"])).stdout,
  );
  assert.ok(minimal.data.agentInstructions.nextCommands.includes("slidesls catalog --json"));
  assert.ok(
    minimal.data.agentInstructions.nextCommands.includes(
      "slidesls inspect layouts/core components/surface components/list --json",
    ),
  );

  const validation = JSON.parse((await run([bin, "validate", root, "--json"])).stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.data.valid, true);
  assert.ok(Array.isArray(validation.data.errors));
  assert.ok(Array.isArray(validation.data.warnings));
  assert.ok(Array.isArray(validation.data.agentInstructions.nextCommands));
  assert.ok(Array.isArray(validation.data.agentInstructions.longRunningCommands));
});

test("blank deck can be composed from layout and component primitives", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-primitive-workflow-"));
  await run([bin, "init", root, "--template", "blank", "--title", "Primitive Test", "--json"]);
  const add = JSON.parse(
    (
      await run([
        bin,
        "add",
        "layouts/core",
        "components/surface",
        "components/stat",
        "--dir",
        root,
        "--json",
      ])
    ).stdout,
  );
  assert.equal(add.ok, true);

  const entryPath = path.join(root, "index.html");
  let html = await readFile(entryPath, "utf8");
  for (const tag of [...add.data.links, ...add.data.scripts]) {
    if (html.includes(tag)) continue;
    html = tag.startsWith("<link")
      ? html.replace("    <script defer", `    ${tag}\n    <script defer`)
      : html.replace("  </head>", `    ${tag}\n  </head>`);
  }
  const primitiveSlide = `      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Custom primitive slide">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Primitive composition</p>
            <h2 class="ls-title">Compose from the layout system and components.</h2>
          </header>
          <div class="ls-slide__body">
            <div class="ls-layout ls-layout--split">
              <div class="ls-layout__region">
                <div class="ls-surface">
                  <p class="ls-surface__kicker">Structure</p>
                  <h3 class="ls-surface__title">Layout stays explicit</h3>
                  <p class="ls-surface__text">Use layouts/core for structure and components for content.</p>
                </div>
              </div>
              <div class="ls-layout__region">
                <div class="ls-stat">
                  <p class="ls-stat__value">3<em>items</em></p>
                  <p class="ls-stat__label">registry primitives composed on this slide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  html = html.replace(/      <section class="ls-slide"[\s\S]*?<\/section>/, primitiveSlide);
  await writeFile(entryPath, html);

  const validation = JSON.parse((await run([bin, "validate", root, "--json"])).stdout);
  assert.equal(validation.ok, true);
  assert.equal(validation.data.valid, true);
  assert.deepEqual(validation.data.errors, []);
  assert.deepEqual(
    validation.data.warnings.map((warning) => warning.code),
    ["style_missing"],
  );
  assert.match(html, /registry\/layouts\/core\/layout\.css/);
  assert.match(html, /registry\/components\/surface\/surface\.css/);
  assert.match(html, /registry\/components\/stat\/stat\.css/);
});

test("validate text shows no-warning guidance on a valid minimal deck", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-valid-text-"));
  await run([bin, "init", root, "--template", "minimal"]);
  const { stdout } = await run([bin, "validate", root]);
  assert.match(stdout, /slidesls validate: ok/);
  assert.doesNotMatch(stdout, /missing_registry_item_for_class/);
  assert.match(stdout, /For AI agents:/);
});

test("catalog and inspect text include grouped AI-agent guidance", async () => {
  const catalog = (await run([bin, "catalog", "--recommended"])).stdout;
  assert.match(catalog, /Components \(\d+\) — Standalone/);
  assert.match(catalog, /Layouts \(\d+\) — Slide-body/);
  assert.match(catalog, /For AI agents:/);
  assert.match(catalog, /Do not invent ls-\*/);

  const inspect = (await run([bin, "inspect", "layouts/core"])).stdout;
  assert.match(inspect, /Authoring: add --api for details/);
  assert.match(inspect, /For AI agents:/);
});

test("documented agent command recipes execute with placeholder substitutions", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-recipe-"));
  await run([bin, "init", root, "--template", "blank", "--json"]);
  const collected = path.join(root, "collected.json");
  await writeFile(
    collected,
    JSON.stringify({
      url: "http://127.0.0.1:4321/",
      deck: { export: "true" },
      slides: [{ index: 1, kind: "content", rect: { height: 900 } }],
    }),
  );
  const substitutions = {
    "<item>": "layouts/core",
    "<items...>": "components/surface",
    "<deck-or-project>": root,
    "<deck>": root,
    "<collected.json>": collected,
  };
  const emittedRecipes = [
    ...Object.values(agentCommandRecipes),
    ...JSON.parse((await run([bin, "catalog", "--json"])).stdout).data.agentInstructions
      .nextCommands,
    ...JSON.parse((await run([bin, "inspect", "layouts/core", "--json"])).stdout).data
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

test("visual-qa command exposes eval script, analysis, and help", async () => {
  const help = (await run([bin, "visual-qa"])).stdout;
  assert.match(help, /--eval/);
  assert.match(help, /--analyze/);

  const evalScript = (await run([bin, "visual-qa", "--eval"])).stdout;
  assert.match(evalScript, /contentFillRatio/);
  assert.match(evalScript, /minBodyFontSize/);
  assert.doesNotMatch(evalScript, /^\{/, "text --eval output must be the raw script, not JSON");

  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-visual-qa-"));
  const collected = path.join(root, "collected.json");
  await writeFile(
    collected,
    JSON.stringify({
      url: "http://127.0.0.1:4321/?export=1",
      deck: { export: "true" },
      slides: [
        {
          index: 1,
          kind: "content",
          label: "Sparse",
          minBodyFontSize: 14,
          rect: { height: 900 },
          innerOffsetTop: 0,
          expectedHeaderOffsetTop: 96,
          headerOffsetTop: 96,
        },
      ],
    }),
  );
  const analysis = JSON.parse(
    (await run([bin, "visual-qa", "--analyze", "--input", collected, "--json"])).stdout,
  );
  assert.equal(analysis.ok, true);
  assert.ok(analysis.data.warnings.some((warning) => warning.code === "body_text_small"));
  assert.equal(analysis.data.perSlide[0].deepLink, "http://127.0.0.1:4321/#slide=1");
  assert.deepEqual(analysis.data.summary.slidesToInspect, [1]);
  assert.ok(Array.isArray(analysis.data.agentInstructions.nextCommands));

  const text = (await run([bin, "visual-qa", "--analyze", "--input", collected])).stdout;
  assert.match(text, /body_text_small/);
  assert.match(text, /#slide=1/);
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

async function guidanceFiles() {
  const { stdout } = await execFileAsync(
    "git",
    ["ls-files", "src/**/*.mjs", "docs/**/*.md", "skills/**/*.md", "README.md"],
    {
      cwd: path.resolve("."),
    },
  );
  return stdout.trim().split(/\n/).filter(Boolean);
}

function commandFlagViolations(text, specs) {
  const violations = [];
  for (const [index, line] of text.split(/\n/).entries()) {
    for (const commandMatch of line.matchAll(/slidesls(?:\.mjs)?\s+([a-z][a-z0-9-]*)/g)) {
      const spec = specs[commandMatch[1]];
      if (!spec) continue;
      const allowed = new Set([...(spec.boolean || []), ...(spec.value || [])]);
      // Attribute flags only up to the end of the invocation: a closing
      // backtick/quote ends a code span or string literal, and a following
      // `slidesls` starts the next invocation on the same line.
      const rest = line.slice(commandMatch.index + commandMatch[0].length);
      const spanEnd = rest.split(/[`"']/, 1)[0];
      const nextCommand = spanEnd.search(/slidesls/);
      const segment = nextCommand === -1 ? spanEnd : spanEnd.slice(0, nextCommand);
      for (const flag of segment.matchAll(/--([a-z][a-z0-9-]*)/g)) {
        if (flag[1] === "help" || allowed.has(flag[1])) continue;
        violations.push({
          line: index + 1,
          command: commandMatch[1],
          flag: flag[1],
          text: line.trim(),
        });
      }
    }
  }
  return violations;
}

test("documented command invocations use only declared flags", async () => {
  for (const file of await guidanceFiles()) {
    const text = await readFile(path.resolve(file), "utf8");
    const violations = commandFlagViolations(text, commandOptionSpecs);
    assert.deepEqual(
      violations,
      [],
      `${file} documents flags the strict parser rejects: ${JSON.stringify(violations)}`,
    );
  }
});

test("command flag sweep detects undeclared flags", () => {
  const violations = commandFlagViolations(
    "Run `slidesls catalog --bogus-flag --json` first.",
    commandOptionSpecs,
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].flag, "bogus-flag");
});

test("agent guidance avoids stale primary commands", async () => {
  for (const file of await guidanceFiles()) {
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
