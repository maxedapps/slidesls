# Asymmetric Feature

Robust two-region editorial layout with a statement region and a normal-flow content stack.

## Minimal markup

```html
<section class="ls-slide">
  <div class="ls-slide__inner">
    <div class="ls-slide__body ls-asymmetric-feature">
      <div class="ls-asymmetric-feature__statement">
        <p class="ls-eyebrow">Editorial mode</p>
        <h2 class="ls-asymmetric-feature__headline">Bold statement.</h2>
      </div>
      <div class="ls-asymmetric-feature__stack">
        <article class="ls-card">...</article>
        <aside class="ls-asymmetric-feature__annotation">Normal-flow annotation.</aside>
      </div>
    </div>
  </div>
</section>
```

## API

Attributes:

- `data-ls-ratio="statement-wide|balanced|stack-wide"` — column ratio preset.
- `data-ls-valign="start|center|end|stretch"` — vertical alignment for both regions; default is `center`.
- `data-ls-stack-align="start|center|end|stretch"` — vertical alignment inside the stack.

Variables:

- `--ls-asymmetric-feature-statement-fr`
- `--ls-asymmetric-feature-stack-fr`
- `--ls-asymmetric-feature-gap`
- `--ls-asymmetric-feature-stack-gap`
- `--ls-asymmetric-feature-headline-max-inline`

## Notes

`data-ls-anchor` and anchor-positioned/floating annotations were removed from this primitive. Annotations stay in normal stack flow so modern browser support cannot create overlap. If a future deck needs floating labels, use or create a dedicated annotation primitive.

## Copy

Copy `asymmetric-feature.css` after `core/base` styles.
