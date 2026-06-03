// Shared path resolution for the docs-review helper scripts.
//
// These scripts live at <repo>/tools/ai-docs-review/ and are
// version-tracked (durable across fresh checkouts / `npm run clean`).
// They resolve the
// docs project relative to their own location, so they run correctly
// from any cwd.
//
// Reuse against a different content tree by setting DOCS_DIR (absolute,
// or relative to the current working directory):
//   DOCS_DIR=path/to/other-docs node .../validate.mjs
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

// .../tools/ai-docs-review/_paths.mjs → up 2 = repo root
const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = resolve(HERE, '..', '..')

export const DOCS = process.env.DOCS_DIR
	? resolve(process.env.DOCS_DIR)
	: join(REPO, 'projects', 'docs')

export const CONTENT = join(DOCS, 'src', 'content')
export const PROGRESS = join(DOCS, 'progress.md')
export const TOPICS = join(DOCS, 'tools', 'topics.js')
