# File Tree

Static file/folder tree for project structure slides.

## Usage

Use nested lists and mark folders/files with data attributes:

```html
<ul class="ls-file-tree" data-ls-density="compact" aria-label="Project structure">
  <li class="ls-file-tree__item" data-ls-kind="folder">
    <span class="ls-file-tree__name">deck/</span>
    <ul>
      <li class="ls-file-tree__item" data-ls-state="active">
        <span class="ls-file-tree__name">index.html</span>
        <span class="ls-file-tree__meta">entry</span>
      </li>
    </ul>
  </li>
</ul>
```

Key classes/attributes:

- `.ls-file-tree`
- `.ls-file-tree__item`
- `.ls-file-tree__name`
- `.ls-file-tree__meta`
- `data-ls-kind="folder|file"`
- `data-ls-state="active"`
- `data-ls-density="compact"`

Keep trees shallow and short. Use text labels instead of mandatory icon libraries; Lucide icons can be added separately when the deck opts in.
