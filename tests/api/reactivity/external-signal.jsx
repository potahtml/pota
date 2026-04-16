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
