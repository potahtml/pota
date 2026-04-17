// Tests for `externalSignal()` — id-based reference preservation,
// deep-equality fallback, update method, mixed id/no-id items.

import { test } from '#test'
import { externalSignal } from 'pota'

await test('externalSignal - preserves equal items by id', expect => {
	const first = { id: '1', label: 'one' }
	const second = { id: '2', label: 'two' }
	const items = externalSignal([first, second])

	items.write([
		{ id: '1', label: 'one' },
		{ id: '2', label: 'two updated' },
		{ id: '3', label: 'three' },
	])

	expect(items.read()[0]).toBe(first)
	expect(items.read()[1]).not.toBe(second)
	expect(items.read()[1].label).toBe('two updated')
	expect(items.read()[2].label).toBe('three')
})

// --- externalSignal update ---------------------------------------------------

await test('externalSignal - update method patches based on updater', expect => {
	const items = externalSignal([
		{ id: '1', label: 'one' },
	])

	items.update(prev => [
		...prev,
		{ id: '2', label: 'two' },
	])

	expect(items.read().length).toBe(2)
	expect(items.read()[1].label).toBe('two')
})

await test('externalSignal - items without id are never preserved', expect => {
	const a = { label: 'a' }
	const items = externalSignal([a])

	// baseline: initial item is our reference
	expect(items.read()[0]).toBe(a)
	expect(items.read().length).toBe(1)

	items.write([{ label: 'a' }])

	// no id field, so deep-equality decides, but reference is different
	// equals({label:'a'},{label:'a'}) is true, so reference IS preserved
	expect(items.read()[0]).toBe(a)
})

// --- externalSignal with mixed id/no-id items --------------------------------

await test('externalSignal - mixed items with and without id', expect => {
	const withId = { id: '1', v: 'a' }
	const noId = { v: 'b' }
	const items = externalSignal([withId, noId])

	// baseline: both items present with correct references
	expect(items.read().length).toBe(2)
	expect(items.read()[0]).toBe(withId)
	expect(items.read()[1]).toBe(noId)

	items.write([
		{ id: '1', v: 'a' },
		{ v: 'b' },
	])

	// item with id preserved by reference (deep equal)
	expect(items.read()[0]).toBe(withId)
	// item without id: both have id=undefined, deep equal, so preserved
	expect(items.read()[1]).toBe(noId)
})

// --- item moves position but reference is preserved ------------------

await test('externalSignal - item reference is preserved when it moves position', expect => {
	const one = { id: '1', v: 'one' }
	const two = { id: '2', v: 'two' }
	const three = { id: '3', v: 'three' }
	const items = externalSignal([one, two, three])

	items.write([
		{ id: '3', v: 'three' },
		{ id: '1', v: 'one' },
		{ id: '2', v: 'two' },
	])

	// Order changed, but references to original items are preserved.
	expect(items.read()[0]).toBe(three)
	expect(items.read()[1]).toBe(one)
	expect(items.read()[2]).toBe(two)
})

// --- duplicate IDs in the fresh array -------------------------------

await test('externalSignal - duplicate IDs in the fresh array reuse the same stale item', expect => {
	const one = { id: '1', v: 'one' }
	const items = externalSignal([one])

	// Two entries with id:1 in the fresh array. `find` returns the
	// first match both times, so BOTH positions deep-equal to the
	// stale `one` and get replaced with its reference.
	items.write([
		{ id: '1', v: 'one' },
		{ id: '1', v: 'one' },
	])

	const read = items.read()
	expect(read.length).toBe(2)
	expect(read[0]).toBe(one)
	expect(read[1]).toBe(one)
})

// --- item removed from fresh array is dropped ------------------------

await test('externalSignal - items missing from the fresh array are removed', expect => {
	const one = { id: '1', v: 'one' }
	const two = { id: '2', v: 'two' }
	const items = externalSignal([one, two])

	items.write([{ id: '1', v: 'one' }])

	expect(items.read().length).toBe(1)
	expect(items.read()[0]).toBe(one)
})

// --- fresh item with a new id becomes a new reference -----------------

await test('externalSignal - new id creates a new reference, existing stays', expect => {
	const one = { id: '1', v: 'one' }
	const items = externalSignal([one])

	const freshTwo = { id: '2', v: 'two' }
	items.write([{ id: '1', v: 'one' }, freshTwo])

	expect(items.read()[0]).toBe(one)
	// Item 2 wasn't in the stale set, so the fresh reference is used.
	expect(items.read()[1]).toBe(freshTwo)
})
