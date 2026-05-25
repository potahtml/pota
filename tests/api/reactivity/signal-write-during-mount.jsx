/** @jsxImportSource pota */

// Regression: a signal write inside a component body that mounts as
// the result of a reactive update must propagate to long-lived
// observers of that signal — including a `<Head><title>{signal}</title></Head>`
// reader that was set up before the new component existed.
//
// Originally surfaced in a real app: the root tree had
// `<Head><title>{pageTitle}</title></Head>`. Each page component
// called `setPageTitle(...)` synchronously in its body. Initial loads
// and `navigateSync` swaps both updated `document.title` correctly,
// but after a `popstate`-triggered SPA navigation (which goes through
// the async `onLocationChange → await canNavigate → setLocation`
// path) the long-lived `<title>` subscriber stopped firing — even
// though the signal value updated and a brand-new `effect()` added
// after the navigation observed every write.
//
// The tests below build up to the failing case in shells: bare
// reactive trigger, sibling swap, `<Head>` + sibling swap, `<Route>`
// + `navigateSync`, then the actual repro: `<Route>` + popstate.

import { test, body, macrotask, sleep } from '#test'

import { derived, render, signal } from 'pota'
import { Head, Route, Suspense } from 'pota/components'
import { addListeners, navigateSync } from 'pota/use/location'

// keep route navigation deterministic in tests
document.startViewTransition = undefined

function gotoSync(path) {
	const url = path.startsWith('http')
		? path
		: `${window.location.origin}${path}`
	navigateSync(url, { replace: true })
}

// ─── 1. Bare: reactive trigger mounts a child that writes a signal ─────────

await test('signal write inside a child mounted via reactive trigger reaches long-lived subscribers', expect => {
	const trigger = signal(false)
	const text = signal('initial')

	function Child() {
		text.write('from-child')
		return <span>child</span>
	}

	const dispose = render(
		<>
			<p>{() => 'text:' + text.read()}</p>
			{() => (trigger.read() ? <Child /> : null)}
		</>,
	)

	expect(body()).toInclude('text:initial')

	trigger.write(true)

	expect(body()).toInclude('child')
	expect(body()).toInclude('text:from-child')

	dispose()
})

// ─── 2. Sibling swap: A → B, both write the same signal on mount ──────────

await test('signal write inside a replacement child after a sibling tree disposes reaches long-lived subscribers', expect => {
	const which = signal('a')
	const text = signal('initial')

	function A() {
		text.write('from-A')
		return <span>A</span>
	}
	function B() {
		text.write('from-B')
		return <span>B</span>
	}

	const dispose = render(
		<>
			<p>{() => 'text:' + text.read()}</p>
			{() => (which.read() === 'a' ? <A /> : <B />)}
		</>,
	)

	expect(body()).toInclude('A')
	expect(body()).toInclude('text:from-A')

	which.write('b')

	expect(body()).toInclude('B')
	expect(body()).toInclude('text:from-B')

	dispose()
})

// ─── 3. <Head><title>{signal}</title></Head> + sibling-swap ───────────────

await test('<Head><title>{signal}</title></Head> updates when a sibling tree swaps and the new child writes that signal', expect => {
	const which = signal('a')
	const title = signal('initial')

	function A() {
		title.write('from-A')
		return <span>A</span>
	}
	function B() {
		title.write('from-B')
		return <span>B</span>
	}

	const dispose = render(
		<>
			<Head>
				<title>{title.read}</title>
			</Head>
			{() => (which.read() === 'a' ? <A /> : <B />)}
		</>,
	)

	expect(document.head.querySelector('title').textContent).toBe(
		'from-A',
	)

	which.write('b')

	expect(body()).toInclude('B')
	expect(document.head.querySelector('title').textContent).toBe(
		'from-B',
	)

	dispose()
})

// ─── 4. <Head> + Route + navigateSync (synchronous nav path) ──────────────

await test('<Head><title>{signal}</title></Head> updates after Route navigation via navigateSync', expect => {
	const title = signal('initial')

	function PageA() {
		title.write('from-A')
		return <p>A</p>
	}
	function PageB() {
		title.write('from-B')
		return <p>B</p>
	}

	addListeners()
	gotoSync('/a')

	const dispose = render(
		<>
			<Head>
				<title>{title.read}</title>
			</Head>
			<Route path="/">
				<Route path="a">
					<PageA />
				</Route>
				<Route path="b">
					<PageB />
				</Route>
			</Route>
		</>,
	)

	expect(body()).toInclude('A')
	expect(document.head.querySelector('title').textContent).toBe(
		'from-A',
	)

	gotoSync('/b')

	expect(body()).toInclude('B')
	expect(document.head.querySelector('title').textContent).toBe(
		'from-B',
	)

	gotoSync('/')
	dispose()
})

// ─── 5. <Head> + Suspense + derived (sync render after resolve) ───────────

await test('<Head><title>{signal}</title></Head> updates when a Suspense-resolved child writes that signal', async expect => {
	const title = signal('initial')

	function Resolved() {
		title.write('from-resolved')
		return <span>resolved</span>
	}

	const d = derived(() => sleep(20).then(() => <Resolved />))

	const dispose = render(
		<>
			<Head>
				<title>{title.read}</title>
			</Head>
			<Suspense fallback={<span>loading</span>}>{d}</Suspense>
		</>,
	)

	expect(document.head.querySelector('title').textContent).toBe(
		'initial',
	)

	await d
	await macrotask()

	expect(body()).toInclude('resolved')
	expect(document.head.querySelector('title').textContent).toBe(
		'from-resolved',
	)

	dispose()
})

// ─── 6. THE BUG: <Head> + Route navigated via popstate (async path) ───────
// Same scenario as #4, but the second navigation goes through
// `dispatchEvent(new PopStateEvent('popstate'))` — the path real apps
// hit when the user clicks a link or uses back/forward. This routes
// through `onLocationChange` (async: `await canNavigate(...)` then
// `setLocation(...)`). After the swap, the new page component's body
// writes to the title signal — the signal value updates and any new
// effect added later observes every write, but the long-lived
// `<title>` subscriber from the original `<Head>` no longer fires,
// so `document.title` freezes at the previous page's value.

await test('<Head><title>{signal}</title></Head> updates after popstate-driven Route navigation (async onLocationChange path)', async expect => {
	const title = signal('initial')

	function PageA() {
		title.write('from-A')
		return <p>A</p>
	}
	function PageB() {
		title.write('from-B')
		return <p>B</p>
	}

	addListeners()
	gotoSync('/a')

	const dispose = render(
		<>
			<Head>
				<title>{title.read}</title>
			</Head>
			<Route path="/">
				<Route path="a">
					<PageA />
				</Route>
				<Route path="b">
					<PageB />
				</Route>
			</Route>
		</>,
	)

	expect(body()).toInclude('A')
	expect(document.head.querySelector('title').textContent).toBe(
		'from-A',
	)

	history.pushState({}, '', '/b')
	dispatchEvent(new PopStateEvent('popstate'))

	// `onLocationChange` is async — give it time to settle
	await macrotask()
	await macrotask()

	expect(body()).toInclude('B')
	// regression: previously stayed at 'from-A' even though the
	// title signal was successfully written to 'from-B' and any
	// freshly-added effect observed the write.
	expect(document.head.querySelector('title').textContent).toBe(
		'from-B',
	)

	gotoSync('/')
	dispose()
})
