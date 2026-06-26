# Centered Statement

Sparse high-impact statement layout with explicit sizing and alignment hooks.

## Minimal markup

```html
<section class="ls-slide">
  <div class="ls-slide__inner ls-centered-statement">
    <div class="ls-centered-statement__content">
      <p class="ls-eyebrow">Chapter idea</p>
      <h1 class="ls-centered-statement__statement">One strong message.</h1>
      <p class="ls-centered-statement__support">Optional supporting copy.</p>
    </div>
  </div>
</section>
```

## API

Attributes:

- `data-ls-align="start|center|end"` — inline placement and text alignment; default is `center`.
- `data-ls-valign="start|center|end"` — block-axis placement; default is `center`.
- `data-ls-size="compact|hero"` — optional sizing presets.

Variables:

- `--ls-centered-statement-max-inline`
- `--ls-centered-statement-title-max-inline`
- `--ls-centered-statement-support-max-inline`
- `--ls-centered-statement-gap`

The content wrapper has an explicit width, so container queries and title sizing do not collapse the layout.

## Copy

Copy `centered-statement.css` after `core/base` styles.
