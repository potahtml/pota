/** @jsxImportSource pota */

/**
 * Identity invariants for merge / replace / reset.
 *
 * Every reconcile function starts with `copy(source)` to detach
 * source from target before walking. That defensive copy is the
 * contract these tests pin down:
 *
 *   1. Return value is the same reference as `target`.
 *   2. Nested target references survive recursive walks (non-morph,
 *      non-wholesale-replace paths).
 *   3. Source mutations after reconcile never leak into target.
 *   4. Target mutations after reconcile never leak into source.
 *   5. Self-reference (`merge(obj, obj)`) doesn't corrupt.
 *   6. Mutable sources are detached just like plain ones.
 *
 * Each invariant is exercised at both shallow and deep paths so a
 * future "lazy copy" refactor that drops the upfront `copy(source)`
 * and inlines copies at assignment sites can be validated against
 * the same pins — at every nesting depth reconcile reaches.
 */

import { test as _test } from '#test'

import { merge, mutable, replace, reset } from 'pota/store'

const test = _test

/* ================================================================= */
/*  A. Return value === target                                         */
/* ================================================================= */

await test('identity: merge returns the target reference', expect => {
	const target = { a: 1 }
	const result = merge(target, { b: 2 })
	expect(result).toBe(target)
})

await test('identity: replace returns the target reference', expect => {
	const target = { a: 1 }
	const result = replace(target, { b: 2 })
	expect(result).toBe(target)
})

await test('identity: reset returns the target reference', expect => {
	const target = { a: 1 }
	const result = reset(target, { a: 2 })
	expect(result).toBe(target)
})

await test('identity: merge on mutable target returns the same mutable', expect => {
	const target = mutable({ a: 1 })
	const result = merge(target, { b: 2 })
	expect(result).toBe(target)
})

await test('identity: replace on mutable target returns the same mutable', expect => {
	const target = mutable({ a: 1 })
	const result = replace(target, { b: 2 })
	expect(result).toBe(target)
})

await test('identity: reset on mutable target returns the same mutable', expect => {
	const target = mutable({ a: 1 })
	const result = reset(target, { a: 2 })
	expect(result).toBe(target)
})

/* ================================================================= */
/*  B. Nested references preserved on recursive walk                   */
/* ================================================================= */
/*
 * merge/replace recurse into nested objects — reading prev/next and
 * mutating prev in place. Target's nested object identity must
 * survive. Reset recurses into non-morph, non-empty, non-array
 * nested objects.
 */

await test('identity: merge preserves shallow nested object ref', expect => {
	const nested = { x: 1 }
	const target = { nested }
	merge(target, { nested: { y: 2 } })
	expect(target.nested).toBe(nested)
	expect(target.nested).toEqual({ x: 1, y: 2 })
})

await test('identity: replace preserves shallow nested object ref', expect => {
	const nested = { x: 1 }
	const target = { nested }
	replace(target, { nested: { y: 2 } })
	expect(target.nested).toBe(nested)
	expect(target.nested).toEqual({ y: 2 })
})

await test('identity: reset preserves shallow nested object ref', expect => {
	const nested = { x: 1 }
	const target = { nested }
	reset(target, { nested: { x: 99 } })
	expect(target.nested).toBe(nested)
	expect(target.nested).toEqual({ x: 99 })
})

await test('identity: merge preserves deep nested object refs (depth 3)', expect => {
	const leaf = { n: 1 }
	const mid = { leaf }
	const root = { mid }
	const target = { root }

	merge(target, { root: { mid: { leaf: { m: 2 } } } })

	expect(target.root).toBe(root)
	expect(target.root.mid).toBe(mid)
	expect(target.root.mid.leaf).toBe(leaf)
	expect(target.root.mid.leaf).toEqual({ n: 1, m: 2 })
})

await test('identity: replace preserves deep nested object refs (depth 3)', expect => {
	const leaf = { n: 1 }
	const mid = { leaf }
	const root = { mid }
	const target = { root }

	replace(target, { root: { mid: { leaf: { m: 2 } } } })

	expect(target.root).toBe(root)
	expect(target.root.mid).toBe(mid)
	expect(target.root.mid.leaf).toBe(leaf)
	expect(target.root.mid.leaf).toEqual({ m: 2 })
})

await test('identity: reset preserves deep nested object refs (depth 3)', expect => {
	const leaf = { n: 1 }
	const mid = { leaf }
	const root = { mid }
	const target = { root }

	reset(target, { root: { mid: { leaf: { n: 99 } } } })

	expect(target.root).toBe(root)
	expect(target.root.mid).toBe(mid)
	expect(target.root.mid.leaf).toBe(leaf)
	expect(target.root.mid.leaf).toEqual({ n: 99 })
})

await test('identity: merge preserves nested array ref (non-keyed)', expect => {
	const list = [1, 2, 3]
	const target = { list }
	merge(target, { list: [99] })
	expect(target.list).toBe(list)
	// merge of arrays without keys reconciles element-wise
	expect(target.list).toEqual([99, 2, 3])
})

await test('identity: replace preserves nested array ref (non-keyed)', expect => {
	const list = [1, 2, 3]
	const target = { list }
	replace(target, { list: [99] })
	expect(target.list).toBe(list)
	// replace of arrays without keys reconciles element-wise then
	// trims length to source length.
	expect(target.list).toEqual([99])
})

await test('identity: merge preserves deep nested array ref', expect => {
	const list = [1, 2]
	const target = { a: { b: { list } } }
	merge(target, { a: { b: { list: [99] } } })
	expect(target.a.b.list).toBe(list)
})

await test('identity: replace preserves deep nested array ref', expect => {
	const list = [1, 2]
	const target = { a: { b: { list } } }
	replace(target, { a: { b: { list: [99] } } })
	expect(target.a.b.list).toBe(list)
})

/* ================================================================= */
/*  C. Nested references REPLACED on morph (array ↔ object)            */
/* ================================================================= */
/*
 * `morphedBetweenArrayAndObject` branch wholesale-replaces
 * target[id] with the (copied) source value. Identity NOT
 * preserved. Applies to merge/replace; reset's branches are tested
 * in section I.
 */

await test('identity: merge replaces target ref when array morphs to object', expect => {
	const arr = [1, 2, 3]
	const target = { x: arr }
	merge(target, { x: { a: 1 } })
	expect(target.x).not.toBe(arr)
	expect(target.x).toEqual({ a: 1 })
})

await test('identity: merge replaces target ref when object morphs to array', expect => {
	const obj = { a: 1 }
	const target = { x: obj }
	merge(target, { x: [1, 2, 3] })
	expect(target.x).not.toBe(obj)
	expect(target.x).toEqual([1, 2, 3])
})

await test('identity: replace replaces target ref when array morphs to object', expect => {
	const arr = [1, 2, 3]
	const target = { x: arr }
	replace(target, { x: { a: 1 } })
	expect(target.x).not.toBe(arr)
	expect(target.x).toEqual({ a: 1 })
})

await test('identity: replace replaces target ref when object morphs to array', expect => {
	const obj = { a: 1 }
	const target = { x: obj }
	replace(target, { x: [1, 2, 3] })
	expect(target.x).not.toBe(obj)
	expect(target.x).toEqual([1, 2, 3])
})

await test('identity: merge morph at depth 2 replaces only the inner ref', expect => {
	const outer = { inner: [1, 2] }
	const target = { outer }
	merge(target, { outer: { inner: { a: 1 } } })
	expect(target.outer).toBe(outer) // recursive walk preserves outer
	expect(target.outer.inner).not.toEqual([1, 2])
	expect(target.outer.inner).toEqual({ a: 1 })
})

await test('identity: replace morph at depth 3 replaces only the leaf ref', expect => {
	const leaf = { k: 1 }
	const mid = { leaf }
	const root = { mid }
	const target = { root }
	replace(target, { root: { mid: { leaf: [7, 8, 9] } } })
	expect(target.root).toBe(root)
	expect(target.root.mid).toBe(mid)
	expect(target.root.mid.leaf).not.toBe(leaf)
	expect(target.root.mid.leaf).toEqual([7, 8, 9])
})

/* ================================================================= */
/*  D. Source detachment (plain source)                                */
/* ================================================================= */
/*
 * The contract: once reconcile returns, mutating any part of the
 * source must not leak into target. The upfront `copy(source)`
 * guarantees this for nested object/array refs that get assigned
 * (via `target[id] = source[id]` in the new-key or morph paths).
 */

await test('identity: merge detaches source — mutating source later does not leak', expect => {
	const srcNested = { x: 1 }
	const target = {}
	merge(target, { nested: srcNested })
	// srcNested's content was copied at assignment; mutating source
	// shouldn't show up in target.
	srcNested.x = 999
	srcNested.y = 'leaked'
	expect(target.nested.x).toBe(1)
	expect(target.nested.y).toBe(undefined)
})

await test('identity: replace detaches source — mutating source later does not leak', expect => {
	const srcNested = { x: 1 }
	const target = {}
	replace(target, { nested: srcNested })
	srcNested.x = 999
	expect(target.nested.x).toBe(1)
})

await test('identity: reset detaches source — mutating source later does not leak', expect => {
	const srcNested = { x: 1 }
	const target = { nested: {} }
	// reset recurses into nested (not empty, non-morph, non-array)
	reset(target, { nested: srcNested })
	srcNested.x = 999
	expect(target.nested.x).toBe(1)
})

await test('identity: merge detaches source array assigned to new key', expect => {
	const srcArr = [1, 2, 3]
	const target = {}
	merge(target, { list: srcArr })
	srcArr.push(4)
	srcArr[0] = 99
	expect(target.list).toEqual([1, 2, 3])
})

await test('identity: merge detaches source deeply — depth-3 source mutation', expect => {
	const srcLeaf = { v: 1 }
	const srcMid = { leaf: srcLeaf }
	const srcRoot = { mid: srcMid }
	const target = {}
	merge(target, { root: srcRoot })

	// Mutate every level of source after merge
	srcLeaf.v = 999
	srcLeaf.added = true
	srcMid.extra = 'leak'
	srcRoot.extra = 'leak'

	expect(target.root.mid.leaf.v).toBe(1)
	expect(target.root.mid.leaf.added).toBe(undefined)
	expect(target.root.mid.extra).toBe(undefined)
	expect(target.root.extra).toBe(undefined)
})

await test('identity: replace detaches source deeply — depth-3 source mutation', expect => {
	const srcLeaf = { v: 1 }
	const srcMid = { leaf: srcLeaf }
	const srcRoot = { mid: srcMid }
	const target = {}
	replace(target, { root: srcRoot })

	srcLeaf.v = 999
	srcMid.extra = 'leak'
	srcRoot.extra = 'leak'

	expect(target.root.mid.leaf.v).toBe(1)
	expect(target.root.mid.extra).toBe(undefined)
	expect(target.root.extra).toBe(undefined)
})

await test('identity: reset detaches source deeply — depth-3 source mutation', expect => {
	const srcLeaf = { v: 1 }
	const srcMid = { leaf: srcLeaf }
	const srcRoot = { mid: srcMid }
	const target = { root: { mid: { leaf: {} } } }
	reset(target, { root: srcRoot })

	srcLeaf.v = 999
	srcMid.extra = 'leak'
	expect(target.root.mid.leaf.v).toBe(1)
})

await test('identity: merge detaches source — shared reference in source tree', expect => {
	// Source has the same object twice (sharing). After merge,
	// mutating source's shared must not leak to either target
	// position.
	const shared = { v: 1 }
	const source = { a: shared, b: shared }
	const target = {}
	merge(target, source)
	shared.v = 999
	shared.added = 'leak'
	expect(target.a.v).toBe(1)
	expect(target.b.v).toBe(1)
	expect(target.a.added).toBe(undefined)
	expect(target.b.added).toBe(undefined)
})

await test('identity: merge preserves intra-source aliasing — shared becomes shared', expect => {
	// copy()'s `seen` map deduplicates shared refs within source, so
	// repeated source refs collapse to a single shared copy in
	// target. Load-bearing behavior: mutating target.a reflects in
	// target.b.
	const shared = { v: 1 }
	const source = { a: shared, b: shared }
	const target = {}
	merge(target, source)
	expect(target.a).toBe(target.b)

	// And it's detached from source.
	expect(target.a).not.toBe(shared)

	// Live sharing inside target: writing through one side is
	// visible on the other.
	target.a.v = 42
	expect(target.b.v).toBe(42)
})

await test('identity: replace preserves intra-source aliasing', expect => {
	const shared = { v: 1 }
	const target = {}
	replace(target, { a: shared, b: shared })
	expect(target.a).toBe(target.b)
	expect(target.a).not.toBe(shared)
	target.a.v = 42
	expect(target.b.v).toBe(42)
})

await test('identity: reset preserves intra-source aliasing on new keys', expect => {
	const shared = { v: 1 }
	const target = {}
	reset(target, { a: shared, b: shared })
	expect(target.a).toBe(target.b)
	expect(target.a).not.toBe(shared)
})

await test('identity: merge preserves intra-source aliasing at depth', expect => {
	const shared = { v: 1 }
	const source = { outer: { a: shared, b: shared } }
	const target = {}
	merge(target, source)
	expect(target.outer.a).toBe(target.outer.b)
	target.outer.a.v = 99
	expect(target.outer.b.v).toBe(99)
})

await test('identity: merge preserves intra-source aliasing inside arrays', expect => {
	const shared = { v: 1 }
	const source = { list: [shared, shared] }
	const target = {}
	merge(target, source)
	expect(target.list[0]).toBe(target.list[1])
	expect(target.list[0]).not.toBe(shared)
})

/* ================================================================= */
/*  E. Target → source isolation                                       */
/* ================================================================= */
/*
 * Mutating target after reconcile must not reach back into source.
 * This is the other direction of detachment.
 */

await test('identity: merge — mutating target does not leak into source', expect => {
	const source = { nested: { x: 1 } }
	const target = {}
	merge(target, source)
	target.nested.x = 999
	target.nested.newKey = 'leak'
	expect(source.nested.x).toBe(1)
	expect(source.nested.newKey).toBe(undefined)
})

await test('identity: replace — mutating target does not leak into source', expect => {
	const source = { nested: { x: 1 } }
	const target = {}
	replace(target, source)
	target.nested.x = 999
	expect(source.nested.x).toBe(1)
})

await test('identity: reset — mutating target does not leak into source', expect => {
	const source = { nested: { x: 1 } }
	const target = { nested: {} }
	reset(target, source)
	target.nested.x = 999
	expect(source.nested.x).toBe(1)
})

await test('identity: merge — mutating target deeply does not leak into source', expect => {
	const source = { root: { mid: { leaf: { v: 1 } } } }
	const target = {}
	merge(target, source)
	target.root.mid.leaf.v = 999
	target.root.mid.leaf.added = 'leak'
	expect(source.root.mid.leaf.v).toBe(1)
	expect(source.root.mid.leaf.added).toBe(undefined)
})

/* ================================================================= */
/*  F. Mutable-source detachment                                       */
/* ================================================================= */
/*
 * When source is itself a mutable, the same detachment guarantees
 * apply. Copying a mutable produces a plain snapshot (see copy.js
 * Policy C), so mutating the mutable source after reconcile must
 * not leak into target.
 */

await test('identity: merge — mutable source detached at shallow path', expect => {
	const source = mutable({ nested: { x: 1 } })
	const target = {}
	merge(target, source)
	source.nested.x = 999
	source.nested.added = 'leak'
	expect(target.nested.x).toBe(1)
	expect(target.nested.added).toBe(undefined)
})

await test('identity: replace — mutable source detached at shallow path', expect => {
	const source = mutable({ nested: { x: 1 } })
	const target = {}
	replace(target, source)
	source.nested.x = 999
	expect(target.nested.x).toBe(1)
})

await test('identity: reset — mutable source detached at shallow path', expect => {
	const source = mutable({ nested: { x: 1 } })
	const target = { nested: {} }
	reset(target, source)
	source.nested.x = 999
	expect(target.nested.x).toBe(1)
})

await test('identity: merge — mutable source detached at depth 3', expect => {
	const source = mutable({ root: { mid: { leaf: { v: 1 } } } })
	const target = {}
	merge(target, source)
	source.root.mid.leaf.v = 999
	source.root.mid.leaf.added = 'leak'
	source.root.mid.extra = 'leak'
	expect(target.root.mid.leaf.v).toBe(1)
	expect(target.root.mid.leaf.added).toBe(undefined)
	expect(target.root.mid.extra).toBe(undefined)
})

await test('identity: merge — mutable source array detached', expect => {
	const source = mutable({ list: [1, 2, 3] })
	const target = {}
	merge(target, source)
	source.list.push(4)
	source.list[0] = 99
	expect(target.list).toEqual([1, 2, 3])
})

await test('identity: merge — mutable target + mutable source both detached', expect => {
	const source = mutable({ nested: { x: 1 } })
	const target = mutable({})
	merge(target, source)
	source.nested.x = 999
	expect(target.nested.x).toBe(1)
	target.nested.x = 777
	expect(source.nested.x).toBe(999) // source unchanged by target
})

/* ================================================================= */
/*  G. Self-reference safety                                           */
/* ================================================================= */
/*
 * `merge(obj, obj)` must not corrupt obj or hang, because the
 * upfront copy detaches source from target. Same for replace/reset
 * and for subtrees shared between target and source.
 */

await test('identity: merge(obj, obj) does not corrupt obj', expect => {
	const obj = { a: 1, nested: { b: 2 } }
	merge(obj, obj)
	expect(obj.a).toBe(1)
	expect(obj.nested.b).toBe(2)
})

await test('identity: replace(obj, obj) does not corrupt obj', expect => {
	const obj = { a: 1, nested: { b: 2 } }
	replace(obj, obj)
	expect(obj.a).toBe(1)
	expect(obj.nested.b).toBe(2)
})

await test('identity: reset(obj, obj) does not corrupt obj', expect => {
	const obj = { a: 1, nested: { b: 2 } }
	reset(obj, obj)
	expect(obj.a).toBe(1)
	expect(obj.nested.b).toBe(2)
})

await test('identity: merge(mutable, mutable) same ref does not corrupt', expect => {
	const m = mutable({ a: 1, nested: { b: 2 } })
	merge(m, m)
	expect(m.a).toBe(1)
	expect(m.nested.b).toBe(2)
})

await test('identity: merge with aliased subtree between target and source', expect => {
	// target.shared and source.shared are the SAME object ref before
	// merge. copy(source) detaches source.shared; target.shared is
	// walked in place.
	const shared = { v: 1 }
	const target = { shared }
	const source = { shared, extra: { q: 9 } }
	merge(target, source)
	// target.shared ref preserved (recursive walk path)
	expect(target.shared).toBe(shared)
	// extra was a new key: target.extra is a detached copy
	expect(target.extra).not.toBe(source.extra)
	source.extra.q = 999
	expect(target.extra.q).toBe(9)
})

/* ================================================================= */
/*  H. Keyed-array identity at deep paths                              */
/* ================================================================= */
/*
 * Already tested in merge.jsx/replace.jsx for shallow arrays. Here
 * we pin that keyed-array identity preservation survives at nested
 * paths.
 */

await test('identity: merge keyed array preserves matched item refs at depth 2', expect => {
	const refAlice = { id: 1, name: 'alice' }
	const refBob = { id: 2, name: 'bob' }
	const target = {
		group: { users: [refAlice, refBob] },
	}
	merge(
		target,
		{
			group: {
				users: [
					{ id: 2, age: 30 },
					{ id: 3, name: 'carol' },
				],
			},
		},
		{ group: { users: { key: 'id' } } },
	)

	expect(target.group.users[0]).toBe(refAlice)
	expect(target.group.users[1]).toBe(refBob)
	expect(target.group.users[1].age).toBe(30)
	// carol was new — pushed as a detached copy
	expect(target.group.users[2]).not.toBe(undefined)
	expect(target.group.users[2].name).toBe('carol')
})

await test('identity: replace keyed array preserves matched refs at depth 2', expect => {
	const refA = { id: 1, name: 'a' }
	const refB = { id: 2, name: 'b' }
	const target = {
		group: { users: [refA, refB] },
	}
	replace(
		target,
		{
			group: { users: [{ id: 2, age: 30 }] },
		},
		{ group: { users: { key: 'id' } } },
	)

	// refA not in source — removed
	expect(target.group.users.length).toBe(1)
	expect(target.group.users[0]).toBe(refB)
	expect(target.group.users[0].age).toBe(30)
})

await test('identity: merge keyed array at depth 3', expect => {
	const refInner = { id: 1, x: 'keep' }
	const target = {
		a: { b: { list: [refInner] } },
	}
	merge(
		target,
		{
			a: { b: { list: [{ id: 1, y: 'add' }] } },
		},
		{ a: { b: { list: { key: 'id' } } } },
	)

	expect(target.a.b.list[0]).toBe(refInner)
	expect(target.a.b.list[0]).toEqual({ id: 1, x: 'keep', y: 'add' })
})

/* ================================================================= */
/*  I. Reset-specific branches                                         */
/* ================================================================= */
/*
 * Reset has distinct branches from merge/replace:
 *   - array `next` → wholesale replacement (target[id] = next)
 *   - empty object → wholesale replacement
 *   - non-morph, non-array, non-empty object → recurse in place
 *
 * Pin the identity behavior of each.
 */

await test('identity: reset replaces array wholesale (identity NOT preserved)', expect => {
	const list = [1, 2, 3]
	const target = { list }
	reset(target, { list: [9] })
	expect(target.list).not.toBe(list)
	expect(target.list).toEqual([9])
})

await test('identity: reset replaces empty-object source wholesale', expect => {
	const nested = { x: 1 }
	const target = { nested }
	reset(target, { nested: {} })
	expect(target.nested).not.toBe(nested)
	expect(target.nested).toEqual({})
})

await test('identity: reset recurses into non-empty object (identity PRESERVED)', expect => {
	const nested = { x: 1 }
	const target = { nested }
	reset(target, { nested: { x: 99 } })
	expect(target.nested).toBe(nested)
	expect(target.nested.x).toBe(99)
})

await test('identity: reset array wholesale-replace at depth 2', expect => {
	const list = [1, 2]
	const target = { outer: { list } }
	reset(target, { outer: { list: [9] } })
	expect(target.outer.list).not.toBe(list)
	expect(target.outer.list).toEqual([9])
})

await test('identity: reset empty-object wholesale-replace at depth 2', expect => {
	const leaf = { k: 1 }
	const target = { outer: { leaf } }
	reset(target, { outer: { leaf: {} } })
	expect(target.outer.leaf).not.toBe(leaf)
	expect(target.outer.leaf).toEqual({})
})

/* ================================================================= */
/*  J. Replace-specific: removes missing keys                          */
/* ================================================================= */

await test('identity: replace removes keys not in source; target ref preserved', expect => {
	const target = { a: 1, b: 2, c: 3 }
	const result = replace(target, { a: 10 })
	expect(result).toBe(target)
	expect('b' in target).toBe(false)
	expect('c' in target).toBe(false)
	expect(target.a).toBe(10)
})

await test('identity: replace removes keys at depth 2 while preserving nested ref', expect => {
	const nested = { a: 1, b: 2, c: 3 }
	const target = { nested }
	replace(target, { nested: { a: 10 } })
	expect(target.nested).toBe(nested)
	expect('b' in target.nested).toBe(false)
	expect('c' in target.nested).toBe(false)
	expect(target.nested.a).toBe(10)
})

await test('identity: replace trims array length at depth 2 preserving array ref', expect => {
	const list = [1, 2, 3, 4, 5]
	const target = { list }
	replace(target, { list: [9, 8] })
	expect(target.list).toBe(list)
	expect(target.list.length).toBe(2)
	expect(target.list).toEqual([9, 8])
})

/* ================================================================= */
/*  K. Merge-specific: target-only keys preserved                      */
/* ================================================================= */

await test('identity: merge keeps target-only keys (shallow)', expect => {
	const target = { keep: 'this', shared: 1 }
	merge(target, { shared: 2, add: 'new' })
	expect(target.keep).toBe('this')
	expect(target.shared).toBe(2)
	expect(target.add).toBe('new')
})

await test('identity: merge keeps target-only keys at depth 2', expect => {
	const nested = { keep: 'this', shared: 1 }
	const target = { nested }
	merge(target, { nested: { shared: 2, add: 'new' } })
	expect(target.nested).toBe(nested)
	expect(target.nested.keep).toBe('this')
	expect(target.nested.shared).toBe(2)
	expect(target.nested.add).toBe('new')
})

/* ================================================================= */
/*  L. Primitive-overwrites-object (and vice versa)                    */
/* ================================================================= */
/*
 * When source[id] is a primitive but target[id] is an object, the
 * object target ref is lost (target[id] = primitive). Document
 * across the three functions at shallow and deep paths.
 */

await test('identity: merge overwrites nested object with primitive source', expect => {
	const nested = { x: 1 }
	const target = { nested }
	merge(target, { nested: 5 })
	expect(target.nested).toBe(5)
})

await test('identity: replace overwrites nested object with primitive source', expect => {
	const nested = { x: 1 }
	const target = { nested }
	replace(target, { nested: 5 })
	expect(target.nested).toBe(5)
})

await test('identity: reset overwrites nested object with primitive source', expect => {
	const nested = { x: 1 }
	const target = { nested }
	reset(target, { nested: 5 })
	expect(target.nested).toBe(5)
})

await test('identity: merge overwrites deep object with primitive', expect => {
	const leaf = { v: 1 }
	const mid = { leaf }
	const target = { root: { mid } }
	merge(target, { root: { mid: { leaf: 'primitive' } } })
	expect(target.root.mid).toBe(mid)
	expect(target.root.mid.leaf).toBe('primitive')
})

/* ================================================================= */
/*  M. Primitive → object / array morph (the other half of §C)         */
/* ================================================================= */
/*
 * `morphedBetweenArrayAndObject` returns true when EITHER side is
 * an object/array and the other isn't. So primitive → object and
 * primitive → array also hit the morph branch — `target[id]` is
 * wholesale-replaced with the copied source value.
 */

await test('identity: merge — primitive target → object source (morph)', expect => {
	/** @type {{x: number | { a: number }}} */
	const target = { x: 1 }
	const sourceInner = { a: 1 }
	merge(target, { x: sourceInner })
	// Morph branch replaces target.x with the copy of sourceInner.
	expect(target.x).not.toBe(sourceInner)
	expect(target.x).toEqual({ a: 1 })
	// Detachment: mutating original source doesn't leak.
	sourceInner.a = 999
	expect(/** @type {{a: number}} */ (target.x).a).toBe(1)
})

await test('identity: merge — primitive target → array source (morph)', expect => {
	const target = { x: 1 }
	const sourceArr = [7, 8, 9]
	merge(target, { x: sourceArr })
	expect(target.x).not.toBe(sourceArr)
	expect(target.x).toEqual([7, 8, 9])
	sourceArr.push(99)
	expect(target.x).toEqual([7, 8, 9])
})

await test('identity: replace — primitive target → object source (morph)', expect => {
	const target = { x: 1 }
	replace(target, { x: { a: 1 } })
	expect(target.x).toEqual({ a: 1 })
})

await test('identity: replace — primitive target → array source (morph)', expect => {
	const target = { x: 1 }
	replace(target, { x: [7, 8, 9] })
	expect(target.x).toEqual([7, 8, 9])
})

await test('identity: reset — primitive target → object source (morph)', expect => {
	const target = { x: 1 }
	reset(target, { x: { a: 1 } })
	expect(target.x).toEqual({ a: 1 })
})

await test('identity: reset — primitive target → array source (morph)', expect => {
	// reset has an explicit array branch that also does wholesale
	// replacement — same observable result.
	const target = { x: 1 }
	reset(target, { x: [7, 8, 9] })
	expect(target.x).toEqual([7, 8, 9])
})

await test('identity: merge primitive→object morph at depth 2', expect => {
	const outer = { inner: 1 }
	const target = { outer }
	merge(target, { outer: { inner: { a: 1 } } })
	expect(target.outer).toBe(outer) // recursive walk preserves outer
	expect(target.outer.inner).toEqual({ a: 1 })
})

/* ================================================================= */
/*  O. Top-level array target                                          */
/* ================================================================= */
/*
 * When the target passed to reconcile is itself an array, the
 * outer `for (id in source)` iterates source's numeric keys and
 * writes them into target. Replace additionally trims
 * `target.length` to match source.
 */

await test('identity: merge on array target — returns target, element-wise merge', expect => {
	const target = [1, 2, 3]
	const result = merge(target, [9])
	expect(result).toBe(target)
	expect(target).toEqual([9, 2, 3])
})

await test('identity: replace on array target trims length', expect => {
	const target = [1, 2, 3, 4, 5]
	const result = replace(target, [9, 8])
	expect(result).toBe(target)
	expect(target.length).toBe(2)
	expect(target).toEqual([9, 8])
})

await test('identity: reset on array target — overwrites without trim', expect => {
	const target = [1, 2, 3]
	const result = reset(target, [9, 8])
	expect(result).toBe(target)
	// reset iterates source keys and writes; extra target slots are
	// left untouched.
	expect(target[0]).toBe(9)
	expect(target[1]).toBe(8)
	expect(target[2]).toBe(3)
})

await test('identity: merge array target — nested object elements preserved by ref', expect => {
	const refA = { id: 1 }
	const refB = { id: 2 }
	const target = [refA, refB]
	merge(target, [{ extra: 'a' }, { extra: 'b' }])
	// No keys option → recurses element-wise.
	expect(target[0]).toBe(refA)
	expect(target[1]).toBe(refB)
	expect(target[0].extra).toBe('a')
	expect(target[1].extra).toBe('b')
})

/* ================================================================= */
/*  P. Empty source                                                    */
/* ================================================================= */

await test('identity: merge(target, {}) is a no-op; target ref preserved', expect => {
	const nested = { x: 1 }
	const target = { a: 1, nested }
	const result = merge(target, {})
	expect(result).toBe(target)
	expect(target.nested).toBe(nested)
	expect(target).toEqual({ a: 1, nested: { x: 1 } })
})

await test('identity: replace(target, {}) strips every key; target ref preserved', expect => {
	const target = { a: 1, b: 2, nested: { x: 1 } }
	const result = replace(target, {})
	expect(result).toBe(target)
	expect(Object.keys(target)).toEqual([])
})

await test('identity: reset(target, {}) is a no-op; target ref preserved', expect => {
	const nested = { x: 1 }
	const target = { a: 1, nested }
	const result = reset(target, {})
	expect(result).toBe(target)
	expect(target.nested).toBe(nested)
	expect(target).toEqual({ a: 1, nested: { x: 1 } })
})

await test('identity: replace(array, []) empties the array, preserving ref', expect => {
	const target = [1, 2, 3]
	const result = replace(target, [])
	expect(result).toBe(target)
	expect(target.length).toBe(0)
})

/* ================================================================= */
/*  Q. Keyed-array — deep paths and pushed-item detachment             */
/* ================================================================= */

await test('identity: replace keyed array removes missing matches at depth 2', expect => {
	const refA = { id: 1, name: 'a' }
	const refB = { id: 2, name: 'b' }
	const refC = { id: 3, name: 'c' }
	const target = {
		group: { users: [refA, refB, refC] },
	}
	replace(
		target,
		{
			group: { users: [{ id: 2, age: 30 }] },
		},
		{ group: { users: { key: 'id' } } },
	)
	expect(target.group.users.length).toBe(1)
	expect(target.group.users[0]).toBe(refB)
	expect(target.group.users[0].age).toBe(30)
})

await test('identity: merge keyed array — pushed new items are detached from source', expect => {
	const target = { users: [{ id: 1 }] }
	const newItem = { id: 2, name: 'bob', nested: { deep: 1 } }
	merge(target, { users: [newItem] }, { users: { key: 'id' } })
	// id=2 is new → pushed. Must be a detached copy.
	expect(target.users.length).toBe(2)
	expect(target.users[1]).not.toBe(newItem)
	newItem.name = 'MUT'
	newItem.nested.deep = 999
	expect(target.users[1].name).toBe('bob')
	expect(target.users[1].nested.deep).toBe(1)
})

await test('identity: replace keyed array — pushed new items are detached from source', expect => {
	const target = { users: [{ id: 1 }] }
	const newItem = { id: 2, nested: { v: 1 } }
	replace(target, { users: [newItem] }, { users: { key: 'id' } })
	expect(target.users[0]).not.toBe(newItem)
	newItem.nested.v = 999
	expect(target.users[0].nested.v).toBe(1)
})

await test('identity: replace keyed array with empty source removes all matched', expect => {
	const refA = { id: 1 }
	const refB = { id: 2 }
	const target = { users: [refA, refB] }
	/** @type {{ users: Array<{ id: number }> }} */
	const source = { users: [] }
	replace(target, source, { users: { key: 'id' } })
	expect(target.users.length).toBe(0)
})

/* ================================================================= */
/*  R. Primitive same-value fast path                                  */
/* ================================================================= */

await test('identity: merge primitive same-value does not trigger write', expect => {
	// Pin the `prev !== next` branch's negative: same-value is a no-op.
	// (Observable effect: nothing to assert on the target, but the
	// branch is covered.)
	const target = { a: 1 }
	const result = merge(target, { a: 1 })
	expect(result).toBe(target)
	expect(target.a).toBe(1)
})

await test('identity: reset primitive same-value branch — no mutation', expect => {
	const target = { a: 1 }
	reset(target, { a: 1 })
	expect(target.a).toBe(1)
})

/* ================================================================= */
/*  S. Source with cycles                                              */
/* ================================================================= */

await test('identity: merge with cyclic source — does not hang, detachment holds', expect => {
	const srcChild = { v: 1 }
	const srcParent = { child: srcChild }
	srcChild.back = srcParent // cycle: child ↔ parent

	const target = {}
	merge(target, { node: srcParent })

	// Structure preserved
	expect(target.node.child.v).toBe(1)
	// Cycle preserved in copy via `seen` — target.node.child.back
	// should point back to target.node (the same copy).
	expect(target.node.child.back).toBe(target.node)

	// Detachment: mutating source doesn't leak.
	srcChild.v = 999
	expect(target.node.child.v).toBe(1)
})

/* ================================================================= */
/*  N. Non-object target + object source — new-key path                */
/* ================================================================= */

await test('identity: merge new key — nested object source is detached', expect => {
	const target = { a: 1 }
	const sourceInner = { deep: { v: 1 } }
	merge(target, { b: sourceInner })
	expect(target.b).not.toBe(sourceInner)
	sourceInner.deep.v = 999
	sourceInner.added = 'leak'
	expect(target.b.deep.v).toBe(1)
	expect(target.b.added).toBe(undefined)
})

await test('identity: replace new key — nested object source is detached', expect => {
	const target = { a: 1 }
	const sourceInner = { deep: { v: 1 } }
	replace(target, { a: 1, b: sourceInner })
	sourceInner.deep.v = 999
	expect(target.b.deep.v).toBe(1)
})

await test('identity: reset new key — nested object source is detached', expect => {
	const target = {}
	const sourceInner = { deep: { v: 1 } }
	reset(target, { b: sourceInner })
	sourceInner.deep.v = 999
	expect(target.b.deep.v).toBe(1)
})
