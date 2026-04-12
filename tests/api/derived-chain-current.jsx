/** @jsxImportSource pota */

// Regression tests for `derived(...fns)` chain behavior.
// Covers single-stage, multi-stage with pure transforms, and
// multi-stage with intermediate signal deps (per-stage re-runs).
//
// See also `derived-chain-expected.jsx` for additional coverage
// and `documentation/derived.md` for the design doc.

import { test } from '#test'
import { signal, derived } from 'pota'

// --- single-stage derived (works correctly) --------------------

await test('current: single-stage derived re-runs when its dep changes', expect => {
	const base = signal(1)
	let runs = 0
	const d = derived(() => {
		runs++
		return base.read() * 10
	})

	expect(d()).toBe(10)
	expect(runs).toBe(1)

	base.write(2)
	expect(d()).toBe(20)
	expect(runs).toBe(2)

	base.write(7)
	expect(d()).toBe(70)
	expect(runs).toBe(3)
})

await test('current: single-stage derived is unaffected by unrelated signal writes', expect => {
	const base = signal(1)
	const unrelated = signal('x')
	let runs = 0
	const d = derived(() => {
		runs++
		return base.read()
	})

	d()
	expect(runs).toBe(1)

	unrelated.write('y')
	d()
	expect(runs).toBe(1)

	unrelated.write('z')
	unrelated.write('w')
	d()
	expect(runs).toBe(1)
})

// --- two-stage chain, pure f1 ----------------------------------

// When the second stage is a pure transformation (no signal
// reads), full-chain re-runs driven by fn[0]'s deps work because
// the update path restarts from the top with `this.fn.slice(1)`.

await test('current: two-stage chain with pure f1 — change in f0 dep re-runs both', expect => {
	const base = signal(2)
	let runs0 = 0
	let runs1 = 0
	const d = derived(
		() => {
			runs0++
			return base.read()
		},
		v => {
			runs1++
			return v * 2
		},
	)

	expect(d()).toBe(4)
	expect(runs0).toBe(1)
	expect(runs1).toBe(1)

	base.write(5)
	expect(d()).toBe(10)
	expect(runs0).toBe(2)
	expect(runs1).toBe(2)
})

// --- two-stage chain with intermediate dep: WORKS today -------

// Surprisingly, 2-stage chains with f1 reading a signal behave
// correctly. This is because:
//
//   - f1 IS the last stage, so `fns` is legitimately empty on
//     commit (Issue 2 is vacuous — no downstream to re-dispatch).
//   - Only one nested `runUpdates` level fires during setup, so
//     `updatedAt` ends up equal to f1's captured `time`, keeping
//     `updatedAt <= time` true on re-run (Issue 1 is vacuous).
//
// This is a working baseline to preserve: when the fix lands,
// these assertions must continue to hold.

await test('current: 2-stage chain, intermediate dep change commits correctly', expect => {
	const baseA = signal(1)
	const baseB = signal(10)
	const runs = { f0: 0, f1: 0 }

	const d = derived(
		() => {
			runs.f0++
			return baseA.read()
		},
		v => {
			runs.f1++
			return v + baseB.read()
		},
	)

	expect(d()).toBe(11)
	expect(runs).toEqual({ f0: 1, f1: 1 })

	// f1 has its own dep (baseB); change it → f1 re-runs → value
	// updates correctly. f0 stays cached at 1.
	baseB.write(20)
	expect(d()).toBe(21)
	expect(runs.f0).toBe(1) // f0 was NOT re-run — its value is cached
	expect(runs.f1).toBe(2)

	baseB.write(100)
	expect(d()).toBe(101)
	expect(runs.f0).toBe(1)
	expect(runs.f1).toBe(3)
})

// --- three-stage chain, pure f1 and f2 -------------------------

await test('current: three-stage chain with pure transforms — dep change in f0 re-runs all', expect => {
	const base = signal(1)
	const runs = { f0: 0, f1: 0, f2: 0 }
	const d = derived(
		() => {
			runs.f0++
			return base.read()
		},
		v => {
			runs.f1++
			return v + 1
		},
		v => {
			runs.f2++
			return v * 10
		},
	)

	expect(d()).toBe(20) // (1 + 1) * 10
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	base.write(3)
	expect(d()).toBe(40) // (3 + 1) * 10
	expect(runs).toEqual({ f0: 2, f1: 2, f2: 2 })
})

// --- chain with an intermediate signal read: KNOWN BROKEN ------

// When an intermediate stage reads a signal of its own, that
// signal's change triggers the stage's tracking effect to re-run
// the transformation — but the result silently fails to commit
// and downstream stages never run. The committed value remains
// stale. See `documentation/derived.md` Issue 1 and Issue 2.
//
// These tests ASSERT the broken behavior so they pass today.
// They are not describing the desired semantic — they are
// pinning current behavior for comparison against
// `derived-chain-expected.jsx`.

await test('current: chain intermediate dep — re-runs from that stage onward', expect => {
	const baseA = signal(1)
	const baseB = signal(10)
	const runs = { f0: 0, f1: 0, f2: 0 }

	const d = derived(
		() => {
			runs.f0++
			return baseA.read()
		},
		v => {
			runs.f1++
			return v + baseB.read()
		},
		v => {
			runs.f2++
			return v * 2
		},
	)

	// baseline: initial read runs everything once and produces 22
	expect(d()).toBe(22)
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// writing baseB re-runs f1 and f2, but not f0
	baseB.write(20)
	expect(d()).toBe(42) // (1 + 20) * 2
	expect(runs.f0).toBe(1)
	expect(runs.f1).toBe(2)
	expect(runs.f2).toBe(2)
})

await test('current: chain intermediate then top dep — both update correctly', expect => {
	const baseA = signal(1)
	const baseB = signal(10)

	const d = derived(
		() => baseA.read(),
		v => v + baseB.read(),
		v => v * 2,
	)

	d()

	// intermediate dep change updates correctly
	baseB.write(20)
	expect(d()).toBe(42) // (1 + 20) * 2

	// top dep change re-runs full chain
	baseA.write(5)
	expect(d()).toBe(50) // (5 + 20) * 2
})

await test('current: chain with unrelated signal does nothing (baseline)', expect => {
	const baseA = signal(1)
	const baseB = signal(10)
	const unrelated = signal('x')
	const runs = { f0: 0, f1: 0, f2: 0 }

	const d = derived(
		() => {
			runs.f0++
			return baseA.read()
		},
		v => {
			runs.f1++
			return v + baseB.read()
		},
		v => {
			runs.f2++
			return v * 2
		},
	)

	d()
	const before = { ...runs }

	unrelated.write('y')
	d()
	expect(runs).toEqual(before)

	unrelated.write('z')
	unrelated.write('w')
	d()
	expect(runs).toEqual(before)
})
