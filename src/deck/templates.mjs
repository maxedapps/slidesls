import { escapeHtml } from "../shared/html.mjs";

export function deckTemplate({
  title = "Untitled deck",
  template = "minimal",
  baseDir = "slidesls",
} = {}) {
  const safeTitle = escapeHtml(title);
  const body = template === "blank" ? blankSlides(safeTitle) : minimalSlides(safeTitle);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./${baseDir}/registry/core/base/slide.css" />
    ${template === "blank" ? "" : `<link rel="stylesheet" href="./${baseDir}/registry/layouts/title-hero/title-hero.css" />`}
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
  return `      <section class="ls-slide ls-layout-title-hero" aria-label="Opening">
        <div class="ls-slide__inner">
          <div class="ls-title-hero__content">
            <p class="ls-eyebrow">slidesls</p>
            <h1 class="ls-title">${title}</h1>
            <p class="ls-subtitle ls-reveal" data-step="1">A plain HTML/CSS/JS deck you can edit directly.</p>
          </div>
        </div>
      </section>
      <section class="ls-slide" aria-label="Next steps">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Next</p>
            <h2 class="ls-title">Add primitives as needed</h2>
          </header>
          <div class="ls-slide__body">
            <p class="ls-subtitle">Run <code>slidesls catalog</code>, <code>slidesls add</code>, then <code>slidesls validate</code>.</p>
          </div>
        </div>
      </section>`;
}
