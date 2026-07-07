# Styles

Art directions for slidesls v2 decks. A style is tokens + fonts + texture + shape + furniture treatment + motion signature, activated by a single `data-ls-style="<name>"` attribute on `<html>`.

Exactly one style per deck. Styles depend on font families in `registry/fonts/` via `registryDependencies`, so `add`/`init` copies each family once per deck.

Items in this group carry `status: "preview"` until the v2 vocabulary ships (0.7.0).
