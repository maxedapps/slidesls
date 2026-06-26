# Timeline Strip

Full-slide horizontal roadmap or process strip.

## Usage

Root `.ls-timeline-strip`; regions/classes:

- `.ls-timeline-strip__intro`
- `.ls-timeline-strip__track`
- `.ls-timeline-strip__line`
- `.ls-timeline-strip__item`
- `.ls-timeline-strip__marker`
- `.ls-timeline-strip__title`
- `.ls-timeline-strip__text`

Attributes:

- `data-ls-density="compact|comfortable"`
- `data-ls-valign="start|center|space-between"`
- `data-ls-progress="true"` for a static progress line fallback

For animated timelines, add an explicit line child and let the runtime auto-sequence direct reveal items:

```html
<div class="ls-timeline-strip__track ls-step-focus" data-ls-reveal-sequence>
  <div class="ls-timeline-strip__line" data-step="1" aria-hidden="true"></div>
  <article class="ls-timeline-strip__item ls-reveal">Q1</article>
  <article class="ls-timeline-strip__item ls-reveal">Q2</article>
</div>
```

Variables: `--ls-timeline-strip-columns`, `--ls-timeline-strip-gap`, `--ls-timeline-strip-accent`.

## Copy

Copy `timeline-strip.css` after `core/base` styles. Animated examples pair with `animations/reveal` and optionally `animations/step-focus`.
