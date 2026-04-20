/** @jsxImportSource pota */

import {
	copy,
	firewall,
	merge as storeMerge,
	mutable,
	project,
	readonly,
	replace,
	reset,
	signalify,
	updateBlacklist,
} from 'pota/store'

// ============================================
// Store types
// ============================================

// signalify — make object properties reactive
const store = signalify({ count: 0, name: 'test' })
store.count = 5
store.name = 'updated'

// signalify preserves T exactly — return type is the same as input
const signalified: { count: number; name: string } = store

// signalify with explicit keys array
const storeSelective = signalify({ a: 1, b: 2, c: 3 }, ['a', 'b'])
storeSelective.a = 10
storeSelective.b = 20

// @ts-expect-error signalify needs a target
const signalifyBad = signalify()

// mutable — deep reactive proxy
const state = mutable({ list: [1, 2, 3], nested: { a: 1 } })
state.list.push(4)
state.nested.a = 2

// storeMerge — reconcile with merge
storeMerge(state, { list: [5, 6], nested: { a: 3 } })

// replace — reconcile with replace
const r = replace(state, { list: [7], nested: { a: 4, b: 5 } })

// reset — reset to source shape
reset(state, { list: [], nested: { a: 0 } })

// ============================================
// reconcile — return values
// ============================================
// merge / replace / reset each return target so callers can capture
// a narrowed shape. The returned reference is the same object.

// merge returns T & U — source keys are visible on the result
const mergedState = storeMerge(
	{ a: 1 } as { a: number },
	{ b: 2 } as { b: number },
)
const merged_a: number = mergedState.a
const merged_b: number = mergedState.b

// replace returns T & U
const replacedState = replace(
	{ a: 1 } as { a: number },
	{ b: 2 } as { b: number },
)
const replaced_b: number = replacedState.b

// reset returns T & U
const resetState = reset(
	{ a: 1 } as { a: number },
	{ b: 2 } as { b: number },
)
const reset_a: number = resetState.a
const reset_b: number = resetState.b

// ============================================
// reconcile — keys option
// ============================================
// The keys option mirrors the target path down to arrays; at an
// array the leaf is `{ key: <fieldName> }`.

type Row = { id: number; name: string }
type Nested = { rows: Row[] }
type Deep = { group: { users: Row[] } }

const rowsTarget = mutable<Nested>({
	rows: [{ id: 1, name: 'a' }],
})

// valid: key option at the array path
storeMerge(
	rowsTarget,
	{ rows: [{ id: 2, name: 'b' }] },
	{
		rows: { key: 'id' },
	},
)
replace(
	rowsTarget,
	{ rows: [{ id: 2, name: 'b' }] },
	{
		rows: { key: 'name' },
	},
)

storeMerge(
	rowsTarget,
	{ rows: [{ id: 2, name: 'b' }] },
	{
		// @ts-expect-error — 'notAField' is not a key of Row
		rows: { key: 'notAField' },
	},
)

// @ts-expect-error — 'notARow' is not a property of target
storeMerge(rowsTarget, { rows: [] }, { notARow: { key: 'id' } })

// nested path: keys mirrors { group: { users: { key } } }
const deepTarget = mutable<Deep>({
	group: { users: [{ id: 1, name: 'a' }] },
})

storeMerge(
	deepTarget,
	{ group: { users: [{ id: 2, name: 'b' }] } },
	{
		group: { users: { key: 'id' } },
	},
)

// @ts-expect-error — primitive leaf has no keys option
storeMerge({ a: 1 } as { a: number }, { a: 2 }, { a: { key: 'x' } })

// copy — shallow copy
const copied = copy(state)

// readonly — immutable view
const readonlyState = readonly(state)
const readVal = readonlyState.nested.a

// ============================================
// project — copy-on-write object
// ============================================
// project<T>(value, proxies?) returns T — a new projection of the
// source that is independent of other projections.

const projectSource = mutable({ a: 1, b: { c: 2 } })
const projected = project(projectSource)
// projected preserves T's shape
const pa: number = projected.a
const pbc: number = projected.b.c

// project on a primitive structure
const projectedNumObj = project({ x: 1, y: 'a' })
const px: number = projectedNumObj.x
const py: string = projectedNumObj.y

// ============================================
// firewall — wrap a function to block mutations
// ============================================
// firewall(fn) — runs fn in a mutation-blocked scope.

firewall(() => {
	// any store mutations inside are blocked
	const x = projectSource.a
})

// return values are ignored by typing (firewall returns void)
firewall(() => 42)

// ============================================
// updateBlacklist — extend blacklist from a target window
// ============================================
// updateBlacklist(window) updates the constructor & symbol
// blacklists based on the provided global.

updateBlacklist(window)

// ============================================
// project — second `proxies: WeakMap` argument
// ============================================
// project<T>(value, proxies?) — sharing a proxies WeakMap across
// calls lets related projections reuse the same wrappers.

const sharedProxies = new WeakMap<object, object>()
const proj1 = project({ a: 1, b: 'x' }, sharedProxies)
const proj1A: number = proj1.a
const proj1B: string = proj1.b

// same WeakMap for a different projection
const proj2 = project({ c: true }, sharedProxies)
const proj2C: boolean = proj2.c

// ============================================
// Nested signalify — just verify it compiles
// ============================================
// signalify is shallow (docstring: "Is not recursive."). Nested
// objects are NOT automatically signalified — they remain plain
// references. The typing reflects identity: the type is unchanged.

const nested = signalify({ outer: { inner: 1 } })
const nestedOuter: { inner: number } = nested.outer
const nestedInnerVal: number = nested.outer.inner
// reassigning the outer triggers reactivity (the shallow property
// was signalified); the inner object is itself just an object.
nested.outer = { inner: 2 }

// ============================================
// mutable with a signal inside
// ============================================
// mutable wraps the object; any signal values stored inside keep
// their signal identity — the type preserves them.

import { signal } from 'pota'

const sigForMutable = signal(0)
const mutWithSig = mutable({ count: sigForMutable })
// `count` is still a SignalObject<number>
const mutSig: SignalObject<number> = mutWithSig.count
const mutSigRead: number = mutWithSig.count.read()

// ============================================
// readonly on a nested object — return type shape
// ============================================
// readonly is `deepFreeze` — returns the same type as its input.
// Typing is identity; immutability is structural, not type-level.

const readSource = { a: 1, nested: { b: 'hi', deep: { c: true } } }
const readResult = readonly(readSource)
// Shape is preserved
const r_a: number = readResult.a
const r_nested_b: string = readResult.nested.b
const r_deep_c: boolean = readResult.nested.deep.c
