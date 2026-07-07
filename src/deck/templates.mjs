import { escapeHtml } from "../shared/html.mjs";

export function deckTemplate({
  title = "Untitled deck",
  template = "minimal",
  baseDir = "slidesls",
  styleAttribute = null,
  styleLinks = [],
} = {}) {
  const safeTitle = escapeHtml(title);
  const safeStyle = styleAttribute ? escapeHtml(styleAttribute) : null;
  // Style + font links arrive resolved from the style item's dependency
  // closure; they load after core so style tokens win in the tokens layer.
  const styleLinkTags = styleLinks.length
    ? `${styleLinks.map((href) => `    <link rel="stylesheet" href="${href}" />`).join("\n")}\n`
    : "";
  const body = template === "blank" ? blankSlides(safeTitle) : minimalSlides(safeTitle);
  const componentLinks =
    template === "blank"
      ? ""
      : `    <link rel="stylesheet" href="./${baseDir}/registry/layouts/core/layout.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/layouts/core/utilities.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/badge/badge.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/figure/figure.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/statement/statement.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/list/list.css" />`;
  return `<!doctype html>
<html lang="en"${safeStyle ? ` data-ls-style="${safeStyle}"` : ""}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/slide.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/icons.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/motion.css" />
${styleLinkTags}${componentLinks}
    <script defer src="./${baseDir}/registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <svg class="ls-sprite" aria-hidden="true"></svg>
    <main class="ls-deck" data-ls-deck aria-label="${safeTitle}">
${body}
    </main>
  </body>
</html>
`;
}

function blankSlides(title) {
  return `      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Opening">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <h1 class="ls-title">${title}</h1>
            <p class="ls-subtitle">Start editing this plain HTML deck.</p>
          </header>
        </div>
      </section>`;
}

function minimalSlides(title) {
  // Typographic hero (transitions and auto-stagger carry the visual
  // interest) plus one content slide whose copy is real guidance.
  return `      <section class="ls-slide" data-ls-slide-kind="hero" aria-label="Opening">
        <div class="ls-slide__inner">
          <div class="ls-stack ls-center-start ls-text-start ls-slide-fill">
            <div class="ls-cluster">
              <span class="ls-badge">slidesls</span>
              <span class="ls-badge">Plain HTML</span>
            </div>
            <h1 class="ls-title">${title}</h1>
            <p class="ls-subtitle">A plain HTML/CSS/JS deck you can edit directly. Navigate with ArrowRight.</p>
          </div>
        </div>
      </section>
      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Next steps">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Next</p>
            <h2 class="ls-title">Build slides from the v2 vocabulary</h2>
          </header>
          <div class="ls-slide__body">
            <ul class="ls-list ls-list--numbered">
              <li>
                <strong class="ls-list__title">Discover</strong>
                <span class="ls-list__text">Run <code>slidesls catalog --json</code>, then <code>inspect &lt;item&gt;</code> for exact markup.</span>
              </li>
              <li>
                <strong class="ls-list__title">Compose</strong>
                <span class="ls-list__text">Lay out slide bodies with <code>ls-layout--*</code> regions and fill them with components.</span>
              </li>
              <li>
                <strong class="ls-list__title">Validate</strong>
                <span class="ls-list__text">Run <code>slidesls validate</code> after every edit, then review the live preview.</span>
              </li>
            </ul>
          </div>
          <footer class="ls-slide__footer">
            <span>${title}</span>
            <span data-ls-page-number></span>
          </footer>
        </div>
      </section>`;
}
