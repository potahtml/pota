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
	store as createStore,
	updateBlacklist,
} from 'pota/store'
import type {
	DeepMutable,
	DeepReadonly,
	Mutable,
} from '#type/store.d.ts'

// Public-surface import sanity check — users should be able to
// name the store types via the `pota` root (re-exported through
// `typescript/exports.d.ts`).
import type {
	DeepMutable as PubDeepMutable,
	DeepReadonly as PubDeepReadonly,
	Mutable as PubMutable,
	ReconcileKeys as PubReconcileKeys,
	Store as PubStore,
} from 'pota'

// Identity checks — the public aliases resolve to the same types.
const _pubMutable: PubMutable<{ a: number }> = {} as Mutable<{ a: number }>
const _pubRO: PubDeepReadonly<{ a: number }> = {} as DeepReadonly<{
	a: number
}>
const _pubMut: PubDeepMutable<{ readonly a: number }> =
	{} as DeepMutable<{ readonly a: number }>
const _pubStore: PubStore<{ a: number }> = [
	{} as PubDeepReadonly<{ a: number }>,
	() => {},
]
const _pubKeys: PubReconcileKeys<{ xs: { id: string }[] }> = {
	xs: { key: 'id' },
}

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
// readonly returns `DeepReadonly<T>` — the type-level shape is
// preserved but every property (including nested) is readonly.

const readSource = { a: 1, nested: { b: 'hi', deep: { c: true } } }
const readResult = readonly(readSource)
// Shape is preserved on reads
const r_a: number = readResult.a
const r_nested_b: string = readResult.nested.b
const r_deep_c: boolean = readResult.nested.deep.c

// Writes rejected at every depth
// @ts-expect-error — top-level property is readonly
readResult.a = 2
// @ts-expect-error — nested property is readonly
readResult.nested.b = 'bye'
// @ts-expect-error — deep property is readonly
readResult.nested.deep.c = false

// readonly on array — elements + methods blocked
const readArr = readonly([1, 2, 3])
const readArr0: number = readArr[0]
const readArrLen: number = readArr.length
// @ts-expect-error — push not on ReadonlyArray
readArr.push(4)
// @ts-expect-error — index write on ReadonlyArray
readArr[0] = 99

// readonly on Map — ReadonlyMap
const readMap = readonly(new Map<string, number>([['a', 1]]))
const readMapGet: number | undefined = readMap.get('a')
const readMapSize: number = readMap.size
// @ts-expect-error — set not on ReadonlyMap
readMap.set('b', 2)
// @ts-expect-error — delete not on ReadonlyMap
readMap.delete('a')

// readonly on Set — ReadonlySet
const readSet = readonly(new Set<number>([1, 2]))
const readSetHas: boolean = readSet.has(1)
// @ts-expect-error — add not on ReadonlySet
readSet.add(3)

// ============================================
// store(source) — [DeepReadonly<T>, setStore] tuple
// ============================================
// The first tuple element is DeepReadonly<T> (TS-only, runtime is
// a plain mutable proxy). The second is a setter that runs its
// callback inside batch() with a DeepMutable<T> draft.

// --- shape ---
const [user, setUser] = createStore({
	name: 'ada',
	age: 30,
	nested: { active: true },
})

// reads work at every depth
const userName: string = user.name
const userAge: number = user.age
const userNested_active: boolean = user.nested.active

// --- writes rejected at every depth ---
// @ts-expect-error — store is DeepReadonly at the top level
user.name = 'grace'
// @ts-expect-error — DeepReadonly recurses into nested objects
user.nested.active = false

// --- setStore accepts a void-returning mutator ---
const setStoreReturn: void = setUser(draft => {
	draft.name = 'grace'
	draft.age = 99
	draft.nested.active = false
})

// --- mutator draft is the writable version (DeepMutable<T>) ---
setUser(draft => {
	draft.name = 'ok'
	// dynamic keys ok — Mutable<T> has Record<PropertyKey, any>
	draft['dynamic'] = 42
})

// @ts-expect-error — setStore requires a function argument
setUser()
// @ts-expect-error — setStore's argument must be a function
setUser('nope')

// --- store with array source ---
const [items, setItems] = createStore([1, 2, 3])
const items0: number = items[0]
const itemsLen: number = items.length
// @ts-expect-error — readonly array, no push
items.push(4)
// @ts-expect-error — index write blocked
items[0] = 99

setItems(draft => {
	draft.push(4) // draft is DeepMutable → plain array
	draft[0] = 99
})

// --- store with Map source ---
const [map, setMap] = createStore(new Map<string, number>([['a', 1]]))
const mapGet: number | undefined = map.get('a')
// @ts-expect-error — .set blocked on ReadonlyMap
map.set('b', 2)
setMap(draft => {
	draft.set('b', 2)
	draft.delete('a')
})

// --- store with Set source ---
const [set, setSet] = createStore(new Set<number>([1, 2]))
const setHas: boolean = set.has(1)
// @ts-expect-error — .add blocked on ReadonlySet
set.add(3)
setSet(draft => {
	draft.add(3)
})

// --- store with clone option ---
const [cloned, setCloned] = createStore({ a: 1 }, true)
const clonedA: number = cloned.a
setCloned(draft => {
	draft.a = 2
})

// --- functions pass through DeepReadonly unchanged ---
const [withFn] = createStore({ fn: (x: number) => x * 2, value: 10 })
const fnCall: number = withFn.fn(5)
const fnValue: number = withFn.value
// @ts-expect-error — can't reassign value through readonly view
withFn.value = 20

// ============================================
// Mutable<T> — direct type checks
// ============================================
// Object/array: readonly stripped + Record<PropertyKey, any> added.
// Map/Set: preserved as their class type + Record<PropertyKey, any>.

// Object: reads narrowed, writes allowed, dynamic keys allowed
type MO = Mutable<{ readonly x: number; readonly y: string }>
const mo = { x: 1, y: 'a' } as unknown as MO
const mo_x: number = mo.x
mo.x = 2 // readonly stripped
mo.y = 'b'
mo['unknown'] = 'ok' // Record<PropertyKey, any>
mo[Symbol('sym')] = 'also ok' // symbol keys ok

// Array: writable, with index signature
type MA = Mutable<readonly number[]>
const ma = [1, 2, 3] as unknown as MA
ma.push(4) // no longer readonly
ma[0] = 99
const maCustom: unknown = ma['custom'] // dynamic key ok

// Map: class preserved, methods still typed, dynamic keys ok
type MM = Mutable<Map<string, number>>
const mm = new Map<string, number>() as unknown as MM
mm.set('a', 1) // Map API preserved
const mmSize: number = mm.size
mm['customProp'] = 'reactive' // Record<PropertyKey, any>

// Set: class preserved, methods still typed, dynamic keys ok
type MS = Mutable<Set<number>>
const ms = new Set<number>() as unknown as MS
ms.add(1)
const msSize: number = ms.size
ms['customProp'] = 'reactive'

// ============================================
// DeepReadonly<T> — direct type checks
// ============================================
// Recurses through objects, arrays, Maps, Sets; passes functions
// and primitives unchanged.

type DR = DeepReadonly<{
	a: number
	nested: { b: string }
	list: number[]
	m: Map<string, { v: number }>
	s: Set<{ tag: string }>
	fn: (x: number) => number
}>

const dr = {} as DR
const dr_a: number = dr.a
const dr_nested_b: string = dr.nested.b
const dr_fn_result: number = dr.fn(1) // functions preserved

// @ts-expect-error — top-level readonly
dr.a = 2
// @ts-expect-error — nested readonly recurses
dr.nested.b = 'x'
// @ts-expect-error — arrays become ReadonlyArray
dr.list.push(1)
// @ts-expect-error — index assignment on readonly array
dr.list[0] = 99
// @ts-expect-error — Map becomes ReadonlyMap
dr.m.set('x', { v: 1 })
// @ts-expect-error — Set becomes ReadonlySet
dr.s.add({ tag: 'x' })

// Even values INSIDE containers are DeepReadonly when retrieved
const drMapVal = dr.m.get('x')
if (drMapVal) {
	// @ts-expect-error — map value is deep-readonly
	drMapVal.v = 99
}

// ============================================
// DeepMutable<T> — direct type checks
// ============================================
// Inverse of DeepReadonly — strips `readonly` recursively.

type DM = DeepMutable<{
	readonly a: number
	readonly nested: { readonly b: string }
	readonly list: readonly number[]
	readonly m: ReadonlyMap<string, { readonly v: number }>
	readonly s: ReadonlySet<{ readonly tag: string }>
}>

const dm = {} as DM
// Writes at every depth are allowed
dm.a = 2
dm.nested.b = 'x'
dm.list.push(1) // array is now writable
dm.list[0] = 99
dm.m.set('x', { v: 1 }) // Map methods available
dm.s.add({ tag: 'x' }) // Set methods available

// Values retrieved from containers are also writable
const dmMapVal = dm.m.get('x')
if (dmMapVal) {
	dmMapVal.v = 99
}

// ============================================
// store() and frozen/readonly input
// ============================================
// If the source type is already readonly, the setter's draft is
// still DeepMutable — so you can mutate inside setStore regardless
// of input tagging.

type FrozenShape = {
	readonly id: number
	readonly info: { readonly label: string }
}
const frozenSource: FrozenShape = { id: 1, info: { label: 'x' } }
const [fz, setFz] = createStore(frozenSource)

// @ts-expect-error — view is DeepReadonly (was already readonly)
fz.id = 2

setFz(draft => {
	// DeepMutable<FrozenShape> — readonly modifiers stripped
	draft.id = 2
	draft.info.label = 'y'
})
