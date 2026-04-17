/** @jsxImportSource pota */

// Tests for `derived(...fns)` chain re-runs — per-stage
// re-evaluation, multi-hop chains, user write override semantics,
// and value correctness.
//
// This file is in the test-runner `ignore` list so the default
// `npm run test:api` does not include it. Run explicitly with:
//
//   npm run test:api -- derived-chain-expected
//
// See also `derived-chain-current.jsx` for baseline regression
// tests and `documentation/derived.md` for the design doc.

import { test } from '#test'
import { signal, derived, memo } from 'pota'

// --- Issue 1: `updatedAt <= time` blocks intermediate commits ---

// These tests focus on the GATE issue. A 3-stage chain with
// intermediate signal deps re-triggers f1's tracking effect when
// baseB changes, but the commit callback's `updatedAt <= time`
// check fails because the setup's nested `runUpdates` bumped
// `this.updatedAt` past f1's captured `time`.
//
// Symptom observable from outside: f1 re-ran (runs.f1 increments)
// but the committed value did NOT change. f2 also never runs
// because the re-dispatch down the chain never happens.
//
// If Issue 1 is fixed in isolation (and Issue 2 is not), this
// test still fails but in a DIFFERENT way — f2 still doesn't run
// (because fns was shifted empty) and the value changes to f1's
// intermediate result rather than the correct final value.

await test('issue 1: 3-stage intermediate dep change — commit is not blocked', expect => {
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

	expect(d()).toBe(22)
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// baseB change — f1's effect re-runs. With Issue 1 fixed,
	// cb2 no longer fails the gate check and enters the commit
	// path. Whether it commits the INTERMEDIATE value or the
	// CORRECT final value depends on Issue 2.
	baseB.write(20)

	// runs.f1 is already 2 today (the effect ran, even though the
	// commit was rejected) — re-assert to pin the behavior
	expect(runs.f1).toBe(2)

	// with Issue 1 fixed alone, value would update to either 21
	// (intermediate, Issue 2 still broken) or 42 (correct).
	// The correct behavior is 42, but to detect that Issue 1
	// specifically was fixed, we check that d() has MOVED away
	// from the stale 22.
	expect(d()).not.toBe(22)
})

// --- Issue 2: `fns.shift()` drops the tail for intermediate re-runs ---

// These tests focus on the MUTATION issue. Even if Issue 1 is
// fixed and cb2 commits on re-run, Issue 2 would cause it to
// commit the intermediate value as if it were the final value —
// bypassing the downstream chain entirely.
//
// Symptom: f2 is not re-invoked on an intermediate dep change.
// runs.f2 stays at 1 while runs.f1 increments.

await test('issue 2: 3-stage intermediate dep change — downstream stages re-run', expect => {
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
	d()
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// after baseB change, f2 must re-run with f1's fresh result
	baseB.write(20)
	d()

	// Issue 2 specifically: f2 must have been invoked again
	expect(runs.f2).toBe(2)
	expect(runs.f0).toBe(1) // and f0 still not re-run
})

await test('issue 2: 3-stage intermediate dep change — final value is not an intermediate', expect => {
	const baseA = signal(1)
	const baseB = signal(10)

	const d = derived(
		() => baseA.read(),
		v => v + baseB.read(), // intermediate result
		v => v * 2, // final multiplier
	)

	expect(d()).toBe(22) // initial correct

	baseB.write(20)
	// the committed value must go through f2 — 42, not 21.
	// If Issue 2 is not fixed but Issue 1 is, we'd see 21 here.
	expect(d()).toBe(42)
})

// --- combined: both issues fixed — full per-stage re-runs ------

await test('expected: intermediate dep change re-runs only from that stage onward', expect => {
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

	// baseline: initial read runs everything once
	expect(d()).toBe(22) // (1 + 10) * 2
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// writing baseB should re-run f1 (its dep changed) and f2
	// (downstream), but NOT f0 whose cached result is still valid
	baseB.write(20)
	expect(d()).toBe(42) // (1 + 20) * 2
	expect(runs.f0).toBe(1) // f0 was NOT re-run
	expect(runs.f1).toBe(2)
	expect(runs.f2).toBe(2)

	// writing baseA must re-run the whole chain from the top
	baseA.write(5)
	expect(d()).toBe(50) // (5 + 20) * 2
	expect(runs).toEqual({ f0: 2, f1: 3, f2: 3 })
})

await test('expected: tail-stage dep change re-runs only that stage', expect => {
	const baseA = signal(1)
	const baseB = signal(10)
	const baseC = signal(100)
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
			return v * baseC.read()
		},
	)

	expect(d()).toBe(1100) // (1 + 10) * 100
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// only the last stage reads baseC; writing baseC should
	// re-run only f2
	baseC.write(1000)
	expect(d()).toBe(11000) // (1 + 10) * 1000
	expect(runs.f0).toBe(1)
	expect(runs.f1).toBe(1)
	expect(runs.f2).toBe(2)
})

await test('expected: multi-hop chain — re-runs start at the stage whose dep changed', expect => {
	const a = signal(1)
	const b = signal(10)
	const c = signal(100)
	const d0 = signal(1000)
	const runs = { s0: 0, s1: 0, s2: 0, s3: 0 }

	const d = derived(
		() => {
			runs.s0++
			return a.read()
		},
		v => {
			runs.s1++
			return v + b.read()
		},
		v => {
			runs.s2++
			return v + c.read()
		},
		v => {
			runs.s3++
			return v + d0.read()
		},
	)

	expect(d()).toBe(1111) // 1 + 10 + 100 + 1000
	expect(runs).toEqual({ s0: 1, s1: 1, s2: 1, s3: 1 })

	// change only `c` — s0, s1 should NOT re-run; s2, s3 should
	c.write(200)
	expect(d()).toBe(1211) // 1 + 10 + 200 + 1000
	expect(runs.s0).toBe(1)
	expect(runs.s1).toBe(1)
	expect(runs.s2).toBe(2)
	expect(runs.s3).toBe(2)

	// change only `d` — only s3 re-runs
	d0.write(5000)
	expect(d()).toBe(5211) // 1 + 10 + 200 + 5000
	expect(runs.s0).toBe(1)
	expect(runs.s1).toBe(1)
	expect(runs.s2).toBe(2)
	expect(runs.s3).toBe(3)

	// change only `b` — s0 still not re-run, s1/s2/s3 re-run
	b.write(20)
	expect(d()).toBe(5221) // 1 + 20 + 200 + 5000
	expect(runs.s0).toBe(1)
	expect(runs.s1).toBe(2)
	expect(runs.s2).toBe(3)
	expect(runs.s3).toBe(4)

	// change only `a` — full chain re-runs
	a.write(7)
	expect(d()).toBe(5227) // 7 + 20 + 200 + 5000
	expect(runs.s0).toBe(2)
	expect(runs.s1).toBe(3)
	expect(runs.s2).toBe(4)
	expect(runs.s3).toBe(5)
})

// --- unrelated signal: no stage re-runs at all -----------------

await test('expected: unrelated signal write re-runs no stage', expect => {
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
	unrelated.write('z')
	d()
	expect(runs).toEqual(before)
	expect(d()).toBe(22)
})

// --- value correctness after per-stage re-run ------------------

await test('expected: after an intermediate re-run, read returns the freshly computed value', expect => {
	const baseA = signal(2)
	const baseB = signal(3)

	const d = derived(
		() => baseA.read(),
		v => v + baseB.read(),
		v => v * 10,
	)

	expect(d()).toBe(50) // (2 + 3) * 10

	baseB.write(7)
	expect(d()).toBe(90) // (2 + 7) * 10

	baseB.write(100)
	expect(d()).toBe(1020) // (2 + 100) * 10
})

// --- multiple intermediate writes without a read between them --

await test('expected: multiple intermediate writes only re-run at the next read', expect => {
	const baseA = signal(1)
	const baseB = signal(1)
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
			return v * 10
		},
	)

	d()
	expect(runs).toEqual({ f0: 1, f1: 1, f2: 1 })

	// several writes without reads in between — the re-runs are
	// eager per pota's current effect model, so f1 and f2 re-run
	// once per baseB write
	baseB.write(2)
	baseB.write(3)
	baseB.write(4)
	expect(d()).toBe(50) // (1 + 4) * 10

	expect(runs.f0).toBe(1) // f0 never re-ran
	expect(runs.f1).toBe(4) // 1 initial + 3 writes
	expect(runs.f2).toBe(4)
})

// --- explicit user write clears per-stage effects? -------------

await test('expected: after an explicit sync write, dep change overwrites user value', expect => {
	const baseB = signal(10)
	const runs = { f0: 0, f1: 0 }

	const d = derived(
		() => {
			runs.f0++
			return 1
		},
		v => {
			runs.f1++
			return v + baseB.read()
		},
	)

	expect(d()).toBe(11)
	expect(runs).toEqual({ f0: 1, f1: 1 })

	// explicit sync override
	d(999)
	expect(d()).toBe(999)

	// changing baseB re-runs the chain from f1 onward,
	// overwriting the user value
	baseB.write(20)
	expect(d()).toBe(21) // 1 + 20
	expect(runs.f1).toBe(2)
	expect(runs.f0).toBe(1) // f0 was not re-run
})

// --- observer propagation during chain effect re-run ---------------
//
// When a chain effect re-runs and commits, `writeNextValue` calls
// `doWrite` which notifies observers — while `Listener` is still
// set to the chain effect. These tests verify that observer
// propagation works correctly in that context.

await test('observer: user write then dep change — downstream derived sees fresh value', expect => {
	const baseA = signal(1)
	const baseB = signal(10)

	const d1 = derived(
		() => baseA.read(),
		v => v + baseB.read(),
		v => v * 2,
	)

	const d2 = derived(() => d1() + 100)

	expect(d1()).toBe(22)
	expect(d2()).toBe(122)

	// user overrides d1
	d1(999)
	expect(d1()).toBe(999)
	expect(d2()).toBe(1099)

	// dep change overwrites user value, d2 updates
	baseB.write(20)
	expect(d1()).toBe(42)
	expect(d2()).toBe(142)
})

await test('observer: user write then dep change — downstream memo sees fresh value', expect => {
	const baseA = signal(1)
	const baseB = signal(10)

	const d = derived(
		() => baseA.read(),
		v => v + baseB.read(),
		v => v * 2,
	)

	const observed = memo(() => d() + 1)

	expect(observed()).toBe(23) // 22 + 1

	// user override
	d(999)
	expect(observed()).toBe(1000)

	// dep change overwrites, memo sees new value
	baseB.write(20)
	expect(observed()).toBe(43) // 42 + 1

	baseA.write(5)
	expect(observed()).toBe(51) // (5 + 20) * 2 + 1
})

await test('observer: user write then dep change — chained deriveds propagate correctly', expect => {
	const baseA = signal(1)
	const baseB = signal(10)
	const baseC = signal(100)
	const runs = { d1f0: 0, d1f1: 0, d2f0: 0, d2f1: 0 }

	const d1 = derived(
		() => {
			runs.d1f0++
			return baseA.read()
		},
		v => {
			runs.d1f1++
			return v + baseB.read()
		},
	)

	const d2 = derived(
		() => {
			runs.d2f0++
			return d1()
		},
		v => {
			runs.d2f1++
			return v + baseC.read()
		},
	)

	expect(d2()).toBe(111) // (1 + 10) + 100
	expect(runs).toEqual({ d1f0: 1, d1f1: 1, d2f0: 1, d2f1: 1 })

	// user overrides d1
	d1(999)
	expect(d1()).toBe(999)
	expect(d2()).toBe(1099) // 999 + 100

	// d1's intermediate dep changes — overwrites user value,
	// propagates to d2
	baseB.write(20)
	expect(d1()).toBe(21)
	expect(d2()).toBe(121) // 21 + 100
	expect(runs.d1f0).toBe(1) // d1 f0 not re-run

	// d2's own intermediate dep — only d2f1 re-runs
	baseC.write(200)
	expect(d2()).toBe(221) // 21 + 200
	expect(runs.d1f0).toBe(1)
	expect(runs.d1f1).toBe(2) // d1 unchanged
})
