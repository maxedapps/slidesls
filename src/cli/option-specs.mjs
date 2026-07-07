import { REGISTRY_VALUE_OPTIONS } from "../shared/args.mjs";

// Single source of truth for each command's parseArgs spec. Commands pass these
// to parseArgs, and tests sweep help text and docs against the same sets, so
// documented flags can never drift from what the strict parser accepts.
export const commandOptionSpecs = {
  init: {
    boolean: ["force", "json", "help"],
    value: ["template", "theme", "style", "title", ...REGISTRY_VALUE_OPTIONS],
  },
  add: {
    boolean: ["include-docs", "dry-run", "force", "json", "help"],
    value: ["dir", "base-dir", ...REGISTRY_VALUE_OPTIONS],
  },
  catalog: {
    boolean: ["json", "help", "recommended", "starter", "api", "preview"],
    value: ["type", "tag", "query", "limit", "level", "intent", "style", ...REGISTRY_VALUE_OPTIONS],
  },
  inspect: {
    boolean: ["json", "help", "readme", "api", "with-dependencies", "brief", "examples"],
    value: [...REGISTRY_VALUE_OPTIONS],
  },
  icons: {
    boolean: ["json", "help"],
    value: ["dir", "add", ...REGISTRY_VALUE_OPTIONS],
  },
  gallery: {
    boolean: ["json", "help"],
    value: ["out", ...REGISTRY_VALUE_OPTIONS],
  },
  skill: {
    boolean: ["json", "help", "dry-run", "force", "all"],
    value: ["reference"],
  },
  validate: {
    boolean: ["strict", "json", "help", "use-manifest-registry", "report"],
    value: ["dir", ...REGISTRY_VALUE_OPTIONS],
  },
  preview: {
    boolean: ["json", "help"],
    value: ["dir", "host", "port"],
  },
  "visual-qa": {
    boolean: ["eval", "analyze", "json", "help"],
    value: ["input"],
  },
  doctor: {
    boolean: ["json", "help"],
    value: ["dir", ...REGISTRY_VALUE_OPTIONS],
  },
  "validate-registry": {
    boolean: ["json", "help"],
    value: [...REGISTRY_VALUE_OPTIONS],
  },
  "validate-examples": {
    boolean: ["json", "help"],
    value: ["dir"],
  },
  "generate-catalog": {
    boolean: ["json", "help", "check"],
    value: ["output", ...REGISTRY_VALUE_OPTIONS],
  },
};
