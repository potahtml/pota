/** @jsxImportSource pota */

// ============================================
// Smoke tests for pota/use/* subpath exports
// ============================================
// Each import should resolve and expose the declared surface. These
// are intentionally shallow — the goal is to verify resolution and
// the basic shape of the types, not to exhaustively test each API.

// --- pota/use/location ---

import {
	location as useLocation,
	navigate,
	navigateSync,
	useBeforeLeave,
} from 'pota/use/location'

// location is a readonly object of signal accessors + records
const protocol: string = useLocation.protocol
const origin: string = useLocation.origin
const href: string = useLocation.href()
const pathname: string = useLocation.pathname()
const hash: string = useLocation.hash()
const search: string = useLocation.search()
const searchParams: Record<PropertyKey, string> =
	useLocation.searchParams
const params: Record<PropertyKey, string> = useLocation.params

// navigate(href, options?)
navigate('/somewhere')
navigate('/somewhere', { replace: true })
navigate('/somewhere', {
	params: { id: '1' },
	scroll: false,
	replace: true,
	delay: 100,
})

// navigateSync — synchronous test-mode navigation
navigateSync('/test')
navigateSync('/test', { replace: true })

// useBeforeLeave — function or promise
useBeforeLeave(() => true)
useBeforeLeave(Promise.resolve(false))

// --- pota/use/animate ---

import { animateClassTo, animatePartTo } from 'pota/use/animate'

const animEl = document.createElement('div')
const animPromise: Promise<unknown> = animateClassTo(
	animEl,
	'old-class',
	'new-class',
)
const partPromise: Promise<unknown> = animatePartTo(
	animEl,
	'old-part',
	'new-part',
)

// --- pota/use/scroll ---

import {
	scrollToElement,
	scrollToLocationHash,
	scrollToSelector,
	scrollToSelectorWithFallback,
	scrollToTop,
} from 'pota/use/scroll'

scrollToElement(document.createElement('div'))
const scrolled: boolean = scrollToSelector('#top')
scrollToSelectorWithFallback('#missing')
const hashScrolled: boolean = scrollToLocationHash()
scrollToTop()

// --- pota/use/css ---

import {
	addAdoptedStyleSheet,
	addStyleSheets,
	adoptedStyleSheets,
	css,
	getAdoptedStyleSheets,
	removeAdoptedStyleSheet,
	sheet,
} from 'pota/use/css'

// css`...` — tagged template producing a CSSStyleSheet
const cssSheet: CSSStyleSheet = css`
	div {
		color: red;
	}
`

// sheet(cssString) — same result from a plain string
const cssSheet2: CSSStyleSheet = sheet('div { color: blue }')

// adoptedStyleSheets — module-level default array
const activeSheets: CSSStyleSheet[] = adoptedStyleSheets

// getAdoptedStyleSheets(document | ShadowRoot)
const docSheets: CSSStyleSheet[] = getAdoptedStyleSheets(document)

// addAdoptedStyleSheet + removeAdoptedStyleSheet
addAdoptedStyleSheet(document, cssSheet)
removeAdoptedStyleSheet(document, cssSheet)

// addStyleSheets(document, list) — mix of sheets and URLs
addStyleSheets(document, [cssSheet, 'https://example.com/app.css'])

// --- pota/use/clipboard ---

// clipboard is primarily a props plugin (registers `use:clipboard`);
// its declaration file only exports `{}`, so a bare import verifies
// resolution.
import 'pota/use/clipboard'

// --- pota/use/form ---

import {
	focusNextInput,
	form2object,
	isDisabled,
	object2form,
} from 'pota/use/form'

// isDisabled(element) — returns boolean
const formEl = document.createElement('input')
const disabled: boolean = isDisabled(formEl)

// form2object — reads a form into an object
const form = document.createElement('form')
const formObject = form2object(form)

// focusNextInput(node, event) — focuses the next form field
focusNextInput(formEl, new Event('keydown'))

// object2form(form, object) — writes values back into a form
object2form(form, { name: 'test' })

// --- pota/use/bind ---

import { bind } from 'pota/use/bind'

// bind() with initial value — returns a SignalFunction
const b1 = bind(0)
const b1Get: number = b1()
const b1Set: boolean = b1(1)

// bind() with computed initial — unwraps via Accessed<T>
const b2 = bind(() => 'hello')
const b2Get: string = b2()

// --- pota/use/browser ---

import { isFirefox, isMobile } from 'pota/use/browser'

const mob: boolean = isMobile
const ff: boolean = isFirefox

// --- pota/use/clickoutside ---

// clickoutside is a pure props plugin registering `use:clickoutside`
// and `use:clickoutsideonce`. No concrete exports — bare import
// verifies subpath resolution only.
import 'pota/use/clickoutside'

// --- pota/use/color ---

import {
	alpha,
	blend,
	darken,
	eyeDropper,
	getLuminance,
	lighten,
	scale,
	textColor,
	textColorWhenBackgroundIs,
	textColorWhenBackgroundIsBlack,
	textColorWhenBackgroundIsWhite,
	validateColor,
} from 'pota/use/color'

eyeDropper(hex => {
	const h: string = hex
})
const gradient = scale(['red', 'blue'], 5)
const faded: string = alpha('#ff0000', 0.5)
const darker: string = darken('#808080', 0.2)
const lighter: string = lighten('#808080', 0.2)
const mixed: string = blend('#000', '#fff', 0.5, 2.2)
const lum: number = getLuminance('#ff0000')
const tc = textColor('#ff0000')
const tcb = textColorWhenBackgroundIsBlack('#fff')
const tcw = textColorWhenBackgroundIsWhite('#000')
const tcBg = textColorWhenBackgroundIs('#ff0000', true)
validateColor('#ff0000')

// --- pota/use/dom ---

import {
	activeElement,
	addClass,
	createElement,
	document as useDomDocument,
	hasAttribute,
	head as useDomHead,
	isConnected,
	querySelector,
	querySelectorAll,
	removeClass,
	setAttribute as domSetAttribute,
} from 'pota/use/dom'

const doc: Document = useDomDocument
const domHead: HTMLElement = useDomHead
const isConn: boolean = isConnected(document.createElement('div'))
const active = activeElement()
const created = createElement('div')
const q = querySelector(document, 'div')
const qAll = querySelectorAll(document, 'div')
const domNode = document.createElement('div')
addClass(domNode, 'a')
removeClass(domNode, 'a')
domSetAttribute(domNode, 'id', 'x')
const hasAttr: boolean = hasAttribute(domNode, 'id')

// --- pota/use/emitter ---

import { Emitter } from 'pota/use/emitter'

const myEmitter = new Emitter<number>({
	on: dispatch => {
		dispatch(42)
		return () => {}
	},
	initialValue: 0,
})
myEmitter.on(n => {
	const x: number = n
})
const emitUse = myEmitter.use()

// --- pota/use/event ---

import {
	addEventNative,
	emit,
	passiveEvent,
	preventDefault,
	removeEventNative,
	stopEvent,
	stopImmediatePropagation,
	stopPropagation,
	waitEvent,
} from 'pota/use/event'

const evNode = document.createElement('button')
emit(evNode, 'my-event')
emit(evNode, 'my-event', { bubbles: false, detail: { id: 1 } })
const clickP = waitEvent(evNode, 'click')
const clickHandlerFn = (e: Event) => {
	preventDefault(e)
	stopPropagation(e)
	stopImmediatePropagation(e)
	stopEvent(e)
}
addEventNative(evNode, 'click', clickHandlerFn)
removeEventNative(evNode, 'click', clickHandlerFn)
const passive = passiveEvent((e: Event) => {})

// --- pota/use/focus ---

import {
	focusNext,
	focusPrevious,
	onDocumentFocus,
	useDocumentFocus,
} from 'pota/use/focus'

focusNext()
focusPrevious()
onDocumentFocus(v => {
	// emitter payload
})
const focusState = useDocumentFocus()

// --- pota/use/fullscreen ---

import {
	exitFullscreen,
	isFullscreen,
	onFullscreen,
	requestFullscreen,
	toggleFullscreen,
	useFullscreen,
} from 'pota/use/fullscreen'

const fsEl = isFullscreen()
onFullscreen(v => {})
const fsState = useFullscreen()
exitFullscreen()
requestFullscreen(document.createElement('div'))
toggleFullscreen(document.createElement('div'))

// --- pota/use/orientation ---

import { onOrientation, useOrientation } from 'pota/use/orientation'

onOrientation(v => {})
const orientState = useOrientation()

// --- pota/use/paginate ---

import { paginate, paginateValues } from 'pota/use/paginate'

const pagi1 = paginateValues(
	() => [1, 2, 3, 4, 5],
	() => 2,
)
const pagi1Next: () => void = pagi1.next
const pagi1HasNext: boolean = pagi1.hasNext()
const pagi1Total: number = pagi1.totalPages()

const pagi2 = paginate((start, end) => [start, end], {
	numPerPage: () => 10,
	numItems: () => 100,
})
const pagi2Prev: () => void = pagi2.previous

// --- pota/use/random ---

import {
	chance,
	random,
	randomBetween,
	randomColor,
	randomId,
	randomSeeded,
} from 'pota/use/random'

const rn: number = random()
const rc: boolean = chance(50)
const rb = randomBetween(1, 10)
const rcol = randomColor()
const rid = randomId()
const rseed = randomSeeded(42)

// --- pota/use/resize ---

import {
	documentSize,
	onDocumentSize,
	useDocumentSize,
} from 'pota/use/resize'

const ds = documentSize()
const dsW: number = ds.width
const dsH: number = ds.height
onDocumentSize(v => {})
const dsUse = useDocumentSize()

// --- pota/use/selection ---

import {
	getSelection as useSelectionGet,
	restoreSelection,
} from 'pota/use/selection'

const currentSel = useSelectionGet()
restoreSelection(currentSel)
restoreSelection(null)

// --- pota/use/selector ---

import { usePrevious, useSelector } from 'pota/use/selector'
import { signal as potaSignal } from 'pota'

const prev = usePrevious<number>((next, previous) => (next ?? 0) + 1)
const prevR = prev(5)

const [selSignal] = potaSignal<string | undefined>('a')
const isSelected = useSelector(selSignal)
const selA = isSelected('a')
const selAVal: string | undefined = selA()

// --- pota/use/stream ---

import {
	copyAudioTracks,
	copyVideoTracks,
	removeAudioTracks,
	removeVideoTracks,
	stopStream,
	stopTrack,
	stopTracks,
} from 'pota/use/stream'

declare const srcStream: MediaStream
declare const dstStream: MediaStream
copyAudioTracks(srcStream, dstStream)
copyVideoTracks(srcStream, dstStream)
removeAudioTracks(srcStream)
removeVideoTracks(srcStream)
stopStream(srcStream)
stopTracks(srcStream)
declare const someTrack: MediaStreamTrack
stopTrack(someTrack)

// --- pota/use/string ---

import {
	capitalizeFirstLetter,
	copyToClipboard,
	dashesToCamelCase,
	diff as strDiff,
	ensureString,
	isEmoji,
	label,
	short,
	toString as strToString,
	validateEmail,
	validatePassword,
	wholeNumber,
} from 'pota/use/string'

const camel: string = dashesToCamelCase('foo-bar')
const cap: string = capitalizeFirstLetter('hello')
copyToClipboard('text')
const lbl: string = label('TestLabel')
const sh: string = short('long string')
const es: string = ensureString(null)
const ts: string = strToString('hello')
// validateEmail / validatePassword return `string | false`
const emailRes: string | false = validateEmail('a@b.com')
const pwRes: string | false = validatePassword('Passw0rd!')
const wn: number = wholeNumber(3.7)
const emoji: boolean = isEmoji('!')
const d = strDiff('hello', 'help')

// --- pota/use/test ---

import {
	$,
	$$,
	body,
	childNodes,
	head as testHead,
	isProxy,
	macrotask,
	microtask,
	rerenders,
	sleep,
	sleepLong,
	test as useTest,
} from 'pota/use/test'

useTest('smoke', expect => {
	const e = expect(1)
	return e.toBe(1)
})
const bhtml: string = body()
const hhtml: string = testHead()
const isP: boolean = isProxy({})
// rerenders returns void (it installs a stylesheet as a side effect)
rerenders()
// childNodes returns the count, not the list
const chCount: number = childNodes()
const el: Element | null = $('.foo')
const els: Element[] = $$('.foo')

// microtask / sleep are awaitable
async function testAsyncs() {
	await microtask()
	await macrotask()
	await sleep(10)
	await sleepLong()
}

// --- pota/use/time ---

import {
	date,
	datetime,
	day,
	measure,
	now,
	time as timeOfDay,
	timeWithSeconds,
	timing,
	useTimeout,
} from 'pota/use/time'

const nowTs: number = now()
const dateStr: string = date()
const dtStr: string = datetime()
const todStr: string = timeOfDay()
const todSecStr: string = timeWithSeconds()
const dayStr: string = day()
const measured = measure('m', () => 42)
const elapsed: number = timing(() => {})
const to = useTimeout(() => {}, 100)
to.start()
to.stop()

// --- pota/use/url ---

import {
	cleanLink,
	decodeURIComponent as urlDecode,
	encodeURIComponent as urlEncode,
	hasProtocol,
	isAbsolute,
	isExternal,
	isFileProtocol,
	isHash,
	isRelative,
	paramsRegExp,
	removeNestedProtocol,
	replaceParams,
} from 'pota/use/url'

const cleaned: string = cleanLink('hi.')
const enc: string = urlEncode('hi there')
const dec: string = urlDecode('hi%20there')
const isFile: boolean = isFileProtocol('file:///a')
const hasProto: boolean = hasProtocol('https://a')
const noProto: string = removeNestedProtocol('https://a')
const isAbs: boolean = isAbsolute('/a')
const isRel: boolean = isRelative('a')
const isHsh: boolean = isHash('#a')
const isExt: boolean = isExternal('https://other.com')
const re: RegExp = paramsRegExp
const replaced: string = replaceParams('/a/:id', { id: '42' })

// --- pota/use/visibility ---

import {
	isDocumentVisible,
	onDocumentVisible,
	useDocumentVisible,
} from 'pota/use/visibility'

const vis: boolean = isDocumentVisible()
onDocumentVisible(v => {})
const visState = useDocumentVisible()
