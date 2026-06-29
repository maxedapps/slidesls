#!/usr/bin/env node
import { validateExamples } from "../src/validation/examples.mjs";

try {
  const result = await validateExamples({ root: process.cwd() });
  if (!result.valid) {
    console.error(`validate-examples: ${result.errors.map((error) => error.message).join("\n")}`);
    process.exit(1);
  }
  console.log(`Validated local asset links for ${result.checkedExamples} example HTML file(s).`);
  console.log("Validated minimal deck layout hooks.");
} catch (error) {
  console.error(`validate-examples: ${error.message}`);
  process.exit(1);
}
