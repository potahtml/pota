---
paths:
  - 'documentation/**'
  - 'tools/**'
  - '.claude/skills/breaking-changes/**'
---

# Release tooling

- Scripts in `tools/` drive versioning, generation, and publishing
  workflows (`generate.js`, `release.js`). `release.js` bumps the
  patch version, writes `src/version.js`, commits, creates a signed
  annotated tag with a minimal `-m "v<version>"` message, pushes, then
  publishes. Read `documentation/todo.md` when changing release
  behavior.
- Document a breaking change for consumers in the **breaking-changes
  skill** (`.claude/skills/breaking-changes/SKILL.md`), not in a
  changelog file. Add a consumer-facing before/after migration entry
  to the matching section, tagged with the version it ships in (e.g.
  `(0.20.234)`); keep maintainer/release mechanics out of that
  consumer-facing body. Never edit `package.json` or `src/version.js`
  by hand — `release.js` runs `npm version patch` at publish.
- Docs-site generated outputs live under `generated/docs/`
  (`importmap.json`, `types.json`) and are gitignored; do not assume
  they are committed—regenerate via `npm run watch:generate` when
  needed.
- Prefer minimal, explicit changes: release code is easy to break in
  subtle ways (paths, cwd assumptions, npm publish side effects).
