# Registry

Copyable slidesls building blocks live here. Items are framework-agnostic, dependency-light, and editable after copying.

## Item anatomy

Each item directory should include:

- implementation files such as `.css` or `.js` when the item has copied assets;
- `registry-item.json` metadata;
- `README.md` with item-specific usage/API notes;
- optional `snippets/*.html` for paste-ready markup.

The root `registry.json` indexes metadata files.

## Categories

- `core/base` — required reset, tokens, slide shell, and runtime assets.
- `utilities/` — layout helpers that work anywhere.
- `components/` — standalone content, data, media, technical, and visual primitives.
- `templates/` — full slide skeleton snippets composed from utilities and components.
- `animations/` — optional reveal-compatible animation recipes.
- `presets/` — scoped token/style remaps such as font-family presets.

## Copy model

Use `slidesls add <items...>` to resolve `registryDependencies`, copy files safely, and update the deck manifest. Manual copying is supported, but load `core/base` before other items.

Recommended discovery flow:

```sh
slidesls catalog --recommended --json
slidesls inspect templates/split --json
slidesls add utilities/layout components/panel components/card
```

Template snippet HTML is exposed through `inspect`; it is not copied into deck assets by `add`.

## Validation

Run `slidesls validate-registry` after changing metadata or registry files.
