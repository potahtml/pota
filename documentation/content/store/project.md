---
title: project
subpath: pota/store
topic: Store
desc:
  Copy-on-write mutable view — reads pass through to the source,
  writes land on the projection's own copy.
---

# project

Wraps `value` in a copy-on-write [mutable](/store/mutable): reads pass
through to the source so the projection stays in sync, but every write
goes to the projection's own copy. Each `project()` call gets its own
proxy store, so two projections of the same source stay independent —
useful for editable drafts, undo stacks, and "what-if" scenarios.

Once the projection writes its own copy of a key, later changes to the
source for that key no longer show through; keys the projection hasn't
touched keep mirroring the source. Arrays are the exception to
read-through: projecting an array seeds the projection's own copy of
the existing entries up front, so later changes to the source array
don't show through — though entries that are objects remain live views
of their source counterparts.

## Arguments

| name    | type | description                                       |
| ------- | ---- | ------------------------------------------------- |
| `value` | `T`  | source value to project; non-objects pass through |

**Returns:** a mutable copy-on-write proxy over `value`.

## Examples

### Editable draft

The draft overrides `age` with its own copy — the original keeps
`30` — while the untouched `name` keeps mirroring the source, so
renaming the original shows through the draft.

```jsx
import { mutable, project } from 'pota/store'
import { render } from 'pota'

const original = mutable({ name: 'Ada', age: 30 })
const draft = project(original)

// the write lands on the draft's own copy, `original` keeps 30
draft.age = 31

function App() {
	return (
		<div>
			<p>
				original: {() => original.name}, {() => original.age}
			</p>
			<p>
				draft: {() => draft.name}, {() => draft.age}
			</p>
			<button on:click={() => (original.name = 'Grace')}>
				rename original (draft sees it through)
			</button>
		</div>
	)
}

render(App)
```
