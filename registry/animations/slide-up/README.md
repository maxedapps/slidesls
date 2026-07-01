# Slide Up

Configurable larger vertical reveal variant.

## Usage

Load after `animations/reveal`, then combine with reveal markup. Use `.ls-reveal` plus at most one transform variant (`ls-reveal-fade`, `ls-reveal-slide-up`, or `ls-reveal-scale-in`) on an element. The variant uses runtime `data-ls-reveal-state` from `animations/reveal` so it works with arbitrary step counts:

```html
<p class="ls-reveal ls-reveal-slide-up" data-step="1">Slide up</p>
```

Customization variables:

- `--ls-slide-up-distance`
- `--ls-slide-up-duration`
- `--ls-slide-up-ease`

## Copy

Copy `slide-up.css` after `core/base` and `animations/reveal` styles.
