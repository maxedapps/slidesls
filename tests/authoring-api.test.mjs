import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRegistry } from "../src/validation/registry.mjs";
import { validateExamples } from "../src/validation/examples.mjs";

async function minimalRegistry() {
  const root = await mkdtemp(path.join(os.tmpdir(), "slidesls-authoring-"));
  await mkdir(path.join(root, "registry", "components", "demo", "snippets"), { recursive: true });
  await writeFile(
    path.join(root, "registry.json"),
    JSON.stringify({ items: ["registry/components/demo/registry-item.json"] }, null, 2),
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "demo.css"),
    ".ls-demo { color: red; }\n",
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<div class="ls-demo"></div>\n',
  );
  await writeFile(
    path.join(root, "registry", "components", "demo", "registry-item.json"),
    JSON.stringify(
      {
        name: "components/demo",
        type: "ls:component",
        description: "Demo component.",
        files: [{ path: "registry/components/demo/demo.css", type: "registry:style" }],
        registryDependencies: [],
        dependencies: [],
        devDependencies: [],
        docs: "registry/components/demo/README.md",
        agentLevel: "recommended",
        authoring: { classGroups: [{ base: "ls-demo" }] },
        snippets: [{ label: "Basic", path: "registry/components/demo/snippets/basic.html" }],
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(root, "registry", "components", "demo", "README.md"), "# demo\n");
  return root;
}

test("registry validation catches agent metadata errors", async () => {
  for (const [mutate, code] of [
    [(item) => delete item.agentLevel, "invalid_agent_level"],
    [(item) => (item.agentLevel = "basic"), "invalid_agent_level"],
    [(item) => (item.agentRecommended = true), "stored_agent_recommended"],
    [
      (item) => {
        item.authoring.classMetadata = {
          "ls-missing": { scopeType: "anywhere", safeAnywhere: true },
        };
      },
      "unknown_class_metadata_key",
    ],
    [
      (item) => {
        item.authoring.classMetadata = {
          "ls-demo": { scopeType: "inside-magic", safeAnywhere: true },
        };
      },
      "invalid_class_scope_type",
    ],
    [
      (item) => {
        item.safeAnywhere = true;
        item.authoring.classMetadata = {
          "ls-demo": { scopeType: "within-slide", safeAnywhere: false },
        };
      },
      "safe_anywhere_class_metadata_conflict",
    ],
  ]) {
    const root = await minimalRegistry();
    const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
    const metadata = JSON.parse(await readFile(itemPath, "utf8"));
    mutate(metadata);
    await writeFile(itemPath, JSON.stringify(metadata, null, 2));

    const result = await validateRegistry({ registryRoot: root });
    assert.equal(result.valid, false, code);
    assert.ok(
      result.errors.some((error) => error.code === code),
      code,
    );
  }
});

test("registry validation catches composition metadata errors", async () => {
  for (const [mutate, code] of [
    [(item) => (item.composition = { avoidwhen: ["typo key"] }), "invalid_composition"],
    [(item) => (item.composition = { layoutBehaviour: "content-sized" }), "invalid_composition"],
    [(item) => (item.composition = { layoutBehavior: "stretchy" }), "invalid_composition"],
    [(item) => (item.composition = { contentDensity: ["airy"] }), "invalid_composition"],
    [(item) => (item.composition = { avoidWhen: [""] }), "invalid_composition"],
    [(item) => (item.composition = { alternatives: [{ when: "x" }] }), "invalid_composition"],
    [
      (item) => (item.composition = { alternatives: [{ when: "x", use: "components/missing" }] }),
      "unknown_composition_alternative",
    ],
    [
      (item) => (item.composition = { copyGuidance: "prefer templates/does-not-exist here" }),
      "unknown_item_in_guidance",
    ],
    [
      (item) => (item.authoring.usage = ["pairs with components/also-missing"]),
      "unknown_item_in_guidance",
    ],
    [
      // README fixture has no "## When not to use" section.
      (item) => (item.composition = { avoidWhen: ["sparse one-liners"] }),
      "avoid_when_missing_readme_section",
    ],
    [
      (item) => (item.authoring.cssVariables = [{ name: "no-dashes" }]),
      "invalid_authoring_css_variable",
    ],
    [
      (item) => (item.authoring.cssVariables = [{ name: "--ls-x", overrideSafe: "yes" }]),
      "invalid_authoring_css_variable",
    ],
  ]) {
    const root = await minimalRegistry();
    const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
    const metadata = JSON.parse(await readFile(itemPath, "utf8"));
    mutate(metadata);
    await writeFile(itemPath, JSON.stringify(metadata, null, 2));

    const result = await validateRegistry({ registryRoot: root });
    assert.equal(result.valid, false, code);
    assert.ok(
      result.errors.some((error) => error.code === code),
      `${code}: ${JSON.stringify(result.errors.map((error) => error.code))}`,
    );
  }
});

test("registry validation accepts valid composition metadata with a paired README", async () => {
  const root = await minimalRegistry();
  const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
  const metadata = JSON.parse(await readFile(itemPath, "utf8"));
  metadata.composition = {
    contentDensity: ["sparse"],
    layoutBehavior: "content-sized",
    copyGuidance: "One line per item; pairs with components/demo.",
    avoidWhen: ["multi-sentence points"],
    alternatives: [{ when: "richer copy", use: "components/demo" }],
  };
  metadata.authoring.cssVariables = [
    "--ls-demo-legacy",
    { name: "--ls-demo-padding", default: "20px", overrideSafe: true },
  ];
  await writeFile(itemPath, JSON.stringify(metadata, null, 2));
  await writeFile(
    path.join(root, "registry", "components", "demo", "README.md"),
    "# demo\n\n## When not to use\n\n- multi-sentence points\n",
  );

  const result = await validateRegistry({ registryRoot: root });
  assert.deepEqual(
    result.errors.map((error) => error.code),
    [],
  );
});

test("registry validation catches authoring classes missing from CSS", async () => {
  const root = await minimalRegistry();
  const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
  const metadata = JSON.parse(await readFile(itemPath, "utf8"));
  metadata.authoring.classGroups[0].modifiers = ["ls-demo--missing"];
  await writeFile(itemPath, JSON.stringify(metadata, null, 2));

  const result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "authoring_class_missing_css"));
});

test("example validation fails unsupported real slidesls classes", async () => {
  const root = await minimalRegistry();
  await mkdir(path.join(root, "examples", "bad"), { recursive: true });
  await writeFile(
    path.join(root, "examples", "bad", "index.html"),
    '<main class="ls-demo ls-demo--typo"></main>\n',
  );

  const result = await validateExamples({ root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "unknown_ls_class"));
});

test("registry validation catches undeclared snippet dependencies", async () => {
  const root = await minimalRegistry();
  await mkdir(path.join(root, "registry", "components", "other"), { recursive: true });
  await writeFile(
    path.join(root, "registry.json"),
    JSON.stringify(
      {
        items: [
          "registry/components/demo/registry-item.json",
          "registry/components/other/registry-item.json",
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(root, "registry", "components", "other", "other.css"),
    ".ls-other { color: blue; }\n",
  );
  await writeFile(
    path.join(root, "registry", "components", "other", "registry-item.json"),
    JSON.stringify(
      {
        name: "components/other",
        type: "ls:component",
        description: "Other component.",
        files: [{ path: "registry/components/other/other.css", type: "registry:style" }],
        registryDependencies: [],
        dependencies: [],
        devDependencies: [],
        docs: "registry/components/other/README.md",
        agentLevel: "advanced",
        authoring: { classGroups: [{ base: "ls-other" }] },
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(root, "registry", "components", "other", "README.md"), "# other\n");
  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<div class="ls-demo ls-other"></div>\n',
  );

  const result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "undeclared_snippet_dependency"));
});

test("registry validation catches broken official snippet structures", async () => {
  const root = await minimalRegistry();
  const itemPath = path.join(root, "registry", "components", "demo", "registry-item.json");
  const metadata = JSON.parse(await readFile(itemPath, "utf8"));
  metadata.authoring = {
    classGroups: [
      {
        base: "ls-progress",
        elements: ["ls-progress__label", "ls-progress__track", "ls-progress__bar"],
      },
      {
        base: "ls-timeline",
        elements: ["ls-timeline__item", "ls-timeline__marker", "ls-timeline__body"],
      },
      {
        base: "ls-quote",
        elements: ["ls-quote__text", "ls-quote__source"],
      },
    ],
  };
  await writeFile(itemPath, JSON.stringify(metadata, null, 2));
  await writeFile(
    path.join(root, "registry", "components", "demo", "demo.css"),
    ".ls-progress {} .ls-progress__label {} .ls-progress__track {} .ls-progress__bar {} .ls-timeline {} .ls-timeline__item {} .ls-timeline__marker {} .ls-timeline__body {} .ls-quote {} .ls-quote__text {} .ls-quote__source {}\n",
  );

  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<div class="ls-progress"><span class="ls-progress__label">Progress</span></div>\n',
  );
  let result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "invalid_progress_structure"));

  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<ol class="ls-timeline"><li class="ls-timeline__item"><span class="ls-timeline__marker">1</span></li></ol>\n',
  );
  result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "invalid_timeline_structure"));

  await writeFile(
    path.join(root, "registry", "components", "demo", "snippets", "basic.html"),
    '<figure class="ls-quote"><blockquote class="ls-quote__text">Text</blockquote></figure>\n',
  );
  result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "invalid_quote_structure"));
});

test("registry validation catches @container without a query container contract", async () => {
  const root = await minimalRegistry();
  await writeFile(
    path.join(root, "registry", "components", "demo", "demo.css"),
    ".ls-demo { color: red; } @container (width < 40rem) { .ls-demo { color: blue; } }\n",
  );

  const result = await validateRegistry({ registryRoot: root });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "container_query_without_contract"));
});

test("example validation recursively checks nested html files", async () => {
  const root = await minimalRegistry();
  await mkdir(path.join(root, "examples", "theme-gallery", "nested"), { recursive: true });
  await writeFile(path.join(root, "examples", "theme-gallery", "index.html"), "<main></main>\n");
  await writeFile(
    path.join(root, "examples", "theme-gallery", "nested", "bad.html"),
    '<main class="ls-demo--typo"></main>\n',
  );

  const result = await validateExamples({ root });
  assert.equal(result.checkedExamples, 2);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "unknown_ls_class"));
});

test("full-slide registry templates use ls-slide-fill instead of direct ls-fill", async () => {
  for (const relative of [
    "registry/templates/title-hero/snippet.html",
    "registry/templates/section-divider/snippet.html",
    "src/deck/templates.mjs",
  ]) {
    const content = await readFile(path.resolve(relative), "utf8");
    assert.doesNotMatch(content, /ls-(?:grid|center)[^"`]*\bls-fill\b/);
    assert.match(content, /ls-slide-fill/);
  }
});
