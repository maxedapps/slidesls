# slidesls

A skill-guided slide design system for AI agents. Decks are plain, editable HTML/CSS/JS with no runtime dependency on slidesls or any framework.

The system, not just a snippet library:

- **Five art directions (styles)** — `editorial`, `terminal`, `gallery`, `boardroom`, `pop`. A style is tokens + vendored typefaces + texture + shape + slide furniture + a motion signature, activated by one `data-ls-style` attribute on `<html>`. Exactly one per deck.
- **Nine archetypes with content contracts** — complete slide patterns (`title-hero`, `statement`, `section`, `big-stat`, `process-flow`, `comparison`, `evidence`, `walkthrough`, `dashboard`) whose slot counts and word limits are machine-checked, so columns align and boxes stay balanced because the content fits, not because type shrank.
- **A content vocabulary beyond boxes** — 14 components (`surface`, `statement`, `stat`, `figure`, `list`, `code`, `chart`, `flow`, `media`, `quote`, `table`, `badge`, `divider`, `progress`) plus `layouts/core` compositions with alignment guarantees.
- **Motion by default** — slide transitions and staggered entrances ship with every style's signature; `data-step` reveals are opt-in where sequence carries meaning; export, print, and `prefers-reduced-motion` render static.
- **Vendored OFL fonts** — eight variable font families copied into the deck, each with its own `OFL.txt`. No font CDNs.
- **Inline Lucide icon sprite** — a curated icon subset delivered as an inline `<svg>` sprite kept in sync by `slidesls icons sync`. No icon CDNs, no emoji soup.
- **Taste lints + scorecard** — `slidesls validate` catches provable defects as errors and taste signatures (card-grid monotony, placeholder visuals, contract violations) as precise advisory warnings; `validate --report` adds a deck scorecard.
- **A visual gate** — `slidesls visual-qa` measures rendered facts (fill ratios, type sizes, WCAG contrast) in a real browser; static validation alone is never "done".

NPM package: [`@maxedapps/slidesls`](https://www.npmjs.com/package/@maxedapps/slidesls)
Binary: `slidesls`

## Quickstart

```sh
npx -y @maxedapps/slidesls@latest init ./my-deck --template minimal --style editorial --title "My Deck"
cd my-deck
npx -y @maxedapps/slidesls@latest validate . --report
npx -y @maxedapps/slidesls@latest preview .
```

`init --style <name>` copies the style, its vendored fonts, and the core assets into the deck, links everything in the entry HTML, and sets `data-ls-style` on `<html>`. Use a dedicated deck folder inside larger projects:

```sh
slidesls init ./slides/my-deck --template minimal --style terminal --title "Architecture Review"
```

## The copyable, no-runtime-dependency model

slidesls is an authoring tool, not a framework. `init` and `add` copy registry assets into the deck's `slidesls/` directory; the deck owns those files and may edit them. A deployed deck needs only its own HTML/CSS/JS/assets — the npm package is never a runtime dependency, and there is no build step.

`add` also works without `init`: pointing `--dir` at a project with no `slidesls.json` uses copy mode and writes assets under `--base-dir` (default `slidesls`).

## For AI agents

The package bundles an agent skill that carries the full authoring workflow (style brief, rhythm plan, contracts, motion pass, QA loop):

```sh
npx -y @maxedapps/slidesls@latest skill show
npx -y @maxedapps/slidesls@latest skill install <your-agent-skill-dir>/create-slides-with-slidesls
```

After installing, agents should fully read `SKILL.md` and the relevant `references/` files before authoring. Discovery is incremental and JSON-first:

```sh
slidesls catalog --type style --json      # pick the deck's art direction
slidesls catalog --type archetype --json  # slide patterns with contracts
slidesls catalog --intent prove --json    # find items by what a slide must DO
slidesls inspect archetypes/big-stat --json
slidesls validate ./my-deck --report --json
```

## Validation and visual QA

`slidesls validate` is offline and deterministic: errors are provable defects (missing runtime, broken style activation, icons missing from the sprite, dead asset links); warnings are taste signatures with precise hints, suppressible per slide with `data-ls-lint="off"` when a deviation is deliberate. `--report` adds the deck scorecard — necessary, never sufficient: rendered review still decides.

For the rendered half, keep `slidesls preview` running, collect browser facts with `slidesls visual-qa --eval`, and analyze with `slidesls visual-qa --analyze` — it reports measured findings (low fill, sparse equal boxes, small body type, WCAG `low_contrast`) with a deep link per slide.

## Documentation

- [CLI reference](./docs/cli.md)
- [Deck contract](./docs/deck-contract.md) — what a generated deck contains and its stable API.
- [Validation](./docs/validation.md) — every error and warning code.
- [Agent workflow](./docs/agent-workflow.md) — the end-to-end agent path.
- [Registry contract](./docs/registry-contract.md) — item metadata for contributors.
- [Publishing](./docs/publishing.md) — release flow.
- [PROJECT.md](./PROJECT.md) — repo layout and contributor guide.

## Licenses

- The package itself is MIT licensed (see [LICENSE](./LICENSE)).
- Vendored fonts (`registry/fonts/*`) are licensed under the SIL Open Font License 1.1; each family directory ships its own `OFL.txt`, and both are copied into decks that use the family.
- Icons are a curated subset of [Lucide](https://lucide.dev) (ISC license); `slidesls icons sync` writes the license text to `slidesls/registry/icons/LICENSE` in decks that use icons.
