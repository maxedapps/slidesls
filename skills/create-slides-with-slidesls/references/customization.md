# Customization

Three sanctioned levels, in order of preference. Never override `.ls-*` selectors in unlayered deck CSS — unlayered rules beat every component layer and break the cascade contract.

## 1. Tokens (deck-level)

Override any `overrideSafe` variable in a deck-level `@layer tokens` block after the style link:

```html
<style>
  @layer tokens {
    :root {
      --ls-accent: #0f766e;
      --ls-accent-text: #0f766e;
      --ls-title-letter-spacing: -0.02em;
    }
  }
</style>
```

Discover safe variables and defaults: `slidesls inspect core/base --api --json` (and per component) — `cssVariables` entries carry `overrideSafe` and `default`. Motion signature (`--ls-transition-*`, `--ls-enter-*`, `--ls-stagger-step`), texture (`--ls-slide-texture`), abstract art (`--ls-abstract-art`), and furniture (`--ls-footer-*`) are all tokens.

Contrast rule: if you change text/background/accent pairs, run the visual-qa pass — `low_contrast` measures the rendered result (WCAG 4.5:1 body, 3:1 display).

## 2. Variants and data attributes

Every component ships modifiers (`ls-surface--accent`, `ls-stat--xl`, `ls-list--timeline`, `ls-figure--abstract`, …) and data attributes (`data-ls-density="compact|spacious"`, `data-ls-variant` on code, `data-ls-tone` on deltas). Use these before writing CSS: `slidesls inspect <item> --api --json` lists all of them with usage rules.

## 3. Copied-file edits

Decks own their copied CSS (`slidesls/registry/...`). Editing copied files is legitimate deck customization (the manifest tracks drift as `customizedFiles`, informational). Prefer it over fighting tokens when a one-deck structural change is genuinely needed — but never edit registry source inside the installed package.

## Per-slide exceptions

One intentionally unusual slide may suppress advisory lints with `data-ls-lint="off"` on the section. Use it to make deviations deliberate and reviewable, not to silence a pattern you repeat.
