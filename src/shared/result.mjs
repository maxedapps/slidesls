import pkg from "../../package.json" with { type: "json" };

export const VERSION = pkg.version || "0.0.0";

export function ok(data = {}, warnings = []) {
  return { ok: true, data, warnings, _meta: { version: VERSION } };
}

export function fail(error) {
  return {
    ok: false,
    error: {
      code: error.code || "command_failed",
      message: error.message || String(error),
      ...(error.hint ? { hint: error.hint } : {}),
    },
    _meta: { version: VERSION },
  };
}

export function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printResult(result, json, text) {
  if (json) printJson(result);
  else if (text) process.stdout.write(text);
}
