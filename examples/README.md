# Examples

Examples are repo-local demo and validation decks for slidesls registry items. They are plain HTML files that use repo-relative assets so changes can be checked without publishing a package.

Preview all examples:

```sh
pnpm serve:examples
```

Validate example links:

```sh
slidesls validate-examples
```

Downstream generated decks normally start with `slidesls init`; examples intentionally remain repo-relative to demonstrate registry assets in place.
