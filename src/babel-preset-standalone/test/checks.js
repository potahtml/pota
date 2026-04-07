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
