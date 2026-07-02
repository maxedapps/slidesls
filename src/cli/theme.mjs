import { usageError } from "../shared/args.mjs";

export function normalizedType(type) {
  return String(type).split(":").at(-1);
}

export function normalizeThemeName(name) {
  const value = String(name).trim();
  return value.startsWith("presets/themes/") ? value : `presets/themes/${value}`;
}

export function themePreset(registryData, name) {
  const item = registryData.byName.get(name);
  if (!item || item.type !== "ls:preset" || !item.name.startsWith("presets/themes/"))
    throw usageError(
      `Unknown theme preset: ${name}`,
      "Use slidesls catalog --type preset --tag theme to list themes.",
    );
  return item;
}

export function themeApplication(items) {
  const themes = items.filter((item) => item.name.startsWith("presets/themes/"));
  if (!themes.length) return null;
  const theme = themes.at(-1);
  return {
    themeAttribute: theme.themeAttribute || theme.name.split("/").at(-1),
    item: theme.name,
    element: "html",
  };
}
