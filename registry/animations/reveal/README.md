# animations/reveal

Vanilla CSS reveal transitions for slide content.

## Usage

Add `.ls-reveal` and `data-step="1"` to elements that should reveal during the first deck advance:

```html
<p class="ls-reveal" data-step="1">Shown on the first advance</p>
```

The core runtime keeps the public `data-step` API and adds runtime state:

- `data-ls-reveal-state="future"` — hidden.
- `data-ls-reveal-state="current"` — the active reveal step.
- `data-ls-reveal-state="past"` — already revealed.

This supports arbitrary positive step counts; copied decks no longer need to extend hard-coded CSS selectors for step 4+.

Use `data-ls-reveal-sequence` on a group to auto-assign missing `data-step` values to direct `.ls-reveal` children in DOM order while respecting explicit steps.

```html
<ol data-ls-reveal-sequence>
  <li class="ls-reveal">First</li>
  <li class="ls-reveal">Second</li>
</ol>
```

`?export=1` or `?export=pdf` reveals all stepped content when JavaScript is available.

Animation variants compose by adding `.ls-reveal` plus at most one transform variant (`ls-reveal-fade`, `ls-reveal-slide-up`, or `ls-reveal-scale-in`) to the same element. Do not stack multiple transform variants; they intentionally share transform state.
