/** @jsxImportSource pota */

// Repro for the `map()` "handle swap" loop bug in
// src/lib/reactive.js.
//
// The second branch of the swap loop tests
//   sorted.includes(rows[usort.index - 1])
// but the analogous first branch tests
//   sorted.includes(rows[usort.index - 1])
// against rows[usort.index - 1] — its own anchor. By symmetry the
// second branch should test rows[usort.index + 1] (its anchor),
// not rows[usort.index - 1]. The typo makes the second branch
// skip a legitimate smart placement when the right-hand neighbor
// is a row that was already handled earlier in the same loop.
//
// With the "handles all other cases" fallback loop enabled the bug
// is invisible — the fallback corrects any missed placement. With
// that fallback disabled, the missed placement surfaces as a wrong
// final DOM order.
//
// Trigger: [A,B,C,D,E,F,G] → [A,F,D,E,C,B,G]
//   iter 1: F placed after A       (first branch)
//   iter 2: B placed before G      (second branch) — B enters sorted
//   iter 3: C — first branch fails (rows[3]=E is unsort, not sorted);
//           second branch anchor is rows[5]=B which IS now in sorted.
//           Buggy check reads rows[3]=E → skip. Correct check reads
//           rows[5]=B → fire.
//
// Expected buggy output:  A F D C E B G   (C and E swapped)
// Expected correct output: A F D E C B G

import { test, body } from '#test'

import { render, signal } from 'pota'
import { For } from 'pota/components'

await test('For - reorder exposes swap-loop asymmetry', expect => {
	const items = signal(['a', 'b', 'c', 'd', 'e', 'f', 'g'])

	const dispose = render(
		<For each={items.read}>{item => <p>{item}</p>}</For>,
	)

	expect(body()).toBe(
		'<p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p>',
	)

	items.write(['a', 'f', 'd', 'e', 'c', 'b', 'g'])

	expect(body()).toBe(
		'<p>a</p><p>f</p><p>d</p><p>e</p><p>c</p><p>b</p><p>g</p>',
	)

	dispose()
})

// Same class of case, but the fixed second branch must fire three
// times in sequence — each unsort row anchors to the row placed in
// the previous iteration.
//
// Trigger: [A..H] → [A, G, F, C, D, B, E, H]
//   iter 1: G placed after A            (first branch)
//   iter 2: E placed before H           (second branch) — E enters sorted
//   iter 3: B — first fails (rows[4]=D unsort); fixed second fires via
//           rows[6]=E in sorted. B enters sorted.
//   iter 4: D — first fails (rows[3]=C unsort); fixed second fires via
//           rows[5]=B in sorted. D enters sorted.
//   iter 5: C — first fails (rows[2]=F unsort); fixed second fires via
//           rows[4]=D in sorted.
//   iter 6: F — unsorted===1, first branch fires trivially.

await test('For - reorder chains three second-branch placements', expect => {
	const items = signal(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])

	const dispose = render(
		<For each={items.read}>{item => <p>{item}</p>}</For>,
	)

	expect(body()).toBe(
		'<p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p><p>g</p><p>h</p>',
	)

	items.write(['a', 'g', 'f', 'c', 'd', 'b', 'e', 'h'])

	expect(body()).toBe(
		'<p>a</p><p>g</p><p>f</p><p>c</p><p>d</p><p>b</p><p>e</p><p>h</p>',
	)

	dispose()
})

// Exercises the first-branch `sorted.includes(rows[usort.index - 1])`
// disjunct — the only disjunct that fires via a row placed earlier in
// the same loop via the first branch.
//
// Trigger: [A, X, B, C] → [A, B, C, X]
//   first pass: sorted=[A], unsort=[B, X, C]
//   iter 1: B placed after A        (first branch via !unsort.includes)
//   iter 2: X — no anchor, skipped
//   iter 3: C — first branch fails on rows[1]=B via !unsort.includes
//           (B is in unsort) but fires via sorted.includes(B) with
//           unsorted=2 (not the unsorted===1 short-circuit).
//           Removes C from DOM and inserts after B, which shifts X to
//           its target position at the end as a side effect.

await test('For - reorder exercises first-branch sorted.includes', expect => {
	const items = signal(['a', 'x', 'b', 'c'])

	const dispose = render(
		<For each={items.read}>{item => <p>{item}</p>}</For>,
	)

	expect(body()).toBe('<p>a</p><p>x</p><p>b</p><p>c</p>')

	items.write(['a', 'b', 'c', 'x'])

	expect(body()).toBe('<p>a</p><p>b</p><p>c</p><p>x</p>')

	dispose()
})

// SCRATCH: does second-branch unsorted===1 actually fire?
// Replace 'a' with new 'd' at the front. After A is disposed,
// prev=[B, C], rows=[D, B, C]. First pass compares prev[P-i2] vs
// rows[R-i2]: matches at both inner steps. sorted=[C, B],
// unsort=[D]. unsorted=1. Iter 1 for D (index 0) — rows[-1] undef,
// first branch fails; rows[1]=B exists and unsorted===1 → second
// branch fires. If this works, the disjunct is reachable.

await test('For - insert at front with disposal', expect => {
	const items = signal(['a', 'b', 'c'])

	const dispose = render(
		<For each={items.read}>{item => <p>{item}</p>}</For>,
	)

	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	items.write(['d', 'b', 'c'])

	expect(body()).toBe('<p>d</p><p>b</p><p>c</p>')

	dispose()
})

// Mirror of the above — replace in the middle instead of the front.
// Breakpoint lands at i=1 so U.index=1, which means rows[U.index-1]
// exists. First branch fires via unsorted===1 on the first iteration
// (it gets the short-circuit before second branch is consulted).
//
// Replace-at-last can't reach the smart loop via the first pass
// because after disposal prev.length < rows.length and the outer
// loop ends before the new-at-end position is ever compared, so
// unsort stays empty and toDiff handles the append alone. Middle
// replacement is the interesting symmetric case.

await test('For - replace in middle with disposal', expect => {
	const items = signal(['a', 'b', 'c'])

	const dispose = render(
		<For each={items.read}>{item => <p>{item}</p>}</For>,
	)

	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')

	items.write(['a', 'd', 'c'])

	expect(body()).toBe('<p>a</p><p>d</p><p>c</p>')

	dispose()
})
