/** @jsxImportSource pota */
// Tests for pota/use/paginate: page boundaries, next/previous,
// paginateValues, boundary clamping, and single-page edge case.

import { test, sleep } from '#test'

import { signal, render, isResolved } from 'pota'
import { paginate, paginateValues } from 'pota/use/paginate'

await test('paginate - paginate tracks page boundaries and slices through fetch', expect => {
	const page = paginate(
		(start, end) => ['a', 'b', 'c', 'd', 'e'].slice(start, end),
		{
			numItems: () => 5,
			numPerPage: () => 2,
		},
	)

	expect(page.items()).toEqual(['a', 'b'])
	expect(page.currentPage()).toBe(1)
	expect(page.totalPages()).toBe(3)
	expect(page.hasPrevious()).toBe(false)
	expect(page.hasNext()).toBe(true)

	page.next()
	expect(page.items()).toEqual(['c', 'd'])
	expect(page.currentPage()).toBe(2)

	page.next()
	expect(page.items()).toEqual(['e'])
	expect(page.hasNext()).toBe(false)

	page.previous()
	expect(page.items()).toEqual(['c', 'd'])
})

await test('paginate - paginateValues reacts to source and page size changes', expect => {
	const items = signal(['a', 'b', 'c', 'd'])
	const numPerPage = signal(3)
	const page = paginateValues(items.read, numPerPage.read)

	expect(page.items()).toEqual(['a', 'b', 'c'])
	expect(page.totalPages()).toBe(2)

	page.next()
	expect(page.items()).toEqual(['d'])

	numPerPage.write(2)
	expect(page.totalPages()).toBe(2)
	expect(page.items()).toEqual(['c', 'd'])

	items.write(['x'])
	expect(page.totalPages()).toBe(1)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual(['x'])
})

await test('paginate - page clamps when total shrinks below current page', expect => {
	const numItems = signal(20)
	const page = paginate(
		(start, end) =>
			Array.from({ length: end - start }, (_, i) => start + i),
		{
			numItems: numItems.read,
			numPerPage: () => 5,
		},
	)

	// go to last page (page 4, 0-indexed 3)
	page.next()
	page.next()
	page.next()
	expect(page.currentPage()).toBe(4)

	// shrink total: only 2 pages now
	numItems.write(10)
	expect(page.totalPages()).toBe(2)
	// page should clamp to last valid page
	expect(page.currentPage()).toBe(2)
})

await test('paginate - next returns false at last page, previous returns false at first', expect => {
	const page = paginate((start, end) => [1, 2, 3].slice(start, end), {
		numItems: () => 3,
		numPerPage: () => 3,
	})

	// only 1 page
	expect(page.hasNext()).toBe(false)
	expect(page.hasPrevious()).toBe(false)
	expect(page.next()).toBe(false)
	expect(page.previous()).toBe(false)
})

// --- empty list edge case ------------------------------------------------

await test('paginate - empty list has zero total pages and no navigation', expect => {
	const page = paginate((start, end) => [].slice(start, end), {
		numItems: () => 0,
		numPerPage: () => 10,
	})

	expect(page.totalPages()).toBe(0)
	expect(page.items()).toEqual([])
	expect(page.hasNext()).toBe(false)
	expect(page.hasPrevious()).toBe(false)
})

// --- numPerPage larger than total items ---------------------------------

await test('paginate - numPerPage larger than items fits everything on one page', expect => {
	const page = paginate((start, end) => [1, 2, 3].slice(start, end), {
		numItems: () => 3,
		numPerPage: () => 100,
	})

	expect(page.totalPages()).toBe(1)
	expect(page.items()).toEqual([1, 2, 3])
	expect(page.hasNext()).toBe(false)
})

// --- page clamps when numPerPage grows -----------------------------------

await test('paginate - page clamps when numPerPage grows to cover all items', expect => {
	const numPerPage = signal(2)
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: numPerPage.read,
		},
	)

	page.next()
	page.next()
	expect(page.currentPage()).toBe(3)

	// grow numPerPage to fit everything on one page
	numPerPage.write(10)
	expect(page.totalPages()).toBe(1)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([1, 2, 3, 4, 5, 6])
})

// --- stale raw page does not resurface after shrink→grow ----------------

await test('paginate - page restores when numPerPage shrinks back to allow it', expect => {
	const numPerPage = signal(2)
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: numPerPage.read,
		},
	)

	page.next()
	page.next()
	expect(page.currentPage()).toBe(3)

	// grow: clamps to page 1
	numPerPage.write(10)
	expect(page.currentPage()).toBe(1)

	// shrink back: user position restores
	numPerPage.write(2)
	expect(page.totalPages()).toBe(3)
	expect(page.currentPage()).toBe(3)
	expect(page.items()).toEqual([5, 6])
})

// --- numItems grows, page stays put -------------------------------------

await test('paginate - page stays when numItems grows', expect => {
	const numItems = signal(6)
	const page = paginate(
		(start, end) =>
			Array.from({ length: end - start }, (_, i) => start + i),
		{
			numItems: numItems.read,
			numPerPage: () => 2,
		},
	)

	page.next()
	expect(page.currentPage()).toBe(2)

	numItems.write(20)
	expect(page.totalPages()).toBe(10)
	expect(page.currentPage()).toBe(2)
})

// --- next at last page is a no-op ---------------------------------------

await test('paginate - next at last page does not change page', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4].slice(start, end),
		{
			numItems: () => 4,
			numPerPage: () => 2,
		},
	)

	page.next()
	expect(page.currentPage()).toBe(2)
	expect(page.hasNext()).toBe(false)

	page.next()
	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([3, 4])
})

// --- previous at first page is a no-op ----------------------------------

await test('paginate - previous at first page does not change page', expect => {
	const page = paginate((start, end) => [1, 2, 3].slice(start, end), {
		numItems: () => 3,
		numPerPage: () => 2,
	})

	expect(page.currentPage()).toBe(1)
	expect(page.hasPrevious()).toBe(false)

	page.previous()
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([1, 2])
})

// --- empty list: navigation is safe -------------------------------------

await test('paginate - empty list: next and previous are safe no-ops', expect => {
	const page = paginate((start, end) => [].slice(start, end), {
		numItems: () => 0,
		numPerPage: () => 5,
	})

	expect(page.totalPages()).toBe(0)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([])

	page.next()
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([])

	page.previous()
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([])
})

// --- paginateValues source shrinks to empty -----------------------------

await test('paginateValues - reacts to source shrinking to empty', expect => {
	const items = signal([1, 2, 3, 4])
	const page = paginateValues(items.read, () => 2)

	page.next()
	expect(page.currentPage()).toBe(2)

	items.write([])
	expect(page.totalPages()).toBe(0)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([])
})

// --- off-by-one: exact multiple of numPerPage ---------------------------

await test('paginate - exact multiple: last page is full, no extra empty page', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 3,
		},
	)

	expect(page.totalPages()).toBe(2)

	page.next()
	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([4, 5, 6])
	expect(page.hasNext()).toBe(false)
})

// --- off-by-one: one item over a full page ------------------------------

await test('paginate - one item over full page creates extra page', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4].slice(start, end),
		{
			numItems: () => 4,
			numPerPage: () => 3,
		},
	)

	expect(page.totalPages()).toBe(2)

	page.next()
	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([4])
	expect(page.hasNext()).toBe(false)
})

// --- off-by-one: single item -------------------------------------------

await test('paginate - single item is one page', expect => {
	const page = paginate((start, end) => ['only'].slice(start, end), {
		numItems: () => 1,
		numPerPage: () => 5,
	})

	expect(page.totalPages()).toBe(1)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual(['only'])
	expect(page.hasNext()).toBe(false)
	expect(page.hasPrevious()).toBe(false)
})

// --- paginateValues with a plain array ----------------------------------

await test('paginateValues - works with a plain array', expect => {
	const page = paginateValues(
		() => [10, 20, 30, 40, 50],
		() => 2,
	)

	expect(page.items()).toEqual([10, 20])
	expect(page.totalPages()).toBe(3)

	page.next()
	expect(page.items()).toEqual([30, 40])

	page.next()
	expect(page.items()).toEqual([50])
	expect(page.hasNext()).toBe(false)
})

// --- paginateValues with an iterable (Set) ------------------------------

await test('paginateValues - accepts a Set as source', expect => {
	const page = paginateValues(
		() => new Set(['a', 'b', 'c', 'd']),
		() => 2,
	)

	expect(page.items()).toEqual(['a', 'b'])
	page.next()
	expect(page.items()).toEqual(['c', 'd'])
})

// --- paginateValues with a Map values iterator --------------------------

await test('paginateValues - accepts a Map as source and iterates its values', expect => {
	const page = paginateValues(
		() =>
			new Map([
				[0, 'zero'],
				[1, 'one'],
				[2, 'two'],
			]),
		() => 2,
	)

	expect(page.items()).toEqual(['zero', 'one'])
	page.next()
	expect(page.items()).toEqual(['two'])
})

// --- chained navigation returns expected currentPage values -----------

await test('paginate - currentPage increments and decrements across navigation', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
		},
	)

	expect(page.currentPage()).toBe(1)

	page.next()
	expect(page.currentPage()).toBe(2)

	page.next()
	expect(page.currentPage()).toBe(3)

	page.previous()
	expect(page.currentPage()).toBe(2)

	page.previous()
	expect(page.currentPage()).toBe(1)

	// already at first page, previous is a no-op
	page.previous()
	expect(page.currentPage()).toBe(1)
})

// --- paginateValues: page arg sets initial page ------------------------

await test('paginateValues - page arg as number sets initial page', expect => {
	const page = paginateValues(
		() => [1, 2, 3, 4, 5, 6],
		() => 2,
		2,
	)

	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([3, 4])
})

// --- paginateValues: page accessor tracks an external signal -----------

await test('paginateValues - page accessor tracks an external signal', expect => {
	const source = signal(1)
	const page = paginateValues(
		() => [1, 2, 3, 4, 5, 6],
		() => 2,
		source.read,
	)

	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([1, 2])

	source.write(3)
	expect(page.currentPage()).toBe(3)
	expect(page.items()).toEqual([5, 6])
})

// --- options.page: synchronous unwrap during component setup ----------
//
// Regression: the page accessor must resolve synchronously inside
// `derived`, so that `page()` returns a number (not the `nothing`
// sentinel) when read during component setup, before the effect
// queue has flushed. Reading `currentPage()` inside `Comp` would
// otherwise throw "Cannot convert object to primitive value" via
// `Math.min(nothing, totalPages())`.

await test('paginate - options.page resolves synchronously during component setup', expect => {
	const source = signal(2)
	let duringSetup

	function Comp() {
		const p = paginate(
			(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
			{
				numItems: () => 6,
				numPerPage: () => 2,
				page: source.read,
			},
		)
		duringSetup = p.currentPage()
		return <div />
	}

	const dispose = render(Comp, document.body)
	expect(duringSetup).toBe(2)
	dispose()
})

// --- options.page: number literal sets initial page --------------------

await test('paginate - options.page as a number sets initial page', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
			page: 2,
		},
	)

	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([3, 4])
})

// --- options.page: accessor drives the page reactively -----------------

await test('paginate - options.page accessor tracks an external signal', expect => {
	const source = signal(1)
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
			page: source.read,
		},
	)

	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([1, 2])

	source.write(3)
	expect(page.currentPage()).toBe(3)
	expect(page.items()).toEqual([5, 6])
})

// --- options.page: source clobbers prior next() write ------------------

await test('paginate - options.page source overrides earlier next() writes', expect => {
	const source = signal(2)
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
			page: source.read,
		},
	)

	expect(page.currentPage()).toBe(2)

	page.next()
	expect(page.currentPage()).toBe(3)

	// source fires: derived re-runs and clobbers the next() write
	source.write(1)
	expect(page.currentPage()).toBe(1)
})

// --- writable page: external write jumps the cursor --------------------

await test('paginate - writing page jumps to that page', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
		},
	)

	page.page(3)
	expect(page.currentPage()).toBe(3)
	expect(page.items()).toEqual([5, 6])

	page.page(1)
	expect(page.currentPage()).toBe(1)
	expect(page.items()).toEqual([1, 2])
})

// --- writable page: read returns raw (unclamped) intent -----------------

await test('paginate - page() reads raw cursor, currentPage clamps', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4].slice(start, end),
		{
			numItems: () => 4,
			numPerPage: () => 2,
		},
	)

	page.page(99)
	expect(page.page()).toBe(99)
	expect(page.currentPage()).toBe(2)
	expect(page.items()).toEqual([3, 4])
})

// --- writable page: last write wins between external and next() --------

await test('paginate - external write and next() both update the same cursor', expect => {
	const page = paginate(
		(start, end) => [1, 2, 3, 4, 5, 6].slice(start, end),
		{
			numItems: () => 6,
			numPerPage: () => 2,
		},
	)

	page.next()
	expect(page.currentPage()).toBe(2)

	page.page(3)
	expect(page.currentPage()).toBe(3)

	page.previous()
	expect(page.currentPage()).toBe(2)
})

// --- numPerPage of 1: each item is its own page ------------------------

await test('paginate - numPerPage of 1 produces one page per item', expect => {
	const page = paginate(
		(start, end) => ['a', 'b', 'c'].slice(start, end),
		{
			numItems: () => 3,
			numPerPage: () => 1,
		},
	)

	expect(page.totalPages()).toBe(3)
	expect(page.items()).toEqual(['a'])

	page.next()
	expect(page.items()).toEqual(['b'])

	page.next()
	expect(page.items()).toEqual(['c'])
})

// --- async fetch: items resolves through the derived's promise arm -----

await test('paginate - async fetch resolves items through derived', async expect => {
	const data = ['a', 'b', 'c', 'd', 'e', 'f']

	const page = paginate(
		(start, end) =>
			new Promise(r => setTimeout(() => r(data.slice(start, end)), 10)),
		{
			numItems: () => 6,
			numPerPage: () => 2,
		},
	)

	// pending: items() is the `nothing` sentinel until the promise
	// settles. isResolved is false.
	expect(isResolved(page.items)).toBe(false)

	await page.items
	expect(page.items()).toEqual(['a', 'b'])
	expect(isResolved(page.items)).toBe(true)

	page.next()
	// next page kicks off another fetch; await it before asserting.
	await sleep(20)
	expect(page.items()).toEqual(['c', 'd'])
})
