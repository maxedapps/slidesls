#!/usr/bin/env node
import { validateRegistry } from "../src/validation/registry.mjs";

try {
  const result = await validateRegistry({ registryRoot: process.cwd() });
  if (!result.valid) {
    console.error(`validate-registry: ${result.errors.map((error) => error.message).join("\n")}`);
    process.exit(1);
  }
  console.log(`Validated ${result.itemCount} registry items.`);
} catch (error) {
  console.error(`validate-registry: ${error.message}`);
  process.exit(1);
}
