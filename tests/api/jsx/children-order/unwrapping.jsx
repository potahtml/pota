/** @jsxImportSource pota */

// Tests for pota's component execution order contract.
//
// In pota every component is a function and every JSX child is
// passed to its parent as a function (or an array of functions).
// Those child functions do not run until the parent yields to them
// — either by returning `props.children` or by passing `children`
// into something the renderer later descends into. This is the
// reverse of React, where children render first and parents wrap
// the resulting tree.
//
// Contract under test:
//
// 1. For every parent component, the parent's function body begins
//    executing strictly before any of its direct child components
//    begin executing.
// 2. When a parent does not render a child (Show false, For empty,
//    Switch without a match, a user component that ignores
//    children, …) the child component function must NOT execute.
//    i.e. children are never "prematurely unwrapped".
// 3. Sibling children execute in source order.
// 4. The compiled JSX path and the buildless `xml` tagged-template
//    path share the same ordering semantics.
//
// Every JSX test has an `xml` counterpart so any divergence between
// the compiled and buildless runtimes is caught here. Built-in
// components are exercised individually: Show, For, Switch + Match,
// Dynamic, Portal, Head, Suspense (sync path), Errored (no throw),
// Collapse, Range, Normalize, Tabs. Route / A / Navigate / load are
// skipped — they need a location context — and `CustomElement` is a
// class base, not a component with children semantics.

import { test, body } from '#test'

import { render } from 'pota'
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

// A traced component: pushes `name` into `log` when its function
// body runs, then yields back to children so the renderer keeps
// descending. Returned value is `props.children` so nested markers
// can log their own entries.
function trace(log, name) {
	return props => {
		log.push(name)
		return props?.children
	}
}

// Like trace but emits a DOM element around children so tests can
// also assert DOM output (used when we care about mounted shape,
// not just order).
function traceEl(log, name) {
	return props => {
		log.push(name)
		return <span data-name={name}>{props?.children}</span>
	}
}

// --- Section A: baseline parent-first order (JSX) ----------------------

await test('unwrapping - parent runs before its single child (JSX)', expect => {
	const log = []
	const Parent = trace(log, 'parent')
	const Child = trace(log, 'child')

	const dispose = render(
		<Parent>
			<Child />
		</Parent>,
	)

	expect(log).toEqual(['parent', 'child'])

	dispose()
})

await test('unwrapping - multiple direct children run in source order after parent (JSX)', expect => {
	const log = []
	const Parent = trace(log, 'parent')
	const A = trace(log, 'a')
	const B = trace(log, 'b')
	const C = trace(log, 'c')

	const dispose = render(
		<Parent>
			<A />
			<B />
			<C />
		</Parent>,
	)

	expect(log).toEqual(['parent', 'a', 'b', 'c'])

	dispose()
})

await test('unwrapping - three-level nesting runs outermost to innermost (JSX)', expect => {
	const log = []
	const Grand = trace(log, 'grand')
	const Parent = trace(log, 'parent')
	const Child = trace(log, 'child')

	const dispose = render(
		<Grand>
			<Parent>
				<Child />
			</Parent>
		</Grand>,
	)

	expect(log).toEqual(['grand', 'parent', 'child'])

	dispose()
})

await test('unwrapping - fragment does not break parent-first order (JSX)', expect => {
	const log = []
	const Parent = trace(log, 'parent')
	const A = trace(log, 'a')
	const B = trace(log, 'b')

	const dispose = render(
		<Parent>
			<>
				<A />
				<B />
			</>
		</Parent>,
	)

	expect(log).toEqual(['parent', 'a', 'b'])

	dispose()
})

await test('unwrapping - sibling parents run in source order, each before its own child (JSX)', expect => {
	const log = []
	const P1 = trace(log, 'p1')
	const P2 = trace(log, 'p2')
	const C1 = trace(log, 'c1')
	const C2 = trace(log, 'c2')

	const dispose = render(
		<>
			<P1>
				<C1 />
			</P1>
			<P2>
				<C2 />
			</P2>
		</>,
	)

	expect(log).toEqual(['p1', 'c1', 'p2', 'c2'])

	dispose()
})

await test('unwrapping - intrinsic (string) children are also deferred until the parent runs (JSX)', expect => {
	const log = []
	const Parent = trace(log, 'parent')
	const Child = traceEl(log, 'child')

	const dispose = render(
		<Parent>
			<div>
				<Child />
			</div>
		</Parent>,
	)

	// parent runs, then the <div> tag instantiates, then Child inside
	expect(log).toEqual(['parent', 'child'])
	expect(body()).toBe('<div><span data-name="child"></span></div>')

	dispose()
})

// --- Section A mirror: baseline parent-first order (xml) ---------------

await test('unwrapping - parent runs before its single child (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Parent: trace(log, 'parent'),
		Child: trace(log, 'child'),
	})

	const dispose = render(x`<Parent><Child/></Parent>`)

	expect(log).toEqual(['parent', 'child'])

	dispose()
})

await test('unwrapping - multiple direct children run in source order after parent (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Parent: trace(log, 'parent'),
		A: trace(log, 'a'),
		B: trace(log, 'b'),
		C: trace(log, 'c'),
	})

	const dispose = render(x`<Parent><A/><B/><C/></Parent>`)

	expect(log).toEqual(['parent', 'a', 'b', 'c'])

	dispose()
})

await test('unwrapping - three-level nesting runs outermost to innermost (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Grand: trace(log, 'grand'),
		Parent: trace(log, 'parent'),
		Child: trace(log, 'child'),
	})

	const dispose = render(
		x`<Grand><Parent><Child/></Parent></Grand>`,
	)

	expect(log).toEqual(['grand', 'parent', 'child'])

	dispose()
})

await test('unwrapping - sibling parents run in source order, each before its own child (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		P1: trace(log, 'p1'),
		P2: trace(log, 'p2'),
		C1: trace(log, 'c1'),
		C2: trace(log, 'c2'),
	})

	const dispose = render(x`<P1><C1/></P1><P2><C2/></P2>`)

	expect(log).toEqual(['p1', 'c1', 'p2', 'c2'])

	dispose()
})

await test('unwrapping - intrinsic (string) children are also deferred until the parent runs (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Parent: trace(log, 'parent'),
		Child: traceEl(log, 'child'),
	})

	const dispose = render(x`<Parent><div><Child/></div></Parent>`)

	expect(log).toEqual(['parent', 'child'])
	expect(body()).toBe('<div><span data-name="child"></span></div>')

	dispose()
})

// --- Section B: children that the parent drops never execute -----------

await test('unwrapping - a parent that ignores props.children never runs the child (JSX)', expect => {
	const log = []
	const Drop = props => {
		log.push('drop')
		return null
	}
	const Child = trace(log, 'child')

	const dispose = render(
		<Drop>
			<Child />
		</Drop>,
	)

	expect(log).toEqual(['drop'])

	dispose()
})

await test('unwrapping - a parent that ignores props.children never runs the child (xml)', expect => {
	const log = []
	const x = XML()
	const Drop = props => {
		log.push('drop')
		return null
	}
	x.define({ Drop, Child: trace(log, 'child') })

	const dispose = render(x`<Drop><Child/></Drop>`)

	expect(log).toEqual(['drop'])

	dispose()
})

await test('unwrapping - children deep inside a dropped subtree also never run (JSX)', expect => {
	const log = []
	const Drop = props => {
		log.push('drop')
		return null
	}
	const Middle = trace(log, 'middle')
	const Leaf = trace(log, 'leaf')

	const dispose = render(
		<Drop>
			<Middle>
				<Leaf />
			</Middle>
		</Drop>,
	)

	expect(log).toEqual(['drop'])

	dispose()
})

await test('unwrapping - children deep inside a dropped subtree also never run (xml)', expect => {
	const log = []
	const x = XML()
	const Drop = props => {
		log.push('drop')
		return null
	}
	x.define({
		Drop,
		Middle: trace(log, 'middle'),
		Leaf: trace(log, 'leaf'),
	})

	const dispose = render(
		x`<Drop><Middle><Leaf/></Middle></Drop>`,
	)

	expect(log).toEqual(['drop'])

	dispose()
})

// --- Section C: built-in components — parent-first + gated children ----

// Show

await test('unwrapping - Show runs its child only when when=true (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const Child = trace(log, 'child')

	const dispose = render(
		<Outer>
			<Show when={true}>
				<Child />
			</Show>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'child'])

	dispose()
})

await test('unwrapping - Show with when=false never runs the child (JSX)', expect => {
	const log = []
	const Child = trace(log, 'child')

	const dispose = render(
		<Show when={false}>
			<Child />
		</Show>,
	)

	expect(log).toEqual([])

	dispose()
})

await test('unwrapping - Show runs its child only when when=true (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		Child: trace(log, 'child'),
	})

	const dispose = render(
		x`<Outer><Show when="${true}"><Child/></Show></Outer>`,
	)

	expect(log).toEqual(['outer', 'child'])

	dispose()
})

await test('unwrapping - Show with when=false never runs the child (xml)', expect => {
	const log = []
	const x = XML()
	x.define({ Child: trace(log, 'child') })

	const dispose = render(
		x`<Show when="${false}"><Child/></Show>`,
	)

	expect(log).toEqual([])

	dispose()
})

// For

await test('unwrapping - For runs the item callback once per item, after the parent (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')

	const dispose = render(
		<Outer>
			<For each={[1, 2, 3]}>
				{item => {
					log.push('item:' + item)
					return <span>{item}</span>
				}}
			</For>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'item:1', 'item:2', 'item:3'])

	dispose()
})

await test('unwrapping - For with an empty array never runs the item callback (JSX)', expect => {
	const log = []

	const dispose = render(
		<For each={[]}>
			{item => {
				log.push('item:' + item)
				return <span>{item}</span>
			}}
		</For>,
	)

	expect(log).toEqual([])

	dispose()
})

await test('unwrapping - For runs the item callback once per item, after the parent (xml)', expect => {
	const log = []
	const x = XML()
	x.define({ Outer: trace(log, 'outer') })

	const dispose = render(
		x`<Outer><For each="${[1, 2, 3]}">${item => {
			log.push('item:' + item)
			return x`<span>${item}</span>`
		}}</For></Outer>`,
	)

	expect(log).toEqual(['outer', 'item:1', 'item:2', 'item:3'])

	dispose()
})

await test('unwrapping - For with an empty array never runs the item callback (xml)', expect => {
	const log = []
	const x = XML()

	const dispose = render(
		x`<For each="${[]}">${item => {
			log.push('item:' + item)
			return x`<span>${item}</span>`
		}}</For>`,
	)

	expect(log).toEqual([])

	dispose()
})

// Switch + Match

await test('unwrapping - Switch runs only the winning Match child (JSX)', expect => {
	const log = []
	const First = trace(log, 'first')
	const Second = trace(log, 'second')
	const Third = trace(log, 'third')

	const dispose = render(
		<Switch>
			<Match when={false}>
				<First />
			</Match>
			<Match when={true}>
				<Second />
			</Match>
			<Match when={true}>
				<Third />
			</Match>
		</Switch>,
	)

	// only the first truthy Match wins → only its child runs
	expect(log).toEqual(['second'])

	dispose()
})

await test('unwrapping - Switch with no matching Match runs no child (JSX)', expect => {
	const log = []
	const A = trace(log, 'a')
	const B = trace(log, 'b')

	const dispose = render(
		<Switch>
			<Match when={false}>
				<A />
			</Match>
			<Match when={false}>
				<B />
			</Match>
		</Switch>,
	)

	expect(log).toEqual([])

	dispose()
})

await test('unwrapping - Switch runs only the winning Match child (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		First: trace(log, 'first'),
		Second: trace(log, 'second'),
		Third: trace(log, 'third'),
	})

	const dispose = render(
		x`<Switch>
			<Match when="${false}"><First/></Match>
			<Match when="${true}"><Second/></Match>
			<Match when="${true}"><Third/></Match>
		</Switch>`,
	)

	expect(log).toEqual(['second'])

	dispose()
})

await test('unwrapping - Switch with no matching Match runs no child (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		A: trace(log, 'a'),
		B: trace(log, 'b'),
	})

	const dispose = render(
		x`<Switch>
			<Match when="${false}"><A/></Match>
			<Match when="${false}"><B/></Match>
		</Switch>`,
	)

	expect(log).toEqual([])

	dispose()
})

// Dynamic

await test('unwrapping - Dynamic runs the dynamic component after the parent, before the child (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const Inner = trace(log, 'inner')
	const Child = trace(log, 'child')

	const dispose = render(
		<Outer>
			<Dynamic component={Inner}>
				<Child />
			</Dynamic>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'inner', 'child'])

	dispose()
})

await test('unwrapping - Dynamic runs the dynamic component after the parent, before the child (xml)', expect => {
	const log = []
	const x = XML()
	const Inner = trace(log, 'inner')
	x.define({
		Outer: trace(log, 'outer'),
		Child: trace(log, 'child'),
	})

	const dispose = render(
		x`<Outer><Dynamic component="${Inner}"><Child/></Dynamic></Outer>`,
	)

	expect(log).toEqual(['outer', 'inner', 'child'])

	dispose()
})

// Portal

await test('unwrapping - Portal runs parent first, then the child inside the mount (JSX)', expect => {
	const log = []
	const mount = document.createElement('div')
	const Outer = trace(log, 'outer')
	const Child = traceEl(log, 'child')

	const dispose = render(
		<Outer>
			<Portal mount={mount}>
				<Child />
			</Portal>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'child'])
	expect(mount.innerHTML).toBe('<span data-name="child"></span>')

	dispose()
})

await test('unwrapping - Portal runs parent first, then the child inside the mount (xml)', expect => {
	const log = []
	const mount = document.createElement('div')
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		Child: traceEl(log, 'child'),
	})

	const dispose = render(
		x`<Outer><Portal mount="${mount}"><Child/></Portal></Outer>`,
	)

	expect(log).toEqual(['outer', 'child'])
	expect(mount.innerHTML).toBe('<span data-name="child"></span>')

	dispose()
})

// Head

await test('unwrapping - Head runs parent first, then children inside document.head (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const Child = trace(log, 'child')

	const dispose = render(
		<Outer>
			<Head>
				<Child />
				<meta name="unwrap-test" />
			</Head>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'child'])
	expect(
		document.head.querySelector('meta[name="unwrap-test"]'),
	).not.toBe(null)

	dispose()

	// Head portals into document.head, so disposal must remove it
	// for the test runner's head-cleanliness check to pass.
	expect(
		document.head.querySelector('meta[name="unwrap-test"]'),
	).toBe(null)
})

await test('unwrapping - Head runs parent first, then children inside document.head (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		Child: trace(log, 'child'),
	})

	const dispose = render(
		x`<Outer><Head><Child/><meta name="unwrap-test-xml"/></Head></Outer>`,
	)

	expect(log).toEqual(['outer', 'child'])
	expect(
		document.head.querySelector('meta[name="unwrap-test-xml"]'),
	).not.toBe(null)

	dispose()

	expect(
		document.head.querySelector('meta[name="unwrap-test-xml"]'),
	).toBe(null)
})

// Suspense (sync path — no promises in children)

await test('unwrapping - Suspense runs non-async children after parent (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const Child = trace(log, 'child')

	const dispose = render(
		<Outer>
			<Suspense fallback={<p>loading</p>}>
				<Child />
			</Suspense>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'child'])

	dispose()
})

await test('unwrapping - Suspense runs non-async children after parent (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		Child: trace(log, 'child'),
	})

	const dispose = render(
		x`<Outer><Suspense fallback="loading"><Child/></Suspense></Outer>`,
	)

	expect(log).toEqual(['outer', 'child'])

	dispose()
})

// Errored (no throw)

await test('unwrapping - Errored runs children in order when nothing throws (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const A = trace(log, 'a')
	const B = trace(log, 'b')

	const dispose = render(
		<Outer>
			<Errored>
				<A />
				<B />
			</Errored>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'a', 'b'])

	dispose()
})

await test('unwrapping - Errored runs children in order when nothing throws (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		A: trace(log, 'a'),
		B: trace(log, 'b'),
	})

	const dispose = render(
		x`<Outer><Errored><A/><B/></Errored></Outer>`,
	)

	expect(log).toEqual(['outer', 'a', 'b'])

	dispose()
})

// Collapse

await test('unwrapping - Collapse runs its child in both when=true and when=false (JSX)', expect => {
	const log = []
	const Child = trace(log, 'child')

	const dispose = render(
		<Collapse when={true}>
			<Child />
		</Collapse>,
	)

	// Collapse keeps the child mounted and just toggles display,
	// so the child's function body runs regardless of `when`.
	expect(log).toEqual(['child'])

	dispose()

	const log2 = []
	const Child2 = trace(log2, 'child')

	const dispose2 = render(
		<Collapse when={false}>
			<Child2 />
		</Collapse>,
	)

	expect(log2).toEqual(['child'])

	dispose2()
})

await test('unwrapping - Collapse runs its child in both when=true and when=false (xml)', expect => {
	const log = []
	const x = XML()
	x.define({ Child: trace(log, 'child') })

	const dispose = render(
		x`<Collapse when="${true}"><Child/></Collapse>`,
	)

	expect(log).toEqual(['child'])

	dispose()

	const log2 = []
	const x2 = XML()
	x2.define({ Child: trace(log2, 'child') })

	const dispose2 = render(
		x2`<Collapse when="${false}"><Child/></Collapse>`,
	)

	expect(log2).toEqual(['child'])

	dispose2()
})

// Range

await test('unwrapping - Range runs the item callback once per index, after the parent (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')

	const dispose = render(
		<Outer>
			<Range
				start={0}
				stop={2}
			>
				{n => {
					log.push('item:' + n)
					return <span>{n}</span>
				}}
			</Range>
		</Outer>,
	)

	// Range is inclusive of both start and stop, so stop=2 → 0,1,2
	expect(log).toEqual(['outer', 'item:0', 'item:1', 'item:2'])

	dispose()
})

await test('unwrapping - Range runs the item callback once per index, after the parent (xml)', expect => {
	const log = []
	const x = XML()
	x.define({ Outer: trace(log, 'outer') })

	const dispose = render(
		x`<Outer><Range start="${0}" stop="${2}">${n => {
			log.push('item:' + n)
			return x`<span>${n}</span>`
		}}</Range></Outer>`,
	)

	expect(log).toEqual(['outer', 'item:0', 'item:1', 'item:2'])

	dispose()
})

// Normalize

await test('unwrapping - Normalize runs child components before flattening to text (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const A = () => {
		log.push('a')
		return 'a'
	}
	const B = () => {
		log.push('b')
		return 'b'
	}

	const dispose = render(
		<Outer>
			<Normalize>
				<A />
				<B />
			</Normalize>
		</Outer>,
	)

	expect(log).toEqual(['outer', 'a', 'b'])
	expect(body()).toBe('ab')

	dispose()
})

await test('unwrapping - Normalize runs child components before flattening to text (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		A: () => {
			log.push('a')
			return 'a'
		},
		B: () => {
			log.push('b')
			return 'b'
		},
	})

	const dispose = render(
		x`<Outer><Normalize><A/><B/></Normalize></Outer>`,
	)

	expect(log).toEqual(['outer', 'a', 'b'])
	expect(body()).toBe('ab')

	dispose()
})

// Tabs (top-level only — Tabs.Labels/Panels are their own components
// with their own semantics and are out of scope here)

await test('unwrapping - Tabs runs its outer function before its child subtree (JSX)', expect => {
	const log = []
	const Outer = trace(log, 'outer')
	const Child = trace(log, 'child')

	const dispose = render(
		<Outer>
			<Tabs>
				<Tabs.Labels>
					<Tabs.Label>
						<Child />
					</Tabs.Label>
				</Tabs.Labels>
				<Tabs.Panels>
					<Tabs.Panel>panel</Tabs.Panel>
				</Tabs.Panels>
			</Tabs>
		</Outer>,
	)

	// Outer runs, then descends into Tabs, then Labels, then Label's
	// child — so Child is logged after Outer.
	expect(log).toEqual(['outer', 'child'])

	dispose()
})

await test('unwrapping - Tabs runs its outer function before its child subtree (xml)', expect => {
	const log = []
	const x = XML()
	x.define({
		Outer: trace(log, 'outer'),
		Child: trace(log, 'child'),
		// Tabs.* subcomponents need to be registered explicitly on xml
		// since the default registry only exposes `Tabs` itself.
		TabsLabels: Tabs.Labels,
		TabsLabel: Tabs.Label,
		TabsPanels: Tabs.Panels,
		TabsPanel: Tabs.Panel,
	})

	const dispose = render(
		x`<Outer>
			<Tabs>
				<TabsLabels><TabsLabel><Child/></TabsLabel></TabsLabels>
				<TabsPanels><TabsPanel>panel</TabsPanel></TabsPanels>
			</Tabs>
		</Outer>`,
	)

	expect(log).toEqual(['outer', 'child'])

	dispose()
})

// --- Section D: cross-API parity ---------------------------------------

await test('unwrapping - compiled JSX and buildless xml produce the same order log', expect => {
	const jsxLog = []
	const xmlLog = []

	const JsxParent = trace(jsxLog, 'parent')
	const JsxA = trace(jsxLog, 'a')
	const JsxB = trace(jsxLog, 'b')
	const JsxLeaf = trace(jsxLog, 'leaf')

	const disposeJsx = render(
		<JsxParent>
			<JsxA>
				<JsxLeaf />
			</JsxA>
			<JsxB />
		</JsxParent>,
	)
	disposeJsx()

	const x = XML()
	x.define({
		Parent: trace(xmlLog, 'parent'),
		A: trace(xmlLog, 'a'),
		B: trace(xmlLog, 'b'),
		Leaf: trace(xmlLog, 'leaf'),
	})

	const disposeXml = render(
		x`<Parent><A><Leaf/></A><B/></Parent>`,
	)
	disposeXml()

	expect(jsxLog).toEqual(['parent', 'a', 'leaf', 'b'])
	expect(xmlLog).toEqual(jsxLog)
})
