import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { assertInside, assertSafeRelativePath } from "../src/shared/fs.mjs";

test("assertSafeRelativePath rejects unsafe paths", () => {
  assert.throws(() => assertSafeRelativePath(""), /Unsafe/);
  assert.throws(() => assertSafeRelativePath(path.resolve("outside")), /Unsafe/);
  assert.throws(() => assertSafeRelativePath("../outside"), /Unsafe/);
  assert.throws(() => assertSafeRelativePath("safe/../../outside"), /Unsafe/);
});

test("assertSafeRelativePath normalizes safe paths", () => {
  assert.equal(assertSafeRelativePath("slidesls\\core/base.css"), "slidesls/core/base.css");
});

test("assertInside accepts inside paths and rejects outside paths", () => {
  const root = path.resolve("/tmp/root");
  assert.doesNotThrow(() => assertInside(root, path.join(root, "nested/file.txt")));
  assert.throws(() => assertInside(root, path.resolve("/tmp/other/file.txt")), /outside root/);
});
