import { escapeHtml } from "../shared/html.mjs";

export function deckTemplate({
  title = "Untitled deck",
  template = "minimal",
  baseDir = "slidesls",
} = {}) {
  const safeTitle = escapeHtml(title);
  const body = template === "blank" ? blankSlides(safeTitle) : minimalSlides(safeTitle);
  const utilityLink =
    template === "blank"
      ? ""
      : `    <link rel="stylesheet" href="./${baseDir}/registry/utilities/layout/layout.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/badge/badge.css" />\n    <link rel="stylesheet" href="./${baseDir}/registry/components/panel/panel.css" />`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/slide.css" />
${utilityLink}
    <script type="module" src="./${baseDir}/registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <main class="ls-deck" data-ls-deck aria-label="${safeTitle}">
${body}
    </main>
  </body>
</html>
`;
}

function blankSlides(title) {
  return `      <section class="ls-slide" aria-label="Opening">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <h1 class="ls-title">${title}</h1>
            <p class="ls-subtitle">Start editing this plain HTML deck.</p>
          </header>
        </div>
      </section>`;
}

function minimalSlides(title) {
  return `      <section class="ls-slide" aria-label="Opening">
        <div class="ls-slide__inner">
          <div class="ls-grid ls-grid--wide-left ls-fill">
            <header class="ls-stack ls-center" style="text-align: left; place-items: center start;">
              <div class="ls-cluster">
                <span class="ls-badge">slidesls</span>
                <span class="ls-badge">Plain HTML</span>
              </div>
              <h1 class="ls-title">${title}</h1>
              <p class="ls-subtitle ls-reveal" data-step="1">A plain HTML/CSS/JS deck you can edit directly.</p>
            </header>
            <div class="ls-panel ls-panel--accent ls-center">
              <p class="ls-eyebrow">Agent-safe primitives</p>
              <p class="ls-panel__text">Compose slides with utilities, standalone components, and inspectable templates.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="ls-slide" aria-label="Next steps">
        <div class="ls-slide__inner">
          <header class="ls-stack ls-stack--sm">
            <p class="ls-eyebrow">Next</p>
            <h2 class="ls-title">Start from recommended templates</h2>
          </header>
          <div class="ls-grid ls-grid--2">
            <div class="ls-panel">
              <h3 class="ls-panel__title">Discover</h3>
              <p class="ls-panel__text">Run <code>slidesls catalog --recommended</code> and inspect templates for snippet HTML.</p>
            </div>
            <div class="ls-panel ls-panel--muted">
              <h3 class="ls-panel__title">Validate</h3>
              <p class="ls-panel__text">Run <code>slidesls validate</code> before visual review.</p>
            </div>
          </div>
        </div>
      </section>`;
}
