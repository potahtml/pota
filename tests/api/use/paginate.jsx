/** @jsxImportSource pota */

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
