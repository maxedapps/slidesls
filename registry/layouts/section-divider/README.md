# Section Divider

Clean chapter or section transition layout. The default is centered and undecorated; ambience is opt-in.

## Minimal markup

```html
<section class="ls-slide">
  <div class="ls-slide__inner ls-section-divider">
    <div class="ls-section-divider__content">
      <p class="ls-section-divider__number">01</p>
      <h2 class="ls-section-divider__title">Section title</h2>
      <p class="ls-section-divider__text">Optional section context.</p>
    </div>
  </div>
</section>
```

## API

Attributes:

- `data-ls-align="start|center|end"` — inline placement and text alignment; default is `center`.
- `data-ls-valign="start|center|end|space-between"` — block-axis placement; default is `center`.
- `data-ls-ambient="radial|wash"` — opt-in decorative background ambience.

Variables:

- `--ls-section-divider-max-inline`
- `--ls-section-divider-title-max-inline`
- `--ls-section-divider-gap`
- `--ls-section-divider-bg`
- `--ls-section-divider-accent`
- `--ls-section-divider-ambient-opacity` such as `18%` or `28%`

## Examples

```html
<div class="ls-slide__inner ls-section-divider" data-ls-ambient="wash">...</div>
```

Use `data-ls-valign="space-between"` only for designs with a meaningful footer/meta region.

## Copy

Copy `section-divider.css` after `core/base` styles.
