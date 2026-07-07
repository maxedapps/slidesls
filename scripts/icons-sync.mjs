#!/usr/bin/env node

// Repo-side, dev-time sync of the curated icon subset (registry/icons/) from
// the pinned lucide-static devDependency.
//
// Each curated icon becomes an individual <symbol> file plus an entry in
// manifest.json; the Lucide ISC license ships alongside. Decks receive icons
// as an inline sprite (managed by `slidesls icons sync`), never as external
// files: <use href="file.svg#id"> is blocked over file://.
//
// To extend the curation, edit CURATED_ICONS and rerun; commit the result.

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { symbolFromLucideSvg } from "../src/icons/sprite.mjs";

export const CURATED_ICONS = [
  // navigation & direction
  "arrow-right",
  "arrow-left",
  "arrow-up-right",
  "arrow-down-right",
  "chevron-right",
  "chevron-down",
  "move-right",
  "corner-down-right",
  // status & feedback
  "check",
  "check-check",
  "x",
  "circle-check",
  "circle-x",
  "circle-alert",
  "circle-help",
  "info",
  "triangle-alert",
  "ban",
  "plus",
  "minus",
  // emphasis & energy
  "zap",
  "sparkles",
  "star",
  "flame",
  "rocket",
  "target",
  "award",
  "trophy",
  "lightbulb",
  "gem",
  "crown",
  "heart",
  // work & process
  "settings",
  "wrench",
  "sliders-horizontal",
  "workflow",
  "repeat",
  "refresh-cw",
  "timer",
  "clock",
  "calendar",
  "hourglass",
  "gauge",
  "list-checks",
  "clipboard-check",
  "milestone",
  "route",
  "flag",
  // technical
  "code",
  "terminal",
  "braces",
  "file-code",
  "git-branch",
  "git-merge",
  "git-pull-request",
  "bug",
  "cpu",
  "database",
  "server",
  "cloud",
  "globe",
  "link",
  "network",
  "layers",
  "box",
  "package",
  "puzzle",
  "blocks",
  "binary",
  "hash",
  // security
  "lock",
  "lock-open",
  "shield",
  "shield-check",
  "key",
  "eye",
  "eye-off",
  "fingerprint",
  // data & business
  "trending-up",
  "trending-down",
  "chart-column",
  "chart-line",
  "chart-pie",
  "dollar-sign",
  "percent",
  "wallet",
  "credit-card",
  "briefcase",
  "building-2",
  "handshake",
  "scale",
  // people & communication
  "users",
  "user",
  "user-check",
  "message-circle",
  "megaphone",
  "mail",
  "send",
  "bell",
  "phone",
  // content & learning
  "book-open",
  "graduation-cap",
  "pencil",
  "notebook-pen",
  "file-text",
  "folder-open",
  "search",
  "filter",
  "bookmark",
  "tag",
  "quote",
  "image",
  "camera",
  "play",
  "download",
  "upload",
  "external-link",
  "copy",
  "trash-2",
  "archive",
  "inbox",
  // world & misc
  "map-pin",
  "map",
  "compass",
  "navigation",
  "plane",
  "truck",
  "home",
  "leaf",
  "sun",
  "moon",
  "droplet",
  "wind",
  "battery-full",
  "plug",
  "wifi",
  "smartphone",
  "laptop",
  "monitor",
  "printer",
  "keyboard",
  "mic",
  "music",
  "palette",
  "brush",
  "scissors",
  "infinity",
];

const root = path.resolve(import.meta.dirname, "..");
const lucideRoot = path.join(root, "node_modules", "lucide-static");
const iconsDir = path.join(root, "registry", "icons");
const symbolsDir = path.join(iconsDir, "symbols");

const pkg = JSON.parse(await readFile(path.join(lucideRoot, "package.json"), "utf8"));
const missing = [];
await rm(symbolsDir, { recursive: true, force: true });
await mkdir(symbolsDir, { recursive: true });

const synced = [];
for (const name of [...CURATED_ICONS].sort()) {
  let svg;
  try {
    svg = await readFile(path.join(lucideRoot, "icons", `${name}.svg`), "utf8");
  } catch {
    missing.push(name);
    continue;
  }
  await writeFile(path.join(symbolsDir, `${name}.svg`), `${symbolFromLucideSvg(name, svg)}\n`);
  synced.push(name);
}

if (missing.length) {
  console.error(`icons-sync: not found in lucide-static ${pkg.version}: ${missing.join(", ")}`);
  process.exit(1);
}

await writeFile(
  path.join(iconsDir, "manifest.json"),
  `${JSON.stringify({ source: "lucide-static", version: pkg.version, prefix: "ls-i-", icons: synced }, null, 2)}\n`,
);
await writeFile(
  path.join(iconsDir, "LICENSE"),
  await readFile(path.join(lucideRoot, "LICENSE"), "utf8"),
);

const leftover = (await readdir(symbolsDir)).filter(
  (file) => !synced.includes(file.replace(/\.svg$/, "")),
);
if (leftover.length) {
  console.error(`icons-sync: unexpected leftover symbols: ${leftover.join(", ")}`);
  process.exit(1);
}

console.log(`icons-sync: ${synced.length} icons from lucide-static ${pkg.version}.`);
