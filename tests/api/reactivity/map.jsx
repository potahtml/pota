/** @jsxImportSource pota */

// Tests for `map()` — fallback rendering, duplicate primitives,
// reactive index. Used as the iteration primitive behind For.

import { test, body } from '#test'
import { cleanup, map, render, root, signal } from 'pota'
import { For } from 'pota/components'

// --- map fallback ------------------------------------------------------------

/*
await test('map - renders fallback when list is empty and clears it when items arrive', expect => {
	const items = signal([])

	const dispose = render(
		<>{map(items.read, item => <p>{item}</p>, false, <b>empty</b>)}</>,
	)

	expect(body()).toBe('<b>empty</b>')

	items.write(['a'])
	expect(body()).toBe('<p>a</p>')

	items.write([])
	expect(body()).toBe('<b>empty</b>')

	dispose()
})
*/

// --- map duplicates ----------------------------------------------------------

await test('map - handles duplicate primitive values', expect => {
	const items = signal([1, 1, 1])
	/** @type {any} */
	let nodes

	root(() => {
		const mapper = map(items.read, item => item)
		nodes = mapper()
	})

	expect(nodes.length).toBe(3)
})

// --- map reactive index ------------------------------------------------------

await test('map - reactive index updates when items reorder', expect => {
	const items = signal(['a', 'b', 'c'])
	const indices = []

	root(() => {
		const mapper = map(
			items.read,
			(item, index) => {
				indices.push({ item, index: index() })
				return item
			},
			false,
			undefined,
			true,
		)
		mapper()
	})

	expect(indices).toEqual([
		{ item: 'a', index: 0 },
		{ item: 'b', index: 1 },
		{ item: 'c', index: 2 },
	])
})

// --- map caches items by reference -----------------------------------

await test('map - items that stay in the list reuse their cached result', expect => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	const items = signal([a, b])

	// callback returns a new object each run; if the row is
	// cached, the returned reference is stable across mapper()
	// calls.
	const mapper = root(() => map(items.read, item => ({ item })))

	// `mapper()` is typed `JSX.Element` but at runtime returns the
	// array of row results. Cast narrows it for assertions.
	const first = /** @type {{ item: { id: string } }[]} */ (
		/** @type {unknown} */ (mapper())
	)
	expect(first.length).toBe(2)
	expect(first[0].item).toBe(a)
	expect(first[1].item).toBe(b)

	const firstA = first[0]
	const firstB = first[1]

	// re-run with same references
	items.write([a, b])
	const second = /** @type {{ item: { id: string } }[]} */ (
		/** @type {unknown} */ (mapper())
	)

	expect(second[0]).toBe(firstA)
	expect(second[1]).toBe(firstB)
})

// --- map creates new rows for new items ------------------------------

await test('map - a new item gets a fresh row, existing items stay cached', expect => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	const c = { id: 'c' }
	const items = signal([a, b])

	const mapper = root(() => map(items.read, item => ({ item })))

	const first = /** @type {{ item: { id: string } }[]} */ (
		/** @type {unknown} */ (mapper())
	)
	const firstA = first[0]
	const firstB = first[1]

	items.write([a, b, c])
	const second = /** @type {{ item: { id: string } }[]} */ (
		/** @type {unknown} */ (mapper())
	)

	expect(second.length).toBe(3)
	expect(second[0]).toBe(firstA)
	expect(second[1]).toBe(firstB)
	expect(second[2].item).toBe(c)
	expect(second[2]).not.toBe(firstA)
	expect(second[2]).not.toBe(firstB)
})

// --- map drops rows for removed items -------------------------------

await test('map - removing an item disposes its row', expect => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	const items = signal([a, b])
	let disposed = 0

	const mapper = root(() =>
		map(items.read, item => {
			cleanup(() => disposed++)
			return item
		}),
	)

	mapper()
	expect(disposed).toBe(0)

	items.write([a]) // drop b
	mapper()

	expect(disposed).toBe(1)
})

// --- map reorders without rebuilding rows ---------------------------

await test('map - reordering preserves row identity', expect => {
	const a = { id: 'a' }
	const b = { id: 'b' }
	const c = { id: 'c' }
	const items = signal([a, b, c])

	const mapper = root(() => map(items.read, item => ({ item })))

	const first = mapper()
	const firstA = first[0]
	const firstB = first[1]
	const firstC = first[2]

	items.write([c, a, b])
	const second = mapper()

	expect(second[0]).toBe(firstC)
	expect(second[1]).toBe(firstA)
	expect(second[2]).toBe(firstB)
})

// --- map clears on owner disposal -----------------------------------

await test('map - cleanup (owner disposal) disposes all rows', expect => {
	const items = signal([{ id: 1 }, { id: 2 }, { id: 3 }])
	let disposed = 0

	const dispose = root(d => {
		const mapper = map(items.read, item => {
			cleanup(() => disposed++)
			return item
		})
		mapper() // create rows
		return d
	})

	expect(disposed).toBe(0)

	dispose()

	// All three rows' cleanups fire when the owner disposes.
	expect(disposed).toBe(3)
})

// --- map with full replacement clears and rebuilds ------------------

await test('map - replacing every item with fresh references rebuilds all rows', expect => {
	const items = signal([{ id: 1 }, { id: 2 }])
	let created = 0

	const mapper = root(() =>
		map(items.read, item => {
			created++
			return item
		}),
	)

	mapper()
	expect(created).toBe(2)

	// All-new references — none are in the cache, so `clearit` path
	// wipes cache and rebuilds from scratch.
	items.write([{ id: 1 }, { id: 2 }])
	mapper()

	expect(created).toBe(4)
})

// --- empty list returns no rows ------------------------------------

// Multi-node rows (fn returns a fragment-like result with multiple
// top-level DOM nodes) force Row.nodesForRow() to walk siblings
// from begin to end. This exercises the while-loop body that is
// otherwise skipped when every row is a single node.

await test('map - row with multiple sibling nodes disposes cleanly (nodesForRow walks siblings)', expect => {
	const items = signal(['a', 'b'])
	const dispose = render(
		<div>
			<For each={items.read}>
				{item => (
					<>
						<span class={`x-${item}-1`}>{item}a</span>
						<span class={`x-${item}-2`}>{item}b</span>
					</>
				)}
			</For>
		</div>,
	)
	expect(document.querySelectorAll('span').length).toBe(4)

	// remove one item (not all) so the 'b' row goes through the
	// per-row dispose path that calls row.remove() -> nodesForRow()
	items.write(['a'])
	expect(document.querySelectorAll('span').length).toBe(2)

	dispose()
})

// Duplicates only get tracked on the SECOND run when prev is
// non-empty. Via <For> so rows carry real DOM nodes and disposal
// paths run cleanly. Transitions [1] → [1, 1, 1] → [1] → [1, 1]
// exercise:
//   - duplicates branch creating dupe rows (line 388-402)
//   - dispose isDupe else branch with both `arr.length > 1`
//     (removeFromArray) and `arr.length === 1` (duplicates.delete)
//     cases.

await test('For - primitive duplicates create and dispose dupe rows cleanly', expect => {
	const items = signal([1])
	const dispose = render(
		<For each={items.read}>{item => <span>{item}</span>}</For>,
	)
	expect(document.querySelectorAll('span').length).toBe(1)

	// grow to 3 — creates two dupe rows
	items.write([1, 1, 1])
	expect(document.querySelectorAll('span').length).toBe(3)

	// shrink to 2 — disposes one dupe (arr.length > 1 branch)
	items.write([1, 1])
	expect(document.querySelectorAll('span').length).toBe(2)

	// grow to 3 — reuses the remaining dupe (for-of dupes loop hits
	// `row = dupe; break`) and creates one new dupe
	items.write([1, 1, 1])
	expect(document.querySelectorAll('span').length).toBe(3)

	// shrink to 1 — disposes both dupes (arr.length > 1 then === 1)
	items.write([1])
	expect(document.querySelectorAll('span').length).toBe(1)

	dispose()
})

await test('map - empty list returns an empty result', expect => {
	const items = signal([])

	const mapper = root(() => map(items.read, item => item))

	const result = /** @type {unknown[]} */ (
		/** @type {unknown} */ (mapper())
	)
	expect(result.length).toBe(0)
})
