/** @jsxImportSource pota */
// Tests for pota/use/paginate: page boundaries, next/previous,
// paginateValues, boundary clamping, and single-page edge case.

import { test } from '#test'

import { signal } from 'pota'
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
	const page = paginate(
		(start, end) => [1, 2, 3].slice(start, end),
		{
			numItems: () => 3,
			numPerPage: () => 3,
		},
	)

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
	const page = paginate(
		(start, end) => [1, 2, 3].slice(start, end),
		{
			numItems: () => 3,
			numPerPage: () => 100,
		},
	)

	expect(page.totalPages()).toBe(1)
	expect(page.items()).toEqual([1, 2, 3])
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
