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
