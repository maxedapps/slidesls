# Project intro example

Two-slide example deck that validates the initial ls_slides registry foundation.

## Run locally

From the repository root:

```sh
pnpm serve:examples
```

Open:

```txt
http://localhost:4173/examples/project-intro/
```

Use ArrowRight/Space to reveal or advance, ArrowLeft to go back, Home/End to jump. Add `?export=1` or `?export=pdf` to show all reveal content without animation.

## Registry items used

- `core/base`
- `animations/reveal`
- `layouts/title-hero`
- `layouts/detail-split`
- `components/badge`
- `components/card`
- `components/diagram`

## Font presets

Font presets can be loaded as optional scoped token remaps:

```html
<link rel="stylesheet" href="../../registry/presets/fonts/editorial-serif/font.css" />
<body class="ls-page" data-ls-font="editorial-serif"></body>
```

You can also apply a preset to one slide with `data-ls-font` on `.ls-slide`.

## Icons

This example loads Lucide from a pinned jsDelivr URL:

```txt
lucide@0.468.0
```

The registry styles target generic `.ls-icon*` wrappers and generated SVGs, so consumers can use Lucide, inline SVG, or another icon source.
