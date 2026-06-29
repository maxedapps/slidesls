export function parseArgs(argv, spec = {}) {
  const result = { _: [] };
  const repeatable = new Set(spec.repeatable || []);
  const boolean = new Set(spec.boolean || []);
  const aliases = spec.aliases || {};

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
    const inlineValue = equalsIndex === -1 ? undefined : arg.slice(equalsIndex + 1);
    const value = boolean.has(key)
      ? inlineValue === undefined
        ? true
        : inlineValue !== "false"
      : (inlineValue ?? argv[++index]);

    if (value === undefined) throw usageError(`Missing value for --${rawKey}`);

    if (repeatable.has(key)) result[key] = [...(result[key] || []), value];
    else result[key] = value;
  }

  return result;
}

export function usageError(message, hint) {
  const error = new Error(message);
  error.code = "usage_error";
  error.exitCode = 2;
  if (hint) error.hint = hint;
  return error;
}
