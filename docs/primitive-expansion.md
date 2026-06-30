# Primitive expansion strategy

`slidesls` grows through coherent groups of utilities, components, and templates. Each addition should make decks easier for agents and humans to compose without hidden structure.

## Current catalog shape

- **Core**: base reset, tokens, slide shell styles, icon helpers, and runtime.
- **Utilities**: reusable layout classes such as stacks, clusters, grids, centering, and fill behavior.
- **Components**: standalone content/visual primitives such as badge, card, panel, callout, metric, quote, table, timeline, code block, image card, divider, and progress.
- **Templates**: complete slide snippets such as title hero, split, split diagram, three cards, code plus notes, metric dashboard, and section divider.
- **Animations**: optional reveal-compatible effects.
- **Presets**: optional token/style remaps.

## Expansion rules

- Prefer utilities and standalone components over structural slide-specific CSS contracts.
- Prefer snippets/templates when an agent needs a complete skeleton.
- Keep the recommended catalog small and high-signal.
- Every recommended item should have concise docs and snippet metadata.
- Avoid adding advanced items until they have clear use cases and non-fragile APIs.
- Do not add hidden ancestor-dependent classes.

## Batch strategy for future additions

Each expansion should include:

1. A small related group of items.
2. Registry metadata and README files for every item.
3. Snippets for every recommended item.
4. At least one example deck or example slide validating the items together.
5. `registry.json` updates.
6. `pnpm check` validation.
7. Browser/visual review for galleries or visual primitives.

## Potential future directions

- More template snippets for teaching, product, consulting, and technical decks.
- Technical/developer components such as terminal, file tree, API request/response, and code diff.
- Theme and preset expansion: color presets, light mode, print/export presets, and style packs.
- Optional browser visual QA and export workflows.

## Quality bar

A new primitive should only be added if it is:

- copyable without build tooling;
- useful in more than one deck;
- visually coherent with the default theme;
- customizable through markup and CSS variables;
- documented with concise usage guidance;
- inspectable through snippets when recommended;
- validated in an example before commit.
