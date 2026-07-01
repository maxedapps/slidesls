# Table

Presentation-friendly semantic table styling.

## Usage

Use `.ls-table` directly on a semantic `<table>`. Native captions are supported without clipping.

```html
<table class="ls-table" data-ls-variant="striped">
  <caption>
    Operating model comparison
  </caption>
  <thead>
    ...
  </thead>
  <tbody>
    ...
  </tbody>
</table>
```

For a clipped decorative surface, keep captions outside the clipped frame. `.ls-table-frame` aligns to the start by default so tables do not stretch misleadingly inside grid/fill regions:

```html
<figure>
  <figcaption class="ls-table__caption">Operating model comparison</figcaption>
  <div class="ls-table-frame">
    <table class="ls-table">
      ...
    </table>
  </div>
</figure>
```

Classes: `.ls-table-frame`, `.ls-table__caption`, `.ls-table__note`, `.ls-table__value`, `.ls-table__muted`.

Attributes: `data-ls-density="compact"`, `data-ls-variant="striped|plain"`.

Variables: `--ls-table-min-inline`, `--ls-table-cell-padding`, `--ls-table-accent`.

## Copy

Copy `table.css` after `core/base` styles.
