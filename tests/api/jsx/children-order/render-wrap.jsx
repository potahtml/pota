/** @jsxImportSource pota */

// Tests that lock the contract `render()` must satisfy before, during,
// and after the "createComponent = Factory" refactor lands.
//
// The refactor makes `<X/>` evaluate eagerly at its JSX site. Without
// a compensating change, `render(<App/>)` would run App *before* the
// render call, so App's signals/effects/cleanups would be orphaned —
// they'd belong to whatever scope evaluated the JSX, not to render's
// own `root(dispose => …)`.
//
// The planned mitigation is a babel preset pass that wraps the first
// argument of `render(…)` in an arrow, i.e.
//
//     render(<App/>, parent)    //   source
//     render(() => <App/>, parent)  //   emitted
//
// Only `render` is rewritten — `insert` is always called inside a
// user-managed `root()` (see tests/api/dom/render.jsx), and `toHTML`
// returns detached DOM and doesn't own reactive state.
//
// Every test in this file must pass:
//   1. today, on the current lazy-createComponent behavior, and
//   2. after the refactor + compile wrap, on the eager-component
//      behavior where the wrap keeps App inside render's root.
//
// A test here that breaks after the refactor means the compile wrap
// slipped (missing a call form, wrong callee detection, etc.) — that
// is the whole point of this file.

import { $, body, test } from '#test'

import {
	cleanup,
	context,
	effect,
	insert,
	memo,
	render,
	root,
	signal,
} from 'pota'

// ========================================================================
// A. render(<X/>) — App runs inside render's root, not before
// ========================================================================

await test('render-wrap - render(<App/>) does not execute App before render is called', expect => {
	let ran = 0
	function App() {
		ran++
		return null
	}
	// lock the sequence: no App call until render() descends.
	const before = ran
	const dispose = render(<App />)
	const after = ran
	expect(before).toBe(0)
	expect(after).toBe(1)
	dispose()
})

await test('render-wrap - render(<App/>): effect in App is owned by render root (cleans on dispose)', expect => {
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

await test('render-wrap - render(<App/>): App-owned effect re-runs on signal write and cleans on dispose', expect => {
	const seen = []
	const cleaned = []
	const count = signal(0)
	function App() {
		effect(() => {
			const v = count.read()
			seen.push(v)
			cleanup(() => cleaned.push(v))
		})
		return null
	}
	const dispose = render(<App />)
	expect(seen).toEqual([0])
	count.write(1)
	expect(seen).toEqual([0, 1])
	expect(cleaned).toEqual([0])
	dispose()
	expect(cleaned).toEqual([0, 1])
	// after dispose, further writes do not re-run the App effect
	count.write(2)
	expect(seen).toEqual([0, 1])
})

await test('render-wrap - render(<App/>): context.Provider inside App scopes its subtree', expect => {
	const Theme = context('light')
	let seen
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

await test('render-wrap - render(<App/>): cleanup registered by App fires during dispose', expect => {
	let disposed = false
	function App() {
		cleanup(() => {
			disposed = true
		})
		return null
	}
	const dispose = render(<App />)
	expect(disposed).toBe(false)
	dispose()
	expect(disposed).toBe(true)
})

await test('render-wrap - render(<App/>): memo in App stops reacting after dispose', expect => {
	const reads = []
	const count = signal(1)
	function App() {
		const doubled = memo(() => count.read() * 2)
		effect(() => reads.push(doubled()))
		return null
	}
	const dispose = render(<App />)
	expect(reads).toEqual([2])
	count.write(3)
	expect(reads).toEqual([2, 6])
	dispose()
	count.write(5)
	expect(reads).toEqual([2, 6])
})

// ========================================================================
// B. render(<X/>) parity with render(() => <X/>)
// ========================================================================

await test('render-wrap - function form: render(() => <App/>) runs App inside root (same as JSX form)', expect => {
	const runs = { setup: 0, cleanup: 0 }
	function App() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return null
	}
	const dispose = render(() => <App />)
	expect(runs.setup).toBe(1)
	dispose()
	expect(runs.cleanup).toBe(1)
})

await test('render-wrap - parity: <App/> and () => <App/> produce identical reactive lifecycles', expect => {
	const track = () => {
		const runs = { setup: 0, cleanup: 0 }
		function App() {
			effect(() => {
				runs.setup++
				cleanup(() => runs.cleanup++)
			})
			return null
		}
		return { runs, App }
	}

	const a = track()
	const disposeA = render(<a.App />)
	disposeA()

	const b = track()
	const disposeB = render(() => <b.App />)
	disposeB()

	expect(a.runs).toEqual(b.runs)
	expect(a.runs.setup).toBe(1)
	expect(a.runs.cleanup).toBe(1)
})

// ========================================================================
// C. render with various argument forms that must keep working
// ========================================================================

await test('render-wrap - render(<fragment>…</fragment>) runs children in root', expect => {
	const runs = { setup: 0, cleanup: 0 }
	function A() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return <p>a</p>
	}
	const dispose = render(
		<>
			<A />
			<p>b</p>
		</>,
	)
	expect(runs.setup).toBe(1)
	expect(body()).toBe('<p>a</p><p>b</p>')
	dispose()
	expect(runs.cleanup).toBe(1)
})

await test('render-wrap - render(<div>{signal.read}</div>): reactive text owned by render root', expect => {
	const count = signal(0)
	const dispose = render(<div>{count.read}</div>)
	expect(body()).toBe('<div>0</div>')
	count.write(7)
	expect(body()).toBe('<div>7</div>')
	dispose()
	// after dispose, further writes do not blow up or produce DOM
	count.write(9)
	expect(body()).toBe('')
})

await test('render-wrap - render(array of components) runs each inside root', expect => {
	const runs = []
	function mk(name) {
		return () => {
			effect(() => {
				runs.push('setup:' + name)
				cleanup(() => runs.push('cleanup:' + name))
			})
			return <p>{name}</p>
		}
	}
	const A = mk('a')
	const B = mk('b')
	const dispose = render([<A />, <B />])
	expect(runs).toEqual(['setup:a', 'setup:b'])
	dispose()
	// cleanup order is reverse of setup
	expect(runs).toEqual([
		'setup:a',
		'setup:b',
		'cleanup:b',
		'cleanup:a',
	])
})

await test('render-wrap - render("text") renders a text node and dispose clears it', expect => {
	const dispose = render('hello')
	expect(body()).toBe('hello')
	dispose()
	expect(body()).toBe('')
})

await test('render-wrap - render(42) renders a number as text', expect => {
	const dispose = render(42)
	expect(body()).toBe('42')
	dispose()
})

await test('render-wrap - render(null) mounts nothing and returns a working dispose', expect => {
	const dispose = render(null)
	expect(body()).toBe('')
	expect(typeof dispose).toBe('function')
	dispose()
})

await test('render-wrap - render(undefined) mounts nothing and returns a working dispose', expect => {
	const dispose = render(undefined)
	expect(body()).toBe('')
	dispose()
})

await test('render-wrap - render(domNode) mounts an existing DOM node', expect => {
	const node = document.createElement('p')
	node.textContent = 'bare'
	const dispose = render(node)
	expect(body()).toBe('<p>bare</p>')
	dispose()
	expect(body()).toBe('')
})

// ========================================================================
// D. render with parent / options still pipes through correctly
// ========================================================================

await test('render-wrap - render(<App/>, parent) scopes App inside root and mounts to parent', expect => {
	const parent = document.createElement('section')
	document.body.appendChild(parent)

	const runs = { setup: 0, cleanup: 0 }
	function App() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return <p>in-parent</p>
	}

	const dispose = render(<App />, parent)
	expect(runs.setup).toBe(1)
	expect(parent.innerHTML).toBe('<p>in-parent</p>')
	dispose()
	expect(runs.cleanup).toBe(1)
	expect(parent.innerHTML).toBe('')
	parent.remove()
})

await test('render-wrap - render(<App/>, parent, { clear: true }) clears then scopes', expect => {
	const parent = document.createElement('section')
	parent.innerHTML = '<span>old</span>'
	document.body.appendChild(parent)

	let ran = 0
	function App() {
		ran++
		return <p>new</p>
	}

	const dispose = render(<App />, parent, { clear: true })
	expect(ran).toBe(1)
	expect(parent.innerHTML).toBe('<p>new</p>')
	dispose()
	parent.remove()
})

// ========================================================================
// E. Multiple concurrent renders stay isolated
// ========================================================================

await test('render-wrap - two independent render(<App/>) calls each own their effects', expect => {
	const a = { setup: 0, cleanup: 0 }
	const b = { setup: 0, cleanup: 0 }
	const parentA = document.createElement('div')
	const parentB = document.createElement('div')
	document.body.append(parentA, parentB)

	function A() {
		effect(() => {
			a.setup++
			cleanup(() => a.cleanup++)
		})
		return <p>a</p>
	}
	function B() {
		effect(() => {
			b.setup++
			cleanup(() => b.cleanup++)
		})
		return <p>b</p>
	}

	const disposeA = render(<A />, parentA)
	const disposeB = render(<B />, parentB)
	expect(a.setup).toBe(1)
	expect(b.setup).toBe(1)

	disposeA()
	expect(a.cleanup).toBe(1)
	expect(b.cleanup).toBe(0)

	disposeB()
	expect(b.cleanup).toBe(1)

	parentA.remove()
	parentB.remove()
})

// ========================================================================
// F. insert / toHTML are NOT in scope for the compile wrap
// ========================================================================

await test('render-wrap - insert inside a user-managed root keeps the user owning the scope', expect => {
	const runs = { setup: 0, cleanup: 0 }
	function App() {
		effect(() => {
			runs.setup++
			cleanup(() => runs.cleanup++)
		})
		return <p>inserted</p>
	}
	const parent = document.createElement('div')

	// this is the documented insert pattern: caller owns the root
	const dispose = root(dispose => {
		insert(<App />, parent)
		return dispose
	})

	expect(runs.setup).toBe(1)
	expect(parent.innerHTML).toBe('<p>inserted</p>')
	dispose()
	expect(runs.cleanup).toBe(1)
})

// ========================================================================
// G. Compile-wrap observability: the JSX arg must NOT evaluate App
//    before render() is called, under either direct JSX form or a
//    sequence that a naive "just pass it through" refactor would leak.
// ========================================================================

await test('render-wrap - nested JSX inside render does not run any component body before render', expect => {
	const order = []
	function A(props) {
		order.push('a')
		return props.children
	}
	function B(props) {
		order.push('b')
		return props.children
	}
	function C() {
		order.push('c')
		return null
	}

	// `<A><B><C/></B></A>` at the variable-assignment site stays
	// lazy because `createComponent` returns a marked thunk per
	// use-site. Nothing runs until render descends into the outer
	// thunk; then A, B, C run in order.
	const tree = (
		<A>
			<B>
				<C />
			</B>
		</A>
	)

	expect(order).toEqual([])
	const dispose = render(tree)
	expect(order).toEqual(['a', 'b', 'c'])
	dispose()
})

await test('render-wrap - render(<A><B/></A>): inline JSX also stays dormant until render runs', expect => {
	const order = []
	function A(props) {
		order.push('a')
		return props.children
	}
	function B() {
		order.push('b')
		return null
	}
	// inline form — this is the form the babel compile wrap targets.
	// Under both current (lazy createComponent) and the refactor
	// (eager createComponent + wrapped render arg), the observable
	// must be: nothing ran before render, A then B ran inside it.
	const before = [...order]
	const dispose = render(
		<A>
			<B />
		</A>,
	)
	const after = [...order]

	expect(before).toEqual([])
	expect(after).toEqual(['a', 'b'])
	dispose()
})
