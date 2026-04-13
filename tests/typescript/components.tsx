/** @jsxImportSource pota */

import {
	A,
	Collapse,
	CustomElement,
	customElement,
	Dynamic,
	Errored,
	For,
	Head,
	load,
	Match,
	Navigate,
	Normalize,
	Portal,
	Range,
	Route,
	Show,
	Suspense,
	Switch,
	Tabs,
} from 'pota/components'
import {
	Component,
	Pota,
	context,
	derived,
	memo,
	signal,
} from 'pota'

// Shared user component declarations (duplicated — not shared
// across files intentionally)

const LoginMsg: VoidComponent<{ name?: string }> = ({
	name = 'Guest',
}) => {
	return <p>Logged in as {name}</p>
}

const Card: ParentComponent<{ title: string }> = ({
	title,
	children,
}) => {
	return (
		<section class="cards">
			<h2>{title}</h2>
			{children}
		</section>
	)
}

const Button: Component<ComponentProps<'button'>> = ({
	...allProps
}) => {
	return <button {...allProps} />
}

const Button2: Component<Omit<ComponentProps<'button'>, 'type'>> = ({
	...allProps
}) => {
	return <button type="button" {...allProps} />
}

type MakeRequired<T, K extends keyof T> = Omit<T, K> &
	Required<{ [P in K]: T[P] }>

type ImgProps = MakeRequired<ComponentProps<'img'>, 'alt' | 'src'>

const Img: Component<ImgProps> = ({ alt, ...allProps }) => {
	return <img alt={alt} {...allProps} />
}

class MyComponent extends Pota {
	props = { some: 'lala' }

	ready() {}
	cleanup() {}
	render(props) {
		return (
			<main>
				{props.children} {props.some}
			</main>
		)
	}
}

// -- flow component inference tests --

const [count, setCount] = signal(42)
const items = signal(['a', 'b', 'c'])
const [userName] = signal('Tito')

// Show: callback children infer T from when
const showCallback = (
	<Show when={count}>
		{value => {
			const n: number = value()
			// @ts-expect-error value() is number, not string
			const s: string = value()
			return <span>{n}</span>
		}}
	</Show>
)

// Show: plain JSX children (no callback)
const showPlain = (
	<Show when={count}>
		<div>plain children</div>
	</Show>
)

// Show: fallback
const showFallback = (
	<Show when={count} fallback={<p>nothing</p>}>
		{value => <span>{value()}</span>}
	</Show>
)

// Match: callback children infer T from when
const switchMatch = (
	<Switch>
		<Match when={count}>
			{value => {
				const n: number = value()
				// @ts-expect-error value() is number, not string
				const s: string = value()
				return <span>{n}</span>
			}}
		</Match>
		<Match when={count}>
			<div>plain match</div>
		</Match>
	</Switch>
)

// For: callback infers item type
const forCallback = (
	<For each={['a', 'b', 'c']}>
		{(item, index) => {
			const s: string = item
			const i: number = index
			return (
				<li>
					{s} {i}
				</li>
			)
		}}
	</For>
)

// For: signal accessor as each
const forSignal = (
	<For each={items.read}>{(item, index) => <li>{item}</li>}</For>
)

// For: array children (multiple callbacks + elements)
const forArray = (
	<For each={[1, 2, 3]}>
		{(item, index) => <li>{item}</li>}
		{(item, index) => <span>{item}</span>}
		<p>static</p>
	</For>
)

// Range: n infers as number
const rangeTest = (
	<Range stop={5}>
		{(n, i) => {
			const num: number = n
			return <span>{num}</span>
		}}
	</Range>
)

// context typing
const MyContext = context<{ theme: string; something: boolean }>({
	theme: 'light',
	something: true,
})
const ctx: Context<{ theme: string; something: boolean }> = MyContext

const contextTest = (
	<MyContext.Provider value={{ theme: 'dark' }}>
		<div />
	</MyContext.Provider>
)

// FlowComponent user definition
const MyFor: FlowComponent<
	{ data: string[] },
	Children<(item: string) => JSX.Element>
> = props => {
	return <div />
}

// ComponentType: function or class
const fnOrClass: ComponentType<{ x: number }> = MyComponent
const fnOrClass2: ComponentType<{ x: number }> = (props: {
	x: number
}) => <span>{props.x}</span>

// -- remaining component tests --

// Collapse: show/hide without removing from DOM
const collapseTest = (
	<Collapse when={count} fallback={<p>hidden</p>}>
		<div>visible</div>
	</Collapse>
)

// Errored: error boundary with fallback
const erroredTest = (
	<Errored
		fallback={(err, reset) => <button on:click={reset}>retry</button>}
	>
		<div>might throw</div>
	</Errored>
)

// Errored: plain fallback
const erroredPlain = (
	<Errored fallback={<p>oops</p>}>
		<div>might throw</div>
	</Errored>
)

// Portal: mount children elsewhere
const portalTest = (
	<Portal mount={document.body}>
		<div>portaled</div>
	</Portal>
)

// Suspense: async fallback
const suspenseTest = (
	<Suspense fallback={<p>loading...</p>}>
		<div>loaded</div>
	</Suspense>
)

// Normalize: children as text
const normalizeTest = (
	<Normalize>
		{'hello'} {'world'}
	</Normalize>
)

// Head: mount to document.head
const headTest = (
	<Head>
		<title>page title</title>
		<meta name="description" content="test" />
	</Head>
)

// Navigate
const navigateTest = <Navigate path="/home" />

// Tabs
const tabsTest = (
	<Tabs>
		<Tabs.Labels>
			<Tabs.Label>Tab 1</Tabs.Label>
			<Tabs.Label>Tab 2</Tabs.Label>
		</Tabs.Labels>
		<Tabs.Panels>
			<Tabs.Panel>Content 1</Tabs.Panel>
			<Tabs.Panel>Content 2</Tabs.Panel>
		</Tabs.Panels>
	</Tabs>
)

// Switch with fallback
const switchFallback = (
	<Switch fallback={<p>no match</p>}>
		<Match when={count}>
			<div>matched</div>
		</Match>
	</Switch>
)

// For with fallback
const forFallback = (
	<For each={[] as string[]} fallback={<p>empty list</p>}>
		{item => <li>{item}</li>}
	</For>
)

// Range with start/step
const rangeFullTest = (
	<Range start={0} stop={10} step={2}>
		{(n, i) => (
			<span>
				{n} at {i}
			</span>
		)}
	</Range>
)

// Navigate with extra props
const navigateFullTest = (
	<Navigate
		path="/login"
		scroll={false}
		replace={true}
		params={{ id: '42' }}
	/>
)

// A (route link)
const linkTest = (
	<A href="/about" params={{ slug: 'hello' }}>
		about
	</A>
)

// Route: basic usage
const routeTest = (
	<Route path="/users">
		<div>users page</div>
	</Route>
)

// Route with all props
const routeFullTest = (
	<Route
		path="/user/:id"
		params={{ id: '42' }}
		fallback={<p>not found</p>}
	>
		<div>user page</div>
	</Route>
)

// Route.Default
const routeDefaultTest = (
	<Route.Default>
		<div>404</div>
	</Route.Default>
)

// -- negative tests (expected errors) --

// @ts-expect-error Show: when is required
const showMissingWhen = <Show>content</Show>

// @ts-expect-error For: each is required
const forMissingEach = <For>{item => item}</For>

// @ts-expect-error Portal: mount is required
const portalMissingMount = <Portal>child</Portal>

// @ts-expect-error Navigate: path is required
const navigateMissingPath = <Navigate />

// ============================================
// derived / memo as reactive sources in components
// ============================================

const [age] = signal(30)

// derived: should infer return type
const greeting = derived(() => `Hello, ${userName()}`)
const isAdult = derived(() => age() >= 18)

// memo: should infer return type
const expensiveList = memo(() =>
	Array.from({ length: age() }, (_, i) => `item-${i}`),
)

// derived as Show when — should infer T from derived return
const showDerived = (
	<Show when={greeting}>
		{value => {
			const s: string = value()
			return <span>{s}</span>
		}}
	</Show>
)

// derived as For each
const forDerived = (
	<For each={expensiveList}>
		{(item, index) => {
			const s: string = item
			const i: number = index
			return <li>{s}</li>
		}}
	</For>
)

// memo as Match when
const matchDerived = (
	<Switch>
		<Match when={isAdult}>
			{value => {
				const b: boolean = value()
				return <span>adult: {String(b)}</span>
			}}
		</Match>
	</Switch>
)

// derived in native element props
const derivedPropsTest = (
	<div
		title={greeting}
		class={derived(() => (isAdult() ? 'adult' : 'child'))}
		style={derived(() => `color: ${isAdult() ? 'green' : 'red'}`)}
		aria-label={greeting}
	/>
)

// derived in Collapse when
const collapseDerived = (
	<Collapse when={isAdult}>
		<div>adult content</div>
	</Collapse>
)

// derived in Dynamic
const dynamicDerived = (
	<Dynamic
		component={Card}
		title={derived(() => `Card: ${userName()}`)}
	/>
)

// ============================================
// Children variety per component
// ============================================

// Show: various children types
const showChildrenVariety = (
	<>
		{/* callback child */}
		<Show when={count}>{value => <span>{value()}</span>}</Show>
		{/* plain JSX */}
		<Show when={count}>
			<div>plain</div>
		</Show>
		{/* string child */}
		<Show when={count}>hello</Show>
		{/* multiple children */}
		<Show when={count}>
			<div>one</div>
			<div>two</div>
		</Show>
		{/* signal as child */}
		<Show when={count}>{count}</Show>
		{/* function child */}
		<Show when={count}>{() => <div>lazy</div>}</Show>
	</>
)

// Match: various children types
const matchChildrenVariety = (
	<Switch>
		{/* callback */}
		<Match when={count}>{value => <span>{value()}</span>}</Match>
		{/* plain */}
		<Match when={userName}>
			<div>name exists</div>
		</Match>
		{/* string */}
		<Match when={count}>text</Match>
	</Switch>
)

// For: various children types
const forChildrenVariety = (
	<>
		{/* single callback */}
		<For each={['a', 'b']}>{item => <li>{item}</li>}</For>
		{/* multiple callbacks */}
		<For each={[1, 2]}>
			{item => <li>{item}</li>}
			{item => <span>{item}</span>}
		</For>
		{/* callbacks mixed with elements */}
		<For each={[1, 2]}>
			{item => <li>{item}</li>}
			<p>static footer</p>
		</For>
	</>
)

// Range: various children
const rangeChildrenVariety = (
	<>
		<Range stop={3}>{n => <span>{n}</span>}</Range>
		<Range start={1} stop={5}>
			{(n, i) => (
				<span>
					{n}:{i}
				</span>
			)}
		</Range>
	</>
)

// Collapse: children variety
const collapseChildren = (
	<>
		<Collapse when={true}>
			<div>single child</div>
		</Collapse>
		<Collapse when={count} fallback={<p>hidden</p>}>
			<div>one</div>
			<div>two</div>
		</Collapse>
		<Collapse when={isAdult}>text child</Collapse>
	</>
)

// Errored: children variety
const erroredChildren = (
	<>
		{/* callback fallback */}
		<Errored
			fallback={(err, reset) => (
				<button on:click={reset}>{String(err)}</button>
			)}
		>
			<div>might throw</div>
		</Errored>
		{/* plain fallback */}
		<Errored fallback={<p>oops</p>}>
			<div>safe</div>
		</Errored>
		{/* no fallback */}
		<Errored>
			<div>no fallback</div>
		</Errored>
		{/* multiple children */}
		<Errored fallback="error">
			<div>one</div>
			<div>two</div>
		</Errored>
	</>
)

// Portal: children variety
const portalChildren = (
	<>
		<Portal mount={document.body}>
			<div>single</div>
		</Portal>
		<Portal mount={document.body}>
			<div>one</div>
			<div>two</div>
		</Portal>
		<Portal mount={document.body}>text child</Portal>
	</>
)

// Suspense: children variety
const suspenseChildren = (
	<>
		<Suspense fallback={<p>loading...</p>}>
			<div>loaded</div>
		</Suspense>
		<Suspense>
			<div>no fallback</div>
		</Suspense>
		<Suspense fallback="loading...">
			<div>one</div>
			<div>two</div>
		</Suspense>
	</>
)

// Normalize: children variety
const normalizeChildren = (
	<>
		<Normalize>single text</Normalize>
		<Normalize>
			{'hello'} {'world'}
		</Normalize>
		<Normalize>{count}</Normalize>
	</>
)

// Head: children variety
const headChildren = (
	<>
		<Head>
			<title>title</title>
		</Head>
		<Head>
			<title>title</title>
			<meta name="description" content="test" />
			<link rel="stylesheet" href="style.css" />
		</Head>
	</>
)

// Switch: children variety
const switchChildren = (
	<>
		{/* with fallback */}
		<Switch fallback={<p>none</p>}>
			<Match when={count}>
				<div>match</div>
			</Match>
		</Switch>
		{/* multiple matches */}
		<Switch>
			<Match when={count}>
				<div>first</div>
			</Match>
			<Match when={userName}>
				<div>second</div>
			</Match>
		</Switch>
	</>
)

// Navigate: children variety
const navigateChildren = (
	<>
		<Navigate path="/a" />
		<Navigate path="/b">
			<div>redirect notice</div>
		</Navigate>
	</>
)

// Dynamic: children variety
const dynamicChildren = (
	<>
		<Dynamic component="div">text child</Dynamic>
		<Dynamic component="div">
			<span>nested</span>
		</Dynamic>
		<Dynamic component={Card} title="t">
			<span>card child</span>
		</Dynamic>
	</>
)

// Tabs: full children test
const tabsFull = (
	<Tabs selected={1}>
		<Tabs.Labels>
			<Tabs.Label>First</Tabs.Label>
			<Tabs.Label>Second</Tabs.Label>
			<Tabs.Label>Third</Tabs.Label>
		</Tabs.Labels>
		<Tabs.Panels>
			<Tabs.Panel>
				<div>Panel 1</div>
			</Tabs.Panel>
			<Tabs.Panel>
				<div>Panel 2</div>
			</Tabs.Panel>
			<Tabs.Panel>
				<div>Panel 3</div>
			</Tabs.Panel>
		</Tabs.Panels>
	</Tabs>
)

// Route: children variety
const routeChildren = (
	<>
		<Route path="/a">
			<div>page a</div>
		</Route>
		<Route path="/b" fallback={<p>loading</p>}>
			<div>page b</div>
		</Route>
		<Route.Default>
			<div>404 page</div>
		</Route.Default>
	</>
)

// A: children variety
const linkChildren = (
	<>
		<A href="/x">text link</A>
		<A href="/y">
			<span>element link</span>
		</A>
		<A href="/z" replace={true}>
			replace link
		</A>
	</>
)

// ============================================
// load, CustomElement, customElement
// ============================================

// load: type test (actual import would need a default export)
const LazyComponent = load(() =>
	Promise.resolve({ default: () => <div /> }),
)

// customElement: register a custom element
class MyElement extends CustomElement {
	render() {
		return <div>custom element</div>
	}
}
customElement('my-test-element', MyElement)

// CustomElement: extend and use lifecycle
class LifecycleElement extends CustomElement {
	static styleSheets = []
	ready() {}
	cleanup() {}
	render(props: { name: string }) {
		return <span>{props.name}</span>
	}
}

// ============================================
// Prop inference assertions via derived/memo
// ============================================

// Show: when with derived number — callback gets number
const showNumberDerived = (
	<Show when={derived(() => 42)}>
		{value => {
			const n: number = value()
			return <span>{n}</span>
		}}
	</Show>
)

// Show: when with derived string
const showStringDerived = (
	<Show when={derived(() => 'hello')}>
		{value => {
			const s: string = value()
			return <span>{s}</span>
		}}
	</Show>
)

// Show: when with derived object
const showObjectDerived = (
	<Show when={derived(() => ({ x: 1, y: 2 }))}>
		{value => {
			const obj: { x: number; y: number } = value()
			return (
				<span>
					{obj.x},{obj.y}
				</span>
			)
		}}
	</Show>
)

// Match: when with inline memo — works after phantom-intersection
// fix on memo's return type
const matchMemoDerived = (
	<Switch>
		<Match when={memo(() => 'test')}>
			{value => {
				const s: string = value()
				return <span>{s}</span>
			}}
		</Match>
	</Switch>
)

// For: each with inline memo array — works (same fix)
const forMemoDerived = (
	<For each={memo(() => [{ id: 1, name: 'a' }])}>
		{(item, index) => {
			const id: number = item.id
			const name: string = item.name
			return (
				<li>
					{id}: {name}
				</li>
			)
		}}
	</For>
)

// For: each with inline derived — works (Derived overload reorder
// placed setter before getter so structural matching uses the
// getter as the primary signature)
const forDerivedArray = (
	<For each={derived(() => [10, 20, 30])}>
		{(item, index) => {
			const n: number = item
			return <li>{n}</li>
		}}
	</For>
)

// Dynamic: with derived component
const [isHeading] = signal(true)
const dynamicDerivedComponent = (
	<Dynamic component={isHeading() ? 'h1' : 'p'}>text</Dynamic>
)

// ============================================
// Negative tests: wrong types
// ============================================

// @ts-expect-error Collapse: when should be When<any>
const collapseNoWhen = <Collapse>child</Collapse>

// TODO: should error — wrong callback sig, but function
// matches JSX.Element union so it passes
const erroredBadCallback = (
	<Errored fallback={(a: number, b: number, c: number) => <div />}>
		child
	</Errored>
)

// @ts-expect-error component is required
const dynamicNoComponent = <Dynamic />

// @ts-expect-error Card: title is required
const cardMissing = <Card>child</Card>

// For: wrong each type — error IS on `each` attr line
const forWrongEach = (
	// @ts-expect-error 42 is not Each<T>
	<For each={42}>{item => <li>{item}</li>}</For>
)

// TODO: should error — value is SignalAccessor<number>, not
// string, but callback matches JSX.Element union branch
const showWrongCallback = (
	<Show when={count}>{(value: string) => <span>{value}</span>}</Show>
)

// @ts-expect-error Button2: type was omitted
const button2Type = <Button2 type="submit">ok</Button2>

// @ts-expect-error Img: alt is required
const imgNoAlt = <Img src="test.png" />

// ============================================
// Generic user components
// ============================================

// generic list component
function List<T>(props: {
	items: T[]
	render: (item: T) => JSX.Element
}) {
	return (
		<ul>
			<For each={props.items}>
				{(item, i) => <li>{props.render(item)}</li>}
			</For>
		</ul>
	)
}

const listTest = (
	<List items={[1, 2, 3]} render={n => <span>{n}</span>} />
)

// render expects (number) callback, not (string)
const listBadRender = (
	// @ts-expect-error items are number, render gets string
	<List items={[1, 2]} render={(n: string) => <span />} />
)

// wrapper using ParentComponent
const Wrapper: ParentComponent<{ label: string }> = ({
	label,
	children,
}) => <div aria-label={label}>{children}</div>

const wrapperTest = (
	<Wrapper label="hi">
		<span>child</span>
	</Wrapper>
)

// ============================================
// Nested flow components
// ============================================

const nestedFlowTest = (
	<Show when={count}>
		{value => (
			<Switch>
				<Match when={() => value() > 10}>
					<For each={['a', 'b']}>
						{item => (
							<Show when={() => item === 'a'}>
								<Range stop={value()}>
									{n => (
										<span>
											{item}:{n}
										</span>
									)}
								</Range>
							</Show>
						)}
					</For>
				</Match>
				<Match when={() => value() <= 10}>
					<Collapse when={() => value() > 0} fallback={<p>zero</p>}>
						<div>small: {value()}</div>
					</Collapse>
				</Match>
			</Switch>
		)}
	</Show>
)

// ============================================
// Dynamic — all component styles
// ============================================

// Dynamic with class component
const dynamicClass = <Dynamic component={MyComponent} some="value" />

// Dynamic: switching between elements
const [tag, setTag] = signal<'h1' | 'h2' | 'h3'>('h1')
const dynamicTag = <Dynamic component={tag()}>heading</Dynamic>

// Dynamic with arrow component
const dynamicArrow = <Dynamic component={LoginMsg} name="Tito" />

// ============================================
// Spread patterns
// ============================================

// spread on native element
const divProps = {
	id: 'test',
	class: 'foo',
	'data-x': 'bar',
}
const spreadNative = <div {...divProps}>child</div>

// spread on component
const cardProps = { title: 'spread card' }
const spreadComponent = <Card {...cardProps}>children</Card>

// rest + spread forwarding
const ForwardButton: Component<
	ComponentProps<'button'> & { variant?: string }
> = ({ variant, ...rest }) => {
	return <button class={variant} {...rest} />
}

const forwardTest = (
	<ForwardButton variant="primary" disabled={true} on:click={e => {}}>
		click
	</ForwardButton>
)

// ============================================
// HOC pattern
// ============================================

function withLogging<P>(Inner: Component<P>): Component<P> {
	return props => {
		console.log('render', props)
		return Inner(props)
	}
}

const LoggedCard = withLogging(Card)
const hocTest = <LoggedCard title="logged">child</LoggedCard>

// --- deeply-nested HOC (3 levels) — prop types propagate ---

function withTiming<P>(Inner: Component<P>): Component<P> {
	return props => {
		const start = performance.now()
		const result = Inner(props)
		console.log(performance.now() - start)
		return result
	}
}

function withErrorBoundary<P>(Inner: Component<P>): Component<P> {
	return props => {
		try {
			return Inner(props)
		} catch {
			return <div>error</div>
		}
	}
}

// chain: withTiming ⇒ withErrorBoundary ⇒ withLogging ⇒ Card
const Level1 = withLogging(Card)
const Level2 = withErrorBoundary(Level1)
const Level3 = withTiming(Level2)

// Original Card's prop types survive all 3 wraps
const threeLevelTest = (
	<Level3 title="still typed">deep</Level3>
)

// --- nested Context.Provider chain — typed inside children ---

const ThemeCtx = context<'light' | 'dark'>('light')
const UserCtx = context<{ name: string; admin: boolean }>({
	name: 'guest',
	admin: false,
})
const LangCtx = context<string>('en')

// Triple-provider chain with readers pulling from each
const nestedProviders = (
	<ThemeCtx.Provider value="dark">
		<UserCtx.Provider value={{ name: 'Tito', admin: true }}>
			<LangCtx.Provider value="es">
				{(() => {
					const theme: 'light' | 'dark' = ThemeCtx()
					const user: { name: string; admin: boolean } = UserCtx()
					const lang: string = LangCtx()
					return (
						<span>
							{theme} {user.name} {lang}
						</span>
					)
				})()}
			</LangCtx.Provider>
		</UserCtx.Provider>
	</ThemeCtx.Provider>
)

// Provider values are type-checked
const badProviderValue = (
	// @ts-expect-error theme provider value must be the declared literal union
	<ThemeCtx.Provider value="purple">
		<div />
	</ThemeCtx.Provider>
)

// ============================================
// Misc component-returning variety
// ============================================

// component returning various types
const ReturnsString: Component = () => 'just text'
const ReturnsNumber: Component = () => 42
const ReturnsNull: Component = () => null
const ReturnsUndefined: Component = () => undefined
const ReturnsArray: Component = () => [<div />, <span />]
const ReturnsFragment: Component = () => (
	<>
		<div />
	</>
)

// VoidComponent with no props
const Empty: VoidComponent = () => <div>empty</div>

// ParentComponent with no extra props
const Shell: ParentComponent = ({ children }) => (
	<div class="shell">{children}</div>
)

// ============================================
// load — dynamic import
// ============================================
// load(() => import('...')) returns JSX.ElementType. In tests we
// stub the promise directly instead of using a real module.

const Lazy = load(() => Promise.resolve({ default: () => <div /> }))
// load's return preserves the component's own signature (after
// `@template C` fix — previously it collapsed to JSX.ElementType)
const lazyElement: () => JSX.Element = Lazy
// Can be mounted through Dynamic
const lazyViaDynamic = <Dynamic component={Lazy} />

// load preserves a component's own prop signature
const LazyWithProps = load(() =>
	Promise.resolve({
		default: (props: { title: string }) => <h1>{props.title}</h1>,
	}),
)
const lazyWithPropsSig: (props: { title: string }) => JSX.Element =
	LazyWithProps

// load with a VoidComponent-like default
const LazyVoid = load(() =>
	Promise.resolve({ default: () => <span>static</span> }),
)

// load with a default export returning more complex JSX
const LazyCard = load(() =>
	Promise.resolve({
		default: () => (
			<section>
				<h2>async</h2>
			</section>
		),
	}),
)
const lazyCardViaDynamic = <Dynamic component={LazyCard} />

// ============================================
// Suspense with a promise child
// ============================================
// Children of Suspense are JSX.Element, which includes promises
// (JSX.Element's recursive union contains Promise<Element>). So
// rendering a promise as a child type-checks.

const promiseChild: Promise<JSX.Element> = Promise.resolve(
	<span>loaded</span>,
)

const suspenseWithPromise = (
	<Suspense fallback="loading">
		<div>{promiseChild}</div>
	</Suspense>
)

// direct promise in Suspense children
const suspensePromiseDirect = (
	<Suspense fallback={<p>loading</p>}>
		{Promise.resolve(<div>async content</div>)}
	</Suspense>
)

// Suspense with fallback as element and string
const suspenseStringFallback = (
	<Suspense fallback="loading...">
		{Promise.resolve('ready')}
	</Suspense>
)
