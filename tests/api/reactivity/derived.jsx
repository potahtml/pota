// Tests for `derived()` — chain stages, sync resolution, array shape
// preservation, explicit writes, promise initialization, stale-token
// rejection.

import { test, sleep } from '#test'
import { signal, derived, isResolved, root, syncEffect } from 'pota'

await test('derived and isResolved - resolve chained values and stay reactive', expect => {
	const count = signal(2)
	const doubled = derived(
		() => count.read(),
		value => value * 2,
	)

	expect(doubled()).toBe(4)
	expect(isResolved(doubled)).toBe(true)

	count.write(5)

	expect(doubled()).toBe(10)
	expect(isResolved(doubled)).toBe(true)
})

// --- derived synchronous chain -----------------------------------------------

await test('derived - synchronous chain resolves immediately', expect => {
	const d = derived(
		() => 2,
		v => v * 3,
		v => v + 1,
	)

	expect(d()).toBe(7)
	expect(isResolved(d)).toBe(true)
})

// --- array shape -------------------------------------------------------------

await test('derived - resolves nested promises into current values', async expect => {
	const resolved = await derived(() => [
		Promise.resolve('a'),
		['b', Promise.resolve('c')],
	])
	expect(resolved()).toEqual(['a', ['b', 'c']])
})

await test('derived - resolves sync array preserving shape', expect => {
	const d = derived(() => ['a', ['b', 'c']])
	expect(d()).toEqual(['a', ['b', 'c']])
})

await test('derived - resolves flat array of promises', async expect => {
	const d = derived(() => [
		Promise.resolve(1),
		Promise.resolve(2),
		Promise.resolve(3),
	])
	const resolved = await d
	expect(resolved()).toEqual([1, 2, 3])
})

await test('derived - resolves deeply nested array with promises', async expect => {
	const d = derived(() => [
		Promise.resolve('a'),
		[Promise.resolve('b'), [Promise.resolve('c')]],
	])
	const resolved = await d
	expect(resolved()).toEqual(['a', ['b', ['c']]])
})

await test('derived - resolves mixed sync and async in array', async expect => {
	const d = derived(() => [
		'sync',
		Promise.resolve('async'),
		42,
		[Promise.resolve('nested')],
	])
	const resolved = await d
	expect(resolved()).toEqual(['sync', 'async', 42, ['nested']])
})

await test('derived - user write to array-returning derived', expect => {
	const d = derived(() => [1, 2, 3])
	expect(d()).toEqual([1, 2, 3])

	d([4, 5])
	expect(d()).toEqual([4, 5])
})

await test('derived - chain stage returning array preserves shape', expect => {
	const base = signal(2)
	const d = derived(
		() => base.read(),
		v => [v, v * 2, v * 3],
	)
	expect(d()).toEqual([2, 4, 6])

	base.write(5)
	expect(d()).toEqual([5, 10, 15])
})

await test('derived - empty array resolves to empty array', expect => {
	const d = derived(() => [])
	expect(d()).toEqual([])
})

await test('derived - nested empty array resolves correctly', expect => {
	const d = derived(() => [1, [], 'a'])
	expect(d()).toEqual([1, [], 'a'])
})

await test('derived - array with null and undefined items', expect => {
	const d = derived(() => [null, undefined, 'a', 0])
	expect(d()).toEqual([null, undefined, 'a', 0])
})

await test('derived - array with function items resolves them', expect => {
	const d = derived(() => [() => 42, () => 'hello'])
	expect(d()).toEqual([42, 'hello'])
})

await test('derived - deeply nested array preserves shape', async expect => {
	const d = derived(() => [
		Promise.resolve([
			Promise.resolve('deep'),
		]),
	])
	const resolved = await d
	expect(resolved()).toEqual([['deep']])
})

await test('derived - array with single promise', async expect => {
	const d = derived(() => [Promise.resolve('only')])
	const resolved = await d
	expect(resolved()).toEqual(['only'])
})

// --- derived writable --------------------------------------------------------

await test('derived - is writable via signal-style write', expect => {
	const base = signal(2)
	const doubled = derived(
		() => base.read(),
		v => v * 2,
	)

	expect(doubled()).toBe(4)

	base.write(5)
	expect(doubled()).toBe(10)
})

await test('derived - write before first read takes effect on subsequent read', expect => {
	const d = derived(() => 'initial')

	// write BEFORE any read — the derived is still STALE at this
	// point; the fix in Derived.write sets state=CLEAN so the next
	// read doesn't re-run the original fn and clobber the value
	d('manual')

	expect(d()).toBe('manual')
})

await test('derived - multiple writes before first read, last write wins', expect => {
	const d = derived(() => 'initial')

	d('first')
	d('second')
	d('third')

	expect(d()).toBe('third')
})

await test('derived - write after read persists through subsequent reads', expect => {
	const d = derived(() => 'initial')

	expect(d()).toBe('initial')

	d('updated')
	expect(d()).toBe('updated')
	expect(d()).toBe('updated')
	expect(d()).toBe('updated')
})

await test('derived - interleaved write/read sequence is consistent', expect => {
	const d = derived(() => 0)

	d(1)
	expect(d()).toBe(1)
	d(2)
	expect(d()).toBe(2)
	d(3)
	d(4)
	expect(d()).toBe(4)
	d(5)
	expect(d()).toBe(5)
})

await test('derived - writing the same value as initial then different still commits', expect => {
	const d = derived(() => 'x')

	d('x')
	expect(d()).toBe('x')
	d('y')
	expect(d()).toBe('y')
})

await test('derived - write without reactive deps does not re-run fn on next read', expect => {
	let runs = 0
	const d = derived(() => {
		runs++
		return 'computed'
	})

	d('manual')
	expect(d()).toBe('manual')
	// fn should not have been invoked at all — the manual write
	// short-circuits the computation on the first read path
	expect(runs).toBe(0)

	d()
	d()
	expect(runs).toBe(0)
})

await test('derived - explicit write updates observers via syncEffect', expect => {
	const d = derived(() => 'initial')
	const seen = []

	const dispose = root(r => {
		syncEffect(() => seen.push(d()))
		return r
	})

	expect(seen).toEqual(['initial'])

	d('next')
	expect(seen).toEqual(['initial', 'next'])

	d('again')
	expect(seen).toEqual(['initial', 'next', 'again'])

	dispose()
})

await test('derived - dependency change after explicit write re-runs fn and overrides the manual value', expect => {
	const base = signal('a')
	const d = derived(() => base.read())

	// trigger initial update so `d` subscribes to `base`
	expect(d()).toBe('a')

	// user override
	d('manual')
	expect(d()).toBe('manual')

	// dep change invalidates the derived — the fn re-runs and
	// the manual override is replaced by the current base value.
	// The derived's fn remains the source of truth; explicit
	// writes are a temporary override, not a detachment.
	base.write('b')
	expect(d()).toBe('b')
})

await test('derived - explicit write survives reads until a dep actually changes', expect => {
	const base = signal(1)
	const d = derived(() => base.read())

	expect(d()).toBe(1)

	d(999)
	// many reads keep returning the manual value as long as
	// no source dep has fired
	expect(d()).toBe(999)
	expect(d()).toBe(999)
	expect(d()).toBe(999)

	// only when base actually changes does d re-compute
	base.write(2)
	expect(d()).toBe(2)
})

await test('derived - writes on two independent deriveds do not interfere', expect => {
	const a = derived(() => 'A')
	const b = derived(() => 'B')

	a('alpha')
	expect(a()).toBe('alpha')
	expect(b()).toBe('B')

	b('beta')
	expect(a()).toBe('alpha')
	expect(b()).toBe('beta')

	a('alpha-2')
	b('beta-2')
	expect(a()).toBe('alpha-2')
	expect(b()).toBe('beta-2')
})

await test('derived - writing a function value is unwrapped and tracked via withValue', expect => {
	const src = signal(10)
	const d = derived(() => 0)

	// write a function instead of a plain value — Derived.write
	// passes through withValue which wraps functions in an effect,
	// so the derived now reflects src.read() reactively
	d(() => src.read() * 2)
	expect(d()).toBe(20)

	src.write(7)
	expect(d()).toBe(14)

	src.write(50)
	expect(d()).toBe(100)
})

// --- derived initialized with a promise ----------------------------

// These tests use wall-clock delays via the `sleep` helper to pin
// down resolution order deterministically. Microtask-based ordering
// is technically well-defined, but wall-clock delays make the
// "which resolves first" intent obvious and resistant to accidental
// test refactors.

await test('derived - initialized with a promise, sync read before resolve returns the nothing placeholder', async expect => {
	const d = derived(
		() => new Promise(r => setTimeout(() => r('later'), 20)),
	)

	// sync read before the promise resolves returns the frozen
	// `nothing` empty-object placeholder
	const sync = d()
	expect(typeof sync).toBe('object')
	expect(sync !== null).toBe(true)
	expect(Object.keys(sync).length).toBe(0)

	await sleep(40)
})

await test('derived - initialized with a promise, await resolves to the promise value', async expect => {
	const d = derived(() => Promise.resolve('hello'))
	// The Derived is thenable — awaiting it yields the accessor
	// once it has committed its resolved value.
	await d
	expect(d()).toBe('hello')
})

await test('derived - initialized with a promise then write sync value after resolve', async expect => {
	const d = derived(() => Promise.resolve('initial'))
	await d
	expect(d()).toBe('initial')

	// writing after resolution replaces the value
	d('manual')
	expect(d()).toBe('manual')

	d('again')
	expect(d()).toBe('again')
})

await test('derived - initialized with a promise, isResolved tracks commit', async expect => {
	const d = derived(
		() => new Promise(r => setTimeout(() => r('x'), 20)),
	)

	// trigger update to register the promise and see the pending state
	d()
	expect(isResolved(d)).toBe(false)

	await sleep(40)
	expect(isResolved(d)).toBe(true)
	expect(d()).toBe('x')
})

await test('derived - writing a promise after initial sync value updates when it resolves', async expect => {
	const d = derived(() => 'sync')
	expect(d()).toBe('sync')

	// user writes a promise — the sync value is cleared to the
	// `nothing` placeholder via writeDefaultValue while the promise
	// is pending, then replaced with the resolved value
	d(new Promise(r => setTimeout(() => r('async'), 20)))
	await sleep(40)
	expect(d()).toBe('async')
})

// --- stale-promise rejection via lastWrite token -------------------

// Each call to `write()` stamps a fresh token onto `lastWrite`.
// An async callback (promise `.then`, function-unwrap effect) only
// commits if its captured token still matches the current
// `lastWrite`, so a stale resolution cannot clobber a newer value.
// These scenarios set explicit wall-clock delays so the "late"
// promise truly resolves after the "winning" write — that is the
// only configuration where the bug would have been observable.

await test('derived - sync write during pending promise is not clobbered when the promise resolves later', async expect => {
	// promise resolves after a wall-clock delay — our sync write
	// lands long before the promise fires, and `lastWrite` rejects
	// the stale resolution when it finally arrives
	const d = derived(
		() => new Promise(r => setTimeout(() => r('fromPromise'), 30)),
	)
	d() // register the pending promise
	d('manual')
	expect(d()).toBe('manual')

	await sleep(60)
	expect(d()).toBe('manual')
})

await test('derived - two pending promises: second resolves at 10ms, first at 30ms, second wins', async expect => {
	// deliberate wall-clock ordering: first is registered first
	// but resolves LAST, so it arrives with a stale token
	const first = new Promise(r => setTimeout(() => r('first'), 30))
	const second = new Promise(r => setTimeout(() => r('second'), 10))

	const d = derived(() => first)
	d() // register first
	d(second) // user overrides with second — lastWrite flips

	await sleep(60)
	// second committed at t≈10; first fired at t≈30 but its token
	// was stale and the commit was skipped
	expect(d()).toBe('second')
})

await test('derived - two pending promises: stale first resolves early, fresh second resolves late, second still commits', async expect => {
	// mirror of the test above: the STALE first now resolves
	// EARLY (at 10ms) and the fresh second resolves LATE (at
	// 30ms). We want two things:
	//   1. the early stale resolution must not commit (token
	//      mismatch)
	//   2. the later fresh resolution must still succeed — the
	//      lastWrite token rejection must not accidentally
	//      invalidate the currently in-flight write
	const first = new Promise(r => setTimeout(() => r('first'), 10))
	const second = new Promise(r => setTimeout(() => r('second'), 30))

	const d = derived(() => first)
	d() // register first
	d(second) // override with second — lastWrite now belongs to second

	// observe the pending placeholder before either resolves
	const sync = d()
	expect(typeof sync).toBe('object')

	await sleep(60)
	// at t≈10, first resolved but its token was stale → skipped
	// at t≈30, second resolved with the current token → committed
	expect(d()).toBe('second')
})

await test('derived - sync overrides then a much-later promise: the promise is stale', async expect => {
	// the initial promise is long-delayed (40ms); the user writes
	// two sync values before it lands. When it finally resolves,
	// its token no longer matches and the commit is skipped.
	const d = derived(
		() => new Promise(r => setTimeout(() => r('C'), 40)),
	)
	d() // register the long-pending promise

	d('A')
	expect(d()).toBe('A')

	d('B')
	expect(d()).toBe('B')

	await sleep(70)
	expect(d()).toBe('B')
})

await test('derived - a promise override after sync write still commits when it resolves', async expect => {
	// Sanity check the opposite direction: a later write (which
	// happens to be a promise) DOES replace an earlier sync value
	// once the promise resolves — the promise is the current
	// `lastWrite`, so its commit is not stale.
	const d = derived(() => 'initial')
	expect(d()).toBe('initial')

	d('interim')
	expect(d()).toBe('interim')

	d(new Promise(r => setTimeout(() => r('final'), 20)))
	await sleep(40)
	expect(d()).toBe('final')
})
