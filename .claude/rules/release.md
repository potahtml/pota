---
paths:
  - "documentation/**"
  - "tools/**"
---

# Release tooling

- Scripts in `tools/` drive versioning, generation, and publishing workflows
  (`generate.js`, `release.js`). Read `documentation/todo.md` and
  `documentation/breaking-changes.md` when changing behavior or messaging.
- Docs-site generated outputs live under `generated/docs/` (`importmap.json`,
  `types.json`) and are gitignored; do not assume they are committed—regenerate
  via `npm run watch:generate` when needed.
- Prefer minimal, explicit changes: release code is easy to break in subtle ways
  (paths, cwd assumptions, npm publish side effects).
