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
touched keep mirroring the source.

## Arguments

| name    | type | description                                       |
| ------- | ---- | ------------------------------------------------- |
| `value` | `T`  | source value to project; non-objects pass through |

**Returns:** a mutable copy-on-write proxy over `value`.

## Examples

### Editable draft

Bumping the draft's age leaves the original untouched; renaming the
original is visible through the draft until the draft writes its own
copy of `name`.

```jsx
import { mutable, project } from 'pota/store'
import { render } from 'pota'

const original = mutable({ name: 'Ada', age: 30 })
const draft = project(original)

function App() {
	return (
		<div>
			<p>
				original: {() => original.name}, {() => original.age}
			</p>
			<p>
				draft: {() => draft.name}, {() => draft.age}
			</p>
			<button on:click={() => (draft.age += 1)}>
				bump draft age (original unchanged)
			</button>
			<button on:click={() => (original.name = 'Grace')}>
				rename original (draft sees it through)
			</button>
		</div>
	)
}

render(App)
```
