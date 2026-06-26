# animations/reveal

Vanilla CSS reveal transitions for slide content.

Requires `core/base`. Add `.ls-reveal` and `data-step="1"` to elements that should reveal during the first deck advance. Use `--ls-delay` for subtle staggered builds.

The core runtime controls each slide's active step. This initial recipe includes selectors for up to three reveal steps; extend it when a deck needs deeper sequencing. `?export=1` or `?export=pdf` reveals all content when JavaScript is available.
