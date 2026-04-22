// Shared test checks for both preset-only and all-in-one bundles.

/** @type {HTMLElement} */
const output = document.getElementById('output')

/**
 * @type {{
 * 	passed: number
 * 	failed: number
 * 	errors: { title: string; error: string }[]
 * }}
 */
const results = { passed: 0, failed: 0, errors: [] }

window.__standalone_current_test__ = null

/**
 * Runs a named check, logging PASS/FAIL to the output element.
 *
 * @param {string} name
 * @param {() => void} fn
 */
function test(name, fn) {
	window.__standalone_current_test__ = name
	try {
		fn()
		results.passed++
		output.textContent += `PASS: ${name}\n`
	} catch (e) {
		results.failed++
		results.errors.push({ title: name, error: e.message })
		output.textContent += `FAIL: ${name} — ${e.message}\n`
	}
	window.__standalone_current_test__ = null
}

/**
 * Throws if condition is falsy.
 *
 * @param {boolean} condition
 * @param {string} [message]
 */
function assert(condition, message) {
	if (!condition) throw new Error(message || 'Assertion failed')
}

// 1. Preset is registered
test('preset registered', () => {
	assert(
		typeof globalThis.Babel.availablePresets.pota !== 'undefined',
		'pota preset not found in globalThis.Babel.availablePresets',
	)
})

// 2. Basic element transform
test('basic element', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div class="hello">world</div>
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(result.code.length > 0, 'empty output')
	assert(
		!result.code.includes('JSXElement') &&
			result.code.includes('import'),
		'JSX not transformed',
	)
})

// 3. Component transform
test('component', () => {
	const code = `
		/** @jsxImportSource pota */
		function App() { return <div>hi</div> }
		const el = <App prop="value" />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(result.code.includes('App'), 'component name missing')
	assert(!result.code.includes('<App'), 'JSX not transformed')
})

// 4. Fragment
test('fragment', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <>
			<span>a</span>
			<span>b</span>
		</>
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(!result.code.includes('<>'), 'fragment not transformed')
})

// 5. Spread props
test('spread props', () => {
	const code = `
		/** @jsxImportSource pota */
		const props = { id: "x" }
		const el = <div {...props} class="a" />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(!result.code.includes('{...'), 'spread not transformed')
})

// 6. HTML string (parse5)
test('html string via parse5', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div innerHTML="<b>bold</b>" />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(result.code.length > 0, 'empty output')
})

// 7. TypeScript + TSX
test('tsx transform', () => {
	const code = `
		/** @jsxImportSource pota */
		interface Props { name: string }
		function App(props: Props) {
			const x: number = 1
			return <div>{props.name}</div>
		}
		const el = <App name="test" />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('interface'),
		'TS interface not stripped',
	)
	assert(
		!result.code.includes(': string'),
		'TS type annotation not stripped',
	)
	assert(
		!result.code.includes(': number'),
		'TS type annotation not stripped',
	)
	assert(result.code.includes('App'), 'component name missing')
})

// 8. Output is parseable JS
test('output is parseable JS', () => {
	const code = `
		/** @jsxImportSource pota */
		function App({ name }) {
			return <div class="app">
				<span>{name}</span>
				<>fragment</>
			</div>
		}
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	globalThis.Babel.transform(result.code, {
		sourceType: 'module',
		plugins: [],
	})
})

// 9. Foreign @jsxImportSource pragma — should NOT be transformed
test('foreign @jsxImportSource skips transform', () => {
	const code = `
		/** @jsxImportSource react */
		const el = <div class="foreign">hello</div>
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('createPartial'),
		'pota transformed a file with a foreign pragma',
	)
	assert(
		!result.code.includes('pota/jsx-runtime'),
		'pota injected its runtime import for a foreign pragma',
	)
	assert(
		result.code.includes('<div'),
		'JSX should remain untransformed',
	)
})

// 10. @jsx pragma — should NOT be transformed
test('classic @jsx pragma skips transform', () => {
	const code = `
		/** @jsx React.createElement */
		const el = <div>hello</div>
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('createPartial'),
		'pota transformed a file with a @jsx pragma',
	)
	assert(
		result.code.includes('<div'),
		'JSX should remain untransformed',
	)
})

// 11. Pota @jsxImportSource — should still be transformed
test('pota @jsxImportSource is transformed', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div class="mine">hello</div>
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		result.code.includes('createPartial'),
		'JSX was not transformed with pota pragma',
	)
})

// 12. No pragma — should still be transformed
test('no pragma is transformed', () => {
	const code = `const el = <div>hello</div>`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		result.code.includes('createPartial'),
		'JSX was not transformed without a pragma',
	)
})

// --- style inlining -----------------------------------------------------
// The next tests verify the compile-time folding of `style=` into the
// partial HTML, not runtime behavior. Runtime assertions live in
// `tests/api/dom/set-style.jsx` — they pass whether the fold happened
// or not, so we also inspect the emitted code here.

// 13. Fully literal style object is folded into the partial HTML and
//     does not emit a setStyle call.
test('style inlining: literal object folded into partial HTML', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={{color: 'red', 'background-color': 'blue'}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('setStyle'),
		'setStyle should not be emitted for a fully literal style object',
	)
	assert(
		result.code.includes('color:red') &&
			result.code.includes('background-color:blue'),
		'folded CSS pieces should appear in the partial HTML',
	)
})

// 14. Mixed literal + dynamic object is left untouched and reaches
//     setStyle at runtime.
test('style inlining: mixed literal + dynamic is not folded', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={{color: 'red', background: dyn()}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		result.code.includes('setStyle'),
		'mixed style object must still go through setStyle at runtime',
	)
})

// 15. null / undefined-valued properties are dropped; if that leaves
//     an all-literal object, the remainder folds.
test('style inlining: null-valued properties dropped', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={{color: 'red', margin: null, padding: undefined}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('margin') &&
			!result.code.includes('padding'),
		'null / undefined-valued properties should not appear in output',
	)
	assert(
		!result.code.includes('setStyle'),
		'after dropping null/undefined the remaining literal should be folded',
	)
})

// 16. style={null} removes the attribute entirely.
test('style inlining: style={null} removes the attribute', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={null} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('style'),
		'style attribute should not appear in output for style={null}',
	)
})

// 17. Empty object style={{}} removes the attribute.
test('style inlining: style={{}} removes the attribute', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={{}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('style'),
		'style attribute should not appear in output for style={{}}',
	)
})

// 18. Computed key whose expression evaluates confident is folded.
test('style inlining: computed key with confident value is folded', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style={{['fo' + 'nt-size']: '14px'}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('setStyle'),
		'confident computed key should be folded, not routed to setStyle',
	)
	assert(
		result.code.includes('font-size:14px'),
		'folded computed key should appear in the partial HTML',
	)
})

// 19. Duplicate `style=` attrs with no spread: dedup keeps the last,
//     then the inliner folds.
test('style inlining: duplicate style attrs, last wins (no spread)', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style="a:b" style={{c: 'd'}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		!result.code.includes('a:b'),
		'earlier duplicate style should be dropped (last wins)',
	)
	assert(
		result.code.includes('c:d'),
		'later duplicate style should survive and fold',
	)
})

// 20. Duplicate `style=` attrs with a spread: dedup is skipped (JS
//     object-literal semantics in assignProps resolve last-wins);
//     both attrs go into the spread object literal.
test('style inlining: duplicate style attrs with spread keeps both keys', () => {
	const code = `
		/** @jsxImportSource pota */
		const el = <div style="a:b" {...x} style={{c: 'd'}} />
	`
	const result = globalThis.Babel.transform(code, {
		presets: ['pota'],
	})
	assert(
		result.code.includes('assignProps'),
		'spread path should route through assignProps',
	)
	assert(
		result.code.includes('a:b') && result.code.includes('c:d'),
		'both style attrs should reach the assignProps object; JS last-key-wins handles resolution at runtime',
	)
})

// done
const summary =
	results.failed === 0
		? `\nAll ${results.passed} tests passed.`
		: `\n${results.failed} failed, ${results.passed} passed.`
output.textContent += summary

window.__standalone_results__ = {
	...results,
	done: true,
}
