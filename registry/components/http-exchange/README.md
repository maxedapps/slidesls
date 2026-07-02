# HTTP Exchange

Static request/response blocks for API walkthrough slides.

## Usage

```html
<div class="ls-http-exchange" data-ls-density="compact">
  <figure class="ls-http-exchange__block">
    <figcaption class="ls-http-exchange__header">
      <span class="ls-http-exchange__method">POST</span>
      <span class="ls-http-exchange__url">/api/decks/preview</span>
    </figcaption>
    <pre><code>{ "entry": "index.html" }</code></pre>
  </figure>
</div>
```

Key classes/attributes:

- `.ls-http-exchange`
- `.ls-http-exchange__block`
- `.ls-http-exchange__header`
- `.ls-http-exchange__method`
- `.ls-http-exchange__status`
- `.ls-http-exchange__url`
- `data-ls-density="compact"`
- `data-ls-tone="success|warning|danger"` on status labels

Use short URLs and compact payloads. Long code scrolls as an authoring safety net; visually review export/PDF slides.
