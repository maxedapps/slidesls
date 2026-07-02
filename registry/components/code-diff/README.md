# Code Diff

Compact static code-diff component for explaining focused implementation changes.

## Usage

```html
<figure class="ls-code-diff" data-ls-density="compact">
  <figcaption class="ls-code-diff__header">
    <span>registry/source.mjs</span>
    <span>dependency order</span>
  </figcaption>
  <div class="ls-code-diff__body" role="list" aria-label="Code diff excerpt">
    <div class="ls-code-diff__line" data-ls-diff="add" role="listitem">
      <span class="ls-code-diff__number">43</span>
      <span class="ls-code-diff__code"
        ><span class="ls-code-diff__marker">+</span>return sortDependenciesFirst(queue);</span
      >
    </div>
  </div>
</figure>
```

Key classes/attributes:

- `.ls-code-diff`
- `.ls-code-diff__header`
- `.ls-code-diff__body`
- `.ls-code-diff__line`
- `.ls-code-diff__number`
- `.ls-code-diff__code`
- `.ls-code-diff__marker`
- `data-ls-density="compact"`
- `data-ls-diff="add|remove|focus"` on lines

Variables:

- `--ls-code-diff-font-size`
- `--ls-code-diff-padding-block`
- `--ls-code-diff-max-block-size`

Use short excerpts. Wide code intentionally scrolls in the diff body for authoring safety; choose line breaks or smaller excerpts for reviewed presentation/PDF slides.

## Copy

Copy `code-diff.css` after `core/base` styles. The component is standalone and does not require a syntax highlighter.
