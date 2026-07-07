# Layouts

Slide-body compositions with alignment guarantees, plus slide furniture (footer, kicker, page number).

Aligned layouts use a declared row skeleton (heading / body / footer subgrid rows) so columns align by construction; each aligned layout also offers a `--free` variant that opts out for irregular content. Every layout defines where surplus space goes instead of blanket vertical centering.

Markup convention (load-bearing): every layout container carries the base class `ls-layout` alongside its modifier (`class="ls-layout ls-layout--split"`). The runtime's auto-stagger traversal descends one level into `.ls-layout` containers; a modifier-only class would not be descended.

Items in this group carry `status: "preview"` until the v2 vocabulary ships (0.7.0).
