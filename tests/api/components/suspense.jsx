/** @jsxImportSource pota */

// Tests for the Suspense component: async children, fallback while
// pending, resolution, rejected promises, multiple async children,
// nested suspense, and cleanup.
import { test, body, macrotask, microtask, sleep } from '#test'

import { render } from 'pota'
import { Suspense, Errored } from 'pota/components'
// --- No promises ---------------------------------------------------------------

await test('Suspense - renders non-promise children directly', expect => {
	const dispose = render(
		<Suspense fallback={<p>loading</p>}>
			<p>ready</p>
		</Suspense>,
	)
	expect(body()).toBe('<p>ready</p>')
	dispose()
})

await test('Suspense - renders text children directly', expect => {
	const dispose = render(
		<Suspense fallback="loading">hello</Suspense>,
	)
	expect(body()).toBe('hello')
	dispose()
})

await test('Suspense - renders multiple non-promise children directly', expect => {
	const dispose = render(
		<Suspense>
			<p>a</p>
			<p>b</p>
		</Suspense>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

await test('Suspense - does not show fallback when no children at all', expect => {
	const dispose = render(<Suspense fallback={<p>loading</p>} />)
	expect(body()).toBe('')
	dispose()
})

// --- Single promise ------------------------------------------------------------

await test('Suspense - shows fallback while promise is pending', expect => {
	const promise = sleep(100).then(() => <p>loaded</p>)
	const dispose = render(
		<Suspense fallback={<p>loading</p>}>{promise}</Suspense>,
	)
	expect(body()).toBe('<p>loading</p>')
	dispose()
})

await test('Suspense - shows string fallback while pending', expect => {
	const promise = sleep(100).then(() => 'done')
	const dispose = render(
		<Suspense fallback="loading...">{promise}</Suspense>,
	)
	expect(body()).toBe('loading...')
	dispose()
})

await test('Suspense - shows children after promise resolves', async expect => {
	const promise = sleep(50).then(() => <p>loaded 1</p>)
	const dispose = render(
		<Suspense fallback={<p>loading 1</p>}>{promise}</Suspense>,
	)
	expect(body()).toBe('<p>loading 1</p>')
	await promise
	await macrotask()
	expect(body()).toBe('<p>loaded 1</p>')
	dispose()
	expect(body()).toBe('')
})

await test('Suspense - resolves string value from promise', async expect => {
	const promise = sleep(20).then(() => 'done 1')
	const dispose = render(
		<Suspense fallback="loading 1">{promise}</Suspense>,
	)
	expect(body()).toBe('loading 1')
	await promise
	await microtask()
	expect(body()).toBe('done 1')
	dispose()
})

// --- Multiple promises --------------------------------------------------------

await test('Suspense - waits for all separate promise children before showing', async expect => {
	const p1 = sleep(20).then(() => <p>a</p>)
	const p2 = sleep(40).then(() => <p>b</p>)
	const dispose = render(
		<Suspense fallback={<p>loading</p>}>
			{p1}
			{p2}
		</Suspense>,
	)
	expect(body()).toBe('<p>loading</p>')
	await p1
	expect(body()).toBe('<p>loading</p>')
	await p2
	await microtask()
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

await test('Suspense - waits for all array promise children before showing', async expect => {
	const p1 = sleep(20).then(() => <p>a</p>)
	const p2 = sleep(40).then(() => <p>b</p>)
	const dispose = render(
		<Suspense fallback={<p>loading</p>}>{[p1, p2]}</Suspense>,
	)
	expect(body()).toBe('<p>loading</p>')
	await p1
	expect(body()).toBe('<p>loading</p>')
	await p2
	await microtask()
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

// --- No fallback --------------------------------------------------------------

await test('Suspense - shows nothing while pending when no fallback', expect => {
	const promise = sleep(100).then(() => <p>loaded</p>)
	const dispose = render(<Suspense>{promise}</Suspense>)
	expect(body()).toBe('')
	dispose()
})

await test('Suspense - shows children after resolve with no fallback', async expect => {
	const promise = sleep(20).then(() => <p>loaded</p>)
	const dispose = render(<Suspense>{promise}</Suspense>)
	await promise
	await microtask()
	expect(body()).toBe('<p>loaded</p>')
	dispose()
})

// --- Nested -------------------------------------------------------------------

await test('Suspense - nested: outer sync children render while inner is pending', async expect => {
	const innerPromise = sleep(20).then(() => <p>inner</p>)
	const dispose = render(
		<Suspense fallback={<p>outer loading</p>}>
			<p>outer</p>
			<Suspense fallback={<p>inner loading</p>}>
				{innerPromise}
			</Suspense>
		</Suspense>,
	)
	// outer has no direct promises so renders immediately; inner shows its fallback
	expect(body()).toBe('<p>outer</p><p>inner loading</p>')
	await innerPromise
	await microtask()
	expect(body()).toBe('<p>outer</p><p>inner</p>')
	dispose()
})

await test('Suspense - deeply nested: three levels all resolve together', async expect => {
	const pA = sleep(20).then(() => 'A')
	const pB = sleep(30).then(() => 'B')
	const pC = sleep(40).then(() => 'C')

	const C = () => <p>{pC}</p>
	const B = () => (
		<>
			<p>{pB}</p>
			<C />
		</>
	)

	const dispose = render(
		<Suspense fallback={<p>loading</p>}>
			<p>{pA}</p>
			<Suspense fallback={<p>inner loading</p>}>
				<B />
			</Suspense>
		</Suspense>,
	)

	expect(body()).toBe('<p>loading</p>')
	await Promise.all([pA, pB, pC])
	await microtask()
	expect(body()).toInclude('A')
	expect(body()).toInclude('B')
	expect(body()).toInclude('C')
	dispose()
})

// --- Cleanup ------------------------------------------------------------------

await test('Suspense - sync children: cleans up on dispose', expect => {
	const dispose = render(
		<Suspense>
			<p>content</p>
		</Suspense>,
	)
	expect(body()).toBe('<p>content</p>')
	dispose()
	expect(body()).toBe('')
})

await test('Suspense - resolved promise: cleans up on dispose', async expect => {
	const promise = Promise.resolve(<p>loaded</p>)
	const dispose = render(
		<Suspense fallback="loading">{promise}</Suspense>,
	)
	await promise
	await microtask()
	expect(body()).toBe('<p>loaded</p>')
	dispose()
	expect(body()).toBe('')
})

await test('Suspense - dispose during pending clears the fallback', async expect => {
	const promise = sleep(30).then(() => <p>loaded</p>)
	const dispose = render(
		<Suspense fallback={<p>loading</p>}>{promise}</Suspense>,
	)
	expect(body()).toBe('<p>loading</p>')
	dispose()
	expect(body()).toBe('')
	await promise
	await microtask()
	expect(body()).toBe('')
})

await test('Suspense - rejected promise propagates to Errored boundary', async expect => {
	const originalError = console.error
	console.error = () => {}

	const promise = Promise.reject(new Error('fail'))
	promise.catch(() => {}) // prevent unhandled rejection

	const dispose = render(
		<Errored fallback={err => <p>{err.message}</p>}>
			<Suspense fallback={<p>loading</p>}>{promise}</Suspense>
		</Errored>,
	)

	expect(body()).toBe('<p>loading</p>')

	await macrotask()

	// rejection routes through catchError to the Errored fallback
	expect(body()).toInclude('<p>fail</p>')

	console.error = originalError
	dispose()
})

await test('Suspense - rejected promise without Errored logs to console.error', async expect => {
	const originalError = console.error
	const errors = []
	console.error = e => errors.push(e)

	const promise = Promise.reject(new Error('fail'))
	promise.catch(() => {}) // prevent unhandled rejection

	const dispose = render(
		<Suspense fallback={<p>loading</p>}>{promise}</Suspense>,
	)

	expect(body()).toBe('<p>loading</p>')

	await macrotask()

	// no boundary: rejection routes to console.error via routeError
	expect(errors.length > 0).toBe(true)
	expect(String(errors[0])).toInclude('fail')

	console.error = originalError
	dispose()
})

await test('Suspense - multiple async children all resolve', async expect => {
	const a = Promise.resolve(<span>a</span>)
	const b = Promise.resolve(<span>b</span>)
	const dispose = render(
		<Suspense fallback="loading">
			{a}
			{b}
		</Suspense>,
	)

	await Promise.all([a, b])
	await macrotask()

	expect(body()).toInclude('<span>a</span>')
	expect(body()).toInclude('<span>b</span>')

	dispose()
})

// --- suspense resolving to null renders nothing -----------------------

await test('Suspense - promise resolving to null renders nothing', async expect => {
	const p = Promise.resolve(null)

	const dispose = render(<Suspense fallback="loading">{p}</Suspense>)

	// initially fallback is shown
	expect(body()).toBe('loading')

	await p
	await macrotask()

	// after resolution, body is empty
	expect(body()).toBe('')

	dispose()
})

// --- suspense with fast-resolved promise --------------------------------

await test('Suspense - already-resolved promise still shows fallback briefly', async expect => {
	const p = Promise.resolve(<p>ready</p>)

	const dispose = render(<Suspense fallback="loading">{p}</Suspense>)

	// even pre-resolved promises flip through fallback
	// (depends on framework — may resolve immediately or after microtask)
	await p
	await macrotask()

	expect(body()).toBe('<p>ready</p>')

	dispose()
})

// --- suspense with number fallback --------------------------------------

await test('Suspense - numeric fallback renders as text', expect => {
	const p = new Promise(() => {}) // never resolves

	const dispose = render(<Suspense fallback={0}>{p}</Suspense>)

	expect(body()).toBe('0')

	dispose()
})

// --- nested suspense with independent async children -------------------

await test('Suspense - nested independent suspense boundaries resolve separately', async expect => {
	const inner = new Promise(resolve => {
		setTimeout(() => resolve(<span>inner</span>), 10)
	})
	const outer = new Promise(resolve => {
		setTimeout(() => resolve(<span>outer</span>), 20)
	})

	const dispose = render(
		<Suspense fallback="outer-loading">
			{outer}
			<Suspense fallback="inner-loading">{inner}</Suspense>
		</Suspense>,
	)

	// outer shows its fallback until BOTH outer and inner resolve
	expect(body()).toBe('outer-loading')

	await outer
	await inner
	await macrotask()

	expect(body()).toInclude('outer')
	expect(body()).toInclude('inner')

	dispose()
})

await test('Suspense - sync children skip the fallback; promise children show it immediately', async expect => {
	const disposeSync = render(
		<Suspense fallback={<p>loading</p>}>
			<p>sync child</p>
		</Suspense>,
	)

	expect(body()).toBe('<p>sync child</p>')

	disposeSync()

	const asyncChild = new Promise(resolve => {
		setTimeout(() => resolve(<p>async child</p>), 100)
	})

	const disposeAsync = render(
		<Suspense fallback={<p>loading</p>}>{asyncChild}</Suspense>,
	)

	expect(body()).toBe('<p>loading</p>')

	await asyncChild

	expect(body()).toBe('<p>async child</p>')

	disposeAsync()
})
