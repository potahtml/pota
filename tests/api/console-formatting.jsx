/** @jsxImportSource pota */
// Tests for verifying console output formatting in the test runner.
// Exercises pack (browser) → page.evaluate → unpack/report (node)
// across console methods, error shapes, and edge cases.
//
// Run with flags to inspect output:
//   npm run test:api -- console-formatting --log --warn --error

import { test } from '#test'
import { test as useTest } from 'pota/use/test'

// `pack` is exposed by the harness in serve.js — alias it once with a
// loose type so the tests don't need to extend Window in 5 places.
const { pack } = /** @type {any} */ (window)

// --- console.log: types and combinations ---

await test('console - log string', () => {
	console.log('hello from test')
})

await test('console - log number', () => {
	console.log(42)
})

await test('console - log boolean, null, undefined', () => {
	console.log(true, false, null, undefined)
})

await test('console - log object', () => {
	console.log({ name: 'pota', version: 1 })
})

await test('console - log nested object', () => {
	console.log({
		user: { name: 'tito', tags: ['dev', 'maintainer'] },
		meta: { nested: { deep: true } },
	})
})

await test('console - log array', () => {
	console.log([1, 'two', { three: 3 }])
})

await test('console - log multiple arguments', () => {
	console.log('count:', 42, 'items:', ['a', 'b'])
})

await test('console - log empty object and array', () => {
	console.log({}, [])
})

// --- console.warn ---

await test('console - warn string', () => {
	console.warn('this is a warning')
})

await test('console - warn object', () => {
	console.warn({ warning: true, code: 'W001' })
})

await test('console - warn multiple arguments', () => {
	console.warn('warning:', { code: 'W002' }, [1, 2, 3])
})

// --- console.error: strings and objects ---

await test('console - error string', () => {
	console.error('something went wrong')
})

await test('console - error plain object', () => {
	console.error({ error: true, details: { message: 'bad' } })
})

await test('console - error multiple arguments', () => {
	console.error('failed:', { step: 3 }, 'reason:', 'timeout')
})

// --- console.error: Error objects (pack __error path) ---

await test('console - error Error object', () => {
	console.error(new Error('test error'))
})

await test('console - error Error with cause chain', () => {
	const err = new Error('outer')
	err.cause = new Error('middle')
	const middle = /** @type {Error} */ (err.cause)
	middle.cause = new Error('root cause')
	console.error(err)
})

await test('console - error Error mixed with other args', () => {
	console.error('context:', new Error('boom'), { extra: 1 })
})

await test('console - error Error with only message no stack', () => {
	console.error({ message: 'msg only' })
})

await test('console - error Error with only stack no message', () => {
	console.error({ stack: 'Error\n    at foo:1:1' })
})

// --- edge cases for pack/unpack ---

await test('console - error-like object with message should pack as __error', () => {
	// has .message so pack treats it as error-like
	console.error({ message: 'looks like error', code: 42 })
})

await test('console - object with cause but no message/stack stays plain', () => {
	// has .cause but no .message/.stack, so pack leaves it as-is
	console.log({ cause: 'not an error', data: 1 })
})

await test('console - no arguments', () => {
	console.log()
	console.warn()
	console.error()
})

// --- assertion failure path (packError → unpack) ---
// Use pota/use/test directly to trigger a controlled failure,
// then verify the test harness captured it without breaking.

// Helper: run an inner test that fails, return the rejection.
// Suppresses console.error so the failure doesn't pollute output.
/**
 * @param {Parameters<typeof useTest>[1]} fn
 * @returns {Promise<any>}
 */
async function expectFailure(fn) {
	useTest.reset()
	const origError = console.error
	console.error = () => {}
	let rejection
	try {
		await useTest('_', fn)
	} catch (e) {
		rejection = e
	}
	console.error = origError
	return rejection
}

await test('console - assertion failure number mismatch', async expect => {
	const r = await expectFailure(e => e(1).toBe(2))
	expect(r.expected).toBe(2)
	expect(r.value).toBe(1)
})

await test('console - assertion failure string mismatch', async expect => {
	const r = await expectFailure(e => e('hello').toBe('world'))
	expect(r.expected).toBe('world')
	expect(r.value).toBe('hello')
})

await test('console - assertion failure boolean mismatch', async expect => {
	const r = await expectFailure(e => e(true).toBe(false))
	expect(r.expected).toBe(false)
	expect(r.value).toBe(true)
})

await test('console - assertion failure null vs undefined', async expect => {
	const r = await expectFailure(e => e(null).toBe(undefined))
	expect(r.expected).toBe(undefined)
	expect(r.value).toBe(null)
})

await test('console - assertion failure toEqual object mismatch', async expect => {
	const r = await expectFailure(e =>
		e({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 4] }),
	)
	// toEqual stringifies both sides
	expect(typeof r.expected).toBe('string')
	expect(typeof r.value).toBe('string')
	expect(r.expected).toInclude('"b"')
	expect(r.value).toInclude('"b"')
})

await test('console - assertion failure toEqual array mismatch', async expect => {
	const r = await expectFailure(e => e([1, 2, 3]).toEqual([1, 2, 4]))
	expect(typeof r.expected).toBe('string')
	expect(typeof r.value).toBe('string')
})

await test('console - assertion failure toInclude missing substring', async expect => {
	const r = await expectFailure(e =>
		e('hello world').toInclude('xyz'),
	)
	expect(r.expected).toBe(true)
	expect(r.value).toBe(false)
})

await test('console - assertion failure toMatch regex mismatch', async expect => {
	const r = await expectFailure(e => e('abc').toMatch(/\d+/))
	expect(r.expected).toBe(true)
	expect(r.value).toBe(false)
})

await test('console - assertion failure not.toBe same value', async expect => {
	const r = await expectFailure(e => e(42).not.toBe(42))
	expect(r.expected).toBe(42)
	expect(r.value).toBe(42)
})

await test('console - assertion failure toEqual nested object', async expect => {
	const r = await expectFailure(e =>
		e({ user: { name: 'a', tags: [1] } }).toEqual({
			user: { name: 'b', tags: [2] },
		}),
	)
	expect(r.value).toInclude('"name"')
	expect(r.expected).toInclude('"name"')
})

// --- uncaught errors (pack ErrorEvent path) ---
// We can't let these actually propagate (they'd set done=true
// and kill the run), but we can verify pack handles ErrorEvent
// by constructing one manually and checking __pota_results__.

await test('console - ErrorEvent is packed with __event marker', expect => {
	const event = new ErrorEvent('error', {
		error: new Error('boom'),
		filename: 'test.js',
		lineno: 42,
	})
	const packed = pack(event)

	expect(packed.__event).toBe('error')
	expect(packed.error.__error).toBe(true)
	expect(packed.error.message).toBe('boom')
	expect(packed.filename).toBe('test.js')
	expect(packed.lineno).toBe(42)
})

await test('console - ErrorEvent with string message (no Error object)', expect => {
	const event = new ErrorEvent('error', {
		message: 'script error',
		filename: 'foo.js',
		lineno: 10,
	})
	const packed = pack(event)

	expect(packed.__event).toBe('error')
	// error is the message string since event.error is null
	expect(packed.error).toBe('script error')
})

// --- unhandled rejections (pack PromiseRejectionEvent path) ---

await test('console - PromiseRejectionEvent is packed with __event marker', expect => {
	const event = new PromiseRejectionEvent('unhandledrejection', {
		promise: Promise.resolve(),
		reason: new Error('rejected'),
	})
	const packed = pack(event)

	expect(packed.__event).toBe('rejection')
	expect(packed.reason.__error).toBe(true)
	expect(packed.reason.message).toBe('rejected')
})

await test('console - PromiseRejectionEvent with non-Error reason', expect => {
	const event = new PromiseRejectionEvent('unhandledrejection', {
		promise: Promise.resolve(),
		reason: 'string rejection',
	})
	const packed = pack(event)

	expect(packed.__event).toBe('rejection')
	expect(packed.reason).toBe('string rejection')
})

await test('console - PromiseRejectionEvent with object reason', expect => {
	const event = new PromiseRejectionEvent('unhandledrejection', {
		promise: Promise.resolve(),
		reason: { code: 'FAIL', info: [1, 2] },
	})
	const packed = pack(event)

	expect(packed.__event).toBe('rejection')
	expect(packed.reason.code).toBe('FAIL')
})
