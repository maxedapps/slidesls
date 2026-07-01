# Fade

Opacity-only reveal variant.

## Usage

Load after `animations/reveal`, then combine with reveal markup. Use `.ls-reveal` plus at most one transform variant (`ls-reveal-fade`, `ls-reveal-slide-up`, or `ls-reveal-scale-in`) on an element. The variant uses runtime `data-ls-reveal-state` from `animations/reveal` so it works with arbitrary step counts:

```html
<p class="ls-reveal ls-reveal-fade" data-step="1">Fade in</p>
```

## Copy

Copy `fade.css` after `core/base` and `animations/reveal` styles.
