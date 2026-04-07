/** @jsxImportSource pota */

// Tests for the routing components: A, load, Navigate, and Route —
// path matching, navigation, link rendering, and cleanup.
import { $, test, body, macrotask } from '#test'

import { render } from 'pota'
import { Route, A, Navigate } from 'pota/components'
import { addListeners } from 'pota/use/location'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// navigate via pushState + popstate since navigate() from pota doesn't update
// window.location synchronously
function goto(path) {
	const url = path.startsWith('http')
		? path
		: `${window.location.origin}${path}`
	history.pushState(null, '', url)
	window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
}

async function reset() {
	addListeners()
	goto('/')
	await macrotask()
	document.body.innerHTML = ''
}

// ─── Basic matching ───────────────────────────────────────────────────────────

await test('Route - renders nothing when path does not match', async expect => {
	await reset()
	const dispose = render(<Route path="/about">about</Route>)
	await macrotask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - renders children when path matches', async expect => {
	await reset()
	const dispose = render(<Route path="/about">about</Route>)
	goto('/about')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('<p>home page</p>')
	dispose()
})

await test('Route - hides content when navigating away', async expect => {
	await reset()
	const dispose = render(<Route path="/page">content</Route>)
	goto('/page')
	await macrotask()
	expect(body()).toBe('content')
	goto('/')
	await macrotask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - re-shows content when navigating back to path', async expect => {
	await reset()
	const dispose = render(<Route path="/page">content</Route>)
	goto('/page')
	await macrotask()
	expect(body()).toBe('content')
	goto('/')
	await macrotask()
	expect(body()).toBe('')
	goto('/page')
	await macrotask()
	expect(body()).toBe('content')
	dispose()
})

// ─── Prefix vs exact matching ─────────────────────────────────────────────────

await test('Route - path is a prefix matcher by default', async expect => {
	await reset()
	// /foo matches /foobar too without $ terminator
	const dispose = render(<Route path="/foo">foo</Route>)
	goto('/foobar')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('foobar')
	goto('/foo')
	await macrotask()
	expect(body()).toBe('foo-exact')
	dispose()
})

await test('Route - prefix path matches child paths', async expect => {
	await reset()
	const dispose = render(<Route path="/users">users</Route>)
	goto('/users/profile')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('home')
	goto('/contact')
	await macrotask()
	expect(body()).toBe('contact')
	goto('/about')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('default')
	goto('/foo')
	await macrotask()
	expect(body()).toBe('foo')
	goto('/other')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('users: settings')
	goto('/users/profile')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('users profile')
	goto('/other')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('a b c')
	goto('/a/b')
	await macrotask()
	expect(body()).toBe('a b')
	goto('/a')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('app: home')
	goto('/app/other')
	await macrotask()
	expect(body()).toBe('app: not found')
	goto('/app/about')
	await macrotask()
	expect(body()).toBe('app: about')
	dispose()
})

// ─── Hash routing ─────────────────────────────────────────────────────────────

await test('Route - hash path matches hash navigation', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/#/home')
	await macrotask()
	expect(body()).toBe('hash home')
	dispose()
})

await test('Route - hash path does not match plain pathname', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/home')
	await macrotask()
	expect(body()).toBe('')
	dispose()
})

await test('Route - hash path hides when navigating to different hash', async expect => {
	await reset()
	const dispose = render(<Route path="/#/home">hash home</Route>)
	goto('/#/home')
	await macrotask()
	expect(body()).toBe('hash home')
	goto('/#/other')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('one')
	goto('/#/two')
	await macrotask()
	expect(body()).toBe('two')
	goto('/#/three')
	await macrotask()
	expect(body()).toBe('three')
	dispose()
})

await test('Route - pathname route matches path with hash fragment', async expect => {
	await reset()
	// regex /^\/page(|#.*)$/ matches '/page#section'
	const dispose = render(<Route path="/page">page</Route>)
	goto('/page#section')
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('home')
	goto('/#/unknown')
	await macrotask()
	expect(body()).toBe('default')
	goto('/#/about')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	expect(body()).toBe('fallback')
	goto('/page')
	await macrotask()
	expect(body()).toBe('page')
	goto('/elsewhere')
	await macrotask()
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
	await macrotask()
	expect($('pota-collapse')).not.toBe(null)
	goto('/other')
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	await macrotask()
	document
		.querySelector('a')
		.dispatchEvent(
			new MouseEvent('click', { bubbles: true, metaKey: true }),
		)
	await macrotask()
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
	await macrotask()
	document
		.querySelector('a')
		.dispatchEvent(
			new MouseEvent('click', { bubbles: true, ctrlKey: true }),
		)
	await macrotask()
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
	await macrotask()
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
	await macrotask()
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
	// Navigate renders children (briefly visible during redirect)
	// and the redirect fires synchronously so we just confirm it ran
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
	goto('/page-a')
	await macrotask()
	expect(body()).toBe('page a')
	goto('/page-b')
	await macrotask()
	expect(body()).toBe('page b')
	history.back()
	window.dispatchEvent(new PopStateEvent('popstate'))
	await macrotask()
	expect(body()).toBe('page a')
	dispose()
})

// ─── Cleanup ─────────────────────────────────────────────────────────────────

await test('Route - cleans up on dispose', async expect => {
	await reset()
	const dispose = render(<Route path="/alive">alive</Route>)
	goto('/alive')
	await macrotask()
	expect(body()).toBe('alive')
	dispose()
	expect(body()).toBe('')
})

await test('Route - stops responding to navigation after dispose', async expect => {
	await reset()
	const dispose = render(<Route path="/page$">page</Route>)
	goto('/page')
	await macrotask()
	expect(body()).toBe('page')
	dispose()
	goto('/')
	await macrotask()
	goto('/page')
	await macrotask()
	expect(body()).toBe('')
})
