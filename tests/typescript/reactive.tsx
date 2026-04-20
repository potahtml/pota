/** @jsxImportSource pota */

import {
	action,
	addEvent,
	asyncEffect,
	batch,
	catchError,
	cleanup,
	context,
	derived,
	effect,
	externalSignal,
	isComponent,
	isResolved,
	listener,
	makeCallback,
	markComponent,
	memo,
	on,
	owned,
	ref,
	removeEvent,
	resolve,
	root,
	signal,
	syncEffect,
	untrack,
	unwrap,
	withValue,
} from 'pota'

// ============================================
// Signal API — tuple + object style
// ============================================

// tuple destructuring: [read, write, update]
const [val, setVal, updateVal] = signal(0)
const r1: number = val()
setVal(5)
updateVal(prev => prev + 1)

// object style: .read, .write, .update
const numSignal = signal(100)
const r2: number = numSignal.read()
numSignal.write(200)
numSignal.update(prev => prev + 1)

// signal generic inference from initial value
const strSignal = signal('hello')
const r3: string = strSignal.read()

const objSignal = signal({ x: 1, y: 'a' })
const r4: { x: number; y: string } = objSignal.read()

// signal with options
const optSignal = signal(0, { equals: (a, b) => a === b })

// signal with no initial value
const emptySignal = signal<string>()
const r5: string | undefined = emptySignal.read()

// write returns boolean (SignalChanged)
const changed: boolean = setVal(10)

// ref — signal shorthand
const myRef = ref()

// ============================================
// Reactive primitives
// ============================================

// effect
effect(() => {
	const v = val()
	console.log(v)
})

// effect with EffectOptions (empty-shape options object)
effect(() => val(), {})
effect(() => val(), undefined)

// syncEffect
syncEffect(() => {
	const v = val()
})

// syncEffect with options
syncEffect(() => val(), {})

// EffectOptions rejects unknown fields
// @ts-expect-error EffectOptions has no `equals` field
const effectBadOpts = effect(() => val(), { equals: false })
// @ts-expect-error EffectOptions is currently empty — arbitrary keys rejected
const effectBadOpts2 = effect(() => val(), { foo: 'bar' })

// on — explicit deps (depend, fn)
on(val, () => {
	// fn runs when depend's deps change
})

// on accepts a plain arrow as depend (after `() => any` widening)
on(
	() => val(),
	() => {},
)

// on returns void
const onReturn: void = on(val, () => 42)

// @ts-expect-error on's depend must be a callable, not a plain value
const onBadDepend = on(42, () => {})

// batch
batch(() => {
	setVal(1)
	strSignal.write('world')
})

// untrack
const untracked = untrack(() => val())
const untrackedVal: number = untracked

// root
root(dispose => {
	effect(() => val())
	// dispose is a function
	dispose()
})

// cleanup
effect(() => {
	val()
	cleanup(() => {
		// cleanup callback
	})
})

// owned
const ownedFn = owned(() => {
	return val()
})

// resolve — children resolution, returns SignalAccessor<T>
const resolved = resolve(() => [<div />, 'text', 42])
// resolved is a SignalAccessor — calling it yields the JSX.Element
const resolvedValue = resolved()

// resolve with inferred JSX.Element child
const resolvedDiv = resolve(() => <div />)
const resolvedDivValue = resolvedDiv()

// resolve with plain value (not function) — also accepted
const resolvedPlain = resolve(<span>hi</span>)

// unwrap — flatten reactive children
const unwrapped = unwrap([<div />, () => 'text', [1, 2]])

// withValue — unwrap and track reactive value
withValue(val, value => {
	const n: number = value
})

// withValue with a promise
withValue(Promise.resolve(42), value => {
	const n: number = value
})

// action — batched callback
const increment = action(() => {
	updateVal(n => n + 1)
})

// externalSignal — expects { id?: string }[]
const ext = externalSignal([{ id: 'test' }])

// externalSignal: items with different id shapes
const extVariety = externalSignal([
	{ id: 'a', name: 'first' },
	{ id: 'b', name: 'second' },
])
// read returns the array
const extItems = extVariety.read()

// @ts-expect-error externalSignal requires { id?: string }[] shape
const extBad = externalSignal([42, 'string'])

// ============================================
// asyncEffect — async side effect
// ============================================

asyncEffect(currentRunningEffect => {
	// currentRunningEffect is Promise<any>
	const p: Promise<any> = currentRunningEffect
	return val() * 2
})

// returns void
const asyncEffectReturn: void = asyncEffect(() => {})

// ============================================
// catchError — run fn, catch with handler
// ============================================

// basic usage
catchError(
	() => 'value',
	err => {
		const e: unknown = err
	},
)

// return type is `T | undefined` — `fn`'s result on success, or
// `undefined` when the handler caught an error
const catchResult: number | undefined = catchError(
	() => 42,
	err => {},
)

// with string fn
const catchStr: string | undefined = catchError(
	() => 'hello',
	err => {},
)

// ============================================
// listener — owned cleanup capability
// ============================================

const listenerObj = listener()
// dispose + doCleanups methods exist
listenerObj.dispose()
listenerObj.doCleanups()
// has a cleanups slot
const cleanupsSlot = listenerObj.cleanups

// ============================================
// addEvent / removeEvent — programmatic listeners
// ============================================

const clickNode = document.createElement('button')
const clickHandler = (e: MouseEvent) => {
	const el: HTMLButtonElement = e.currentTarget as HTMLButtonElement
}

// returns a Function used to remove the listener
const off: Function = addEvent(clickNode, 'click', clickHandler)

// removeEvent returns a Function that re-adds the listener
const on2: Function = removeEvent(clickNode, 'click', clickHandler)

// ============================================
// isComponent / markComponent / makeCallback
// ============================================

// isComponent — returns boolean
const ic: boolean = isComponent(() => <div />)
const icFalse: boolean = isComponent('not a component')

// markComponent — returns the marked function
const marked = markComponent(() => <div />)
// marked is still callable
const markedReturn = marked()

// makeCallback — returns a callable
const callback = makeCallback(<div />)
const cbResult = callback()

const callbackArr = makeCallback([<div />, <span />])
const cbArrResult = callbackArr()

// ============================================
// Derived — type inference
// ============================================

// derived returns Derived<R> (callable + thenable)
const dNum = derived(() => 42)
const dVal: number = dNum()

// derived setter
dNum(100)

// derived .resolved
const dNumResolved: boolean = dNum.resolved()

// isResolved() — top-level helper
const dNumIsResolved: boolean = isResolved(dNum)
const dUntypedIsResolved: boolean = isResolved(
	derived(() => 42 as any),
)

// derived with signal dependency
const dDouble = derived(() => val() * 2)
const dDoubleVal: number = dDouble()

// memo returns SignalAccessor<T>
const mStr = memo(() => `val: ${val()}`)
const mStrVal: string = mStr()

// ============================================
// derived — comprehensive inference (mirrors memo)
// ============================================

// --- basic value types ---

const dN = derived(() => 42)
const dNV: number = dN()

const dBool = derived(() => true)
const dBoolV: boolean = dBool()

const dArr = derived(() => [1, 2, 3])
const dArrV: number[] = dArr()

const dObj = derived(() => ({ x: 1, y: 'a' as const }))
const dObjV: { x: number; y: 'a' } = dObj()

// --- derived nested in derived ---

const dInner = derived(() => 100)
const dOuter = derived(() => dInner() + 1)
const dOuterV: number = dOuter()

// --- derived returning a function (auto-unwraps recursively) ---
// Unlike memo, derived's Accessed<> walks call signatures too

const dRetFn = derived(() => () => 'inner')
// Derived's return type is recursively unwrapped, so reading
// gives the innermost value directly.
const dRetFnV: string = dRetFn()

// --- derived returning a SignalAccessor (auto-unwraps) ---

const mForD = memo(() => 'memo-value')
const dFromMemo = derived(() => mForD)
const dFromMemoV: string = dFromMemo()

// --- derived with explicit type parameters ---
// derived's first overload is <A extends any[], R>, so the R can
// be forced via the second type parameter.

const dExplicit = derived<[], number>(() => 42)
const dExplicitV: number = dExplicit()

// --- 4-stage chain ---

const d4 = derived(
	() => 'hello',
	(s: string) => s.length,
	(n: number) => Promise.resolve({ count: n }),
	(o: { count: number }) => o.count > 0,
)
const d4Val: boolean = d4()

// --- 5-stage chain ---

const d5 = derived(
	() => 1,
	(n: number) => n + 1,
	(n: number) => `value-${n}`,
	(s: string) => s.length,
	(n: number) => n > 0,
)
const d5Val: boolean = d5()

// --- derived setter usage returns SignalChanged (boolean) ---

const dForSetter = derived(() => 0)
const setterChanged: boolean = dForSetter(42)

// --- derived .resolved is SignalAccessor<boolean> ---

const dResolved = derived(() => 'x')
const dResolvedVal: boolean = dResolved.resolved()

// --- await derived — Derived is PromiseLike<DerivedSignal<R>> ---

async function awaitDerivedSanity() {
	const d = derived(() => 'eventually')
	const settled = await d
	const s: string = settled()
	return s
}

// --- negative: derived does NOT expose arbitrary properties ---

const dNeg = derived(() => 42)
// @ts-expect-error Derived does not expose arbitrary properties
const _dNoFoo = dNeg.foo

// ============================================
// derived + promises (the whole point of derived)
// ============================================
// Derived auto-unwraps promises via Accessed<Promise<R>> → R.

// derived returning a promise — read returns the unwrapped value
const dPromiseNum = derived(() => Promise.resolve(42))
const dpnRead: number = dPromiseNum()
const dpnResolved: boolean = dPromiseNum.resolved()

// derived returning a promise of a string
const dPromiseStr = derived(() => Promise.resolve('async'))
const dpsRead: string = dPromiseStr()

// derived returning a promise of an object
const dPromiseObj = derived(() => Promise.resolve({ x: 1, y: 'a' }))
const dpoRead: { x: number; y: string } = dPromiseObj()

// await a derived — Derived is PromiseLike<DerivedSignal<R>>
async function awaitDerived() {
	const d = derived(() => Promise.resolve('hi'))
	const settled = await d
	const s: string = settled()
	return s
}

// fetch-style chain
async function fetchPattern() {
	const dFetch = derived(() =>
		Promise.resolve({ name: 'pota', version: 1 }),
	)
	const settled = await dFetch
	const obj: { name: string; version: number } = settled()
	return obj.name
}

// derived directly from a promise value (not a function)
declare const aPromise: Promise<number>
const dDirectPromise = derived(() => aPromise)
const ddpRead: number = dDirectPromise()

// ============================================
// derived multi-stage chains
// ============================================
// derived(f1, f2, ..., fN) — each stage receives the unwrapped
// result of the previous one. derived.d.ts has overloads up to
// 11 stages; this exercises 2/3/4-stage chains.

// 2-stage: number → number
const d2 = derived(
	() => Promise.resolve(10),
	(n: number) => n * 2,
)
const d2Val: number = d2()

// 3-stage: number → number → string (with promise in the middle)
const d3 = derived(
	() => 5,
	(n: number) => Promise.resolve(n * 2),
	(n: number) => `value: ${n}`,
)
const d3Val: string = d3()

// ============================================
// memo — comprehensive inference scenarios
// ============================================
// memo's return type is `SignalAccessor<T> & { readonly memo?: void }`
// — the phantom property anchors T for inline-generic inference. These
// tests exercise the cases that motivated the fix and the edge cases.

// --- basic value types ---

const mNum = memo(() => 42)
const mNumV: number = mNum()

const mBool = memo(() => true)
const mBoolV: boolean = mBool()

const mNull = memo(() => null)
const mNullV: null = mNull()

const mUndef = memo(() => undefined)
const mUndefV: undefined = mUndef()

const mObj = memo(() => ({ x: 1, y: 'a' as const }))
const mObjV: { x: number; y: 'a' } = mObj()

const mArr = memo(() => [1, 2, 3])
const mArrV: number[] = mArr()

const mTuple = memo(() => [1, 'a', true] as const)
const mTupleV: readonly [1, 'a', true] = mTuple()

// --- union return types ---

const mUnion = memo(() =>
	Math.random() > 0.5 ? ('text' as string) : 42,
)
const mUnionV: string | number = mUnion()

const mNullable = memo(() => (Math.random() > 0.5 ? 'value' : null))
const mNullableV: string | null = mNullable()

// --- memo over signals (the common case) ---

const [count2] = signal(10)
const mFromSignal = memo(() => count2() * 2)
const mfsV: number = mFromSignal()

const [name2] = signal('Tito')
const mFromSignalStr = memo(() => `Hello, ${name2()}!`)
const mfssV: string = mFromSignalStr()

// --- memo over a memo (nesting) ---

const mInner = memo(() => 100)
const mOuter = memo(() => mInner() + 1)
const mOuterV: number = mOuter()

// --- memo over a derived ---

const dForMemo = derived(() => 'world')
const mOverDerived = memo(() => `hello ${dForMemo()}`)
const modV: string = mOverDerived()

// --- memo over a promise (returns Promise, doesn't unwrap like derived) ---

const mPromise = memo(() => Promise.resolve(42))
const mpV: Promise<number> = mPromise()

// --- memo with options ---

const mWithOpts = memo(() => 42, { equals: (a, b) => a === b })
const mwoV: number = mWithOpts()

const mWithFalseEquals = memo(() => ({ x: 1 }), { equals: false })
const mwfeV: { x: number } = mWithFalseEquals()

// --- memo returning a function (NOT auto-unwrapped, unlike derived) ---

const mReturnFn = memo(() => () => 'inner')
const mrfV: () => string = mReturnFn()
const mrfInner: string = mReturnFn()()

// --- memo returning JSX ---

const mJsx = memo(() => <span>hello</span>)
const mjV: JSX.Element = mJsx()

// --- memo with explicit type parameter ---

const mExplicit = memo<string>(() => 'forced string')
const meV: string = mExplicit()

// --- the phantom property is invisible/safe ---
// `readonly memo?: void` means it can never be meaningfully read
// or written. This compiles only because the property is optional.

const mPhantomCheck = memo(() => 42)
const phantomVal: void | undefined = mPhantomCheck.memo

// === negative tests: memo's return is NOT a Derived ===

const mForNeg = memo(() => 42)
// @ts-expect-error memo doesn't have .resolved (that's derived)
const _noResolved = mForNeg.resolved
// @ts-expect-error memo doesn't have .run (that's derived)
const _noRun = mForNeg.run
// @ts-expect-error memo isn't a setter — passing args is wrong
const _noSetter: boolean = mForNeg(100)
// memo isn't really thenable, but `await x` returns x for
// non-promises (Awaited<T> identity), so this doesn't error
const _awaitMemo = (async () => {
	const r = await mForNeg
	const _stillFn: number = r()
})()

// ============================================
// memo pre-assigned (regression protection)
// ============================================

const mShowWorkaround = memo(() => 'pre-assigned')
const mForWorkaround = memo(() => [{ id: 1, name: 'a' }])
const mMatchWorkaround = memo(() => 'matched')

// ============================================
// memo + signal interop in plain code (not JSX)
// ============================================

const mForArith = memo(() => count2() + 5)
const mfaV: number = mForArith()

// ============================================
// SignalFunction — overloaded get/set
// ============================================

// SignalFunction: get and set via call
declare const sfAny: SignalFunction<number>
const sf: SignalFunction<number> = sfAny
const sfVal: number = sf()
sf(42)

// ============================================
// Context — basic + advanced patterns
// ============================================

// context with default values
const ThemeContext = context({ mode: 'dark' as 'dark' | 'light' })
const themeVal: Context<{ mode: 'dark' | 'light' }> = ThemeContext

// read current value
const currentTheme = ThemeContext()
const mode: 'dark' | 'light' = currentTheme.mode

// Provider with partial value — overload 2 (Partial<T>)
const contextProvider = (
	<ThemeContext.Provider value={{ mode: 'light' }}>
		<div>themed</div>
	</ThemeContext.Provider>
)

// Provider with full T — overload 1 (exact T)
const fullThemeCtx = context<{
	theme: string
	mode: 'dark' | 'light'
}>({ theme: 'light', mode: 'light' })
const providerFull = (
	<fullThemeCtx.Provider value={{ theme: 'dark', mode: 'dark' }}>
		<div>themed</div>
	</fullThemeCtx.Provider>
)
const providerPartial = (
	<fullThemeCtx.Provider value={{ theme: 'dark' }}>
		<div>themed</div>
	</fullThemeCtx.Provider>
)

// Wrong value still caught by both overloads
const providerBad = (
	// @ts-expect-error wrong mode value rejected by both overloads
	<fullThemeCtx.Provider value={{ mode: 'purple' }}>
		<div />
	</fullThemeCtx.Provider>
)

// context as function (value, fn) — both full-T and Partial<T> accepted
const contextFn = ThemeContext({ mode: 'light' }, () => (
	<div>scoped</div>
))
const contextFnFull = fullThemeCtx(
	{ theme: 'dark', mode: 'dark' },
	() => <div />,
)
const contextFnPartial = fullThemeCtx({ theme: 'dark' }, () => (
	<div />
))

// multiple nested contexts
const CountCtx = context(0)
const NameCtx = context('anonymous')

const nestedContexts = (
	<CountCtx.Provider value={42}>
		<NameCtx.Provider value="Tito">
			<div>{/* both contexts accessible */}</div>
		</NameCtx.Provider>
	</CountCtx.Provider>
)

// context walk
ThemeContext.walk(value => {
	const m: 'dark' | 'light' = value.mode
	return true // stop walking
})

// context as function form
const contextScoped = CountCtx(99, () => <div>scoped</div>)

// ============================================
// SignalObject / SignalTuple / DerivedSignal assertions
// ============================================

// SignalTuple is readonly [read, write, update]
const tuple: SignalTuple<number> = signal(0)
const [tRead, tWrite, tUpdate] = tuple
const tv: number = tRead()
tWrite(1)
tUpdate(n => n + 1)

// SignalObject has both tuple and named access
const obj: SignalObject<string> = signal('hi')
const ov1: string = obj.read()
obj.write('bye')
obj.update(s => s + '!')
// also indexable
const ov2: string = obj[0]()

// DerivedSignal shape
const ds = derived(() => 42)
const dsRead: number = ds()
const dsSet: boolean = ds(100)
const dsResolved: boolean = ds.resolved()

// ============================================
// Context as When source
// ============================================

// Context as a When source — the context itself is callable
const ColorCtx = context<string>('red')
declare const sigStr: SignalFunction<string>

// ============================================
// SignalFunction inference through When/Each
// ============================================

declare const sigArrSF: SignalFunction<number[]>

// ============================================
// Reactive cleanups composability
// ============================================

// nested root and cleanup
root(dispose => {
	effect(() => {
		cleanup(() => console.log('inner cleanup'))
	})
	cleanup(() => console.log('outer cleanup'))
	dispose()
})

// ============================================
// ref<T>() with element generic parameter
// ============================================
// ref<T>() returns SignalFunction<T> — get the element by calling
// with no args, set it by calling with the element.

const divRef = ref<HTMLDivElement>()
// divRef is a SignalFunction<HTMLDivElement>
const sfRef: SignalFunction<HTMLDivElement> = divRef
// getter — returns the set element (or undefined initially)
const refEl = divRef()
// setter returns SignalChanged
const refEl_set: boolean = divRef(document.createElement('div'))

// ref on other element types
const inputRef = ref<HTMLInputElement>()
const sfInputRef: SignalFunction<HTMLInputElement> = inputRef

const svgRef = ref<SVGSVGElement>()
const sfSvgRef: SignalFunction<SVGSVGElement> = svgRef

// use:ref accepts ref() result directly on matching element
const refInJsxDiv = <div use:ref={divRef} />
const refInJsxInput = <input use:ref={inputRef} />
const refInJsxSvg = <svg use:ref={svgRef} />

// ============================================
// on() — single accessor dep
// ============================================
// on(depend, fn, options?) — `depend` is a single Function, not an
// array of deps. (Confirmed by src/lib/solid.js:695 — signature is
// `(depend, fn, options)` where depend is `Function`.) Array-deps
// would require a wrapper like `on(() => [sig1(), sig2()], fn)`.

// wrapper pattern for multiple deps
const [depA, setDepA] = signal(0)
const [depB, setDepB] = signal('x')
on(
	() => [depA(), depB()],
	() => {
		// fires whenever either signal changes
	},
)

// with options
on(
	() => depA(),
	() => {
		// fires only when depA changes
	},
	// @ts-expect-error on()'s options is EffectOptions — no `equals`
	{ equals: false },
)

// ============================================
// catchError — handler return becomes fallback value
// ============================================
// catchError(fn, handler) — if `fn` throws, `handler(err)` runs. The
// typing shows the return is `undefined`; handler return values are
// not threaded back into the outer type.

const caught = catchError(
	() => {
		throw new Error('boom')
	},
	err => {
		const e: unknown = err
		return 'fallback'
	},
)
// catchError's return type is `undefined`
const _caught_is_undefined: undefined = caught

// handler can return nothing
const catchVoid = catchError(
	() => 42,
	err => {},
)
