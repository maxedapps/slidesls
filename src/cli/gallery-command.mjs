import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "../shared/args.mjs";
import { commandOptionSpecs } from "./option-specs.mjs";
import { ok } from "../shared/result.mjs";
import { exists, writeText } from "../shared/fs.mjs";
import { escapeHtml } from "../shared/html.mjs";
import { registryData, registrySource, rejectRemovedRegistryOption } from "./registry-options.mjs";

// Design-review harness: renders every registry snippet under every style and
// density into .gallery/ pages. Screenshot capture and measured checks run in
// scripts/visual-gate.mjs; humans review captures under .gallery-review/.

const DENSITIES = ["default", "compact", "spacious"];

function wrapFragment(item, snippet, density) {
  const densityAttribute = density === "default" ? "" : ` data-ls-density="${density}"`;
  return `      <section class="ls-slide" data-ls-slide-kind="content"${densityAttribute} aria-label="${escapeHtml(item.name)} (${snippet.label})">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">${escapeHtml(item.type)}</p>
            <h2 class="ls-title">${escapeHtml(item.name)}</h2>
          </header>
          <div class="ls-slide__body">
${snippet.html.replace(/^/gm, "            ")}
          </div>
        </div>
      </section>`;
}

function adjustSlideSnippet(snippetHtml, density) {
  const labeled = snippetHtml.replace(/^/gm, "      ");
  if (density === "default") return labeled;
  return labeled.replace(/class="ls-slide"/g, `class="ls-slide" data-ls-density="${density}"`);
}

async function galleryPage({ source, data, style, density }) {
  const links = new Set();
  const scripts = new Set();
  for (const item of data.items) {
    if (item.type === "ls:style" && item.name !== style?.name) continue;
    if (item.type === "ls:font") continue;
    for (const file of item.files || []) {
      if (file.path.endsWith(".css")) links.add(file.path);
      if (file.path.endsWith(".js")) scripts.add(file.path);
    }
  }
  if (style) {
    // Font families arrive through the style's dependency closure.
    for (const dependencyName of style.registryDependencies || []) {
      const dependency = data.byName.get(dependencyName);
      for (const file of dependency?.files || []) {
        if (file.path.endsWith(".css")) links.add(file.path);
      }
    }
  }

  const sections = [];
  for (const item of data.items) {
    for (const snippet of item.snippets || []) {
      const html = await source.readText(snippet.path);
      sections.push(
        /class="ls-slide[" ]/.test(html)
          ? adjustSlideSnippet(html, density)
          : wrapFragment(item, { ...snippet, html }, density),
      );
    }
  }

  const styleAttribute = style ? ` data-ls-style="${style.styleAttribute}"` : "";
  return `<!doctype html>
<html lang="en"${styleAttribute}>
  <head>
    <meta charset="utf-8" />
    <title>slidesls gallery — ${style ? style.styleAttribute : "default"} / ${density}</title>
    ${[...links].map((href) => `<link rel="stylesheet" href="../${href}" />`).join("\n    ")}
    ${[...scripts].map((src) => `<script defer src="../${src}"></script>`).join("\n    ")}
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="slidesls gallery">
${sections.join("\n")}
    </main>
  </body>
</html>
`;
}

const REVIEW_TEMPLATE = `# Gallery review

Sampled rubric review verdicts. One section per session; keep history.

Rubric (per image or side-by-side pair):

1. Is there a focal point?
2. Is the hierarchy unambiguous at thumbnail size?
3. Does the whitespace read as intentional?
4. Is it on-brief for the style?
5. Would you present this slide?

## <date> — <scope>

| Combo | Verdict | Notes |
| ----- | ------- | ----- |
`;

export async function galleryCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.gallery);
  if (args.help)
    return ok({
      help: `Usage: slidesls gallery [--out <dir>] [--registry-root <path>] [--registry-url <url>] [--json]

Generates .gallery/ HTML pages rendering every registry snippet under every
style and density (repo/dev review harness). Open pages with ?export=1 for
stills; scripts/visual-gate.mjs measures and screenshots them.`,
    });
  rejectRemovedRegistryOption(args);
  const data = await registryData(args);
  const source = registrySource(args);
  const outDir = path.resolve(args.out || ".gallery");
  await mkdir(outDir, { recursive: true });

  const styles = [null, ...data.items.filter((item) => item.type === "ls:style")];
  const pages = [];
  for (const style of styles) {
    for (const density of DENSITIES) {
      const name = `${style ? style.styleAttribute : "default"}--${density}.html`;
      await writeFile(path.join(outDir, name), await galleryPage({ source, data, style, density }));
      pages.push(name);
    }
  }
  const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>slidesls gallery</title></head>
<body><h1>slidesls gallery</h1><ul>
${pages.map((page) => `<li><a href="./${page}">${page}</a> (<a href="./${page}?export=1">export</a>)</li>`).join("\n")}
</ul></body></html>
`;
  await writeFile(path.join(outDir, "index.html"), index);

  const reviewFile = path.resolve(".gallery-review", "REVIEW.md");
  if (!(await exists(reviewFile))) await writeText(reviewFile, REVIEW_TEMPLATE);

  return ok({
    out: outDir,
    pages: pages.length + 1,
    styles: styles.map((style) => (style ? style.name : "default")),
    densities: DENSITIES,
    reviewFile,
  });
}
