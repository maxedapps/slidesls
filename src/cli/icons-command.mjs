import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs, usageError } from "../shared/args.mjs";
import { commandOptionSpecs } from "./option-specs.mjs";
import { ok } from "../shared/result.mjs";
import { exists } from "../shared/fs.mjs";
import { DEFAULT_CONFIG, readConfig } from "../deck/config.mjs";
import {
  renderSprite,
  spriteIconNames,
  symbolFromLucideSvg,
  usedIconNames,
  withSprite,
} from "../icons/sprite.mjs";
import { registrySource, rejectRemovedRegistryOption } from "./registry-options.mjs";

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function iconsManifest(source) {
  return source.readJson("registry/icons/manifest.json");
}

// Curated local set first; the pinned lucide-static version on a public npm
// CDN as the online long tail. Offline without a local match fails loudly.
async function resolveSymbol({ source, manifest, name }) {
  try {
    const symbol = (await source.readText(`registry/icons/symbols/${name}.svg`)).trim();
    return { symbol, from: "curated" };
  } catch {
    // Not curated; try the network fallback below.
  }
  const urls = [
    `https://unpkg.com/lucide-static@${manifest.version}/icons/${name}.svg`,
    `https://cdn.jsdelivr.net/npm/lucide-static@${manifest.version}/icons/${name}.svg`,
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.status === 404) {
        const error = new Error(
          `Icon does not exist in lucide-static ${manifest.version}: ${name}`,
        );
        error.code = "unknown_icon_name";
        throw error;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      return { symbol: symbolFromLucideSvg(name, await response.text()), from: "network" };
    } catch (error) {
      if (error.code === "unknown_icon_name") throw error;
      lastError = error;
    }
  }
  const error = new Error(
    `Icon "${name}" is not in the curated set and could not be fetched (offline?): ${lastError?.message}`,
  );
  error.code = "icon_unavailable";
  error.hint = "Use a curated icon (slidesls icons list) or retry with network access.";
  throw error;
}

export async function iconsCommand(argv) {
  const args = parseArgs(argv, commandOptionSpecs.icons);
  const action = args._[0];
  if (args.help || !action)
    return ok({
      help: `Usage: slidesls icons <sync|list> [--dir <deck>] [--add <name,name>] [--registry-root <path>] [--registry-url <url>] [--json]

sync   Rewrite the deck's inline icon sprite to exactly the icons the entry
       HTML references via <use href="#ls-i-<name>"> (plus any --add names).
list   Show the curated icon set.

For AI agents:
  Use icons only via the sprite: <svg class="ls-icon"><use href="#ls-i-zap"/></svg>.
  After adding or removing icon references, run: slidesls icons sync --dir <deck> --json
  --add resolves curated icons locally and falls back to the pinned lucide-static
  version on npm CDNs when online.`,
    });
  rejectRemovedRegistryOption(args);
  const source = registrySource(args);
  const manifest = await iconsManifest(source);

  if (action === "list")
    return ok({
      source: manifest.source,
      version: manifest.version,
      prefix: manifest.prefix,
      count: manifest.icons.length,
      icons: manifest.icons,
      usage: '<svg class="ls-icon"><use href="#ls-i-<name>"/></svg>',
    });

  if (action !== "sync")
    throw usageError(`Unknown icons action: ${action}`, "Use slidesls icons sync or icons list.");

  const projectStart = path.resolve(args.dir || ".");
  const { config: foundConfig, root } = await readConfig(projectStart, Boolean(args.dir));
  const config = foundConfig || DEFAULT_CONFIG;
  const entryPath = path.join(root, config.paths.entry);
  if (!(await exists(entryPath)))
    throw usageError(`Entry HTML not found: ${entryPath}`, "Pass --dir <deck> for the deck root.");

  const added = (args.add || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const name of added) {
    if (!NAME_PATTERN.test(name))
      throw usageError(`Invalid icon name: ${name}`, "Icon names are lowercase-kebab-case.");
  }

  const html = await readFile(entryPath, "utf8");
  const names = [...new Set([...usedIconNames(html), ...added])].sort();
  const symbols = [];
  const resolved = [];
  for (const name of names) {
    const { symbol, from } = await resolveSymbol({ source, manifest, name });
    symbols.push(symbol);
    resolved.push({ name, from });
  }

  const before = spriteIconNames(html);
  const nextHtml = withSprite(html, renderSprite(symbols));
  if (nextHtml === null)
    throw usageError(
      "Entry HTML has no <body> to anchor the icon sprite.",
      "Ensure the deck entry is a full HTML document.",
    );
  const changed = nextHtml !== html;
  if (changed) await writeFile(entryPath, nextHtml);

  // ISC notice retention: decks are standalone artifacts, so the full Lucide
  // license text must ship with any deck that carries copied symbols.
  let licensePath = null;
  if (names.length) {
    const baseDir = foundConfig?.paths?.items || DEFAULT_CONFIG.paths.items;
    licensePath = path.join(baseDir, "registry", "icons", "LICENSE");
    const target = path.join(root, licensePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await source.readText("registry/icons/LICENSE"));
  }

  return ok({
    root,
    entry: config.paths.entry,
    changed,
    icons: names,
    added,
    removed: before.filter((name) => !names.includes(name)),
    resolved,
    licensePath,
    agentInstructions: {
      purpose: "Keep the inline icon sprite in sync with icon references.",
      rules: [
        'Icons render via <svg class="ls-icon"><use href="#ls-i-<name>"/></svg> against the inline sprite.',
        "Rerun slidesls icons sync --dir <deck> --json after adding or removing icon references.",
        "Do not mix sprite icons with emoji or ad-hoc glyphs in icon slots.",
      ],
    },
  });
}
