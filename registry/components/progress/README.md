# Progress

Native progress or custom accessible progress bar.

## Usage

Use native `<progress class="ls-progress">` for the simplest accessible static bar:

```html
<progress class="ls-progress" value="62" max="100" aria-label="Rollout progress">62%</progress>
```

Use custom markup when you need labels, card-like composition, or reveal-aware fill animation:

```html
<div
  class="ls-progress ls-reveal"
  data-ls-animate="fill"
  data-step="2"
  style="--ls-progress-value: 62%"
  role="progressbar"
  aria-label="Rollout progress"
  aria-valuenow="62"
  aria-valuemin="0"
  aria-valuemax="100"
>
  <div class="ls-progress__label">
    <span>Rollout</span><span class="ls-progress__value">62%</span>
  </div>
  <div class="ls-progress__track"><div class="ls-progress__bar"></div></div>
</div>
```

Classes: `.ls-progress__track`, `.ls-progress__bar`, `.ls-progress__label`, `.ls-progress__value`.

Attributes: `data-ls-density="compact|spacious"`, `data-ls-tone="success|warning|danger"`, `data-ls-animate="fill"`. Omit `data-ls-tone` for the default accent gradient.

Variables: `--ls-progress-value`, `--ls-progress-accent`, `--ls-progress-thickness`, `--ls-progress-label-size`.

## Copy

Copy `progress.css` after `core/base` styles. Animated fills pair with `animations/reveal`.
