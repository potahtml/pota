---
paths:
  - 'src/**'
---

# `@url` documentation links

Exported symbols carry a JSDoc `@url` tag linking to their page on the
docs site (`https://pota.quack.uy/…`). The path **mirrors
`documentation/content/`**: the docs build derives each page's `href`
as `/` plus its content-file path under `documentation/content/`
(minus the `.md`), casing preserved
(`projects/docs/tools/vite-plugin-content.js` → `routeId`). A page's
basename equals the export name it documents.

- `documentation/content/components/For.md` →
  `@url https://pota.quack.uy/components/For`
- `documentation/content/use/keyboard/shortcut.md` →
  `@url https://pota.quack.uy/use/keyboard/shortcut`
- `documentation/content/setAttribute.md` →
  `@url https://pota.quack.uy/setAttribute`

Namespace prefixes follow the subpath exports: `components/`,
`store/`, `xml/`, and `use/<module>/` for multi-export `use/*` files
(`src/use/color.js` → `use/color/<export>`). Main-`pota` exports
(reactivity, renderer, props, scheduler helpers) sit at the **root**
(`/render`, `/signal`, `/setProperty`), not under a prefix.

- Add `@url` only when the page actually exists — link to the
  **specific** export page, not just the module overview when a
  per-export page is present. If no page exists, omit `@url`; don't
  invent a path.
- When a content page is renamed or moved, update the matching `@url`
  so it keeps resolving.
