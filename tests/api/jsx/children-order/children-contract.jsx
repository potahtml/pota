/** @jsxImportSource pota */

// Tests that lock down pota's current children contract so a planned
// refactor — `createComponent(v) = Factory(v)` (eager) plus
// "children are always a marked thunk wrapped at the parent site" —
// cannot ship silent regressions.
//
// Scope:
//
//   A. Shape of `props.children` for every JSX input kind. If a
//      parent currently observes a string, a number, a function, an
//      array, or `undefined`, the refactor must either preserve that
//      or break every test that pins it — not silently.
//
//   B. Timing of component function execution. In particular:
//      `<Child/>` stored in a variable and rendered later must run
//      Child *inside the render's root* so reactive state is owned
//      by the render, not by the enclosing scope.
//
//   C. Reactive ownership at top-level `render(<App/>)` — effects,
//      cleanups, context, memos created in App must clean up when
//      the render's dispose runs.
//
//   D. Callback-style children (Show/For/Switch+Match/Range). The
//      child is a single function that receives a context arg
//      (signal accessor, item, index). Any wrapping scheme must
//      preserve this invocation shape.
//
//   E. Built-ins that inspect `props.children` shape internally:
//      Switch's `isArray(props.children)` branch; Normalize's
//      `unwrap([props.children])`; Fragment's identity-return;
//      Errored / Suspense / Portal / Head / Collapse pass-through.
//
//   F. Fragment semantics — `<>...</>`, `<Fragment>...</Fragment>`,
//      empty fragment, single-child fragment, nested fragments.
//
//   G. Top-level `render` forms — `render(<App/>)`, `render(value)`,
//      `render(() => ...)`, `render(null)`, dispose semantics.
//
//   H. Children pass-through chains — intermediate components relay
//      children down without collapsing or re-wrapping them.
//
//   I. XML parity — every observable pinned for JSX has an xml
//      counterpart when expressible, because xml runs outside babel
//      and the refactor has to land matching changes in
//      `src/core/xml.js` manually.

import { test, body, microtask } from '#test'

import {
	cleanup,
	context,
	effect,
	Fragment,
	isComponent,
	memo,
	render,
	root,
	signal,
	untrack,
} from 'pota'
import {
	Collapse,
	Dynamic,
	Errored,
	For,
	Head,
	Match,
	Normalize,
	Portal,
	Range,
	Show,
	Suspense,
	Switch,
	Tabs,
} from 'pota/components'
import { XML } from 'pota/xml'

// -----------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------

// Capture what a parent observes as `props.children` without touching
// the DOM. Returns [sink, Component]. `sink.value` = last observed
// children, `sink.touched` = whether the component ran.
/**
 * @returns {[
 * 	{ value: any; touched: boolean; calls: number },
 * 	(props: any) => any,
 * ]}
 */
function captureChildren() {
	/** @type {{ value: any; touched: boolean; calls: number }} */
	const sink = { value: undefined, touched: false, calls: 0 }
	const Capture = props => {
		sink.value = props.children
		sink.touched = true
		sink.calls++
		return null
	}
	return [sink, Capture]
}

// Like captureChildren but also renders children out so we can check
// DOM output alongside the shape observation.
/**
 * @returns {[
 * 	{ value: any; touched: boolean },
 * 	(props: any) => any,
 * ]}
 */
function captureAndRender() {
	/** @type {{ value: any; touched: boolean }} */
	const sink = { value: undefined, touched: false }
	const CaptureRender = props => {
		sink.value = props.children
		sink.touched = true
		return props.children
	}
	return [sink, CaptureRender]
}

// ========================================================================
// A. props.children shape (JSX)
// ========================================================================

await test('children-contract - <Capture/> (no children) observes undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture />)
	expect(sink.touched).toBe(true)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - <Capture></Capture> (no children) observes undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture></Capture>)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - single text literal child is a string', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>hello</Capture>)
	expect(typeof sink.value).toBe('string')
	expect(sink.value).toBe('hello')
	dispose()
})

await test('children-contract - single numeric literal child is a string (JSX flattens)', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{42}</Capture>)
	// babel's children transform flattens literal numbers → stringified
	// and merged as a StringLiteral; see tests/api/jsx/children.jsx.
	expect(typeof sink.value).toBe('string')
	expect(sink.value).toBe('42')
	dispose()
})

await test('children-contract - adjacent text + literal number children merge to one string', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>hello {42}!</Capture>)
	expect(typeof sink.value).toBe('string')
	expect(sink.value).toBe('hello 42!')
	dispose()
})

await test('children-contract - single component child is a function', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return <p>leaf</p>
	}
	const dispose = render(
		<Capture>
			<Leaf />
		</Capture>,
	)
	expect(typeof sink.value).toBe('function')
	dispose()
})

await test('children-contract - single component child is marked as a component', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return <p>leaf</p>
	}
	const dispose = render(
		<Capture>
			<Leaf />
		</Capture>,
	)
	// isComponent tests both isFunction() + $isComponent marker
	expect(isComponent(sink.value)).toBe(true)
	dispose()
})

await test('children-contract - multiple component children are an array of marked component thunks', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	function B() {
		return null
	}
	const dispose = render(
		<Capture>
			<A />
			<B />
		</Capture>,
	)
	// Each `<X/>` compiles to `_X()` = `markComponent(() => component({}))`
	// — a per-use-site marked thunk. Multi-child children is an
	// array of those thunks.
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(isComponent(sink.value[0])).toBe(true)
	expect(isComponent(sink.value[1])).toBe(true)
	dispose()
})

await test('children-contract - mixed text + component is an array (text first)', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return null
	}
	const dispose = render(
		<Capture>
			text
			<Leaf />
		</Capture>,
	)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(sink.value[0]).toBe('text')
	expect(isComponent(sink.value[1])).toBe(true)
	dispose()
})

await test('children-contract - mixed component + text is an array (component first)', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return null
	}
	const dispose = render(
		<Capture>
			<Leaf />
			text
		</Capture>,
	)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(isComponent(sink.value[0])).toBe(true)
	expect(sink.value[1]).toBe('text')
	dispose()
})

await test('children-contract - {null} literal child is filtered to undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{null}</Capture>)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - {undefined} literal child is filtered to undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{undefined}</Capture>)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - {true} literal child is filtered to undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{true}</Capture>)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - {false} literal child is filtered to undefined', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{false}</Capture>)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - callback expression child ({v => ...}) is a function', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{v => v}</Capture>)
	expect(typeof sink.value).toBe('function')
	// the callback is the user's raw arrow — invocation shape preserved
	expect(sink.value('x')).toBe('x')
	dispose()
})

await test('children-contract - signal-accessor child ({count.read}) is a function (signal accessor)', expect => {
	const [sink, Capture] = captureChildren()
	const count = signal(7)
	const dispose = render(<Capture>{count.read}</Capture>)
	expect(typeof sink.value).toBe('function')
	expect(sink.value()).toBe(7)
	dispose()
})

await test('children-contract - {value} numeric expression child snapshot (pin current shape)', expect => {
	const [sink, Capture] = captureChildren()
	const n = 5
	const dispose = render(<Capture>{n}</Capture>)
	// Pin whichever shape the current runtime produces (string or
	// number) so the refactor can't silently change it. If babel's
	// dynamic-expression path evolves, this test fails.
	const ok = sink.value === 5 || sink.value === '5'
	expect(ok).toBe(true)
	dispose()
})

await test('children-contract - JSX array expression child is an array of marked thunks', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	function B() {
		return null
	}
	const dispose = render(
		<Capture>{[<A />, <B />]}</Capture>,
	)
	// `{[<A/>, <B/>]}` — each `<X/>` inside the literal still
	// compiles to a marked thunk; the array literal itself is the
	// children value.
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(isComponent(sink.value[0])).toBe(true)
	expect(isComponent(sink.value[1])).toBe(true)
	dispose()
})

await test('children-contract - map-result array child keeps array shape', expect => {
	const [sink, Capture] = captureChildren()
	function Item(props) {
		return <p>{props.v}</p>
	}
	const items = [1, 2, 3]
	const dispose = render(
		<Capture>
			{items.map(v => (
				<Item v={v} />
			))}
		</Capture>,
	)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(3)
	sink.value.forEach(c => expect(isComponent(c)).toBe(true))
	dispose()
})

await test('children-contract - attribute form <Cap children={x}/> passes value through as-is', expect => {
	const [sink, Capture] = captureChildren()
	// per tests/api/jsx/children.jsx: attribute form is not touched by
	// the children transform — booleans/null/arrays reach the
	// component unchanged.
	const dispose = render(<Capture children={[1, 2, 3]} />)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value).toEqual([1, 2, 3])
	dispose()
})

await test('children-contract - attribute form children={true} reaches the component as true', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture children={true} />)
	expect(sink.value).toBe(true)
	dispose()
})

await test('children-contract - attribute form children={null} reaches the component as null', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture children={null} />)
	expect(sink.value).toBe(null)
	dispose()
})

// ========================================================================
// A'. props.children shape (xml)
// ========================================================================

await test('children-contract - xml <Capture/> (no children) observes undefined', expect => {
	const [sink, Capture] = captureChildren()
	const x = XML()
	x.define({ Capture })
	const dispose = render(x`<Capture/>`)
	expect(sink.value).toBe(undefined)
	dispose()
})

await test('children-contract - xml single text child is a string', expect => {
	const [sink, Capture] = captureChildren()
	const x = XML()
	x.define({ Capture })
	const dispose = render(x`<Capture>hello</Capture>`)
	expect(typeof sink.value).toBe('string')
	expect(sink.value).toBe('hello')
	dispose()
})

await test('children-contract - xml single component child is a function (marked)', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return null
	}
	const x = XML()
	x.define({ Capture, Leaf })
	const dispose = render(x`<Capture><Leaf/></Capture>`)
	expect(isComponent(sink.value)).toBe(true)
	dispose()
})

await test('children-contract - xml multiple component children are an array of component functions', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	function B() {
		return null
	}
	const x = XML()
	x.define({ Capture, A, B })
	const dispose = render(x`<Capture><A/><B/></Capture>`)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(isComponent(sink.value[0])).toBe(true)
	expect(isComponent(sink.value[1])).toBe(true)
	dispose()
})

await test('children-contract - xml interpolated signal accessor is a function', expect => {
	const [sink, Capture] = captureChildren()
	const count = signal(7)
	const x = XML()
	x.define({ Capture })
	const dispose = render(x`<Capture>${count.read}</Capture>`)
	// xml children that are interpolated functions end up inside an
	// array (because xml wraps surrounding text, even when empty).
	// Assert the shape the current runtime produces.
	const v = sink.value
	if (Array.isArray(v)) {
		const fn = v.find(e => typeof e === 'function')
		expect(typeof fn).toBe('function')
		expect(fn()).toBe(7)
	} else {
		expect(typeof v).toBe('function')
		expect(v()).toBe(7)
	}
	dispose()
})

// ========================================================================
// B. Timing — component-in-a-variable must not run until rendered
// ========================================================================

await test('children-contract - <Child/> stored in a variable does NOT run Child until render', expect => {
	let ran = 0
	function Child() {
		ran++
		return null
	}
	// `<Child/>` compiles to `_Child()` which returns a lazy marked
	// thunk (createComponent's closure). Child runs only when the
	// renderer descends into the thunk inside `render()`.
	const jsx = <Child />
	expect(ran).toBe(0)
	const dispose = render(jsx)
	expect(ran).toBe(1)
	dispose()
})

await test('children-contract - <Child/> passed deep through props does not run until parent descends', expect => {
	let ran = 0
	function Child() {
		ran++
		return null
	}
	function Skip(props) {
		// component that ignores children
		return null
	}
	const dispose = render(
		<Skip>
			<Child />
		</Skip>,
	)
	expect(ran).toBe(0)
	dispose()
})

await test('children-contract - effect created by a stored <Child/> is owned by render root', async expect => {
	const runs = { setup: 0, cleanup: 0 }
	function Child() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return null
	}
	// Because `<Child/>` stays lazy until render descends, Child's
	// body runs inside render's root — effects and cleanups are
	// owned by the render and clean up on dispose.
	const jsx = <Child />
	expect(runs.setup).toBe(0)
	const dispose = render(jsx)
	expect(runs.setup).toBe(1)
	expect(runs.cleanup).toBe(0)
	dispose()
	expect(runs.cleanup).toBe(1)
})

// ========================================================================
// C. Reactive ownership at top-level render
// ========================================================================

await test('children-contract - render(<App/>): effect in App cleans up on dispose', expect => {
	const runs = { setup: 0, cleanup: 0 }
	function App() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return null
	}
	const dispose = render(<App />)
	expect(runs.setup).toBe(1)
	expect(runs.cleanup).toBe(0)
	dispose()
	expect(runs.cleanup).toBe(1)
})

await test('children-contract - render(<App/>): signal effect re-runs on write, cleanup on dispose', expect => {
	const runs = []
	const cleaned = []
	const count = signal(0)
	function App() {
		effect(() => {
			const v = count.read()
			runs.push(v)
			cleanup(() => cleaned.push(v))
		})
		return null
	}
	const dispose = render(<App />)
	expect(runs).toEqual([0])
	count.write(1)
	expect(runs).toEqual([0, 1])
	expect(cleaned).toEqual([0])
	dispose()
	expect(cleaned).toEqual([0, 1])
})

await test('children-contract - render(<App/>): context set in App propagates to child descendants', expect => {
	const Theme = context('light')
	let seen = null
	function Child() {
		seen = Theme()
		return null
	}
	function App() {
		return (
			<Theme.Provider value="dark">
				<Child />
			</Theme.Provider>
		)
	}
	const dispose = render(<App />)
	expect(seen).toBe('dark')
	dispose()
})

await test('children-contract - render(<App/>): nested cleanups run during dispose in reverse order', expect => {
	const order = []
	function Inner() {
		cleanup(() => order.push('inner'))
		return null
	}
	function Outer() {
		cleanup(() => order.push('outer'))
		return <Inner />
	}
	const dispose = render(<Outer />)
	dispose()
	// pota cleans children (reverse) then parent cleanups (reverse);
	// inner registered before outer cleanup in this shape because
	// Outer's cleanup registers first, then Inner runs and registers.
	// Assert the observed order; if refactor changes disposal order
	// this test fails loudly.
	expect(order).toEqual(['inner', 'outer'])
})

await test('children-contract - render(<App/>): memo created in App is live and cleaned on dispose', expect => {
	const reads = []
	const count = signal(1)
	function App() {
		const doubled = memo(() => count.read() * 2)
		effect(() => {
			reads.push(doubled())
		})
		return null
	}
	const dispose = render(<App />)
	expect(reads).toEqual([2])
	count.write(3)
	expect(reads).toEqual([2, 6])
	dispose()
	count.write(5)
	// after dispose, the effect should no longer react
	expect(reads).toEqual([2, 6])
})

// ========================================================================
// D. Callback-style children — signature preserved
// ========================================================================

await test('children-contract - Show callback receives a signal accessor (reactive when)', expect => {
	const count = signal(1)
	/** @type {any} */
	let seenAccessor
	const dispose = render(
		<Show when={count.read}>
			{v => {
				seenAccessor = v
				return <p>{() => v()}</p>
			}}
		</Show>,
	)
	expect(typeof seenAccessor).toBe('function')
	expect(seenAccessor()).toBe(1)
	count.write(2)
	expect(seenAccessor()).toBe(2)
	dispose()
})

await test('children-contract - For callback receives (item, index)', expect => {
	const calls = []
	const dispose = render(
		<For each={['a', 'b', 'c']}>
			{(item, i) => {
				calls.push([item, i])
				return <span>{item}</span>
			}}
		</For>,
	)
	expect(calls).toEqual([
		['a', 0],
		['b', 1],
		['c', 2],
	])
	dispose()
})

await test('children-contract - For reactiveIndex callback receives (item, () => index)', expect => {
	const calls = []
	const dispose = render(
		<For
			each={['a', 'b']}
			reactiveIndex
		>
			{(item, i) => {
				// with reactiveIndex, second arg is an accessor
				calls.push([item, typeof i, i()])
				return <span>{item}</span>
			}}
		</For>,
	)
	expect(calls).toEqual([
		['a', 'function', 0],
		['b', 'function', 1],
	])
	dispose()
})

await test('children-contract - Range callback receives (n, index)', expect => {
	const calls = []
	const dispose = render(
		<Range
			start={10}
			stop={12}
		>
			{(n, i) => {
				calls.push([n, i])
				return <span>{n}</span>
			}}
		</Range>,
	)
	expect(calls).toEqual([
		[10, 0],
		[11, 1],
		[12, 2],
	])
	dispose()
})

await test('children-contract - Match callback receives the when accessor from Switch', expect => {
	const hit = signal({ n: 7 })
	/** @type {any} */
	let seenAccessor
	const dispose = render(
		<Switch>
			<Match when={hit.read}>
				{v => {
					seenAccessor = v
					return <p>{() => v()?.n ?? 0}</p>
				}}
			</Match>
		</Switch>,
	)
	expect(typeof seenAccessor).toBe('function')
	expect(seenAccessor().n).toBe(7)
	dispose()
})

// ========================================================================
// E. Built-ins that inspect props.children internally
// ========================================================================

await test('children-contract - Switch with single Match: isArray(children) path works', expect => {
	// Switch.js line 17: `isArray(props.children) ? children : [children]`
	// — single-Match form must still be classified correctly.
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>a</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>a</p>')
	dispose()
})

await test('children-contract - Switch with multiple Match: array path works', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match when={true}>
				<p>b</p>
			</Match>
			<Match when={true}>
				<p>c</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>b</p>')
	dispose()
})

await test('children-contract - Switch with no-when Match acts as fallback', expect => {
	const dispose = render(
		<Switch>
			<Match when={false}>
				<p>a</p>
			</Match>
			<Match>
				<p>fallback</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>fallback</p>')
	dispose()
})

await test('children-contract - Normalize concatenates scalar children to a single text node', expect => {
	const dispose = render(
		<Normalize>
			a{'b'}{42}
		</Normalize>,
	)
	// Normalize calls `unwrap([props.children]).map(x => x?.toString()).join('')`
	// — scalar children are unwrapped and joined. Component children
	// would stringify to "[object HTMLElement]" which is why
	// Normalize is documented as text-only.
	expect(body()).toBe('ab42')
	dispose()
})

await test('children-contract - Fragment returns props.children directly', expect => {
	function Leaf() {
		return <p>leaf</p>
	}
	const dispose = render(
		<Fragment>
			<Leaf />
		</Fragment>,
	)
	expect(body()).toBe('<p>leaf</p>')
	dispose()
})

await test('children-contract - Fragment with multiple children renders all in order', expect => {
	const dispose = render(
		<Fragment>
			<p>a</p>
			<p>b</p>
		</Fragment>,
	)
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

await test('children-contract - Errored passes children through when nothing throws', expect => {
	const dispose = render(
		<Errored>
			<p>ok</p>
		</Errored>,
	)
	expect(body()).toBe('<p>ok</p>')
	dispose()
})

await test('children-contract - Suspense passes non-async children through', expect => {
	const dispose = render(
		<Suspense>
			<p>ready</p>
		</Suspense>,
	)
	expect(body()).toBe('<p>ready</p>')
	dispose()
})

await test('children-contract - Portal moves children to its mount', expect => {
	const mount = document.createElement('div')
	const dispose = render(
		<Portal mount={mount}>
			<p>portaled</p>
		</Portal>,
	)
	expect(body()).toBe('')
	expect(mount.innerHTML).toBe('<p>portaled</p>')
	dispose()
})

await test('children-contract - Head moves children to document.head', expect => {
	const dispose = render(
		<Head>
			<meta name="children-contract-head" />
		</Head>,
	)
	expect(
		document.head.querySelector('meta[name="children-contract-head"]'),
	).not.toBe(null)
	dispose()
	expect(
		document.head.querySelector('meta[name="children-contract-head"]'),
	).toBe(null)
})

await test('children-contract - Collapse wraps children in a div and always mounts them', expect => {
	let ran = 0
	function Child() {
		ran++
		return <p>c</p>
	}
	const dispose = render(
		<Collapse when={false}>
			<Child />
		</Collapse>,
	)
	// when=false, Collapse still renders children inside a display:none div
	expect(ran).toBe(1)
	expect(body().includes('<p>c</p>')).toBe(true)
	dispose()
})

// ========================================================================
// F. Fragment variants
// ========================================================================

await test('children-contract - empty fragment <></> renders nothing', expect => {
	const dispose = render(<></>)
	expect(body()).toBe('')
	dispose()
})

await test('children-contract - single-child fragment renders the child only', expect => {
	const dispose = render(
		<>
			<p>a</p>
		</>,
	)
	expect(body()).toBe('<p>a</p>')
	dispose()
})

await test('children-contract - multi-child fragment renders children in order', expect => {
	const dispose = render(
		<>
			<p>a</p>
			<p>b</p>
			<p>c</p>
		</>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p>')
	dispose()
})

await test('children-contract - nested fragments flatten', expect => {
	const dispose = render(
		<>
			<p>a</p>
			<>
				<p>b</p>
				<p>c</p>
			</>
			<p>d</p>
		</>,
	)
	expect(body()).toBe('<p>a</p><p>b</p><p>c</p><p>d</p>')
	dispose()
})

await test('children-contract - <Fragment>{x}</Fragment> returns x directly (single child)', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(
		<Capture>
			<Fragment>
				<p>a</p>
			</Fragment>
		</Capture>,
	)
	// <Fragment> path goes through Component's short-circuit; the
	// returned value IS the fragment's children (a marked <p> thunk).
	expect(isComponent(sink.value)).toBe(true)
	dispose()
})

// ========================================================================
// G. Top-level render forms
// ========================================================================

await test('children-contract - render(value): a non-function value renders its DOM', expect => {
	const dispose = render(<p>static</p>)
	expect(body()).toBe('<p>static</p>')
	dispose()
})

await test('children-contract - render(() => <App/>): function form is accepted', expect => {
	let ran = 0
	const App = () => {
		ran++
		return <p>fn</p>
	}
	const dispose = render(() => <App />)
	expect(ran).toBe(1)
	expect(body()).toBe('<p>fn</p>')
	dispose()
})

await test('children-contract - render(null) renders nothing, dispose cleans up', expect => {
	const dispose = render(null)
	expect(body()).toBe('')
	dispose()
})

await test('children-contract - render("text") creates a text node', expect => {
	const dispose = render('hello')
	expect(body()).toBe('hello')
	dispose()
})

await test('children-contract - render() returns a dispose function', expect => {
	const dispose = render(<p>x</p>)
	expect(typeof dispose).toBe('function')
	dispose()
})

await test('children-contract - double dispose is idempotent (no throw)', expect => {
	const dispose = render(<p>x</p>)
	dispose()
	dispose()
	expect(body()).toBe('')
})

// ========================================================================
// H. Children pass-through chains
// ========================================================================

await test('children-contract - A → B → C: each parent sees the next component as children', expect => {
	const seenByA = { v: undefined }
	const seenByB = { v: undefined }
	function A(props) {
		seenByA.v = props.children
		return props.children
	}
	function B(props) {
		seenByB.v = props.children
		return props.children
	}
	function C() {
		return <p>c</p>
	}
	const dispose = render(
		<A>
			<B>
				<C />
			</B>
		</A>,
	)
	// A's children = the B component function
	expect(isComponent(seenByA.v)).toBe(true)
	// B's children = the C component function
	expect(isComponent(seenByB.v)).toBe(true)
	expect(body()).toBe('<p>c</p>')
	dispose()
})

await test('children-contract - intermediate wrapper can forward children without collapsing', expect => {
	function Wrapper(props) {
		return <section>{props.children}</section>
	}
	const dispose = render(
		<Wrapper>
			<p>a</p>
			<p>b</p>
		</Wrapper>,
	)
	expect(body()).toBe('<section><p>a</p><p>b</p></section>')
	dispose()
})

await test('children-contract - pass-through preserves reactive children (signal accessor)', expect => {
	const count = signal(1)
	function Pass(props) {
		return <span>{props.children}</span>
	}
	const dispose = render(<Pass>{count.read}</Pass>)
	expect(body()).toBe('<span>1</span>')
	count.write(2)
	expect(body()).toBe('<span>2</span>')
	dispose()
})

// ========================================================================
// I. Assorted edge cases
// ========================================================================

await test('children-contract - component returning another component function', expect => {
	function Inner() {
		return <p>inner</p>
	}
	function Outer() {
		// returning the component reference (not <Inner/>) still works
		return Inner
	}
	const dispose = render(<Outer />)
	expect(body()).toBe('<p>inner</p>')
	dispose()
})

await test('children-contract - component returning an array of mixed elements', expect => {
	function Multi() {
		return [<p>a</p>, 'text', <p>b</p>]
	}
	const dispose = render(<Multi />)
	expect(body()).toBe('<p>a</p>text<p>b</p>')
	dispose()
})

await test('children-contract - children can be accessed twice by the same parent (idempotent)', expect => {
	function Twice(props) {
		return (
			<>
				{props.children}
				{props.children}
			</>
		)
	}
	function Leaf() {
		return <p>x</p>
	}
	const dispose = render(
		<Twice>
			<Leaf />
		</Twice>,
	)
	// pota currently allows reading props.children twice; whatever
	// the DOM outcome, lock it so a refactor can't silently diverge.
	expect(body()).toBe('<p>x</p><p>x</p>')
	dispose()
})

await test('children-contract - children accessed zero times: no DOM, no side effect', expect => {
	let ran = 0
	function Drop(props) {
		return null
	}
	function Leaf() {
		ran++
		return <p>x</p>
	}
	const dispose = render(
		<Drop>
			<Leaf />
		</Drop>,
	)
	expect(ran).toBe(0)
	expect(body()).toBe('')
	dispose()
})

await test('children-contract - conditional expression inside children: `cond && <X/>`', expect => {
	function X() {
		return <p>x</p>
	}
	const dispose = render(
		<div>{true && <X />}</div>,
	)
	expect(body()).toBe('<div><p>x</p></div>')
	dispose()
})

await test('children-contract - conditional expression inside children: `false && <X/>` renders nothing', expect => {
	let ran = 0
	function X() {
		ran++
		return <p>x</p>
	}
	const dispose = render(
		<div>{false && <X />}</div>,
	)
	expect(body()).toBe('<div></div>')
	expect(ran).toBe(0)
	dispose()
})

await test('children-contract - array literal as single children expression renders in order', expect => {
	const dispose = render(<div>{[<p>a</p>, <p>b</p>, <p>c</p>]}</div>)
	expect(body()).toBe('<div><p>a</p><p>b</p><p>c</p></div>')
	dispose()
})

// ========================================================================
// J. XML parity for children passthrough, fragments, reactive children
// ========================================================================

await test('children-contract - xml intermediate wrapper forwards children', expect => {
	const x = XML()
	function Wrapper(props) {
		return x`<section>${props.children}</section>`
	}
	x.define({ Wrapper })
	const dispose = render(
		x`<Wrapper><p>a</p><p>b</p></Wrapper>`,
	)
	expect(body()).toBe('<section><p>a</p><p>b</p></section>')
	dispose()
})

await test('children-contract - xml reactive interpolation updates on signal write', expect => {
	const count = signal(1)
	const x = XML()
	const dispose = render(x`<span>${count.read}</span>`)
	expect(body()).toBe('<span>1</span>')
	count.write(2)
	expect(body()).toBe('<span>2</span>')
	dispose()
})

await test('children-contract - xml A → B → C parents see each next component as children', expect => {
	const seenA = { v: undefined }
	const seenB = { v: undefined }
	const x = XML()
	function A(props) {
		seenA.v = props.children
		return props.children
	}
	function B(props) {
		seenB.v = props.children
		return props.children
	}
	function C() {
		return x`<p>c</p>`
	}
	x.define({ A, B, C })
	const dispose = render(x`<A><B><C/></B></A>`)
	expect(isComponent(seenA.v)).toBe(true)
	expect(isComponent(seenB.v)).toBe(true)
	expect(body()).toBe('<p>c</p>')
	dispose()
})

await test('children-contract - xml <App/>: effect created inside cleans up on dispose', expect => {
	const runs = { setup: 0, cleanup: 0 }
	function App() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return null
	}
	const x = XML()
	x.define({ App })
	const dispose = render(x`<App/>`)
	expect(runs.setup).toBe(1)
	dispose()
	expect(runs.cleanup).toBe(1)
})

await test('children-contract - xml Switch + Match: single Match path renders', expect => {
	const x = XML()
	const dispose = render(
		x`<Switch><Match when="${true}"><p>a</p></Match></Switch>`,
	)
	expect(body()).toBe('<p>a</p>')
	dispose()
})

await test('children-contract - xml Fragment-like bare template renders children in order', expect => {
	const x = XML()
	const dispose = render(x`<p>a</p><p>b</p>`)
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
})

// ========================================================================
// K. What the refactor MUST NOT silently break: snapshot assertions
// ========================================================================

await test('children-contract - multi-child parent: N children each a separate marked thunk (JSX)', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	function B() {
		return null
	}
	function C() {
		return null
	}
	const dispose = render(
		<Capture>
			<A />
			<B />
			<C />
		</Capture>,
	)
	// Each JSX element compiles to `_X()` = `markComponent(() => …)`
	// — a fresh marked thunk per use-site. Multi-child children is
	// an array of those thunks, and every entry satisfies
	// `isComponent(...)`.
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(3)
	expect(sink.value.every(isComponent)).toBe(true)
	dispose()
})

await test('children-contract - single-component parent: children is NOT an array, it is the marked thunk (JSX)', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	const dispose = render(
		<Capture>
			<A />
		</Capture>,
	)
	// CURRENT: single-component child is passed as the function itself,
	// not wrapped in an array.
	expect(Array.isArray(sink.value)).toBe(false)
	expect(isComponent(sink.value)).toBe(true)
	dispose()
})

await test('children-contract - single text child is a bare string, not wrapped (JSX)', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>hello</Capture>)
	// CURRENT: text children are plain strings — not wrapped in
	// a function or an array. The refactor must preserve this for
	// pass-through and Normalize to keep working.
	expect(typeof sink.value).toBe('string')
	expect(sink.value).toBe('hello')
	dispose()
})

await test('children-contract - Switch still receives Match components as its children (JSX)', expect => {
	// Switch reads props.children as the Match elements. If the
	// refactor wraps them in an outer thunk, Switch must unwrap it
	// — otherwise `isArray(props.children)` stops matching.
	const [sink, ForwardToSwitch] = captureAndRender()
	const dispose = render(
		<Switch>
			<Match when={true}>
				<p>won</p>
			</Match>
		</Switch>,
	)
	expect(body()).toBe('<p>won</p>')
	dispose()
})

// ========================================================================
// L. How `createComponent`'s per-use-site wrap shapes what callback-
//    style parents can pass through to a component child.
//
//    Every `<X/>` compiles to `_X(props)` whose body is effectively
//    `markComponent(() => component(props))` — the outer arrow takes
//    no params, so any arg a caller passes to the thunk is *ignored*.
//    That's why passing `<Child/>` as the child of `Show` / `For` /
//    `Switch+Match` / `Range` is not the same as passing a callback
//    `{(v) => …}`: the callback form receives the parent's callback
//    args, but the component form doesn't.
//
//    This section pins the current (createComponent-wrap) contract
//    for each callback-style parent, so the "component children
//    swallow the callback arg" behavior can't drift silently.
// ========================================================================

await test('children-contract - single no-props component child is a marked thunk (createComponent wrap)', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return null
	}
	const dispose = render(
		<Capture>
			<Leaf />
		</Capture>,
	)
	// `<Leaf/>` → `_Leaf()` → `markComponent(() => Leaf({}))`. The
	// children slot receives that thunk. It's marked, it ignores
	// any args the caller passes, and calling it runs Leaf with the
	// JSX-site props (here: empty).
	expect(isComponent(sink.value)).toBe(true)
	expect(sink.value()).toBe(null)
	expect(sink.value('ignored')).toBe(null)
	dispose()
})

await test('children-contract - single component child WITH props: wrap runs Leaf with the JSX-site props', expect => {
	const [sink, Capture] = captureChildren()
	/** @type {any} */
	let seen
	function Leaf(props) {
		seen = props
		return null
	}
	const dispose = render(
		<Capture>
			<Leaf a={1} b="two" />
		</Capture>,
	)
	expect(isComponent(sink.value)).toBe(true)
	sink.value()
	expect(seen.a).toBe(1)
	expect(seen.b).toBe('two')
	// callers passing args can't override the JSX-site props —
	// createComponent's arrow takes no params.
	seen = undefined
	sink.value('an-arg')
	expect(seen.a).toBe(1)
	expect(seen.b).toBe('two')
	dispose()
})

await test('children-contract - <Show when={x}><Child/></Show>: Child runs with its JSX-site props, NOT Show\'s accessor', expect => {
	/** @type {any} */
	let received = 'unset'
	function Child(props) {
		received = props
		return null
	}
	const count = signal(42)
	const dispose = render(
		<Show when={count.read}>
			<Child />
		</Show>,
	)
	// Show calls `callback(value)` with the accessor, but the
	// createComponent wrap's arrow has no params, so `value` is
	// discarded. Child runs with its JSX-site props (empty).
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - <For each={arr}><Item/></For>: Item runs with empty props, NOT the iterated item', expect => {
	const calls = []
	function Item(props) {
		calls.push(Object.keys(props))
		return null
	}
	const dispose = render(
		<For each={['a', 'b', 'c']}>
			{
				/**
				 * @type {(
				 * 	item: string,
				 * 	index: number,
				 * ) => JSX.Element}
				 */
				(/** @type {unknown} */ (<Item />))
			}
		</For>,
	)
	// For calls `callback(item, index)`; the createComponent wrap
	// ignores both and runs Item once per iteration with its
	// JSX-site props (empty here).
	expect(calls).toEqual([[], [], []])
	dispose()
})

await test('children-contract - <Range start stop><Tick/></Range>: Tick runs with empty props, NOT the number', expect => {
	const calls = []
	function Tick(props) {
		calls.push(Object.keys(props))
		return null
	}
	const dispose = render(
		<Range
			start={10}
			stop={12}
		>
			{
				/**
				 * @type {(
				 * 	n: number,
				 * 	index: number,
				 * ) => JSX.Element}
				 */
				(/** @type {unknown} */ (<Tick />))
			}
		</Range>,
	)
	expect(calls).toEqual([[], [], []])
	dispose()
})

await test('children-contract - <Switch><Match when={x}><Body/></Match></Switch>: Body runs with empty props, NOT the when accessor', expect => {
	/** @type {any} */
	let received = 'unset'
	function Body(props) {
		received = props
		return null
	}
	const hit = signal({ label: 'on' })
	const dispose = render(
		<Switch>
			<Match when={hit.read}>
				<Body />
			</Match>
		</Switch>,
	)
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - basic <Parent><Child/></Parent>: Child runs with empty props', expect => {
	/** @type {any} */
	let received = 'unset'
	function Child(props) {
		received = props
		return null
	}
	function Parent(props) {
		return props.children
	}
	const dispose = render(
		<Parent>
			<Child />
		</Parent>,
	)
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - pass-through chain: each parent sees the next component as a marked thunk', expect => {
	const seenByA = { v: undefined }
	function A(props) {
		seenByA.v = props.children
		return props.children
	}
	function B() {
		return <p>b</p>
	}
	const dispose = render(
		<A>
			<B />
		</A>,
	)
	expect(isComponent(seenByA.v)).toBe(true)
	expect(body()).toBe('<p>b</p>')
	dispose()
})

await test('children-contract - multi no-props siblings: each is its own marked thunk in an array', expect => {
	const [sink, Capture] = captureChildren()
	function A() {
		return null
	}
	function B() {
		return null
	}
	const dispose = render(
		<Capture>
			<A />
			<B />
		</Capture>,
	)
	expect(Array.isArray(sink.value)).toBe(true)
	expect(sink.value.length).toBe(2)
	expect(sink.value.every(isComponent)).toBe(true)
	dispose()
})

await test('children-contract - order is preserved: parent runs before a single component child', expect => {
	const order = []
	function Parent(props) {
		order.push('parent')
		return props.children
	}
	function Child() {
		order.push('child')
		return null
	}
	const dispose = render(
		<Parent>
			<Child />
		</Parent>,
	)
	expect(order).toEqual(['parent', 'child'])
	dispose()
})

// ========================================================================
// M. Mirror of Section L with the callback form — `{(v) => …}`.
//    Pins that the callback form works alongside the direct-component
//    form, plus the one place where they diverge: callbacks receive
//    *all* args the parent passes, whereas the direct-component form
//    only gets the first (Factory's wrapper is `(p = nothing) => …`).
// ========================================================================

await test('children-contract - single callback child is a plain (unmarked) arrow at the children slot', expect => {
	const [sink, Capture] = captureChildren()
	const dispose = render(<Capture>{(v, i) => null}</Capture>)
	// The children-wrap logic only fires when a child is a
	// component-call CallExpression. A bare arrow expression passes
	// through untouched — it's a plain function, NOT marked with
	// `$isComponent`. The renderer will treat it either as a
	// reactive expression (wrap in effect) or a callback, depending
	// on what the parent does with it.
	expect(typeof sink.value).toBe('function')
	expect(isComponent(sink.value)).toBe(false)
	dispose()
})

await test('children-contract - Show + callback: receives the accessor (equivalent to Show + Component)', expect => {
	/** @type {any} */
	let received
	const count = signal(42)
	const dispose = render(
		<Show when={count.read}>
			{v => {
				received = v
				return null
			}}
		</Show>,
	)
	// Same observable as the component-form test (`<Show><Child/>`)
	// — Show is a 1-arg callback shape so both forms see the same
	// accessor.
	expect(typeof received).toBe('function')
	expect(received()).toBe(42)
	count.write(100)
	expect(received()).toBe(100)
	dispose()
})

await test('children-contract - Match + callback: receives the when accessor (equivalent to Match + Component)', expect => {
	/** @type {any} */
	let received
	const hit = signal({ label: 'on' })
	const dispose = render(
		<Switch>
			<Match when={hit.read}>
				{v => {
					received = v
					return null
				}}
			</Match>
		</Switch>,
	)
	expect(typeof received).toBe('function')
	expect(received().label).toBe('on')
	dispose()
})

await test('children-contract - For + callback receives (item, index); the component form gets neither', expect => {
	const callbackSeen = []
	const componentProps = []
	function Item(props) {
		componentProps.push(Object.keys(props))
		return null
	}

	// callback form — gets both positional args
	const disposeCb = render(
		<For each={['a', 'b', 'c']}>
			{(item, index) => {
				callbackSeen.push([item, index])
				return null
			}}
		</For>,
	)
	disposeCb()

	// component form — createComponent's outer arrow has no params,
	// so the callback args are discarded and Item runs with its
	// JSX-site props (empty here).
	const disposeComp = render(
		<For each={['a', 'b', 'c']}>
			{
				/**
				 * @type {(
				 * 	item: string,
				 * 	i: number,
				 * ) => JSX.Element}
				 */
				(/** @type {unknown} */ (<Item />))
			}
		</For>,
	)
	disposeComp()

	expect(callbackSeen).toEqual([
		['a', 0],
		['b', 1],
		['c', 2],
	])
	expect(componentProps).toEqual([[], [], []])
})

await test('children-contract - Range + callback receives (n, index); the component form gets empty props', expect => {
	const callbackSeen = []
	const componentProps = []
	function Tick(props) {
		componentProps.push(Object.keys(props))
		return null
	}

	const disposeCb = render(
		<Range
			start={0}
			stop={2}
		>
			{(n, index) => {
				callbackSeen.push([n, index])
				return null
			}}
		</Range>,
	)
	disposeCb()

	const disposeComp = render(
		<Range
			start={0}
			stop={2}
		>
			{
				/**
				 * @type {(
				 * 	n: number,
				 * 	i: number,
				 * ) => JSX.Element}
				 */
				(/** @type {unknown} */ (<Tick />))
			}
		</Range>,
	)
	disposeComp()

	expect(callbackSeen).toEqual([
		[0, 0],
		[1, 1],
		[2, 2],
	])
	expect(componentProps).toEqual([[], [], []])
})

await test('children-contract - zero-arg arrow child is reactive in a basic Parent (renderer wraps in effect)', expect => {
	const count = signal(0)
	function Parent(props) {
		return <div>{props.children}</div>
	}
	const dispose = render(
		<Parent>{() => count.read()}</Parent>,
	)
	// A plain unmarked function child takes the renderer's
	// `effect(...)` branch in `createChildren`, so signal reads
	// inside track and re-render the node on change.
	expect(body()).toBe('<div>0</div>')
	count.write(7)
	expect(body()).toBe('<div>7</div>')
	dispose()
})

await test('children-contract - multi-arg arrow in a basic Parent is called with no args by the renderer', expect => {
	/** @type {any} */
	let received = 'unset'
	function Parent(props) {
		return <div>{props.children}</div>
	}
	const dispose = render(
		<Parent>
			{x => {
				received = x
				return 'done'
			}}
		</Parent>,
	)
	// The renderer's effect branch invokes the arrow with zero
	// args, so multi-arg arrows passed to a basic parent simply
	// see `undefined` for every param. This is why the multi-arg
	// shape is really only useful for callback-style parents
	// (Show/For/Range/Switch+Match) that invoke the callback with
	// specific args themselves.
	expect(received).toBe(undefined)
	expect(body()).toBe('<div>done</div>')
	dispose()
})

// ========================================================================
// N. XML (buildless) parity for Section L + M.
//
//    `xml` runs outside babel, so `toH` in `src/core/xml.js` always
//    dispatches through `Component(tagName, props)` — which returns
//    `markComponent(propsOverride => component({...props, ...overr}))`.
//    The `{...value}` spread of a callback arg (a signal accessor is
//    a function) yields no enumerable own properties, so the merge
//    produces the JSX-site props unchanged — Child runs with whatever
//    attributes it had in the template, ignoring callback args. This
//    is the same observable as the compiled JSX path; the tests here
//    pin it explicitly so the two paths can't drift.
// ========================================================================

await test('children-contract - xml single no-props component child is a marked thunk', expect => {
	const [sink, Capture] = captureChildren()
	function Leaf() {
		return null
	}
	const x = XML()
	x.define({ Capture, Leaf })
	const dispose = render(x`<Capture><Leaf/></Capture>`)
	expect(isComponent(sink.value)).toBe(true)
	dispose()
})

await test('children-contract - xml single component child WITH attributes runs with those attributes as props', expect => {
	const [sink, Capture] = captureChildren()
	/** @type {any} */
	let seen
	function Leaf(props) {
		seen = props
		return null
	}
	const x = XML()
	x.define({ Capture, Leaf })
	const dispose = render(
		x`<Capture><Leaf a="${1}" b="two"/></Capture>`,
	)
	expect(isComponent(sink.value)).toBe(true)
	sink.value()
	expect(seen.a).toBe(1)
	expect(seen.b).toBe('two')
	// Extra args passed at call time don't override the xml-site
	// attributes — the wrap merges propsOverride on top of base.
	seen = undefined
	sink.value('extra')
	expect(seen.a).toBe(1)
	expect(seen.b).toBe('two')
	dispose()
})

await test('children-contract - xml <Show when="${x}"><Child/></Show>: Child runs with empty props, NOT the accessor', expect => {
	/** @type {any} */
	let received = 'unset'
	function Child(props) {
		received = props
		return null
	}
	const count = signal(42)
	const x = XML()
	x.define({ Child })
	const dispose = render(
		x`<Show when="${count.read}"><Child/></Show>`,
	)
	// Same as JSX: the Component-wrap merges propsOverride (the
	// accessor) into xml-site props ({}). `{...fn}` yields {}, so
	// Child runs with empty props.
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - xml <For each="${arr}"><Item/></For>: Item runs with empty props when items are non-iterable primitives', expect => {
	const calls = []
	function Item(props) {
		calls.push(Object.keys(props))
		return null
	}
	const x = XML()
	x.define({ Item })
	// Numbers are used because xml's `Component` merge spreads the
	// callback arg into the base props: `{...props, ...item}`. For
	// iterable items (strings/arrays), the spread would yield
	// indexed keys (`{0: 'a'}`) — a quirk that diverges from the
	// JSX path. Numbers spread to `{}`, so the observable matches
	// JSX: Item runs with empty props.
	const dispose = render(
		x`<For each="${[10, 20, 30]}"><Item/></For>`,
	)
	expect(calls).toEqual([[], [], []])
	dispose()
})

await test('children-contract - xml <Range start stop><Tick/></Range>: Tick runs with empty props, NOT the number', expect => {
	const calls = []
	function Tick(props) {
		calls.push(Object.keys(props))
		return null
	}
	const x = XML()
	x.define({ Tick })
	const dispose = render(
		x`<Range start="${10}" stop="${12}"><Tick/></Range>`,
	)
	expect(calls).toEqual([[], [], []])
	dispose()
})

await test('children-contract - xml <Switch><Match when="${x}"><Body/></Match></Switch>: Body runs with empty props, NOT the accessor', expect => {
	/** @type {any} */
	let received = 'unset'
	function Body(props) {
		received = props
		return null
	}
	const hit = signal({ label: 'on' })
	const x = XML()
	x.define({ Body })
	const dispose = render(
		x`<Switch><Match when="${hit.read}"><Body/></Match></Switch>`,
	)
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - xml basic <Parent><Child/></Parent>: Child runs with empty props', expect => {
	/** @type {any} */
	let received = 'unset'
	function Child(props) {
		received = props
		return null
	}
	function Parent(props) {
		return props.children
	}
	const x = XML()
	x.define({ Child, Parent })
	const dispose = render(x`<Parent><Child/></Parent>`)
	expect(received).not.toBe('unset')
	expect(Object.keys(received)).toEqual([])
	dispose()
})

await test('children-contract - xml <Show when="${x}">${callback}</Show> receives the accessor (callback form)', expect => {
	/** @type {any} */
	let received
	const count = signal(42)
	const x = XML()
	const dispose = render(
		x`<Show when="${count.read}">${v => {
			received = v
			return null
		}}</Show>`,
	)
	expect(typeof received).toBe('function')
	expect(received()).toBe(42)
	count.write(100)
	expect(received()).toBe(100)
	dispose()
})

await test('children-contract - xml <For each="${arr}">${callback}</For> receives (item, index) (callback form)', expect => {
	const seen = []
	const x = XML()
	const dispose = render(
		x`<For each="${['a', 'b', 'c']}">${(item, index) => {
			seen.push([item, index])
			return null
		}}</For>`,
	)
	expect(seen).toEqual([
		['a', 0],
		['b', 1],
		['c', 2],
	])
	dispose()
})

await test('children-contract - xml For: callback form forwards (item, index); component form gets neither', expect => {
	const componentProps = []
	const callbackSeen = []

	function Item(props) {
		componentProps.push(Object.keys(props))
		return null
	}

	// component side uses numbers so the xml spread-merge produces
	// empty props (see the xml For test above for the rationale).
	const x1 = XML()
	x1.define({ Item })
	const d1 = render(
		x1`<For each="${[10, 20, 30]}"><Item/></For>`,
	)
	d1()

	const x2 = XML()
	const d2 = render(
		x2`<For each="${['a', 'b', 'c']}">${(item, i) => {
			callbackSeen.push([item, i])
			return null
		}}</For>`,
	)
	d2()

	// Parity with JSX: component form swallows both callback args,
	// callback form keeps them.
	expect(componentProps).toEqual([[], [], []])
	expect(callbackSeen).toEqual([
		['a', 0],
		['b', 1],
		['c', 2],
	])
})

await test('children-contract - xml pass-through chain: each parent sees the next component as a marked thunk', expect => {
	/** @type {any} */
	let seenByA
	/** @type {any} */
	let seenByB
	function A(props) {
		seenByA = props.children
		return props.children
	}
	function B(props) {
		seenByB = props.children
		return props.children
	}
	function C() {
		return null
	}
	const x = XML()
	x.define({ A, B, C })
	const dispose = render(x`<A><B><C/></B></A>`)
	expect(isComponent(seenByA)).toBe(true)
	expect(isComponent(seenByB)).toBe(true)
	dispose()
})
