/** @jsxImportSource pota */

// Tests for the route context factory `create()` — specifically its
// `resolve(href)` helper, which turns a link (absolute or relative)
// into a full URL relative to the owning `<Route>`'s base. The public
// `<Route>` tests exercise matching/nesting; `resolve()` is the
// low-level URL math and is covered directly here.
import { test } from '#test'

import { create } from '../../../src/components/route/context.js'

// === Absolute hrefs pass through untouched ===

await test('route context - resolve() returns absolute http(s) hrefs unchanged', expect => {
	const ctx = create({ href: () => 'http://localhost/#uno/' })
	expect(ctx.resolve('https://other.example/x')).toBe(
		'https://other.example/x',
	)
})

await test('route context - resolve() returns root-relative ("/...") hrefs unchanged', expect => {
	// isAbsolute() treats a leading "/" as absolute, so it is returned
	// verbatim rather than joined to the base.
	const ctx = create({ href: () => 'http://localhost/base/' })
	expect(ctx.resolve('/abs')).toBe('/abs')
})

// === Relative hrefs are joined to the base ===

await test('route context - resolve() appends to a hash base (hash routing)', expect => {
	// When the base already contains "#", the href is concatenated so
	// "dos/" relative to ".../#uno/" becomes ".../#uno/dos/".
	const ctx = create({ href: () => 'http://localhost/#uno/' })
	expect(ctx.resolve('dos/')).toBe('http://localhost/#uno/dos/')
})

await test('route context - resolve() uses URL() against a path base (no hash)', expect => {
	const ctx = create({ href: () => 'http://localhost/base/' })
	expect(ctx.resolve('dos')).toBe('http://localhost/base/dos')
})

await test('route context - resolve() falls back to location.href when the route has no base', expect => {
	// Default href() returns '' (falsy), so the base becomes
	// location.href. A relative href resolves against the current page.
	const ctx = create({})
	const expected = new URL('dos', window.location.href).href
	expect(ctx.resolve('dos')).toBe(expected)
})

// === Default placeholders (overridden by a real <Route>) ===

await test('route context - default context exposes overridable placeholders', expect => {
	// `create({})` ships no-op defaults that `<Route>` later overrides.
	const ctx = create({})
	expect(ctx.show()).toBe(undefined)
	expect(ctx.href()).toBe('')
	// params() yields a getter to the empty `nothing` object
	expect(Object.keys(ctx.params()()).length).toBe(0)
	expect(ctx.base).toBe(undefined)
})
