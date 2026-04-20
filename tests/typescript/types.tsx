/** @jsxImportSource pota */

import { Component, Pota, derived, memo, ref, signal } from 'pota'

// Reused local component for ComponentProps extraction tests
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

class MyComponent extends Pota {
	props = { some: 'lala' }
	render(props) {
		return <main>{props.some}</main>
	}
}

const [val] = signal(0)
const strSignal = signal('hello')

// ============================================
// JSX namespace types — direct assertions
// ============================================

// JSX.Element — wide union
const elem1: JSX.Element = 'string'
const elem2: JSX.Element = 42
const elem3: JSX.Element = true
const elem4: JSX.Element = undefined
const elem5: JSX.Element = null
const elem6: JSX.Element = <div />
const elem7: JSX.Element = () => <div />
const elem8: JSX.Element = [1, 'two', <div />]
const elem9: JSX.Element = Promise.resolve(<div />)

// JSX.ElementType — what can be a component
const et1: JSX.ElementType = 'div'
const et2: JSX.ElementType = Card
const et3: JSX.ElementType = MyComponent

// JSX.ElementClass — class shape
const ec: JSX.ElementClass = {
	render: () => <div />,
	ready: () => {},
	cleanup: () => {},
}

// DOMElement
const de1: DOMElement = document.createElement('div')
const de2: DOMElement = document.createElementNS(
	'http://www.w3.org/2000/svg',
	'svg',
)

// JSX.Props<T>
type MyProps = JSX.Props<{ title: string }>
const mp: MyProps = { title: 'hi', children: <div /> }

// JSX.Elements — alias for IntrinsicElements
type DivAttrs = JSX.Elements['div']
type SpanAttrs = JSX.Elements['span']

// JSX.BooleanAttribute
const ba: JSX.BooleanAttribute = true
const ba2: JSX.BooleanAttribute = ''

// JSX.StyleAttribute
const sa: JSX.StyleAttribute = 'color: red'
const sa2: JSX.StyleAttribute = () => 'color: blue'

// ============================================
// Accessor / When / Each — type compatibility
// ============================================

// Accessor<T> accepts plain values, signals, and functions
const a1: Accessor<number> = 42
const a2: Accessor<number> = val
const a3: Accessor<number> = () => 42

// When<T> is Accessor<T>
const w1: When<number> = 42
const w2: When<number> = val
const w3: When<string> = strSignal.read

// Each<T> accepts Iterable<T> or accessor of it
const e1: Each<number> = [1, 2, 3]
const e2: Each<string> = () => ['a', 'b']

// Accessed<T> — recursive unwrapping
type A1 = Accessed<SignalAccessor<number>> // number
type A2 = Accessed<() => string> // string
type A3 = Accessed<number> // number (identity)

const _a1: A1 = 42
const _a2: A2 = 'hello'
const _a3: A3 = 100

// ============================================
// Accessor nesting + Accessed recursive unwrapping
// ============================================

// Accessor<Accessor<T>> — double-wrapped
const a_nested: Accessor<Accessor<number>> = () => () => 42
const a_triple: Accessor<Accessor<Accessor<string>>> =
	() => () => () =>
		'deep'

// Accessed<T> — recursive chain
type A_SA = Accessed<SignalAccessor<number>> // → number
type A_Fn = Accessed<() => () => string> // → string (recursive)
type A_Promise = Accessed<Promise<number>> // → number
type A_Derived = Accessed<Derived<string>> // → string
type A_Identity = Accessed<42> // → 42

const _asa: A_SA = 42
const _afn: A_Fn = 'hi'
const _ap: A_Promise = 100
const _ad: A_Derived = 'derived'
const _ai: A_Identity = 42

// When<T> accepts Accessor<T> forms
const w_plain: When<number> = 42
const w_fn: When<number> = () => 42
const w_signal: When<number> = val

// Each<T> accepts Iterable forms
const e_arr: Each<number> = [1, 2, 3]
const e_fn: Each<string> = () => ['a']
const e_signal_fn: Each<number> = () => new Set([1, 2])

// ============================================
// recursive Accessed<> — multi-level unwrapping
// ============================================
// Accessed<T> walks PromiseLike, Derived, SignalAccessor,
// SignalFunction, and plain callables until it finds a
// non-accessor type.

type A_DerivedPromise = Accessed<Derived<Promise<number>>> // → number
type A_SigAccDerived = Accessed<SignalAccessor<Derived<string>>> // → string
type A_PromiseFn = Accessed<Promise<() => boolean>> // → boolean
type A_DerivedSigAcc = Accessed<Derived<SignalAccessor<number>>> // → number
type A_TripleFn = Accessed<() => () => () => string> // → string

const _adp: A_DerivedPromise = 42
const _asad: A_SigAccDerived = 'hi'
const _apf: A_PromiseFn = true
const _adsa: A_DerivedSigAcc = 100
const _atf: A_TripleFn = 'deep'

// ============================================
// Merge utility type
// ============================================

type Base = { a: number; b: string; c: boolean }
type Override = { b: number; d: string }
type Merged = Merge<Base, Override>

const merged: Merged = { a: 1, b: 42, c: true, d: 'hi' }
const mergedB: number = merged.b // b is now number
const mergedA: number = merged.a // a unchanged

// ============================================
// ComponentProps — extraction
// ============================================

// from intrinsic element
type DivProps = ComponentProps<'div'>
type InputProps = ComponentProps<'input'>
type AnchorProps = ComponentProps<'a'>

// from function component
type CardProps = ComponentProps<typeof Card>
const cp: CardProps = { title: 'x', children: <div /> }

// from class component
type PotaProps = ComponentProps<typeof MyComponent>

// ============================================
// JSX.EventType map — direct access
// ============================================

// EventType maps event names to event objects
type ClickEvent = JSX.EventType['click'] // PointerEvent
type AuxClickEvent = JSX.EventType['auxclick'] // PointerEvent
type ContextMenuEvent = JSX.EventType['contextmenu'] // PointerEvent
type DblClickEvent = JSX.EventType['dblclick'] // MouseEvent
type KeyEvent = JSX.EventType['keydown'] // KeyboardEvent
type ScrollEvt = JSX.EventType['scroll'] // Event
type WheelEvt = JSX.EventType['wheel'] // WheelEvent
type SubmitEvt = JSX.EventType['submit'] // SubmitEvent
type InputEvt = JSX.EventType['input'] // InputEvent
type BeforeInputEvt = JSX.EventType['beforeinput'] // InputEvent

const _ce: ClickEvent = new PointerEvent('click')
const _ax: AuxClickEvent = new PointerEvent('auxclick')
const _cm: ContextMenuEvent = new PointerEvent('contextmenu')
const _dc: DblClickEvent = new MouseEvent('dblclick')
const _ke: KeyEvent = new KeyboardEvent('keydown')
const _ie: InputEvt = new InputEvent('input')

// @ts-expect-error plain MouseEvent is not a PointerEvent (missing pointerId etc.)
const _ce_bad: ClickEvent = new MouseEvent('click')

// ============================================
// Intersection of component utilities
// ============================================

// Omit + Component — removing props
type NoTitleCard = Omit<ComponentProps<typeof Card>, 'title'>
const ntc: NoTitleCard = { children: <div /> }

// Pick + Component — selecting props
type OnlyTitle = Pick<ComponentProps<typeof Card>, 'title'>
const ot: OnlyTitle = { title: 'just title' }

// Required — making optional props required
type RequiredCard = Required<ComponentProps<typeof Card>>
const rc: RequiredCard = { title: 't', children: <div /> }

// Partial — making all props optional
type PartialCard = Partial<ComponentProps<typeof Card>>
const pc: PartialCard = {}

// ============================================
// Signal primitive types — direct assertions
// ============================================

// SignalAccessor<T> is `() => T`
type SA = SignalAccessor<number>
const sa_plain: SA = () => 42
const sa_v: number = sa_plain()

// SignalSetter<T> returns SignalChanged (boolean)
type SSetter = SignalSetter<number>
const ss_setter: SSetter = (v?: number) => true
const ss_changed: boolean = ss_setter(10)

// SignalUpdate<T> receives prev and returns SignalChanged
type SUpd = SignalUpdate<number>
const su_upd: SUpd = fn => {
	const prev = 1
	const next: number = fn(prev)
	return true
}

// SignalOptions<T> — shape of options bag
const so_equals_fn: SignalOptions<number> = {
	equals: (a, b) => a === b,
}
const so_equals_false: SignalOptions<number> = { equals: false }
const so_empty: SignalOptions<number> = {}
const so_undefined: SignalOptions<number> = undefined

// SignalChanged — boolean alias
const schanged_true: SignalChanged = true
const schanged_false: SignalChanged = false

// SignalTuple<T> — [read, write, update]
type ST = SignalTuple<number>
declare const stTuple: ST
const stR: number = stTuple[0]()
const stW: boolean = stTuple[1](1)
const stU: boolean = stTuple[2](n => n + 1)

// SignalObject<T> — tuple + named access
type SObj = SignalObject<number>
declare const sObjVal: SObj
const sObj_r: number = sObjVal.read()
const sObj_w: boolean = sObjVal.write(2)
const sObj_u: boolean = sObjVal.update(n => n + 1)
const sObj_i0: number = sObjVal[0]()

// SignalFunction<T> — call with arg (set) / no arg (get)
type SF = SignalFunction<number>
declare const sFn: SF
const sFn_get: number = sFn()
const sFn_set: boolean = sFn(42)

// Derived<T> / DerivedSignal<T>
type D = Derived<number>
type DS = DerivedSignal<number>
declare const dVal: D
declare const dsVal: DS
const d_get: number = dVal()
const d_set: boolean = dVal(1)
const d_resolved: boolean = dVal.resolved()
const ds_get: number = dsVal()
const ds_set: boolean = dsVal(1)

// ============================================
// JSX.EventHandler<Event, Target> — direct
// ============================================

// Function form
type ClickHandler = JSX.EventHandler<MouseEvent, HTMLButtonElement>
const ch_fn: ClickHandler = e => {
	if (e) {
		const ev: MouseEvent = e
		const el: HTMLButtonElement = e.currentTarget
	}
}

// Object form with handleEvent
const ch_obj: ClickHandler = {
	handleEvent(e) {
		const ev: MouseEvent = e
		const el: HTMLButtonElement = e.currentTarget
	},
}

// Object form with listener options
const ch_obj_opts: ClickHandler = {
	handleEvent(e) {},
	capture: true,
	passive: true,
	once: true,
}

// Keyboard handler on input
type KeyHandler = JSX.EventHandler<KeyboardEvent, HTMLInputElement>
const kh_fn: KeyHandler = e => {
	if (e) {
		const el: HTMLInputElement = e.currentTarget
	}
}

// ============================================
// JSX.IntrinsicElements — attribute map
// ============================================

type IE = JSX.IntrinsicElements
type DivAttrsFromIE = IE['div']
type InputAttrsFromIE = IE['input']
type ButtonAttrsFromIE = IE['button']
// spot-check a couple of keys exist
declare const divAttrs: DivAttrsFromIE
declare const inputAttrs: InputAttrsFromIE
