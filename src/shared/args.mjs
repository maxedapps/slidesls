export const REGISTRY_VALUE_OPTIONS = ["registry-root", "registry-url", "registry"];

export function parseArgs(argv, spec = {}) {
  const result = { _: [] };
  const repeatable = new Set(spec.repeatable || []);
  const boolean = new Set(spec.boolean || []);
  const valueOptions = spec.value ? new Set(spec.value) : null;
  const aliases = spec.aliases || {};
  const known = new Set([...boolean, ...(valueOptions || []), ...Object.keys(aliases)]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      result._.push(...argv.slice(index + 1));
      break;
    }
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }

    const equalsIndex = arg.indexOf("=");
    const rawKey = equalsIndex === -1 ? arg.slice(2) : arg.slice(2, equalsIndex);
    const key = aliases[rawKey] || rawKey;
    if (valueOptions && !boolean.has(key) && !valueOptions.has(key)) {
      const suggestion = nearestOption(rawKey, [...known]);
      throw usageError(
        `Unknown option --${rawKey}`,
        suggestion ? `Did you mean --${suggestion}?` : undefined,
      );
    }

    const inlineValue = equalsIndex === -1 ? undefined : arg.slice(equalsIndex + 1);
    let value;
    if (boolean.has(key)) value = inlineValue === undefined ? true : inlineValue !== "false";
    else {
      value = inlineValue ?? argv[++index];
      if (value === undefined) throw usageError(`Missing value for --${rawKey}`);
      if (String(value).startsWith("--"))
        throw usageError(`Missing value for --${rawKey}`, `Provide a value after --${rawKey}.`);
    }

    if (repeatable.has(key)) result[key] = [...(result[key] || []), value];
    else result[key] = value;
  }

  return result;
}

function nearestOption(rawKey, options) {
  let best = null;
  for (const option of options) {
    const distance = levenshtein(rawKey, option);
    if (distance <= 2 && (!best || distance < best.distance)) best = { option, distance };
  }
  return best?.option;
}

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

export function usageError(message, hint) {
  const error = new Error(message);
  error.code = "usage_error";
  error.exitCode = 2;
  if (hint) error.hint = hint;
  return error;
}
