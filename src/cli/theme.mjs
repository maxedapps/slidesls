import { usageError } from "../shared/args.mjs";

export function normalizedType(type) {
  return String(type).split(":").at(-1);
}

export function normalizeStyleName(name) {
  const value = String(name).trim();
  return value.startsWith("styles/") ? value : `styles/${value}`;
}

export function stylePreset(registryData, name) {
  const item = registryData.byName.get(name);
  if (!item || item.type !== "ls:style")
    throw usageError(
      `Unknown style: ${name}`,
      "Use slidesls catalog --type style --json to list styles.",
    );
  return item;
}

// The last style in dependency order wins, mirroring CSS load order.
export function styleApplication(items) {
  const styles = items.filter((item) => item.type === "ls:style");
  if (!styles.length) return null;
  const style = styles.at(-1);
  return {
    styleAttribute: style.styleAttribute || style.name.split("/").at(-1),
    item: style.name,
    element: "html",
  };
}

// The v1 theme model was replaced by styles in 0.7.0.
export function rejectRemovedThemeOption(args) {
  if (args.theme === undefined) return;
  throw usageError(
    "--theme was removed: themes were replaced by v2 styles",
    "Use --style <name> (slidesls catalog --type style --json lists the art directions).",
  );
}
