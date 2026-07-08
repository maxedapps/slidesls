# slidesls Agent Catalog

Generated from `registry.json` and per-item metadata. Do not edit manually; run `slidesls generate-catalog`.

Deep reference for per-item lookup only; it is large, so do not read it end-to-end. For normal authoring use `slidesls catalog --json` (brief) and `slidesls inspect <item> --json` (snippet) first, and open this file only to look up one item.

## Archetypes

### archetypes/title-hero

- Label: Title hero
- Type: ls:archetype
- Description: The deck opener: badges, a display-size claim, a support line, and an optional figure slot. Ships a no-figure statement variant per the image-sourcing ladder.
- Agent level: starter
- Agent recommended: yes
- Intent: open
- Safe anywhere: no
- Content contract:
  - `title`: count 1–1, words 0–10, One claim, not a label — say what the deck proves.
  - `subtitle`: count 0–1, words 0–20
  - `badges`: count 0–3, words 0–3
  - `figure`: count 0–1, Follow the image ladder: real asset → authored diagram → figure --abstract → the statement variant.
- Motion default: stagger
- Motion notes: The default entrance stagger carries the opener; do not add steps to a title slide.
- Icon guidance: At most one sprite icon inside a badge; never an icon row.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - opening a deck
    - restarting attention after a long section
  - Avoid when:
    - you have no real asset and no authored diagram and the abstract art fights the style — use the statement variant
    - mid-deck content slides — use archetypes/statement, archetypes/section, or a content archetype instead
  - Alternatives:
    - a plain divider between chapters is enough: `archetypes/section`
    - the opener is a bare claim with no meta: `archetypes/statement`
- Attributes: `data-ls-archetype="title-hero"`
- Usage: Title is a claim ("Latency fell while traffic doubled"), never a label ("Q3 update"). Use the statement variant when no honest figure exists; never fill the figure slot with text-in-a-panel. Use ls-hero-media + ls-hero-copy for the figure variant; do not place grouped hero copy directly in aligned subgrid regions.
- Registry dependencies: core/base, layouts/core, components/badge, components/figure
- Files: none
- Snippets: With figure (registry/archetypes/title-hero/snippets/basic.html), Statement (no figure) (registry/archetypes/title-hero/snippets/statement.html)
- Docs: registry/archetypes/title-hero/README.md

### archetypes/statement

- Label: Statement
- Type: ls:archetype
- Description: One claim at display size with an optional support line. The pause button of a deck: no figure, no list, just the sentence that matters.
- Agent level: starter
- Agent recommended: yes
- Intent: emphasize
- Safe anywhere: no
- Content contract:
  - `claim`: count 1–1, words 0–14, One sentence that could carry the slide alone; cut until it does.
  - `support`: count 0–1, words 0–16
- Motion default: stagger
- Motion notes: Claim and support enter with the core stagger; a statement never needs data-step.
- Icon guidance: No icons — the sentence is the visual.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - one sentence deserves the whole slide
    - resetting attention between dense data slides
  - Avoid when:
    - the claim needs badges or a figure — that is an opener, use archetypes/title-hero
    - the sentence is really a number — use archetypes/big-stat and let the value speak
  - Alternatives:
    - the claim opens the deck: `archetypes/title-hero`
    - the claim is a metric: `archetypes/big-stat`
- Attributes: `data-ls-archetype="statement"`
- Usage: Write the claim as a verdict ("Ship the smallest change that proves the idea"), never a heading. Use <em> for the two or three words doing the work; italicizing everything emphasizes nothing. If you are tempted to add a third line, the content wants a different archetype.
- Registry dependencies: core/base, layouts/core, components/statement
- Files: none
- Snippets: Basic (registry/archetypes/statement/snippets/basic.html)
- Docs: registry/archetypes/statement/README.md

### archetypes/process-flow

- Label: Process flow
- Type: ls:archetype
- Description: A 3–5 step pipeline as a horizontal band: numbered markers, terse step titles, one sentence per step, revealed in order.
- Agent level: recommended
- Agent recommended: yes
- Intent: explain-process
- Safe anywhere: no
- Content contract:
  - `steps`: count 3–5, 3–5 stages; two is a comparison, six is two slides.
  - `stepTitle`: words 0–4
  - `stepBody`: words 6–16
- Motion default: steps
- Motion notes: Each ls-flow\_\_step carries ls-reveal with data-step 1..N so the pipeline builds in order; the sequence is the argument.
- Icon guidance: The numbered markers are the iconography; do not add sprite icons to steps.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - the order of stages carries the meaning
    - each stage can be said in one sentence
  - Avoid when:
    - stages need evidence, code, or sub-bullets — give each stage its own slide
    - the steps are dated milestones rather than a pipeline — use components/list with ls-list--timeline
  - Alternatives:
    - only two stages, framed as a contrast: `archetypes/comparison`
    - milestones on a time axis: `components/list`
- Attributes: `data-ls-archetype="process-flow"`
- Usage: Step titles are verbs ("Build", "Canary", "Promote"), not noun phrases. Keep step bodies parallel in length and grammar; one long step makes the band ragged. Give the ls-flow a role="img" aria-label summarizing the whole pipeline.
- Registry dependencies: core/base, layouts/core, components/flow
- Files: none
- Snippets: Basic (registry/archetypes/process-flow/snippets/basic.html)
- Docs: registry/archetypes/process-flow/README.md

### archetypes/comparison

- Label: Comparison
- Type: ls:archetype
- Description: Exactly two columns with aligned rows — options, before/after, us/them — and an optional one-line verdict. Alignment by construction keeps the fight fair.
- Agent level: recommended
- Agent recommended: yes
- Intent: compare
- Safe anywhere: no
- Content contract:
  - `columns`: count 2–2, Exactly two ls-layout\_\_region columns; a third option is a table, not a comparison.
  - `columnHeading`: count 2–2, words 0–4
  - `verdict`: count 0–1, Optional one-line verdict after the columns; if the deck makes a call, say it.
- Motion default: stagger
- Motion notes: Columns enter with the core stagger. When you add a verdict line, give it ls-reveal with data-step="1" so the call lands after both sides are seen.
- Icon guidance: At most one sprite icon per column heading, and only if both columns get one.
- Composition:
  - Layout behavior: fills-area
  - Copy: 2-4 rows per column, aligned across both; unequal rows read as a rigged fight. Rows may be list items, stats, or layout text - keep the same construct on both sides.
  - Use when:
    - a decision between exactly two options with real trade-offs
    - before/after evidence where the same measure appears on both sides
  - Avoid when:
    - three or more options — use components/table so rows stay comparable
    - one side is a strawman; an honest comparison gives both columns their best case
  - Alternatives:
    - the contrast is one number moving: `archetypes/big-stat`
    - more than two options or many criteria: `components/table`
- Attributes: `data-ls-archetype="comparison"`
- Usage: Keep rows parallel: row N answers the same question in both columns. Use ls-layout\_\_note for a per-column bottom line ("Lower risk · slower"); the subgrid keeps the notes level. For before/after, repeat the same stat label on both sides and let the values differ.
- Registry dependencies: components/list, components/stat, components/surface, core/base, layouts/core
- Files: none
- Snippets: Two options (registry/archetypes/comparison/snippets/basic.html), Before / after (registry/archetypes/comparison/snippets/before-after.html), With verdict band (registry/archetypes/comparison/snippets/with-verdict.html)
- Docs: registry/archetypes/comparison/README.md

### archetypes/section

- Label: Section
- Type: ls:archetype
- Description: A chapter divider: an oversized chapter number, a short title, and an optional progress hint. Deliberately sparse — the breath between chapters.
- Agent level: starter
- Agent recommended: yes
- Intent: open
- Safe anywhere: no
- Content contract:
  - `number`: count 1–1, The chapter number as digits ("02") — the deck's structure, made visible.
  - `title`: count 1–1, words 0–6
  - `progressHint`: count 0–1, words 0–6, Optional orientation line ("Part two of four").
- Motion default: transition
- Motion notes: The slide transition is the moment; keep the divider free of data-step reveals and stagger-heavy content.
- Icon guidance: None. A divider is a number and a title.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - a long deck changes subject and the audience should feel it
    - numbering the argument so people know where they are
  - Avoid when:
    - the deck has fewer than eight slides — dividers outnumber the content
    - the divider carries a claim worth reading on its own — use archetypes/statement
  - Alternatives:
    - the break should land a claim, not a number: `archetypes/statement`
    - opening the whole deck: `archetypes/title-hero`
- Attributes: `data-ls-archetype="section"`
- Usage: Titles are topic labels here ("The rebuild") — the one archetype where a label beats a claim. Keep the numbering honest: if slides move, renumber; a wrong "03" is worse than none. Resist filling the space; the emptiness is what makes the chapter break register.
- Registry dependencies: core/base, layouts/core, components/stat, components/statement
- Files: none
- Snippets: Basic (registry/archetypes/section/snippets/basic.html)
- Docs: registry/archetypes/section/README.md

### archetypes/big-stat

- Label: Big stat
- Type: ls:archetype
- Description: One to three numbers at display size with quiet labels and one grounding context line. Scale contrast does the work; no boxes, no chart junk.
- Agent level: starter
- Agent recommended: yes
- Intent: show-data, prove
- Safe anywhere: no
- Content contract:
  - `stats`: count 1–3, 1–3 numbers; four numbers is a dashboard, not a headline.
  - `statValue`: max 6 chars, Short display strings only — "3.4×", "99.99%", "12ms".
  - `statLabel`: words 0–8
  - `context`: count 0–1, words 0–16, One grounding line: where the numbers come from and why they can be trusted.
- Motion default: stagger
- Motion notes: The entrance stagger lands the numbers one after another; do not add data-step to stats.
- Icon guidance: No icons next to numbers; the value is the graphic.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - one to three numbers carry the argument on their own
    - the audience should remember a value, not a shape
  - Avoid when:
    - four or more metrics — use archetypes/dashboard before the values shrink
    - the numbers need a trend or distribution to be honest — use components/chart
  - Alternatives:
    - the numbers need customer words behind them: `archetypes/evidence`
    - an operational spread of metrics: `archetypes/dashboard`
- Attributes: `data-ls-archetype="big-stat"`
- Usage: Wrap units in <em> ("12<em>ms</em>") so the number stays the loudest thing on the slide. Use ls-stat\_\_delta only when the direction of change is the story. The context line earns trust — say where the numbers come from, not another adjective.
- Registry dependencies: core/base, layouts/core, components/stat
- Files: none
- Snippets: Basic (registry/archetypes/big-stat/snippets/basic.html)
- Docs: registry/archetypes/big-stat/README.md

### archetypes/evidence

- Label: Evidence
- Type: ls:archetype
- Description: A pull-quote with a named source, corroborated by exactly one piece of proof — a stat, chart, or figure that lands on the first advance.
- Agent level: recommended
- Agent recommended: yes
- Intent: prove
- Safe anywhere: no
- Content contract:
  - `quote`: count 1–1, words 0–30
  - `attribution`: count 1–1, A real name and role; anonymous praise proves nothing.
  - `proof`: count 1–1, Exactly one stat, chart, or figure inside ls-quote\_\_evidence that corroborates the words.
- Motion default: steps
- Motion notes: The quote enters with the slide; the proof (ls-quote\_\_evidence) carries ls-reveal with data-step="1" so the number lands after the words.
- Icon guidance: No icons; the attribution and the proof carry the credibility.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - a claim needs a human voice and a number together
    - closing an argument with corroborated testimony
  - Avoid when:
    - no proof exists for the quote — use components/quote alone rather than inventing a stat
    - the numbers are the story and the voice is decoration — use archetypes/big-stat
  - Alternatives:
    - the quote stands alone without proof: `components/quote`
    - numbers only, no voice: `archetypes/big-stat`
- Attributes: `data-ls-archetype="evidence"`
- Usage: Trim the quote to the sentence with the verdict in it; 30 words is a ceiling, not a target. The proof must measure what the quote claims — a mismatched stat reads as spin. Attribute to a person with a role, not a logo.
- Registry dependencies: core/base, layouts/core, components/quote, components/stat
- Files: none
- Snippets: Basic (registry/archetypes/evidence/snippets/basic.html)
- Docs: registry/archetypes/evidence/README.md

### archetypes/walkthrough

- Label: Walkthrough
- Type: ls:archetype
- Description: One code excerpt beside 2–4 numbered annotations that reveal step by step, each pointing at a highlighted line. Teaching code, not displaying it.
- Agent level: recommended
- Agent recommended: yes
- Intent: show-code, teach
- Safe anywhere: no
- Content contract:
  - `code`: count 1–1, One excerpt, trimmed to the lines the annotations discuss — never a full file.
  - `annotations`: count 2–4, words 0–14
- Motion default: steps
- Motion notes: Each annotation carries ls-reveal with data-step 1..N and pairs with a data-ls-line="highlight" line in the excerpt, so the eye and the narration move together.
- Icon guidance: None — line highlights, not icons, point at the code.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - the audience must understand how the code works, not just that it exists
    - two to four lines of an excerpt deserve individual narration
  - Avoid when:
    - the code needs no narration — use components/code and let the excerpt speak
    - the excerpt would exceed roughly fifteen lines; trim it or split the slide
  - Alternatives:
    - the code is context, not the subject: `components/code`
    - explaining the process around the code: `archetypes/process-flow`
- Attributes: `data-ls-archetype="walkthrough"`
- Usage: Annotations run top-to-bottom in the same order as their highlighted lines. Highlight only the lines the annotations name; highlighting half the excerpt highlights nothing. Keep the excerpt runnable-looking and honest — elide with real code, not pseudo-code.
- Registry dependencies: core/base, layouts/core, components/code, components/list
- Files: none
- Snippets: Basic (registry/archetypes/walkthrough/snippets/basic.html)
- Docs: registry/archetypes/walkthrough/README.md

### archetypes/dashboard

- Label: Dashboard
- Type: ls:archetype
- Description: An operational read-out: 3–5 tiles mixing surfaces, bare stats, and a chart in the filling dashboard grid. Density with a headline, not a wall of equal boxes.
- Agent level: recommended
- Agent recommended: yes
- Intent: show-data
- Safe anywhere: no
- Content contract:
  - `tiles`: count 3–5, Surface, stat, and chart tiles; nesting a stat inside a surface counts both, so keep tiles flat.
  - `tileTitle`: words 0–8
- Motion default: stagger
- Motion notes: Tiles enter with the core stagger; a dashboard never needs data-step.
- Icon guidance: At most one sprite icon per surface kicker; never icons on bare stats.
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - several metrics form one operational picture
    - the audience needs the state of the system at a glance
  - Avoid when:
    - one number carries the story — use archetypes/big-stat and let it breathe
    - every tile would be the same boxed surface; vary boxed and unboxed tiles or use components/table
  - Alternatives:
    - one to three headline numbers: `archetypes/big-stat`
    - many like values that should scan as rows: `components/table`
- Attributes: `data-ls-archetype="dashboard"`
- Usage: Mix tile weights: boxed surfaces for narrated metrics, bare stats for numbers that speak alone. Reserve ls-surface--accent or ls-surface--warning for the one tile that is the headline. The slide title makes the call ("holding", "degrading"); the tiles are the evidence.
- Registry dependencies: core/base, layouts/core, components/surface, components/stat, components/chart
- Files: none
- Snippets: Basic (registry/archetypes/dashboard/snippets/basic.html)
- Docs: registry/archetypes/dashboard/README.md

## Styles

### styles/editorial

- Label: Editorial
- Type: ls:style
- Description: Magazine field-guide art direction: warm paper, ink text, one oxblood accent, Fraunces display over Newsreader body, hairline rules, and an unhurried fade-and-settle motion signature.
- Agent level: recommended
- Agent recommended: yes
- Style attribute: editorial
- Style tone: warm, humane, literary; light backgrounds
- Safe anywhere: no
- Motion default: fade
- Motion notes: Slow crossfades between slides; children settle in like paragraphs (760ms enters, 110ms stagger). Avoid bouncy or springy extras.
- Icon guidance: Sparse, hairline sprite icons in ink or oxblood; prefer typographic markers (numbered kickers, asterisks) over icon grids.
- Attributes: `data-ls-style="editorial"`
- Usage: Set data-ls-style="editorial" on the <html> element and load style.css plus the font.css of each font family dependency. Use exactly one style per deck; styles replace the v1 theme presets.
- Registry dependencies: core/base, fonts/fraunces, fonts/newsreader, fonts/jetbrains-mono
- Files: registry/styles/editorial/style.css
- Snippets: none
- Docs: registry/styles/editorial/README.md

### styles/terminal

- Label: Terminal
- Type: ls:style
- Description: Dense engineered phosphor art direction: near-black, one green phosphor accent, JetBrains Mono display over Inter body, hard 1px borders, and an instant steppy motion signature.
- Agent level: recommended
- Agent recommended: yes
- Style attribute: terminal
- Style tone: technical, dense, engineered; dark phosphor
- Safe anywhere: no
- Motion default: fade
- Motion notes: Instant steppy reveals (140ms, stepped easing); stagger blinks units in with no vertical drift. Avoid slow fades and any bounce.
- Icon guidance: Hairline sprite icons in phosphor green; prompt prefixes (>) and status glyphs fit the direction better than decorative icons.
- Attributes: `data-ls-style="terminal"`
- Usage: Set data-ls-style="terminal" on the <html> element and load style.css plus the font.css of each font family dependency. Use exactly one style per deck; styles replace the v1 theme presets.
- Registry dependencies: core/base, fonts/jetbrains-mono, fonts/inter
- Files: registry/styles/terminal/style.css
- Snippets: none
- Docs: registry/styles/terminal/README.md

### styles/gallery

- Label: Gallery
- Type: ls:style
- Description: Swiss white-cube art direction: black on white with one International Orange accent, huge Space Grotesk display type, square edges, whitespace as texture, and precise unbouncy motion.
- Agent level: recommended
- Agent recommended: yes
- Style attribute: gallery
- Style tone: minimal, confident, typographic; white backgrounds
- Safe anywhere: no
- Motion default: slide
- Motion notes: Precise horizontal slides between slides (420ms, sharp ease-out); children fade opacity-only per the choreography rule. Never bounce.
- Icon guidance: Almost none: oversized folio numerals and thin rules carry the visual system. When needed, black hairline sprite icons only.
- Attributes: `data-ls-style="gallery"`
- Usage: Set data-ls-style="gallery" on the <html> element and load style.css plus the font.css of each font family dependency. Use exactly one style per deck; styles replace the v1 theme presets.
- Registry dependencies: core/base, fonts/space-grotesk, fonts/inter, fonts/jetbrains-mono
- Files: registry/styles/gallery/style.css
- Snippets: none
- Docs: registry/styles/gallery/README.md

### styles/boardroom

- Label: Boardroom
- Type: ls:style
- Description: Premium calm-authority art direction: deep charcoal-navy, brass accent, Libre Franklin display over Source Serif 4 body, hairline gold rules, and an understated fade-and-slow-stagger motion signature.
- Agent level: recommended
- Agent recommended: yes
- Style attribute: boardroom
- Style tone: premium, composed, executive; dark navy with brass
- Safe anywhere: no
- Motion default: fade
- Motion notes: Understated fades (620ms) and slow staggers (95ms steps); nothing moves fast, nothing bounces.
- Icon guidance: Restrained brass hairline sprite icons; prefer numbers and rules over icon grids.
- Attributes: `data-ls-style="boardroom"`
- Usage: Set data-ls-style="boardroom" on the <html> element and load style.css plus the font.css of each font family dependency. Use exactly one style per deck; styles replace the v1 theme presets.
- Registry dependencies: core/base, fonts/libre-franklin, fonts/source-serif-4, fonts/jetbrains-mono
- Files: registry/styles/boardroom/style.css
- Snippets: none
- Docs: registry/styles/boardroom/README.md

### styles/pop

- Label: Pop
- Type: ls:style
- Description: Playful loud-and-friendly art direction: cream ground, coral and electric-blue accents, Bricolage Grotesque display type, thick ink borders with sticker shadows, and a springy rise-and-bounce motion signature.
- Agent level: recommended
- Agent recommended: yes
- Style attribute: pop
- Style tone: playful, loud, friendly; cream with saturated accents
- Safe anywhere: no
- Motion default: rise
- Motion notes: Springy rises with overshoot easing (cubic-bezier 0.34/1.56); children fade opacity-only per the choreography rule. Bounce is the signature — do not flatten it.
- Icon guidance: Bold sprite icons in ink inside sticker badges; emoji is allowed only when the deck deliberately opts in with data-ls-icons="emoji".
- Attributes: `data-ls-style="pop"`
- Usage: Set data-ls-style="pop" on the <html> element and load style.css plus the font.css of each font family dependency. Use exactly one style per deck; styles replace the v1 theme presets.
- Registry dependencies: core/base, fonts/bricolage-grotesque, fonts/inter, fonts/jetbrains-mono
- Files: registry/styles/pop/style.css
- Snippets: none
- Docs: registry/styles/pop/README.md

## Core

### core/base

- Label: Base
- Type: ls:core
- Description: Mandatory base styles and runtime for slidesls decks.
- Agent level: starter
- Agent recommended: yes
- Safe anywhere: yes
- Class groups:
  - `ls-page`: base only
  - `ls-deck`: base only
  - `ls-slide`: `ls-slide__inner`, `ls-slide__header`, `ls-slide__body`, `ls-slide__footer`
- Classes: `ls-stage`, `ls-eyebrow`, `ls-title`, `ls-subtitle`, `ls-muted`, `ls-subtle`, `ls-accent-text`, `ls-icon`, `ls-icon-badge`, `ls-icon-mark`, `ls-sprite`, `ls-reveal`
- Data attributes: `data-ls-deck`, `data-step`, `data-ls-density=compact|spacious`, `data-ls-reveal-sequence`, `data-ls-sequence-skip`, `data-ls-slide-kind=content|hero|section`, `data-ls-lint=off`, `data-ls-transition=fade|rise|slide|none`, `data-ls-motion=none`, `data-ls-stagger`, `data-ls-page-number`
- CSS variables: `--ls-slide-width` (default 1600px, not override-safe), `--ls-slide-height` (default 900px, not override-safe), `--ls-slide-bg` (default #111318, override-safe), `--ls-page-bg` (default #0b0d12, override-safe), `--ls-text` (default #f5f7fb, override-safe), `--ls-muted` (default #bcc3d0, override-safe), `--ls-accent` (default #3b82f6, override-safe), `--ls-accent-2` (default #22d3ee, override-safe), `--ls-accent-text` (default #bfdbfe, override-safe), `--ls-space-3` (default 16px, override-safe), `--ls-space-6` (default 48px, override-safe), `--ls-slide-padding-block` (default 92px, override-safe), `--ls-slide-padding-inline` (default 108px, override-safe), `--ls-title-line-height` (default 0.96, override-safe), `--ls-title-letter-spacing` (default -0.045em, override-safe), `--ls-card-padding` (default 24px, override-safe), `--ls-card-title-size` (default 28px, override-safe), `--ls-card-text-size` (default 21px, override-safe), `--ls-callout-padding` (default 22px 24px, override-safe), `--ls-callout-title-size` (default 27px, override-safe), `--ls-callout-text-size` (default 22px, override-safe), `--ls-font-heading` (default var(--ls-font-sans), override-safe), `--ls-font-body` (default var(--ls-font-sans), override-safe), `--ls-slide-header-gap` (default var(--ls-space-2), override-safe), `--ls-slide-header-max-inline-size` (default 1080px, override-safe), `--ls-transition-kind` (default fade, override-safe), `--ls-transition-duration` (default 460ms, override-safe), `--ls-transition-ease` (default var(--ls-ease), override-safe), `--ls-transition-distance` (default 96px, override-safe), `--ls-enter-duration` (default 640ms, override-safe), `--ls-enter-distance` (default 22px, override-safe), `--ls-stagger-step` (default 70ms, override-safe), `--ls-border-width` (default 1px, override-safe), `--ls-slide-texture` (default none, override-safe), `--ls-footer-block-size` (default 52px, override-safe), `--ls-footer-font-size` (default 17px, override-safe), `--ls-footer-color` (default var(--ls-subtle), override-safe), `--ls-footer-letter-spacing` (default 0.08em, override-safe), `--ls-footer-rule` (default 1px solid var(--ls-border), override-safe)
- Usage: Use body.ls-page, a .ls-deck[data-ls-deck] wrapper, and one or more .ls-slide sections. Runtime state attributes such as data-ls-ready and data-active are managed by slide-runtime.js. Set data-ls-slide-kind on slides: content slides use .ls-slide\_\_header; hero/section slides may intentionally use centered full-slide layouts.
- Registry dependencies: none
- Files: registry/core/base/reset.css, registry/core/base/tokens.css, registry/core/base/slide.css, registry/core/base/icons.css, registry/core/base/motion.css, registry/core/base/slide-runtime.js
- Snippets: none
- Docs: registry/core/base/README.md

## Layouts

### layouts/core

- Label: Layouts
- Type: ls:layout
- Description: Slide-body compositions with alignment guarantees: subgrid column layouts with a heading/body/footer row skeleton, generic hero/media composition, statement/band/dashboard/gallery compositions, region bleed, plus low-level stack/cluster/grid utilities.
- Agent level: recommended
- Agent recommended: yes
- Safe anywhere: no
- Composition:
  - Layout behavior: fills-area
  - Use when:
    - the slide body has two or more columns whose headings/bodies/footers should align
    - one claim needs the whole body (statement) or a sequence needs a full-width band
  - Avoid when:
    - a single content-sized group is enough — use ls-stack or ls-grid directly
    - columns have genuinely irregular content — use the --free variant instead of fighting the skeleton
- Class groups:
  - `ls-layout`: `ls-layout__region`, `ls-layout__heading`, `ls-layout__text`, `ls-layout__note`, `ls-layout--split`, `ls-layout--columns-3`, `ls-layout--columns-4`, `ls-layout--wide-start`, `ls-layout--wide-end`, `ls-layout--free`, `ls-layout--statement`, `ls-layout--band`, `ls-layout--dashboard`, `ls-layout--gallery`, `ls-layout__region--bleed`
    - Rule: Always keep the base class ls-layout alongside a modifier — the runtime's auto-stagger descends one level into .ls-layout. Aligned layouts expect each region to hold up to three children in heading/body/footer order; use ls-layout--free for irregular columns.
  - `ls-stack`: `ls-stack--sm`, `ls-stack--lg`
  - `ls-cluster`: base only
  - `ls-grid`: `ls-grid--start`, `ls-grid--fill`, `ls-grid--2`, `ls-grid--3`, `ls-grid--4`, `ls-grid--wide-left`, `ls-grid--wide-right`
  - `ls-hero-media`: base only
    - Rule: Use for cover-style copy + media compositions. Put one ls-hero-copy and one media/figure element inside it; do not use aligned subgrid layouts for grouped hero copy.
- Classes: `ls-center`, `ls-center-start`, `ls-text-start`, `ls-fill`, `ls-slide-fill`, `ls-frame`, `ls-hero-copy`
- CSS variables: `--ls-layout-heading-size` (default 30px, override-safe), `--ls-layout-text-size` (default 22px, override-safe), `--ls-layout-gap` (default var(--ls-space-5), override-safe), `--ls-layout-columns` (default 3, override-safe), `--ls-stack-gap` (default var(--ls-space-4), override-safe), `--ls-stack-align-content` (default start, override-safe), `--ls-cluster-gap` (default var(--ls-space-3), override-safe), `--ls-cluster-align` (default center, override-safe), `--ls-grid-gap` (default var(--ls-space-5), override-safe), `--ls-grid-align-content` (default center, override-safe), `--ls-frame-min-block-size` (default 320px, override-safe), `--ls-hero-gap` (default var(--ls-space-6), override-safe), `--ls-hero-copy-gap` (default var(--ls-space-4), override-safe), `--ls-hero-copy-fr` (default 1.15fr, override-safe), `--ls-hero-media-fr` (default 0.85fr, override-safe), `--ls-hero-copy-max-inline-size` (default 920px, override-safe)
- Usage: Place one ls-layout composition (e.g. ls-layout--split) directly inside .ls-slide\_\_body; put content in ls-layout\_\_region children. Aligned layouts: region children map to the heading/body/footer rows in DOM order; surplus space lands inside the body row, footers stay anchored. Use ls-stack/ls-cluster/ls-grid to arrange content INSIDE a region, not as the slide-body skeleton. For cover-style slides, use ls-hero-media with ls-hero-copy so eyebrow/title/subtitle stay grouped; aligned subgrid layouts are for heading/body/footer rows, not hero copy.
- Registry dependencies: components/figure, components/statement, core/base
- Files: registry/layouts/core/layout.css, registry/layouts/core/utilities.css
- Snippets: Aligned split (registry/layouts/core/snippets/split.html), Statement body (registry/layouts/core/snippets/statement.html), Bleed figure (registry/layouts/core/snippets/bleed.html)
- Docs: registry/layouts/core/README.md

## Components

### components/badge

- Label: Badge
- Type: ls:component
- Description: Compact labels for slide metadata and short attributes.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-badge
- Safe anywhere: yes
- Class groups:
  - `ls-badge`: `ls-badge--accent`, `ls-badge--solid`
- Usage: Use for compact labels, statuses, or category markers.
- Registry dependencies: core/base
- Files: registry/components/badge/badge.css
- Snippets: Basic badge (registry/components/badge/snippets/basic.html)
- Docs: registry/components/badge/README.md

### components/divider

- Label: Divider
- Type: ls:component
- Description: Content divider component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-divider
- Safe anywhere: yes
- Class groups:
  - `ls-divider`: `ls-divider__label`
- Data attributes: `data-ls-density=compact|spacious`, `data-ls-orientation=vertical`, `data-ls-variant=accent|dashed`
- CSS variables: `--ls-divider-color`, `--ls-divider-thickness`, `--ls-divider-gap`
- Registry dependencies: core/base
- Files: registry/components/divider/divider.css
- Snippets: Basic divider (registry/components/divider/snippets/basic.html)
- Docs: registry/components/divider/README.md

### components/progress

- Label: Progress
- Type: ls:component
- Description: Accessible progress component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-progress
- Safe anywhere: yes
- Class groups:
  - `ls-progress`: `ls-progress__label`, `ls-progress__value`, `ls-progress__track`, `ls-progress__bar`
- Data attributes: `data-ls-tone=success|warning|danger`, `data-ls-density=compact|spacious`, `data-ls-animate=fill`
- CSS variables: `--ls-progress-value`, `--ls-progress-thickness`, `--ls-progress-label-size`
- Usage: Set --ls-progress-value to the fill percentage, e.g. 72%.
- Registry dependencies: core/base
- Files: registry/components/progress/progress.css
- Snippets: Basic progress (registry/components/progress/snippets/basic.html)
- Docs: registry/components/progress/README.md

### components/quote

- Label: Quote
- Type: ls:component
- Description: Quote slide component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-quote
- Safe anywhere: yes
- Class groups:
  - `ls-quote`: `ls-quote__evidence`, `ls-quote__source`, `ls-quote__text`, `ls-quote--lg`
- CSS variables: `--ls-quote-size` (default 44px, override-safe), `--ls-quote-indent` (default 44px, override-safe), `--ls-quote-rule-width` (default 5px, override-safe)
- Registry dependencies: core/base
- Files: registry/components/quote/quote.css
- Snippets: Basic quote (registry/components/quote/snippets/basic.html)
- Docs: registry/components/quote/README.md

### components/table

- Label: Table
- Type: ls:component
- Description: Presentation-friendly table component.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-table
- Safe anywhere: yes
- Class groups:
  - `ls-table`: `ls-table__caption`, `ls-table__value`, `ls-table__muted`, `ls-table__note`
- Classes: `ls-table-frame`
- Data attributes: `data-ls-density=compact`, `data-ls-variant=striped|plain`, `data-ls-overflow=clip`
- CSS variables: `--ls-table-cell-padding`, `--ls-table-min-inline`, `--ls-table-accent`, `--ls-table-stripe-bg`
- Registry dependencies: core/base
- Files: registry/components/table/table.css
- Snippets: Basic table (registry/components/table/snippets/basic.html)
- Docs: registry/components/table/README.md

### components/surface

- Label: Surface
- Type: ls:component
- Description: The one bordered container of the v2 vocabulary: cards, panels, callouts, and boxed metrics collapse into this single noun with status and layout variants.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-surface
- Intent: teach, compare, emphasize
- Safe anywhere: yes
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Item count: 2-4 surfaces per slide; a lone surface should earn its border with status meaning or grouping.
  - Copy: Kicker up to 3 words, title up to 6 words, 1-3 sentences of text.
  - Use when:
    - content needs a visible frame to read as one unit inside a busier composition
    - a status tone (success, warning, danger, accent) should color a block of copy
    - a compact labelled band of information should sit in a row
  - Avoid when:
    - the slide holds a single idea that display type carries better
    - a grid of surfaces would each hold only one short line
    - a number is the content; unboxed scale contrast does the work
  - Alternatives:
    - a single full-width claim: `components/statement`
    - a headline number with a label: `components/stat`
    - 3-6 short items: `components/list`
- Class groups:
  - `ls-surface`: `ls-surface__kicker`, `ls-surface__title`, `ls-surface__text`, `ls-surface--muted`, `ls-surface--accent`, `ls-surface--success`, `ls-surface--warning`, `ls-surface--danger`, `ls-surface--row`, `ls-surface--center`
- CSS variables: `--ls-surface-padding` (default 26px 28px, override-safe), `--ls-surface-title-size` (default 29px, override-safe), `--ls-surface-text-size` (default 22px, override-safe)
- Usage: Reach for a surface only when the composition needs a frame; everything else in the v2 vocabulary is deliberately unboxed. Use exactly one status modifier (--accent, --success, --warning, --danger) per surface; the default border carries neutral content. Add ls-surface--row for compact horizontal bands and ls-surface--center only when the surface sits in a stretched grid area.
- Registry dependencies: core/base
- Files: registry/components/surface/surface.css
- Snippets: Basic surface (registry/components/surface/snippets/basic.html)
- Docs: registry/components/surface/README.md

### components/statement

- Label: Statement
- Type: ls:component
- Description: A full-width display-type claim with an optional support line. No border, no box: the words are the design — the strongest single-idea slide body in the vocabulary.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-statement
- Intent: emphasize, open, close
- Safe anywhere: yes
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Item count: One statement per slide; two competing claims dilute both.
  - Copy: Claim of 4-12 words with one emphasized span; support line of at most 2 sentences.
  - Use when:
    - one idea deserves the whole slide
    - opening or closing a section with a thesis
    - a transition needs a beat between dense slides
  - Avoid when:
    - the point needs supporting structure such as steps or evidence
    - several claims compete on the same slide
    - the claim is really a number
  - Alternatives:
    - the claim is a number: `components/stat`
    - the claim is someone else's words: `components/quote`
    - several short points instead of one claim: `components/list`
- Class groups:
  - `ls-statement`: `ls-statement__text`, `ls-statement__support`, `ls-statement--hero`, `ls-statement--center`
- CSS variables: `--ls-statement-size` (default var(--ls-text-xl), override-safe)
- Usage: Emphasize at most one span per claim with <em> or ls-accent-text; the accent does the pointing. Keep the claim to a single sentence; move any qualification into ls-statement\_\_support. Use ls-statement--hero for opening or closing slides where the claim is the whole slide.
- Registry dependencies: core/base
- Files: registry/components/statement/statement.css
- Snippets: Basic statement (registry/components/statement/snippets/basic.html)
- Docs: registry/components/statement/README.md

### components/stat

- Label: Stat
- Type: ls:component
- Description: An unboxed number: display-size value, quiet label, optional delta. Scale contrast does the work a border used to fake.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-stat
- Intent: show-data, prove, emphasize
- Safe anywhere: yes
- Composition:
  - Content density: sparse
  - Layout behavior: content-sized
  - Item count: 1 hero stat, or 2-4 in a row; beyond that the numbers stop reading as headlines.
  - Copy: Value of at most 6 characters plus unit; label of 2-6 words; delta of 1-3 words.
  - Use when:
    - one number is the evidence
    - a small row of KPIs summarizes an outcome
    - a metric needs a delta with an honest up/down tone
  - Avoid when:
    - the number needs comparison context across categories
    - more than 4 metrics compete on one slide
    - the value requires a paragraph of explanation to land
  - Alternatives:
    - comparing values across categories: `components/chart`
    - many metrics with structure: `components/table`
    - the point is a worded claim, not a number: `components/statement`
- Class groups:
  - `ls-stat`: `ls-stat__value`, `ls-stat__label`, `ls-stat__delta`, `ls-stat--xl`, `ls-stat--sm`, `ls-stat--center`
- Data attributes: `data-ls-tone=down|neutral`
- CSS variables: `--ls-stat-value-size` (default 96px, override-safe)
- Usage: Keep the stat unboxed; place it inside a components/surface only when the composition really needs a frame. Deltas default to the success color; set data-ls-tone="down" when the movement is bad and "neutral" when it carries no judgment. Emphasize part of the value with <em> or ls-accent-text when the unit should stay quiet.
- Registry dependencies: core/base
- Files: registry/components/stat/stat.css
- Snippets: Basic stat (registry/components/stat/snippets/basic.html)
- Docs: registry/components/stat/README.md

### components/figure

- Label: Figure
- Type: ls:component
- Description: The image and diagram frame, with a caption slot and the sanctioned abstract-art fallback for figure slots without a real asset.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-figure
- Intent: teach, prove, emphasize
- Safe anywhere: yes
- Composition:
  - Content density: sparse, balanced
  - Layout behavior: fills-area
  - Item count: 1-2 figures per slide; a figure earns space by being the point, not decoration.
  - Copy: Caption of one short sentence; the media carries the content.
  - Use when:
    - a screenshot, photo, or authored SVG diagram is the slide's evidence
    - a split layout needs a visual half (ls-figure--fill)
    - no real asset exists and the slot still deserves intentional art (ls-figure--abstract)
  - Avoid when:
    - the visual would be text restating the title in a colored panel
    - the content has inherent structure better authored as steps or bars
    - the asset is an app screenshot that deserves product chrome
  - Alternatives:
    - step sequences with connectors: `components/flow`
    - proportional values: `components/chart`
    - screenshots that should read as product UI: `components/media`
- Class groups:
  - `ls-figure`: `ls-figure__media`, `ls-figure__caption`, `ls-figure--frame`, `ls-figure--edge`, `ls-figure--fill`, `ls-figure--contain`, `ls-figure--abstract`
- CSS variables: `--ls-abstract-art` (override-safe)
- Usage: Follow the image-sourcing ladder: real asset, then an authored diagram (components/flow, components/chart, or hand-written SVG), then ls-figure--abstract, then the archetype's no-figure variant. Text in a panel pretending to be a visual is never sanctioned. Author as a <figure> element with the caption in a <figcaption class="ls-figure\_\_caption">. For ls-figure--abstract leave the media element empty and mark it aria-hidden="true"; the art is CSS and styles override --ls-abstract-art with their own compositions. SVG figures need role="img" and an aria-label describing the diagram. Use ls-figure--contain for illustrations, diagrams, logos, or other assets that must not be cropped; leave the default cover behavior for photos and screenshots.
- Registry dependencies: core/base
- Files: registry/components/figure/figure.css
- Snippets: Abstract figure with caption (registry/components/figure/snippets/basic.html)
- Docs: registry/components/figure/README.md

### components/list

- Label: List
- Type: ls:component
- Description: Styled lists with CSS-drawn markers (check, arrow, numbered, timeline): the sanctioned form for short items, replacing grids of one-line boxes.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-list
- Intent: teach, compare, explain-process
- Safe anywhere: yes
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Item count: 3-6 items; split longer lists across slides or columns.
  - Copy: Single-line items up to 10 words; titled items pair a title of up to 5 words with one sentence of text.
  - Use when:
    - 3-6 short parallel points need a marker and rhythm
    - an ordered sequence of takeaways suits numbered markers
    - a compact chronology suits the timeline rail
  - Avoid when:
    - each item needs multiple sentences of explanation
    - the sequence describes a process whose steps deserve markers and connectors
    - there are more than 6 items
  - Alternatives:
    - items need multi-sentence explanations: `components/surface`
    - a process with distinct steps: `components/flow`
    - items are values to compare: `components/chart`
- Class groups:
  - `ls-list`: `ls-list__title`, `ls-list__text`, `ls-list--check`, `ls-list--arrow`, `ls-list--numbered`, `ls-list--timeline`
- CSS variables: `--ls-list-gap` (default var(--ls-space-3), override-safe), `--ls-list-indent` (default 52px, override-safe), `--ls-list-title-size` (default 27px, override-safe), `--ls-list-text-size` (default 22px, override-safe)
- Usage: Use a <ul> or <ol> with the class on the list element; markers are drawn in CSS, so pick exactly one marker modifier and never add emoji or glyph bullets. Single-line items go straight in the <li>; two-line items use ls-list\_\_title plus ls-list\_\_text. Prefer a list over a grid of one-line boxes: short items do not earn borders.
- Registry dependencies: core/base
- Files: registry/components/list/list.css
- Snippets: Check list (registry/components/list/snippets/basic.html), Timeline (registry/components/list/snippets/timeline.html)
- Docs: registry/components/list/README.md

### components/code

- Label: Code
- Type: ls:component
- Description: One component for code blocks, diffs, and terminal transcripts, switched by data-ls-variant, with line-level hooks for highlight, add/del, and prompt/output emphasis.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-code
- Intent: show-code, teach
- Safe anywhere: yes
- Composition:
  - Content density: balanced, dense
  - Layout behavior: content-sized
  - Item count: One code block per slide; pair it with notes rather than a second block.
  - Copy: Up to about 12 lines of at most 60 characters; trim with ellipsis comments instead of shrinking the font.
  - Use when:
    - an API or config excerpt is the teaching content
    - a before/after change reads best as a diff
    - a command sequence and its output tell the story
  - Avoid when:
    - the excerpt would exceed roughly 15 lines
    - the audience needs the concept, not the syntax
    - the content is data, not code
  - Alternatives:
    - the concept matters more than the syntax: `components/flow`
    - structured values rather than code: `components/table`
    - a product screenshot of the tool: `components/media`
- Class groups:
  - `ls-code`: `ls-code__header`, `ls-code__body`, `ls-code__line`
- Data attributes: `data-ls-variant=block|diff|terminal`, `data-ls-line=highlight|add|del|prompt|output`
- CSS variables: `--ls-code-font-size` (default 21px, override-safe)
- Usage: Author as a <figure class="ls-code"> with a <figcaption class="ls-code\_\_header"> (filename or command context) and the code inside .ls-code\_\_body > pre. Wrap each line in a .ls-code\_\_line span; +/- diff markers and $ prompts are drawn by CSS, so do not type them into the source. Keep excerpts short: highlight the 1-3 lines the narration is about instead of pasting whole files.
- Registry dependencies: core/base
- Files: registry/components/code/code.css
- Snippets: Code block with highlighted line (registry/components/code/snippets/basic.html)
- Docs: registry/components/code/README.md

### components/chart

- Label: Chart
- Type: ls:component
- Description: Dependency-free CSS mini-charts (bar rows, column sets, donut) that are honest by construction: geometry is proportional to a 0-100 value with a fixed zero baseline.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-chart
- Intent: show-data, prove, compare
- Safe anywhere: yes
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Item count: 3-6 bars or columns; one donut per proportion. More series belong in a real chart image.
  - Copy: Labels of 1-4 words; always print the actual value alongside the geometry.
  - Use when:
    - comparing a handful of values across categories
    - showing one proportion of a whole (donut)
    - data needs to stay token-colored and dependency-free
  - Avoid when:
    - the data has more than about 6 categories or needs a time axis
    - exact values matter more than proportions
    - a single number is the whole story
  - Alternatives:
    - one headline number: `components/stat`
    - exact values across many rows: `components/table`
    - a complex plot exported as an image or SVG: `components/figure`
- Class groups:
  - `ls-chart`: `ls-chart__title`, `ls-chart__row`, `ls-chart__label`, `ls-chart__track`, `ls-chart__bar`, `ls-chart__value`, `ls-chart__columns`, `ls-chart__column`, `ls-chart__donut`, `ls-chart--columns`, `ls-chart--donut`
- CSS variables: `--ls-chart-value` (default 0, override-safe), `--ls-chart-color` (default var(--ls-accent), override-safe), `--ls-chart-label-width` (default 220px, override-safe), `--ls-chart-bar-size` (default 26px, override-safe), `--ls-chart-column-height` (default 300px, override-safe), `--ls-chart-donut-size` (default 260px, override-safe)
- Usage: --ls-chart-value is percent-of-track on a 0-100 scale with a fixed zero baseline: scale the largest datum to its true share of 100 (or to 100 when showing relative size) and put the real value in ls-chart\_\_value; never offset the baseline. role="img" and an aria-label describing the data are REQUIRED on the chart root; the chart is presentational markup and screen readers get the label. Values are 0-100 with a fixed zero baseline, set per bar/column/donut via style="--ls-chart-value: NN"; there is no axis-minimum hook, so truncated dishonest bars are inexpressible by construction. Normalize your data to percentages of the axis maximum. Show the real number next to each bar in ls-chart\_\_value; geometry shows proportion, the text shows the value. Recolor a series with --ls-chart-color; keep one accent color unless a second series genuinely exists.
- Registry dependencies: core/base
- Files: registry/components/chart/chart.css
- Snippets: Bar rows (registry/components/chart/snippets/basic.html)
- Docs: registry/components/chart/README.md

### components/flow

- Label: Flow
- Type: ls:component
- Description: Linear step sequences (horizontal band or vertical rail) with CSS connectors between adjacent siblings. Deliberately not a node-graph engine — arbitrary diagrams are authored SVG in a figure.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-flow
- Intent: explain-process, teach
- Safe anywhere: yes
- Composition:
  - Content density: balanced
  - Layout behavior: content-sized
  - Item count: 3-5 steps; horizontal bands get cramped past 4 steps with real copy.
  - Copy: Step titles up to 4 words; step text of 6-16 words.
  - Use when:
    - a process runs through 3-5 ordered stages
    - a pipeline or lifecycle needs visible hand-offs
    - a rollout or migration plan reads as sequential phases
  - Avoid when:
    - the diagram branches, loops, or has more than one path
    - steps carry no real explanation and are just labels
    - there are more than 5 steps
  - Alternatives:
    - branching or cyclic diagrams: `components/figure`
    - short ordered points without connectors: `components/list`
    - stages with heavy copy each: `components/surface`
- Class groups:
  - `ls-flow`: `ls-flow__step`, `ls-flow__marker`, `ls-flow__title`, `ls-flow__text`, `ls-flow--vertical`
- CSS variables: `--ls-flow-gap` (default 56px, override-safe), `--ls-flow-title-size` (default 27px, override-safe), `--ls-flow-text-size` (default 21px, override-safe)
- Usage: Connectors are drawn between adjacent sibling steps only; branching or cyclic diagrams are out of scope — author those as SVG inside components/figure. Put a step number or short token in ls-flow\_\_marker; the connector aligns to the marker row. Use ls-flow--vertical when step text is longer than a phrase or there are more than 5 steps' worth of copy.
- Registry dependencies: core/base
- Files: registry/components/flow/flow.css
- Snippets: Horizontal flow (registry/components/flow/snippets/basic.html)
- Docs: registry/components/flow/README.md

### components/media

- Label: Media
- Type: ls:component
- Description: Screenshot and product frames: browser chrome with an address bar, a plain window, or bare shadowed media. Frames make real assets read as intentional.
- Agent level: recommended
- Agent recommended: yes
- Root class: ls-media
- Intent: show-data, prove, teach
- Safe anywhere: yes
- Composition:
  - Content density: sparse, balanced
  - Layout behavior: fills-area
  - Item count: 1 media frame per slide; two screenshots compete for legibility.
  - Copy: Only the address bar carries text; narration belongs next to the frame, not inside it.
  - Use when:
    - a product screenshot should read as a browser or app window
    - a demo recording needs framed context
    - a split layout pairs UI evidence with narration
  - Avoid when:
    - no real screenshot or recording exists
    - the asset is a diagram or photo rather than product UI
    - the screenshot's fine detail is the content and cropping would hide it
  - Alternatives:
    - no real asset exists: `components/figure`
    - diagrams, photos, or captioned visuals: `components/figure`
    - a terminal session as text: `components/code`
- Class groups:
  - `ls-media`: `ls-media__chrome`, `ls-media__dots`, `ls-media__address`, `ls-media__body`, `ls-media--window`, `ls-media--bare`
- Usage: Requires a real asset: put an <img> or <video> with a descriptive alt directly inside ls-media\_\_body; it covers the body, cropped from the top. The chrome row holds ls-media\_\_dots (three <i> dots) and ls-media\_\_address (the product URL); use ls-media--window for native-app framing without the address bar. The frame fills its grid area, so give it a sized region (a split or dashboard layout) rather than free-flowing content.
- Registry dependencies: core/base
- Files: registry/components/media/media.css
- Snippets: Browser frame (registry/components/media/snippets/basic.html)
- Docs: registry/components/media/README.md

## Motion

### motion/emphasis

- Label: Emphasis
- Type: ls:motion
- Description: Scale-and-settle entrance for a step-revealed element — the recipe behind 'the number lands'. Pairs with data-step; respects export, print, reduced-motion, and data-ls-motion kill switches.
- Agent level: recommended
- Agent recommended: yes
- Intent: emphasize
- Safe anywhere: no
- Motion default: step-triggered
- Motion notes: Only fires on the reveal step; core transitions and stagger stay untouched. Use on at most one element per slide — emphasis rations itself.
- Composition:
  - Layout behavior: content-sized
  - Use when:
    - one number or claim deserves a physical landing on its reveal
  - Avoid when:
    - applied to several elements per slide — emphasis everywhere is emphasis nowhere
- Classes: `ls-emphasize`
- CSS variables: `--ls-emphasize-duration` (default 480ms, override-safe), `--ls-emphasize-from` (default 0.92, override-safe), `--ls-emphasize-peak` (default 1.03, override-safe)
- Usage: Add ls-emphasize plus data-step to the element; the pop plays when the step reveals it. Combine with components/stat for Appendix-B style 'stat emphasis (scale/settle)'.
- Registry dependencies: core/base, components/stat
- Files: registry/motion/emphasis/emphasis.css
- Snippets: Emphasized stat (registry/motion/emphasis/snippets/basic.html)
- Docs: registry/motion/emphasis/README.md

## Fonts

### fonts/fraunces

- Label: Fraunces
- Type: ls:font
- Description: Fraunces variable webfont (latin, wght axis), vendored from @fontsource-variable/fraunces@5.2.9 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Fraunces Variable".
- Registry dependencies: none
- Files: registry/fonts/fraunces/fraunces-latin-wght-normal.woff2, registry/fonts/fraunces/font.css, registry/fonts/fraunces/OFL.txt
- Snippets: none
- Docs: registry/fonts/fraunces/README.md

### fonts/newsreader

- Label: Newsreader
- Type: ls:font
- Description: Newsreader variable webfont (latin, wght axis), vendored from @fontsource-variable/newsreader@5.2.10 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Newsreader Variable".
- Registry dependencies: none
- Files: registry/fonts/newsreader/newsreader-latin-wght-normal.woff2, registry/fonts/newsreader/font.css, registry/fonts/newsreader/OFL.txt
- Snippets: none
- Docs: registry/fonts/newsreader/README.md

### fonts/source-serif-4

- Label: Source Serif 4
- Type: ls:font
- Description: Source Serif 4 variable webfont (latin, wght axis), vendored from @fontsource-variable/source-serif-4@5.2.9 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Source Serif 4 Variable".
- Registry dependencies: none
- Files: registry/fonts/source-serif-4/source-serif-4-latin-wght-normal.woff2, registry/fonts/source-serif-4/font.css, registry/fonts/source-serif-4/OFL.txt
- Snippets: none
- Docs: registry/fonts/source-serif-4/README.md

### fonts/inter

- Label: Inter
- Type: ls:font
- Description: Inter variable webfont (latin, wght axis), vendored from @fontsource-variable/inter@5.2.8 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Inter Variable".
- Registry dependencies: none
- Files: registry/fonts/inter/inter-latin-wght-normal.woff2, registry/fonts/inter/font.css, registry/fonts/inter/OFL.txt
- Snippets: none
- Docs: registry/fonts/inter/README.md

### fonts/space-grotesk

- Label: Space Grotesk
- Type: ls:font
- Description: Space Grotesk variable webfont (latin, wght axis), vendored from @fontsource-variable/space-grotesk@5.2.10 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Space Grotesk Variable".
- Registry dependencies: none
- Files: registry/fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2, registry/fonts/space-grotesk/font.css, registry/fonts/space-grotesk/OFL.txt
- Snippets: none
- Docs: registry/fonts/space-grotesk/README.md

### fonts/libre-franklin

- Label: Libre Franklin
- Type: ls:font
- Description: Libre Franklin variable webfont (latin, wght axis), vendored from @fontsource-variable/libre-franklin@5.2.8 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Libre Franklin Variable".
- Registry dependencies: none
- Files: registry/fonts/libre-franklin/libre-franklin-latin-wght-normal.woff2, registry/fonts/libre-franklin/font.css, registry/fonts/libre-franklin/OFL.txt
- Snippets: none
- Docs: registry/fonts/libre-franklin/README.md

### fonts/jetbrains-mono

- Label: JetBrains Mono
- Type: ls:font
- Description: JetBrains Mono variable webfont (latin, wght axis), vendored from @fontsource-variable/jetbrains-mono@5.2.8 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "JetBrains Mono Variable".
- Registry dependencies: none
- Files: registry/fonts/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2, registry/fonts/jetbrains-mono/font.css, registry/fonts/jetbrains-mono/OFL.txt
- Snippets: none
- Docs: registry/fonts/jetbrains-mono/README.md

### fonts/bricolage-grotesque

- Label: Bricolage Grotesque
- Type: ls:font
- Description: Bricolage Grotesque variable webfont (latin, wght axis), vendored from @fontsource-variable/bricolage-grotesque@5.2.10 under the SIL Open Font License 1.1.
- Agent level: advanced
- Agent recommended: no
- Safe anywhere: no
- Usage: Loaded via the family @font-face in font.css; reference it through style tokens, not directly. The registered font-family name is "Bricolage Grotesque Variable".
- Registry dependencies: none
- Files: registry/fonts/bricolage-grotesque/bricolage-grotesque-latin-wght-normal.woff2, registry/fonts/bricolage-grotesque/font.css, registry/fonts/bricolage-grotesque/OFL.txt
- Snippets: none
- Docs: registry/fonts/bricolage-grotesque/README.md
