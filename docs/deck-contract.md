# Deck contract

A generated deck is plain HTML/CSS/JS: one entry HTML file, a `slidesls/` directory of copied assets the deck owns, and two JSON files (`slidesls.json`, `slidesls/manifest.json`). The npm package is not a runtime dependency — a deployed deck needs only these files.

## Entry HTML anatomy

`slidesls init --style <name>` generates an entry file with this shape:

```html
<!doctype html>
<html lang="en" data-ls-style="editorial">
  <head>
    <!-- core: reset, tokens, slide shell, icons, motion -->
    <link rel="stylesheet" href="./slidesls/registry/core/base/reset.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/tokens.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/slide.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/icons.css" />
    <link rel="stylesheet" href="./slidesls/registry/core/base/motion.css" />
    <!-- the style's font families, then the style itself -->
    <link rel="stylesheet" href="./slidesls/registry/fonts/fraunces/font.css" />
    <link rel="stylesheet" href="./slidesls/registry/fonts/newsreader/font.css" />
    <link rel="stylesheet" href="./slidesls/registry/fonts/jetbrains-mono/font.css" />
    <link rel="stylesheet" href="./slidesls/registry/styles/editorial/style.css" />
    <!-- layouts and components used by the deck -->
    <link rel="stylesheet" href="./slidesls/registry/layouts/core/layout.css" />
    <link rel="stylesheet" href="./slidesls/registry/layouts/core/utilities.css" />
    <!-- the runtime, deferred -->
    <script defer src="./slidesls/registry/core/base/slide-runtime.js"></script>
  </head>
  <body class="ls-page">
    <!-- inline icon sprite; slidesls icons sync rewrites its <symbol> contents -->
    <svg class="ls-sprite" aria-hidden="true"></svg>
    <main class="ls-deck" data-ls-deck aria-label="My Deck">
      <section class="ls-slide" data-ls-slide-kind="content" aria-label="Next steps">
        <div class="ls-slide__inner">
          <header class="ls-slide__header">
            <p class="ls-eyebrow">Kicker</p>
            <h2 class="ls-title">Slide title</h2>
          </header>
          <div class="ls-slide__body"><!-- layout + components --></div>
          <footer class="ls-slide__footer">
            <span>My Deck</span>
            <span data-ls-page-number></span>
          </footer>
        </div>
      </section>
    </main>
  </body>
</html>
```

Required shell, enforced by `slidesls validate`:

- `<body class="ls-page">`
- one `.ls-deck[data-ls-deck]` element
- one or more `.ls-slide` elements, each preferably declaring `data-ls-slide-kind="content" | "hero" | "section"`
- `slide-runtime.js` loaded as a classic `defer` or module script

Footer furniture: content slides carry a `.ls-slide__footer`; the runtime fills every `[data-ls-page-number]` element at init, so page numbers work without any authored state. The style controls the footer treatment (rule, casing, tracking).

## Copied assets (`slidesls/`)

`init` and `add` copy registry files under `slidesls/registry/<group>/<item>/...` and JSON schemas under `slidesls/schema/`. Notable contents:

- `registry/core/base/` — `reset.css`, `tokens.css`, `slide.css`, `icons.css`, `motion.css`, `slide-runtime.js`.
- `registry/fonts/<family>/` — the family's latin variable `.woff2`, its `font.css` (`@font-face`), and its own `OFL.txt` (SIL Open Font License 1.1).
- `registry/styles/<name>/style.css` — the deck's one art direction.
- `registry/icons/LICENSE` — Lucide ISC license text, written by `slidesls icons sync` for decks that use sprite icons.

The deck owns these files: editing them is legitimate customization. The manifest records copied files with hashes; `validate` reports edits as informational `customizedFiles` (an error only under `--strict`).

## Config and manifest

- `slidesls.json` — project config: registry mode and `paths` (`items`, `entry`, `assets`, `snapshots`).
- `slidesls/manifest.json` — records `cliVersion`, `registrySource`, `requestedItems`, `dependencyOrder`, `copiedFiles` (with `sha256`), and the canonical `links`/`scripts` load tags. Validation uses it for hash drift, load-tag cross-checks, and legacy-rule routing (`cliVersion` < 0.6.0 decks get the frozen v1 lints).

## Style activation contract

Exactly one style per deck:

1. `registry/styles/<name>/style.css` is linked (after core and the style's `font.css` files);
2. every font family in the style's `registryDependencies` has its `font.css` linked;
3. `<html>` carries `data-ls-style="<name>"`.

`validate` enforces all three (`style_conflict`, `style_missing`, `style_fonts_missing`). `init --style <name>` wires them; adding a style later means `slidesls add styles/<name> --dir <deck> --dry-run --json`, inserting the returned load tags, and setting the attribute. Do not stack styles or hand-link fonts from another style.

## Icons

Icons render from the deck's inline sprite: `<svg class="ls-icon"><use href="#ls-i-<name>"/></svg>`. After adding or removing icon references, run `slidesls icons sync --dir <deck> --json` to rewrite the sprite. One icon system per deck: sprite icons or nothing; emoji in icon slots only when the deck opts in with `data-ls-icons="emoji"` on the deck element.

## Motion

Motion is on by default, in three layers:

1. **Slide transitions** (automatic) — driven by the runtime via the Web Animations API, interruptible under rapid navigation. The style sets the default kind; override per deck with `data-ls-transition="fade | rise | slide | none"` on the deck element.
2. **Staggered entrances** (automatic) — direct children of the slide body settle in with the style's cadence; the runtime descends one level into layout containers (`ls-layout`, `ls-grid`, `ls-stack`, `ls-cluster`) or anything marked `data-ls-stagger`. First load renders slide 1 static.
3. **Step reveals** (opt-in) — `data-step="N"` + `.ls-reveal` reveals on ArrowRight where sequence carries meaning; `data-ls-reveal-sequence` on a container auto-numbers its `.ls-reveal` children.

Choreography rule (built-in): the slide transition and the child stagger never both translate — with a `rise`/`slide` transition the runtime degrades child entrances to opacity-only.

### Kill switches

- `?export=1` (or `?export=pdf`) and print render all slides static with every step revealed.
- `prefers-reduced-motion` collapses motion to instant opacity changes.
- `data-ls-motion="none"` on the deck or on one slide disables transitions and entrances there. Deck-wide use is surfaced by the `motion_absent` lint so it stays a decision, not a leak.

## Authoring attributes (stable API)

- `data-ls-style` on `<html>` — activates the deck's art direction.
- `data-ls-slide-kind` on `.ls-slide` — `content` (header + body + footer), `hero`, or `section` (may intentionally center full-slide layouts; do not use `ls-slide-fill` on content slides).
- `data-ls-archetype` on `.ls-slide` — names the archetype; powers contract linting, the scorecard, and monotony detection.
- `data-ls-density` on `.ls-slide` — `compact` or `spacious`.
- `data-ls-lint="off"` on `.ls-slide` — suppresses advisory lints for that slide only.
- `data-ls-transition`, `data-ls-motion`, `data-ls-icons` — deck-level switches described above.
- `data-step`, `data-ls-reveal-sequence`, `data-ls-stagger` — motion hooks described above.

Customize visuals through token overrides in a deck-level `@layer tokens` block and documented component variants — never by overriding `.ls-*` selectors in unlayered deck CSS (unlayered rules beat all component layers). Discover safe variables via `slidesls inspect <item> --api --json` (`cssVariables` entries carry `overrideSafe` and `default`).

## Deep links

Runtime URLs may include `#slide=2&step=1`:

- `slide` is 1-based; `step` is 0-based (`0` is the initial unrevealed state).
- Missing or invalid values clamp to safe defaults.
- Export mode ignores hash state and renders all slides and reveals.

`preview --json` returns per-slide deep links as `slideLinks`.
