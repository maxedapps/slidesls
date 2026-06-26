# Stagger

Within-step delay sequencing for grouped reveal children.

## Usage

Load after `animations/reveal`, add `.ls-stagger` to a parent, and put `.ls-reveal` on children:

```html
<ul class="ls-bullet-list ls-stagger">
  <li class="ls-reveal" data-step="1">First</li>
  <li class="ls-reveal" data-step="1">Second</li>
</ul>
```

Customization variables:

- `--ls-stagger-base`
- `--ls-stagger-step`

The default CSS assigns delays for the first eight direct children. Extend the `:nth-child()` rules if a copied deck needs more.

## Copy

Copy `stagger.css` after `core/base` and `animations/reveal` styles.
