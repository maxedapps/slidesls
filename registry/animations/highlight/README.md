# Highlight Animation

Static or reveal-timed highlight emphasis for marked text or data.

## Usage

Use `.ls-highlight` for static emphasis.

Use `.ls-reveal ls-reveal-highlight` with `data-step` (or a reveal sequence) when the highlight should be timed by the reveal runtime:

```html
<strong class="ls-reveal ls-reveal-highlight" data-step="2">Important result</strong>
```

Do not use `.ls-reveal-highlight` without `.ls-reveal` for reveal-timed behavior.

Variables: `--ls-highlight-animation-duration`, `--ls-highlight-animation-accent`, `--ls-highlight-animation-spread`.

## Copy

Copy `highlight.css` after `core/base` and `animations/reveal` styles.
