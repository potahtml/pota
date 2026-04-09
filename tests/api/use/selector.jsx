/** @jsxImportSource pota */
// Tests for pota/use/selector: usePrevious, useSelector with scalar
// signals, iterable selections, undefined, and Map values.

import { test } from '#test'

import { root, signal, syncEffect } from 'pota'
import { usePrevious, useSelector } from 'pota/use/selector'

await test('selector - usePrevious receives the previous computed value', expect => {
	const previous = usePrevious((next, prev) => [next, prev])

	expect(previous('a')).toEqual(['a', undefined])
	expect(previous('b')).toEqual(['b', ['a', undefined]])
})

await test('selector - useSelector tracks a scalar signal', expect => {
	const current = signal('a')
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)

		syncEffect(() => {
			seen.push([isSelected('a')(), isSelected('b')()])
		})
	})

	expect(seen).toEqual([[true, false]])

	current.write('b')

	expect(seen).toEqual([
		[true, false],
		[false, true],
	])
})

await test('selector - useSelector supports iterable selections', expect => {
	const current = signal(new Set(['a', 'c']))
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)

		syncEffect(() => {
			seen.push([
				isSelected('a')(),
				isSelected('b')(),
				isSelected('c')(),
			])
		})
	})

	expect(seen).toEqual([[true, false, true]])

	current.write(new Set(['b']))

	expect(seen).toEqual([
		[true, false, true],
		[false, true, false],
	])
})

await test('selector - useSelector handles undefined value as empty selection', expect => {
	const current = signal(undefined)
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)

		syncEffect(() => {
			seen.push([isSelected('a')(), isSelected('b')()])
		})
	})

	expect(seen).toEqual([[false, false]])

	current.write('a')

	expect(seen).toEqual([
		[false, false],
		[true, false],
	])
})

await test('selector - useSelector unselects items when value changes', expect => {
	const current = signal('a')
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)

		syncEffect(() => {
			seen.push(isSelected('a')())
		})
	})

	expect(seen).toEqual([true])

	current.write('b')
	expect(seen).toEqual([true, false])

	current.write('a')
	expect(seen).toEqual([true, false, true])
})

await test('selector - useSelector with Map values', expect => {
	const current = signal(
		new Map([
			['x', 'a'],
			['y', 'b'],
		]),
	)
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)

		syncEffect(() => {
			seen.push([
				isSelected('a')(),
				isSelected('b')(),
				isSelected('c')(),
			])
		})
	})

	expect(seen).toEqual([[true, true, false]])

	current.write(
		new Map([
			['x', 'c'],
		]),
	)

	expect(seen).toEqual([
		[true, true, false],
		[false, false, true],
	])
})
