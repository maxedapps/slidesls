# Code Block

Presentation-ready code snippets without a syntax highlighter dependency.

## Usage

Use semantic `pre` and `code` markup. Two root patterns are supported.

Direct semantic block:

```html
<pre class="ls-code-block"><code>const value = 42;</code></pre>
```

Framed block with a header or caption:

```html
<figure class="ls-code-block">
  <figcaption class="ls-code-block__header">example.js</figcaption>
  <pre><code>const value = 42;</code></pre>
</figure>
```

Key classes/attributes:

- `.ls-code-block`
- `.ls-code-block__header`
- `data-ls-density="dense"`

Variables:

- `--ls-code-padding`
- `--ls-code-max-block-size`
- `--ls-code-font-size`

Padding is applied to the actual `<pre>` scroll surface in both root patterns, so wrapper mode does not double-pad the frame. Overflow scrollbars are intentional for authoring safety but are not presentation/PDF-safe; keep snippets short enough to fit visually, or use `data-ls-density="dense"`, `--ls-code-font-size`, and `--ls-code-max-block-size` for reviewed compact excerpts.

## Copy

Copy `code-block.css` after `core/base` styles.
