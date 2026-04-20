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

	current.write(new Map([['x', 'c']]))

	expect(seen).toEqual([
		[true, true, false],
		[false, false, true],
	])
})

// --- usePrevious first call receives undefined as previous --------------

await test('selector - usePrevious returns the first call return as previous on second call', expect => {
	const previous = usePrevious((next, prev) => ({
		next,
		prev,
	}))

	const first = previous(1)
	expect(first.prev).toBe(undefined)
	expect(first.next).toBe(1)

	const second = previous(2)
	expect(second.next).toBe(2)
	// `prev` is the entire return of the first invocation
	expect(second.prev).toBe(first)
})

// --- useSelector with an empty Set has no selected items ---------------

await test('selector - useSelector with empty Set reports nothing selected', expect => {
	const current = signal(new Set())
	const seen = []

	root(() => {
		const isSelected = useSelector(current.read)
		syncEffect(() => {
			seen.push([isSelected('a')(), isSelected('b')()])
		})
	})

	expect(seen).toEqual([[false, false]])
})

// --- useSelector does not re-run for items whose selection didnt change -

await test('selector - only items whose selection flipped re-run their effect', expect => {
	const current = signal('a')
	const seenA = []
	const seenB = []

	root(() => {
		const isSelected = useSelector(current.read)
		syncEffect(() => seenA.push(isSelected('a')()))
		syncEffect(() => seenB.push(isSelected('b')()))
	})

	expect(seenA).toEqual([true])
	expect(seenB).toEqual([false])

	// transition a → b: both flip
	current.write('b')
	expect(seenA).toEqual([true, false])
	expect(seenB).toEqual([false, true])

	// transition b → c: only b flips (a stays false, c not observed)
	current.write('c')
	expect(seenA).toEqual([true, false])
	expect(seenB).toEqual([false, true, false])
})
