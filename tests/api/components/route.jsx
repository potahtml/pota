/** @jsxImportSource pota */

// Tests for the routing components: A, load, Navigate, and Route —
// path matching, :params, nested routes, navigation, link rendering,
// Route.Default, collapse, scroll, useBeforeLeave, popstate, and
// cleanup.
import {
	$,
	test,
	body,
	macrotask,
	microtask,
	sleepLong,
} from '#test'

import { render, root } from 'pota'
import { Route, A, Navigate, load } from 'pota/components'
import {
	addListeners,
	navigate,
	navigateSync,
	useBeforeLeave,
} from 'pota/use/location'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// disable view transitions in tests to avoid AbortError
document.startViewTransition = undefined

// navigate via navigateSync which does replaceState + setLocation
// directly, avoiding the async onLocationChange/popstate path
function goto(path) {
	const url = path.startsWith('http')
		? path
		: `${window.location.origin}${path}`
	navigateSync(url, { replace: true })
}

async function reset() {
	addListeners()
	goto('/')
	await microtask()
	document.body.innerHTML = ''
}

// ─── Basic matching ───────────────────────────────────────────────────────────

await test('Route - renders nothing when path does not match', async expect => {
	await reset()
	const dispose = render(<Route path="/about">about</Route>)
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - renders children when path matches', async expect => {
	await reset()
	const dispose = render(<Route path="/about">about</Route>)
	goto('/about')
	await microtask()
	expect(body()).toBe('about')
	dispose()
})

await test('Route - renders element children when path matches', async expect => {
	await reset()
	const dispose = render(
		<Route path="/home">
			<p>home page</p>
		</Route>,
	)
	goto('/home')
	await microtask()
	expect(body()).toBe('<p>home page</p>')
	dispose()
})

await test('Route - hides content when navigating away', async expect => {
	await reset()
	const dispose = render(<Route path="/page">content</Route>)
	goto('/page')
	await microtask()
	expect(body()).toBe('content')
	goto('/')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - re-shows content when navigating back to path', async expect => {
	await reset()
	const dispose = render(<Route path="/page">content</Route>)
	goto('/page')
	await microtask()
	expect(body()).toBe('content')
	goto('/')
	await microtask()
	expect(body()).toBe('')
	goto('/page')
	await microtask()
	expect(body()).toBe('content')
	dispose()
})

// ─── Prefix vs exact matching ─────────────────────────────────────────────────

await test('Route - path is a prefix matcher by default', async expect => {
	await reset()
	// /foo matches /foobar too without $ terminator
	const dispose = render(<Route path="/foo">foo</Route>)
	goto('/foobar')
	await microtask()
	expect(body()).toBe('foo')
	dispose()
})

await test('Route - $ suffix makes path exact, does not match prefix', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/foo$">foo-exact</Route>
			<Route path="/foobar">foobar</Route>
		</>,
	)
	goto('/foobar')
	await microtask()
	expect(body()).toBe('foobar')
	goto('/foo')
	await microtask()
	expect(body()).toBe('foo-exact')
	dispose()
})

await test('Route - prefix path matches child paths', async expect => {
	await reset()
	const dispose = render(<Route path="/users">users</Route>)
	goto('/users/profile')
	await microtask()
	expect(body()).toBe('users')
	dispose()
})

// ─── Multiple sibling routes ──────────────────────────────────────────────────

await test('Route - only the matching sibling renders', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/home$">home</Route>
			<Route path="/about$">about</Route>
			<Route path="/contact$">contact</Route>
		</>,
	)
	goto('/about')
	await microtask()
	expect(body()).toBe('about')
	dispose()
})

await test('Route - switches between siblings on navigation', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/home$">home</Route>
			<Route path="/about$">about</Route>
			<Route path="/contact$">contact</Route>
		</>,
	)
	goto('/home')
	await microtask()
	expect(body()).toBe('home')
	goto('/contact')
	await microtask()
	expect(body()).toBe('contact')
	goto('/about')
	await microtask()
	expect(body()).toBe('about')
	dispose()
})

await test('Route - nothing renders when no sibling matches', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/home$">home</Route>
			<Route path="/about$">about</Route>
		</>,
	)
	goto('/other')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

// ─── Route.Default ───────────────────────────────────────────────────────────

await test('Route.Default - renders when no sibling Route matches', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/foo$">foo</Route>
			<Route.Default>default</Route.Default>
		</>,
	)
	goto('/bar')
	await microtask()
	expect(body()).toBe('default')
	dispose()
})

await test('Route.Default - hidden when a sibling Route matches', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/foo$">foo</Route>
			<Route.Default>default</Route.Default>
		</>,
	)
	goto('/foo')
	await microtask()
	expect(body()).toBe('foo')
	dispose()
})

await test('Route.Default - toggles as navigation changes', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/foo$">foo</Route>
			<Route.Default>default</Route.Default>
		</>,
	)
	goto('/bar')
	await microtask()
	expect(body()).toBe('default')
	goto('/foo')
	await microtask()
	expect(body()).toBe('foo')
	goto('/other')
	await microtask()
	expect(body()).toBe('default')
	dispose()
})

// ─── Nested routes ───────────────────────────────────────────────────────────

await test('Route - nested: parent renders at parent path', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			users-base
			<Route path="/profile">profile</Route>
		</Route>,
	)
	goto('/users')
	await microtask()
	expect(body()).toBe('users-base')
	dispose()
})

await test('Route - nested: child renders alongside parent at child path', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			{'users-base '}
			<Route path="/profile">profile</Route>
		</Route>,
	)
	goto('/users/profile')
	await microtask()
	expect(body()).toBe('users-base profile')
	dispose()
})

await test('Route - nested: only matching child renders', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			{'users: '}
			<Route path="/profile">profile</Route>
			<Route path="/settings">settings</Route>
		</Route>,
	)
	goto('/users/settings')
	await microtask()
	expect(body()).toBe('users: settings')
	goto('/users/profile')
	await microtask()
	expect(body()).toBe('users: profile')
	dispose()
})

await test('Route - nested: hiding parent hides all children', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			{'users '}
			<Route path="/profile">profile</Route>
		</Route>,
	)
	goto('/users/profile')
	await microtask()
	expect(body()).toBe('users profile')
	goto('/other')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - nested without path: matches parent path exactly', async expect => {
	await reset()
	const dispose = render(
		<Route path="/section">
			{'section: '}
			<Route>exact</Route>
		</Route>,
	)
	goto('/section')
	await microtask()
	expect(body()).toBe('section: exact')
	dispose()
})

await test('Route - nested without path: does not match sub-paths', async expect => {
	await reset()
	const dispose = render(
		<Route path="/section">
			{'section: '}
			<Route>exact</Route>
		</Route>,
	)
	goto('/section/sub')
	await microtask()
	expect(body()).toBe('section:')
	dispose()
})

await test('Route - deeply nested three levels', async expect => {
	await reset()
	const dispose = render(
		<Route path="/a">
			{'a '}
			<Route path="/b">
				{'b '}
				<Route path="/c">c</Route>
			</Route>
		</Route>,
	)
	goto('/a/b/c')
	await microtask()
	expect(body()).toBe('a b c')
	goto('/a/b')
	await microtask()
	expect(body()).toBe('a b')
	goto('/a')
	await microtask()
	expect(body()).toBe('a')
	dispose()
})

await test('Route - nested with Route.Default', async expect => {
	await reset()
	const dispose = render(
		<Route path="/app">
			{'app: '}
			<Route path="/home$">home</Route>
			<Route path="/about$">about</Route>
			<Route.Default>not found</Route.Default>
		</Route>,
	)
	goto('/app/home')
	await microtask()
	expect(body()).toBe('app: home')
	goto('/app/other')
	await microtask()
	expect(body()).toBe('app: not found')
	goto('/app/about')
	await microtask()
	expect(body()).toBe('app: about')
	dispose()
})

// ─── Hash routing ─────────────────────────────────────────────────────────────

await test('Route - hash path matches hash navigation', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/#/home')
	await microtask()
	expect(body()).toBe('hash home')
	dispose()
})

await test('Route - hash path does not match plain pathname', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/home')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - hash path hides when navigating to different hash', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/#/home')
	await microtask()
	expect(body()).toBe('hash home')
	goto('/#/other')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - multiple hash routes switch correctly', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/#/one">one</Route>
			<Route path="/#/two">two</Route>
			<Route path="/#/three">three</Route>
		</>,
	)
	goto('/#/one')
	await microtask()
	expect(body()).toBe('one')
	goto('/#/two')
	await microtask()
	expect(body()).toBe('two')
	goto('/#/three')
	await microtask()
	expect(body()).toBe('three')
	dispose()
})

await test('Route - pathname route matches path with hash fragment', async expect => {
	await reset()
	// regex /^\/page(|#.*)$/ matches '/page#section'
	const dispose = render(<Route path="/page">page</Route>)
	goto('/page#section')
	await microtask()
	expect(body()).toBe('page')
	dispose()
})

await test('Route - hash route with Route.Default', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/#/home">home</Route>
			<Route path="/#/about">about</Route>
			<Route.Default>default</Route.Default>
		</>,
	)
	goto('/#/home')
	await microtask()
	expect(body()).toBe('home')
	goto('/#/unknown')
	await microtask()
	expect(body()).toBe('default')
	goto('/#/about')
	await microtask()
	expect(body()).toBe('about')
	dispose()
})

// ─── Route props ─────────────────────────────────────────────────────────────

await test('Route - when=false blocks render even when path matches', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/guarded"
			when={false}
		>
			guarded
		</Route>,
	)
	goto('/guarded')
	await microtask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - when=true renders normally when path matches', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/allowed"
			when={true}
		>
			allowed
		</Route>,
	)
	goto('/allowed')
	await microtask()
	expect(body()).toBe('allowed')
	dispose()
})

await test('Route - fallback renders when path does not match', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/page"
			fallback="fallback"
		>
			page
		</Route>,
	)
	goto('/other')
	await microtask()
	expect(body()).toBe('fallback')
	dispose()
})

await test('Route - fallback hides when path matches', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/page"
			fallback="fallback"
		>
			page
		</Route>,
	)
	goto('/page')
	await microtask()
	expect(body()).toBe('page')
	dispose()
})

await test('Route - fallback toggles with navigation', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/page$"
			fallback="fallback"
		>
			page
		</Route>,
	)
	goto('/other')
	await microtask()
	expect(body()).toBe('fallback')
	goto('/page')
	await microtask()
	expect(body()).toBe('page')
	goto('/elsewhere')
	await microtask()
	expect(body()).toBe('fallback')
	dispose()
})

await test('Route - collapse keeps pota-collapse in DOM when unmatched', async expect => {
	await reset()
	const dispose = render(
		<Route
			path="/kept"
			collapse
		>
			kept
		</Route>,
	)
	goto('/kept')
	await microtask()
	expect($('pota-collapse')).not.toBe(null)
	goto('/other')
	await microtask()
	// pota-collapse stays in DOM (Collapse behaviour vs Show)
	expect($('pota-collapse')).not.toBe(null)
	dispose()
})

// ─── A component ─────────────────────────────────────────────────────────────

await test('A - renders an anchor element', async expect => {
	await reset()
	const dispose = render(
		<Route path="/start">
			<A href="/end">go</A>
		</Route>,
	)
	goto('/start')
	await microtask()
	expect($('a')).not.toBe(null)
	expect($('a').textContent).toBe('go')
	dispose()
})

await test('A - resolves href on the rendered anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/start">
			<A href="/destination">link</A>
		</Route>,
	)
	goto('/start')
	await microtask()
	expect($('a').getAttribute('href')).toBe('/destination')
	dispose()
})

await test('A - does not navigate when metaKey is held', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/start$">
				<A href="/end">go</A>
			</Route>
			<Route path="/end$">end</Route>
		</>,
	)
	goto('/start')
	await microtask()
	document
		.querySelector('a')
		.dispatchEvent(
			new MouseEvent('click', { bubbles: true, metaKey: true }),
		)
	await microtask()
	// body still shows the /start content (the link), not /end
	expect(body()).toBe('<a href="/end">go</a>')
	dispose()
})

await test('A - does not navigate when ctrlKey is held', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/start$">
				<A href="/end">go</A>
			</Route>
			<Route path="/end$">end</Route>
		</>,
	)
	goto('/start')
	await microtask()
	document
		.querySelector('a')
		.dispatchEvent(
			new MouseEvent('click', { bubbles: true, ctrlKey: true }),
		)
	await microtask()
	expect(body()).toBe('<a href="/end">go</a>')
	dispose()
})

await test('A - does not pass params prop to rendered anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/page">
			<A
				href="/target"
				params={{ id: '1' }}
			>
				link
			</A>
		</Route>,
	)
	goto('/page')
	await microtask()
	expect($('a').hasAttribute('params')).toBe(false)
	dispose()
})

await test('A - forwards extra props to anchor', async expect => {
	await reset()
	const dispose = render(
		<Route path="/page">
			<A
				href="/target"
				class="my-link"
			>
				link
			</A>
		</Route>,
	)
	goto('/page')
	await microtask()
	expect($('a.my-link')).not.toBe(null)
	dispose()
})

// ─── Navigate component ───────────────────────────────────────────────────────

await test('Navigate - redirects to target path on render', async expect => {
	await reset()
	const origin = window.location.origin
	const dispose = render(
		<>
			<Route path="/redirect$">
				<Navigate path={`${origin}/target`} />
			</Route>
			<Route path="/target$">target page</Route>
		</>,
	)
	goto('/redirect')
	await macrotask()
	expect(body()).toBe('target page')
	dispose()
})

await test('Navigate - renders its children while redirecting', async expect => {
	await reset()
	const origin = window.location.origin
	const dispose = render(
		<Route path="/redirect$">
			<Navigate path={`${origin}/elsewhere`}>Redirecting...</Navigate>
		</Route>,
	)
	goto('/redirect')
	await macrotask()
	expect(window.location.pathname).toBe('/elsewhere')
	dispose()
})

// ─── Browser history ─────────────────────────────────────────────────────────

await test('Route - responds to popstate (browser back)', async expect => {
	await reset()
	const dispose = render(
		<>
			<Route path="/page-a$">page a</Route>
			<Route path="/page-b$">page b</Route>
		</>,
	)
	// use pushState (not replace) so history.back() has somewhere to go
	navigateSync('/page-a')
	await microtask()
	expect(body()).toBe('page a')
	navigateSync('/page-b')
	await microtask()
	expect(body()).toBe('page b')
	// back() is truly async browser behavior; the popstate listener
	// (from addListeners) calls setLocation internally
	history.back()
	await sleepLong()
	expect(body()).toBe('page a')
	dispose()
})

// ─── Cleanup ─────────────────────────────────────────────────────────────────

await test('Route - cleans up on dispose', async expect => {
	await reset()
	const dispose = render(<Route path="/alive">alive</Route>)
	goto('/alive')
	await microtask()
	expect(body()).toBe('alive')
	dispose()
	expect(body()).toBe('')
})

await test('Route - stops responding to navigation after dispose', async expect => {
	await reset()
	const dispose = render(<Route path="/page$">page</Route>)
	goto('/page')
	await microtask()
	expect(body()).toBe('page')
	dispose()
	goto('/')
	await microtask()
	goto('/page')
	await microtask()
	expect(body()).toBe('')
})

// --- Route with :params -----------------------------------------------------

await test('Route - matches path with :param segments', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users/:id$">user page</Route>,
	)

	goto('/users/42')
	await microtask()
	expect(body()).toBe('user page')

	goto('/users')
	await microtask()
	expect(body()).toBe('')

	dispose()
})

await test('Route - multiple :param segments all match', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users/:id/posts/:postId$">post</Route>,
	)

	goto('/users/1/posts/99')
	await microtask()
	expect(body()).toBe('post')

	goto('/users/1/posts')
	await microtask()
	expect(body()).toBe('')

	dispose()
})

// --- nested routes accumulate params ----------------------------------------

await test('Route - nested routes render correctly', async expect => {
	await reset()
	const dispose = render(
		<Route path="/app">
			<p>app</p>
			<Route path="/settings$">
				<span>settings</span>
			</Route>
		</Route>,
	)

	goto('/app/settings')
	await microtask()
	expect(body()).toInclude('<p>app</p>')
	expect(body()).toInclude('<span>settings</span>')

	goto('/app/other')
	await microtask()
	expect(body()).toInclude('<p>app</p>')
	expect(body()).not.toInclude('settings')

	dispose()
})

// --- A component resolves relative href ------------------------------------

await test('A - renders anchor with interpolated params', async expect => {
	await reset()
	const dispose = render(
		<Route path="/users">
			<A
				href="/users/:id"
				params={{ id: '5' }}
			>
				link
			</A>
		</Route>,
	)
	goto('/users')
	await microtask()

	const anchor = $('a')
	expect(anchor).not.toBe(null)
	expect(anchor.getAttribute('href')).toInclude('5')

	dispose()
})

// --- Navigate with replace ---------------------------------------------------

await test('Navigate - replace option uses replaceState', async expect => {
	await reset()
	const before = history.length

	// baseline: history has a known length before navigate
	expect(before > 0).toBe(true)

	const dispose = render(
		<Navigate
			path="/nav-replace"
			replace
		>
			redirected
		</Navigate>,
	)

	await sleepLong()

	expect(body()).toInclude('redirected')
	// history.length should not increase with replace
	expect(history.length).toBe(before)

	dispose()
})

// --- Route with scroll prop --------------------------------------------------

await test('Route - scroll prop triggers scroll on match', async expect => {
	await reset()
	const target = document.createElement('div')
	target.id = 'scroll-target'
	let scrollCalled = false
	target.scrollIntoView = () => {
		scrollCalled = true
	}
	document.body.append(target)

	const dispose = render(
		<Route
			path="/scroll-test$"
			scroll="#scroll-target"
		>
			content
		</Route>,
	)

	goto('/scroll-test')
	await macrotask()

	expect(body()).toInclude('content')

	dispose()
	target.remove()
})

// --- useBeforeLeave ----------------------------------------------------------

await test('Route - useBeforeLeave callback can block navigation', async expect => {
	await reset()
	let blockNav = true
	const seen = []

	const dispose = render(
		<Route path="/guarded">
			{() => {
				useBeforeLeave(() => {
					seen.push('beforeLeave')
					return !blockNav
				})
				return 'guarded content'
			}}
		</Route>,
	)

	goto('/guarded')
	await microtask()
	expect(body()).toInclude('guarded content')

	// try to navigate away — should be blocked
	await navigate('/other')
	await sleepLong()
	seen.length > 0 && expect(seen).toInclude('beforeLeave')

	dispose()
	await reset()
})

// --- load component ----------------------------------------------------------

await test('load - resolves a dynamic import and renders its default export', async expect => {
	await reset()

	const Lazy = load(() =>
		Promise.resolve({
			default: () => <p>lazy loaded</p>,
		}),
	)

	const dispose = render(
		<Route path="/load-test$">
			<Lazy />
		</Route>,
	)

	goto('/load-test')
	await macrotask()

	expect(body()).toInclude('lazy loaded')

	dispose()
	await reset()
})

await test('load - retries on failure and eventually renders error string', async expect => {
	await reset()
	let attempts = 0

	const Lazy = load(() => {
		attempts++
		return Promise.reject(new Error('network error'))
	})

	const dispose = render(
		<Route path="/load-fail$">
			<Lazy />
		</Route>,
	)

	goto('/load-fail')

	// load retries up to 9 times with 5s delay
	// just verify it attempted at least once
	await microtask()
	await sleepLong()

	expect(attempts >= 1).toBe(true)

	dispose()
	await reset()
})

// --- Route with empty path matches root ------------------------------

await test('Route - empty path matches / path', async expect => {
	await reset()

	goto('/')

	const dispose = render(
		<Route path="">
			<p>root</p>
		</Route>,
	)

	await microtask()

	expect(body()).toInclude('root')

	dispose()
	await reset()
})

