# Media

Screenshot and product frames: browser chrome with an address bar, a plain window, or bare shadowed media. A frame makes a real asset read as intentional product evidence instead of a floating rectangle. Media requires a real screenshot or recording — it is step one of the image-sourcing ladder, not a fallback.

## Usage

- `.ls-media` — the framed shell; it fills its grid area, so place it in a sized region (split or dashboard layouts).
- `.ls-media__chrome` — the top chrome row.
- `.ls-media__dots` — three traffic-light dots; author as `<i></i><i></i><i></i>`.
- `.ls-media__address` — the address pill; put the product URL there.
- `.ls-media__body` — the media well; a direct `<img>` or `<video>` child covers it, cropped from the top (screenshots keep their header visible). Give the image a descriptive `alt`.

Modifiers:

- `.ls-media--window` — window chrome without the address bar (native-app feel).
- `.ls-media--bare` — no chrome row; just the bordered, shadowed media.

## When not to use

- No real asset exists — do not fake UI; use `components/figure` with `--abstract` or drop the slot.
- Diagrams and photos — browser chrome misleads; `components/figure` frames non-product visuals.
- Terminal output — `components/code` with `data-ls-variant="terminal"` stays crisp and copyable.

## Copy

Copy `media.css` after `core/base` styles.
