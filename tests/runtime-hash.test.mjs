import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

async function runtimeHelpers() {
  const source = await readFile("registry/core/base/slide-runtime.js", "utf8");
  const context = {
    document: {
      readyState: "loading",
      querySelector: () => null,
      addEventListener: () => {},
    },
    window: {
      location: { search: "", hash: "", pathname: "/", href: "/" },
      addEventListener: () => {},
      history: { state: null, replaceState: () => {} },
    },
    Element: class {},
    URLSearchParams,
  };

  vm.runInNewContext(
    `${source}\nglobalThis.__helpers = { parseHashState, formatHashState, clampState };`,
    context,
  );

  return context.__helpers;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function slideWithSteps(...steps) {
  return {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-step]");
      return steps.map((step) => ({ dataset: { step: String(step) } }));
    },
  };
}

test("runtime hash helpers parse and format canonical slide state", async () => {
  const { parseHashState, formatHashState } = await runtimeHelpers();

  assert.deepEqual(plain(parseHashState("#slide=2&step=1")), { slide: 2, step: 1 });
  assert.deepEqual(plain(parseHashState("slide=3&step=0")), { slide: 3, step: 0 });
  assert.deepEqual(plain(parseHashState("")), { slide: 1, step: 0 });
  assert.deepEqual(plain(parseHashState("#slide=abc&step=NaN")), { slide: 1, step: 0 });
  assert.equal(formatHashState(1, 0), "#slide=2&step=0");
});

test("runtime hash helpers clamp slide and step state", async () => {
  const { clampState } = await runtimeHelpers();
  const slides = [slideWithSteps(1, 3), slideWithSteps(1), slideWithSteps()];

  assert.deepEqual(plain(clampState({ slide: 2, step: 99 }, slides)), { index: 1, step: 1 });
  assert.deepEqual(plain(clampState({ slide: -5, step: -2 }, slides)), { index: 0, step: 0 });
  assert.deepEqual(plain(clampState({ slide: 99, step: 5 }, slides)), { index: 2, step: 0 });
  assert.deepEqual(plain(clampState({ slide: 1.8, step: 2.4 }, slides)), { index: 0, step: 2 });
  assert.deepEqual(plain(clampState({}, [])), { index: 0, step: 0 });
});
