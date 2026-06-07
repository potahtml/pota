// Shared path resolution for the docs-review helper scripts.
//
// These scripts live at <repo>/tools/ai-docs-review/ and are
// version-tracked (durable across fresh checkouts / `npm run clean`).
// They resolve the
// docs project relative to their own location, so they run correctly
// from any cwd.
//
// Reuse against a different docs project by setting DOCS_DIR, or a
// different content tree by setting CONTENT_DIR (each absolute, or
// relative to the current working directory):
//   CONTENT_DIR=path/to/other-content node .../validate.mjs
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

// .../tools/ai-docs-review/_paths.mjs → up 2 = repo root
const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = resolve(HERE, '..', '..')

export const DOCS = process.env.DOCS_DIR
	? resolve(process.env.DOCS_DIR)
	: join(REPO, 'projects', 'docs')

// The content markdown lives in the pota repo (documentation/content),
// consumed by the docs project via a glob import; progress.md and
// topics.js still live under the docs project (DOCS).
export const CONTENT = process.env.CONTENT_DIR
	? resolve(process.env.CONTENT_DIR)
	: join(REPO, 'documentation', 'content')
export const PROGRESS = join(DOCS, 'progress.md')
export const TOPICS = join(DOCS, 'tools', 'topics.js')
