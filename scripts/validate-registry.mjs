import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const registryPath = "registry.json";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${path}: ${error.message}`);
  }
}

const registry = await readJson(registryPath);
assert(Array.isArray(registry.items), `${registryPath} must contain an items array.`);

const items = [];
const itemNames = new Set();

for (const itemPath of registry.items) {
  assert(typeof itemPath === "string", `${registryPath} items must be path strings.`);
  assert(existsSync(itemPath), `Missing item metadata: ${itemPath}`);

  const item = await readJson(itemPath);
  assert(typeof item.name === "string" && item.name.length > 0, `${itemPath} must have a name.`);
  assert(!itemNames.has(item.name), `Duplicate registry item name: ${item.name}`);

  itemNames.add(item.name);
  items.push({ itemPath, item });
}

for (const { itemPath, item } of items) {
  assert(Array.isArray(item.files), `${itemPath} must contain a files array.`);
  assert(
    Array.isArray(item.registryDependencies),
    `${itemPath} must contain a registryDependencies array.`,
  );

  for (const file of item.files) {
    assert(file && typeof file.path === "string", `${itemPath} has a file without a path.`);
    assert(existsSync(file.path), `Missing registry file listed by ${itemPath}: ${file.path}`);
  }

  for (const dependencyName of item.registryDependencies) {
    assert(
      itemNames.has(dependencyName),
      `${itemPath} depends on unknown registry item: ${dependencyName}`,
    );
  }

  if (item.docs) {
    assert(typeof item.docs === "string", `${itemPath} docs must be a string when present.`);
    assert(existsSync(item.docs), `Missing docs listed by ${itemPath}: ${item.docs}`);
  }
}

console.log(`Validated ${items.length} registry items.`);
