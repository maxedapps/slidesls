# Figure

The image and diagram frame — and the sanctioned abstract-art fallback. A figure hosts a real asset (screenshot, photo), an authored SVG diagram, or, when neither exists, a token-colored CSS composition (`--abstract`) that is designed to be shown, not to apologize. Text in a panel pretending to be a visual is never sanctioned.

## Usage

Author as a `<figure>` element:

- `.ls-figure` — the frame; content-sized by default.
- `.ls-figure__media` — the media well. Direct `img`/`video` children cover it; direct `svg` children scale to full width.
- `.ls-figure__caption` — subtle label-font caption; use a `<figcaption>`.

Modifiers:

- `.ls-figure--frame` — hairline border for screenshots that would bleed into the background.
- `.ls-figure--edge` — square, unrounded media for diagrams and technical plots.
- `.ls-figure--fill` — the figure stretches to its grid area (split layouts).
- `.ls-figure--abstract` — intentional token-colored art. Leave the media element empty and add `aria-hidden="true"`; styles override `--ls-abstract-art` with their own generative layers.

The image-sourcing ladder, in order: real asset → authored diagram (`components/flow`, `components/chart`, hand-written SVG) → `--abstract` → the archetype's no-figure variant. SVG diagrams need `role="img"` and an `aria-label`.

## When not to use

- The "visual" would just restate the slide title in a colored box — drop the slot instead.
- The content has inherent structure — author it with `components/flow` or `components/chart`.
- The asset is product UI that benefits from browser or window chrome — use `components/media`.

## Copy

Copy `figure.css` after `core/base` styles.
