import { startTags, stripNonRenderedCode, stylesheetHrefs } from "../shared/html.mjs";

// v2 style activation checks. Exactly one style per deck once the v1 theme
// model is deleted (Phase 1); during the transition these fire only for decks
// that opt into styles, so v1 theme decks stay clean.
export function validateStyles({
  html,
  errors,
  warnings = [],
  manifest = null,
  registryData = null,
}) {
  const rendered = stripNonRenderedCode(html);
  const hrefs = stylesheetHrefs(rendered);
  const linked = [
    ...new Set(
      hrefs
        .map((href) => /registry\/styles\/([a-z0-9-]+)\/style\.css/.exec(href)?.[1])
        .filter(Boolean),
    ),
  ];
  const active = startTags(rendered, "html")[0]?.get("data-ls-style") ?? null;

  if (linked.length > 1)
    errors.push({
      code: "style_conflict",
      message: `Multiple style stylesheets are linked (${linked.join(", ")}); a deck uses exactly one style.`,
      hint: "Remove all but one registry/styles/<name>/style.css link.",
    });

  if (active && !linked.includes(active))
    errors.push({
      code: "style_missing",
      message: `data-ls-style="${active}" is set but registry/styles/${active}/style.css is not linked.`,
      hint: `Run slidesls add styles/${active} --dir <deck> --dry-run --json and add the returned load tags.`,
    });

  for (const name of linked) {
    if (active !== name && linked.length === 1)
      errors.push({
        code: "style_missing",
        message: `styles/${name} is linked but not activated: <html> ${active ? `has data-ls-style="${active}"` : "is missing data-ls-style"}.`,
        hint: `Set data-ls-style="${name}" on the <html> element.`,
      });
  }

  // Initialized v2 decks without any style: nudge, don't block — default
  // tokens are legitimate for QA decks, but shipping decks should pick one
  // of the art directions.
  if (!active && !linked.length && manifest?.cliVersion && !/^0\.[0-5]\./.test(manifest.cliVersion))
    warnings.push({
      code: "style_missing",
      message: "The deck uses no style: base tokens only.",
      hint: "Pick one art direction (slidesls catalog --type style --json) and add it with slidesls add styles/<name> --dir <deck>; or keep default tokens deliberately.",
    });

  // An active style must load the fonts it depends on: @font-face lives in
  // each family's font.css, so a missing link silently falls back to system
  // fonts — exactly the D3 silent-no-op class of failure.
  if (!active || !registryData) return;
  const styleItem = registryData.byName.get(`styles/${active}`);
  if (!styleItem) return;
  const missingFonts = (styleItem.registryDependencies || [])
    .filter((name) => name.startsWith("fonts/"))
    .filter(
      (name) => !hrefs.some((href) => href.includes(`registry/${name}/`) && href.endsWith(".css")),
    );
  if (missingFonts.length)
    errors.push({
      code: "style_fonts_missing",
      message: `styles/${active} needs font stylesheets that are not linked: ${missingFonts.join(", ")}`,
      hint: `Add a <link rel="stylesheet"> for each family's font.css (see slidesls add styles/${active} --dry-run --json load tags).`,
    });
}
