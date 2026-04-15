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
import { Component, context, Pota, derived, memo, signal } from 'pota'
import { bind } from 'pota/use/bind'

declare module 'pota' {
	namespace JSX {
		interface IntrinsicElements {
			lala: {
				testing: boolean
			}
			'some-element': HTMLAttributes<HTMLElement>
			'my-component': {
				lala?: string
			} & HTMLAttributes<HTMLElement>
		}
	}
}

declare module 'pota' {
	namespace JSX {
		interface HTMLSpanElementAttributes<Element> {
			'prop:bla'?: boolean
		}
	}
}

function MyFactoryFunction() {
	return {
		render: (props: { what: 'havier' }) => {
			return props.what
		},
	}
}

const TestArrow = () => 1

const StringObject = {
	toString() {
		return 'test'
	},
}

const [read, write] = signal('lefta' as const)

// default props test

const LoginMsg: VoidComponent<{ name?: string }> = ({
	name = 'Guest',
}) => {
	return <p>Logged in as {name}</p>
}

// with children

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

// spread

const Button: Component<ComponentProps<'button'>> = ({
	...allProps
}) => {
	return <button {...allProps} />
}

// disallowing a type

const Button2: Component<Omit<ComponentProps<'button'>, 'type'>> = ({
	...allProps
}) => {
	return <button type="button" {...allProps} />
}

// @ts-expect-error `type` was omitted from Button2 props
const z = <Button2 type="button">Hi</Button2>

// required

type MakeRequired<T, K extends keyof T> = Omit<T, K> &
	Required<{ [P in K]: T[P] }>

type ImgProps = MakeRequired<ComponentProps<'img'>, 'alt' | 'src'>

const Img: Component<ImgProps> = ({ alt, ...allProps }) => {
	return <img alt={alt} {...allProps} />
}

// @ts-expect-error `alt` is required on Img
const zz = <Img src="..." />

const Div = () => <div />
const Div2 = <div />

function Test() {
	return <some-element on:error={e => console.log(e)} />
}

// classes

class MyComponent extends Pota {
	props = { some: 'lala' }

	ready() {
		// render(<div>ready callback!</div>)
	}
	cleanup() {
		// render(<div>cleanup callback!</div>)
	}
	render(props) {
		return (
			<main>
				{props.children} {props.some}
			</main>
		)
	}
}

function typescript(props) {
	const myspan = bind('')
	return (
		<span
			on:click={read}
			aria-busy={'true'}
			aria-readonly={'true'}
			what-what="aer"
			class:lalala={true}
			prop:bla={true}
			data-pathname={location.pathname}
			// @ts-expect-error duplicate on:click attribute
			on:click={e => {
				console.log(e, e.currentTarget)
			}}
			use:connected={e => {}}
		>
			{/* expected error: prop:bla only on span, contentEditable filtered */}
			<div
				// @ts-expect-error
				prop:bla="should error"
				prop:contentEditable={'true'}
			/>
			{/* @ts-expect-error contentEditable is on base class, filtered */}
			<div prop:contentEditable={'true'} />

			<lala testing={true}></lala>
			<data value="asd" prop:value="good" />
			<Button style:stroke="antiquewhite" />
			<Card title="lala">lala</Card>
			<LoginMsg name="name" />
			<Div />
			{Div2}
			<span
				use:bind={myspan}
				use:ref={element => {
					console.log(element)
				}}
				use:connected={e => e}
				on:click={e => {
					e.target
					e.currentTarget
				}}
			>
				<TestArrow />
				{/* @ts-expect-error toString objects not in JSX.ElementType */}
				<StringObject />
				<MyFactoryFunction lala="true" />
				{/* expected error: extra prop `javier` */}
				<MyComponent
					some="content"
					// @ts-expect-error
					javier="243"
				/>

				<meta content="404 Not Found" />
				<svg
					href="ss"
					use:connected={e => e}
					color="red"
					on:click={e => {
						console.log(e.currentTarget)
						console.log(e.target)
					}}
				>
					<path />
				</svg>
				<my-component lala="true" />
				<my-component />
				<For
					each={() => {
						return [1, 2, 3]
					}}
				></For>
				<For each={[1, 2, 3]}></For>
				<span
					use:connected={e => {
						console.log(e)
					}}
				></span>
				{/* @ts-expect-error tabindex for dialog is set to never*/}
				<dialog tabindex="should error" />
				<div tabindex="-1" />
				<div use:clickoutside={(e, node) => {}} />
				<Dynamic component="h2" />
				{/* @ts-expect-error hola not on h2 */}
				<Dynamic component="h2" hola="" />
				<Dynamic component={Card} title="ok" />
				{/* @ts-expect-error hola not on Card */}
				<Dynamic component={Card} hola="" />
			</span>
		</span>
	)
}

typescript({})

// -- signals used in JSX --

const [count, setCount] = signal(42)

// event handler inference
const eventTest = (
	<div
		on:click={e => {
			const ev: MouseEvent = e
			const el: HTMLDivElement = e.currentTarget
		}}
		on:keydown={e => {
			const ev: KeyboardEvent = e
		}}
	/>
)

// use:ref element type
const refTest = (
	<input
		use:ref={el => {
			const input: HTMLInputElement = el
		}}
	/>
)

// svg event inference
const svgEventTest = (
	<svg
		on:click={e => {
			const el: SVGSVGElement = e.currentTarget
		}}
	>
		<circle
			on:click={e => {
				const el: SVGCircleElement = e.currentTarget
			}}
		/>
	</svg>
)

// -- element-specific inference --

// use:disconnected receives the element type
const disconnectedTest = (
	<div
		use:disconnected={el => {
			const d: HTMLDivElement = el
		}}
	/>
)

// use:ref on SVG element
const svgRefTest = (
	<svg
		use:ref={el => {
			const s: SVGSVGElement = el
		}}
	/>
)

// -- style tests --

// style as string
const styleStringTest = <div style="color: red" />

// style as object
const styleObjTest = (
	<div style={{ color: 'red', 'font-size': '14px' }} />
)

// style as signal
const [styleSignal] = signal('color: blue')
const styleSignalTest = <div style={styleSignal} />

// style:* individual props
const styleIndividualTest = (
	<div
		style:color="red"
		style:font-size="14px"
		style:background-color={() => 'blue'}
	/>
)

// -- class tests --

// class as string
const classStringTest = <div class="foo bar" />

// class as object (conditional classes)
const classObjTest = <div class={{ active: true, hidden: false }} />

// class as signal
const [classSignal] = signal('dynamic-class')
const classSignalTest = <div class={classSignal} />

// class:* individual toggles
const classBoolTest = (
	<div class:active={true} class:hidden={() => false} />
)

// -- prop:* tests --

// prop:value on input
const propValueInput = <input prop:value="hello" />

// prop:checked on checkbox
const propCheckedTest = <input prop:checked={true} />

// prop:innerHTML
const propInnerTest = <div prop:innerHTML="<b>bold</b>" />

// -- boolean attributes --

const boolAttrsTest = (
	<>
		<input disabled={true} />
		<input readonly={true} />
		<button disabled={true}>disabled</button>
		<select disabled={true}>
			<option selected={true}>one</option>
		</select>
		<details open={true}>
			<summary>details</summary>
		</details>
	</>
)

// -- data-* and aria-* --

const dataAriaTest = (
	<div
		data-testid="hello"
		data-custom-attr="value"
		aria-label="accessible"
		aria-hidden="true"
		aria-expanded="false"
		role="button"
	/>
)

// WAI-ARIA 1.2 roles — document-structure additions for HTML5
// elements that didn't have a role prior to 1.2
const aria12Roles = (
	<>
		<blockquote role="blockquote" />
		<code role="code" />
		<em role="emphasis" />
		<strong role="strong" />
		<mark role="mark" />
		<ins role="insertion" />
		<del role="deletion" />
		<sub role="subscript" />
		<sup role="superscript" />
		<p role="paragraph" />
		<time role="time" />
		<caption role="caption" />
		<div role="generic" />
		<div role="suggestion" />
	</>
)

const ariaRoleBad = (
	// @ts-expect-error 'nonsense' is not a valid ARIA role
	<div role="nonsense" />
)

// -- event handler variations --

// event handler as object with handleEvent
const handleEventTest = (
	<div
		on:click={{
			handleEvent(e) {
				const ev: MouseEvent = e
			},
		}}
	/>
)

// multiple event types
const multiEventTest = (
	<input
		on:input={e => {
			const ev: Event = e
			const el: HTMLInputElement = e.currentTarget
		}}
		on:focus={e => {
			const ev: FocusEvent = e
		}}
		on:blur={e => {
			const ev: FocusEvent = e
		}}
		on:keydown={e => {
			const ev: KeyboardEvent = e
		}}
		on:change={e => {
			const ev: Event = e
		}}
	/>
)

// -- use:* directives --

// use:connected on different elements
const connectedTest = (
	<input
		use:connected={el => {
			const input: HTMLInputElement = el
		}}
	/>
)

// use:disconnected
const disconnectedInput = (
	<textarea
		use:disconnected={el => {
			const ta: HTMLTextAreaElement = el
		}}
	/>
)

// -- SVG elements --

const svgElementsTest = (
	<svg viewBox="0 0 100 100">
		<circle
			cx="50"
			cy="50"
			r="40"
			use:ref={el => {
				const c: SVGCircleElement = el
			}}
		/>
		<rect
			x="10"
			y="10"
			width="80"
			height="80"
			on:click={e => {
				const el: SVGRectElement = e.currentTarget
			}}
		/>
		<text x="50" y="50">
			hello
		</text>
		<g>
			<line x1="0" y1="0" x2="100" y2="100" />
			<polyline points="0,0 50,50 100,0" />
		</g>
		<defs>
			<linearGradient id="grad">
				<stop offset="0%" stop-color="red" />
			</linearGradient>
		</defs>
		<use href="#grad" />
	</svg>
)

// -- form elements --

const formElementsTest = (
	<form
		on:submit={e => {
			const ev: SubmitEvent = e
			const el: HTMLFormElement = e.currentTarget
		}}
	>
		<input type="text" value="hello" placeholder="type here" />
		<textarea rows={5} />
		<select>
			<option value="a">A</option>
			<optgroup label="group">
				<option value="b">B</option>
			</optgroup>
		</select>
		<fieldset>
			<legend>Legend</legend>
			<label>
				<input type="checkbox" /> check
			</label>
		</fieldset>
		<output>result</output>
	</form>
)

// -- media elements --

const mediaTest = (
	<>
		<video
			src="video.mp4"
			controls={true}
			autoplay={true}
			muted={true}
			on:play={e => {
				const el: HTMLVideoElement = e.currentTarget
			}}
		/>
		<audio
			src="audio.mp3"
			on:ended={e => {
				const el: HTMLAudioElement = e.currentTarget
			}}
		/>
		<img
			src="img.png"
			alt="test"
			loading="lazy"
			on:load={e => {
				const el: HTMLImageElement = e.currentTarget
			}}
		/>
		<canvas
			width={300}
			height={150}
			use:ref={el => {
				const c: HTMLCanvasElement = el
			}}
		/>
	</>
)

// -- table elements --

const tableTest = (
	<table>
		<thead>
			<tr>
				<th scope="col">Header</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td colspan={2}>Cell</td>
			</tr>
		</tbody>
		<tfoot>
			<tr>
				<td>Footer</td>
			</tr>
		</tfoot>
	</table>
)

// -- children as various types --

const childrenTypes = (
	<div>
		{/* string */}
		{'text'}
		{/* number */}
		{42}
		{/* boolean (should not render) */}
		{true}
		{/* null/undefined */}
		{null}
		{undefined}
		{/* array */}
		{[1, 2, 3].map(n => (
			<span>{n}</span>
		))}
		{/* signal accessor */}
		{count}
		{/* function */}
		{() => <span>lazy</span>}
	</div>
)

// -- Accessor in props (reactive values) --

const [reactiveTitle] = signal('hello')
const reactivePropsTest = (
	<div title={reactiveTitle} tabindex={() => '-1'} />
)

// -- template/slot elements --

const templateSlotTest = (
	<template>
		<slot name="header" />
		<slot />
	</template>
)

// -- iframe --

const iframeTest = (
	<iframe
		src="https://example.com"
		sandbox="allow-scripts"
		loading="lazy"
	/>
)

// -- misc elements --

const miscElements = (
	<>
		<progress value={50} max={100} />
		<meter value={0.7} min={0} max={1} />
		<hr />
		<br />
		<wbr />
		<pre>
			<code>{'const x = 1'}</code>
		</pre>
		<blockquote cite="https://example.com">quoted</blockquote>
		<abbr title="HyperText Markup Language">HTML</abbr>
		<time datetime="2024-01-01">New Year</time>
	</>
)

// ============================================
// Untested use:* directives
// ============================================

// use:normalize — forces text normalization
const useNormalize = <span use:normalize={true}>{'hello'}</span>

// use:css — inline CSS injection
const useCss = <div use:css="div { color: red }" />
const useCssFn = <div use:css={() => 'div { color: blue }'} />

// use:clipboard — copy to clipboard
const useClipboard = <button use:clipboard="copy this" />
const useClipboardFn = <button use:clipboard={e => 'dynamic copy'} />
const useClipboardTrue = <button use:clipboard={true} />

// use:fullscreen — fullscreen API
const useFullscreen = <div use:fullscreen={true} />
const useFullscreenFn = <div use:fullscreen={(e, node) => {}} />

// use:clickoutsideonce — fires once
const useClickoutsideonce = (
	<div use:clickoutsideonce={(e, node) => {}} />
)

// ============================================
// Event handler array + options
// ============================================

// array of handlers (EventHandlers recursive type)
const eventArray = (
	<div
		on:click={[
			e => console.log('first', e),
			e => console.log('second', e),
		]}
	/>
)

// handler with options (EventObject & EventHandlerOptions)
const eventWithOptions = (
	<div
		on:click={{
			handleEvent(e) {
				const ev: MouseEvent = e
			},
			capture: true,
			passive: true,
			once: true,
		}}
	/>
)

// ============================================
// Distinct event types (one per event class)
// ============================================

// ClipboardEvent
const clipboardEvent = (
	<div
		on:copy={e => {
			const ev: ClipboardEvent = e
		}}
		on:paste={e => {
			const ev: ClipboardEvent = e
		}}
	/>
)

// CompositionEvent
const compositionEvent = (
	<input
		on:compositionstart={e => {
			const ev: CompositionEvent = e
		}}
		on:compositionend={e => {
			const ev: CompositionEvent = e
		}}
	/>
)

// InputEvent (on:beforeinput)
const inputEventBeforeInput = (
	<input
		on:beforeinput={e => {
			const ev: InputEvent = e
		}}
	/>
)

// UIEvent
const uiEvent = (
	<div
		on:resize={e => {
			const ev: UIEvent = e
		}}
		on:scroll={e => {
			const ev: Event = e
		}}
	/>
)

// FormDataEvent
const formDataEvent = (
	<form
		on:formdata={e => {
			const ev: FormDataEvent = e
		}}
	/>
)

// ToggleEvent
const toggleEvent = (
	<details
		on:toggle={e => {
			const ev: ToggleEvent = e
		}}
		on:beforetoggle={e => {
			const ev: ToggleEvent = e
		}}
	/>
)

// ProgressEvent
const progressEvent = (
	<img
		on:progress={e => {
			const ev: ProgressEvent = e
		}}
	/>
)

// ErrorEvent
const errorEvent = (
	<img
		on:error={e => {
			const ev: ErrorEvent = e
		}}
	/>
)

// window events on body (EventHandlersWindow)
const windowEventsOnBody = (
	<body
		on:hashchange={e => {
			const ev: HashChangeEvent = e
		}}
		on:popstate={e => {
			const ev: PopStateEvent = e
		}}
		on:beforeunload={e => {
			const ev: BeforeUnloadEvent = e
		}}
	/>
)

// Recently-added window/document events
const newWindowEvents = (
	<body
		on:visibilitychange={e => {
			const ev: Event = e
		}}
		on:DOMContentLoaded={e => {
			const ev: Event = e
		}}
		on:readystatechange={e => {
			const ev: Event = e
		}}
		on:pointerlockchange={e => {
			const ev: Event = e
		}}
		on:pointerlockerror={e => {
			const ev: Event = e
		}}
		on:clipboardchange={e => {
			const ev: Event = e
		}}
		on:devicemotion={e => {
			const ev: DeviceMotionEvent = e
			const acc = e.acceleration
		}}
		on:deviceorientation={e => {
			const ev: DeviceOrientationEvent = e
			const alpha: number | null = e.alpha
		}}
		on:deviceorientationabsolute={e => {
			const ev: DeviceOrientationEvent = e
		}}
		on:orientationchange={e => {
			const ev: Event = e
		}}
	/>
)

// on:command upgraded from Event to CommandEvent (lib.dom has
// CommandEvent defined but types oncommand as plain Event — pota
// is more specific, matching MDN/spec)
const commandEvent = (
	<div
		on:command={e => {
			const ev: CommandEvent = e
			const cmd: string = e.command
			const src: Element | null = e.source
		}}
	/>
)

// ============================================
// More event edge cases
// ============================================

// pointer events
const pointerEvents = (
	<div
		on:pointerdown={e => {
			const ev: PointerEvent = e
			const el: HTMLDivElement = e.currentTarget
		}}
		on:pointerup={e => {
			const ev: PointerEvent = e
		}}
		on:pointermove={e => {
			const ev: PointerEvent = e
		}}
	/>
)

// click / auxclick / contextmenu are PointerEvent per lib.dom.d.ts —
// pointer-specific props (pointerId, pressure, pointerType) must be
// reachable, not just MouseEvent props.
const pointerClickEvents = (
	<div
		on:click={e => {
			const ev: PointerEvent = e
			const id: number = e.pointerId
			const kind: string = e.pointerType
		}}
		on:auxclick={e => {
			const ev: PointerEvent = e
			const id: number = e.pointerId
		}}
		on:contextmenu={e => {
			const ev: PointerEvent = e
			const id: number = e.pointerId
		}}
		on:dblclick={e => {
			// dblclick is still MouseEvent in lib.dom.d.ts
			const ev: MouseEvent = e
		}}
	/>
)

// handler typed as MouseEvent still works on PointerEvent slots via
// parameter contravariance (PointerEvent extends MouseEvent).
const mouseHandlerOnPointerSlot = (
	<div on:click={(e: MouseEvent) => void e.clientX} />
)

// touch events
const touchEvents = (
	<div
		on:touchstart={e => {
			const ev: TouchEvent = e
		}}
		on:touchend={e => {
			const ev: TouchEvent = e
		}}
	/>
)

// wheel event
const wheelEvent = (
	<div
		on:wheel={e => {
			const ev: WheelEvent = e
		}}
	/>
)

// drag events
const dragEvents = (
	<div
		draggable="true"
		on:dragstart={e => {
			const ev: DragEvent = e
		}}
		on:drop={e => {
			const ev: DragEvent = e
		}}
		on:dragover={e => {
			const ev: DragEvent = e
		}}
	/>
)

// transition/animation events
const animEvents = (
	<div
		on:transitionend={e => {
			const ev: TransitionEvent = e
		}}
		on:animationend={e => {
			const ev: AnimationEvent = e
		}}
	/>
)

// ============================================
// More element-specific types
// ============================================

// dialog
const dialogTest = (
	<dialog open={true}>
		<form method="dialog">
			<button>close</button>
		</form>
	</dialog>
)

// details/summary
const detailsTest = (
	<details
		open={true}
		on:toggle={e => {
			const el: HTMLDetailsElement = e.currentTarget
		}}
	>
		<summary>title</summary>
		content
	</details>
)

// picture/source
const pictureTest = (
	<picture>
		<source srcset="img.webp" type="image/webp" />
		<source srcset="img.jpg" type="image/jpeg" />
		<img src="img.jpg" alt="pic" />
	</picture>
)

// dl/dt/dd
const dlTest = (
	<dl>
		<dt>Term</dt>
		<dd>Definition</dd>
	</dl>
)

// map/area
const mapAreaTest = (
	<>
		<img src="map.png" alt="map" usemap="#mymap" />
		<map name="mymap">
			<area
				shape="rect"
				coords="0,0,100,100"
				href="/link"
				alt="area"
			/>
		</map>
	</>
)

// ============================================
// prop:* on various element types
// ============================================

// prop:textContent and prop:innerText
const propText = (
	<>
		<div prop:textContent="text" />
		<span prop:innerText="inner" />
	</>
)

// prop:value on select
const propSelect = <select prop:value="option-a" />

// prop:selectedIndex on select
const propSelectedIdx = <select prop:selectedIndex={2} />

// prop:indeterminate on input
const propIndeterminate = (
	<input type="checkbox" prop:indeterminate={true} />
)

// ============================================
// Properties<T> — writable element-specific props
// ============================================
// These come from the Properties<T> mapped type in
// jsx-with-properties.d.ts, which generates prop:K for every
// writable, primitive-valued, element-specific key not on
// the SkipPropsFrom base classes (HTMLElement, Element, Node).

// -- input --
const propInput = (
	<input
		prop:value="hello"
		prop:checked={true}
		prop:disabled={true}
		prop:readOnly={true}
		prop:multiple={true}
		prop:type="text"
		prop:defaultValue="default"
		prop:defaultChecked={false}
		prop:name="field"
		prop:placeholder="enter..."
		prop:required={true}
		prop:size={20}
		prop:maxLength={100}
		prop:minLength={1}
		prop:accept="image/*"
	/>
)

// -- select --
const propSelectFull = (
	<select
		prop:value="opt-b"
		prop:selectedIndex={1}
		prop:multiple={true}
		prop:disabled={true}
		prop:size={5}
		prop:name="sel"
		prop:required={true}
	>
		<option>opt-a</option>
	</select>
)

// -- textarea --
const propTextarea = (
	<textarea
		prop:value="content"
		prop:readOnly={true}
		prop:disabled={true}
		prop:cols={40}
		prop:rows={10}
		prop:wrap="soft"
		prop:maxLength={500}
		prop:minLength={1}
		prop:placeholder="type here"
		prop:name="body"
		prop:defaultValue="initial"
		prop:required={true}
	/>
)

// -- anchor --
const propAnchor = (
	<a
		prop:href="https://example.com"
		prop:target="_blank"
		prop:rel="noopener"
		prop:download="file.txt"
		prop:hreflang="en"
		prop:type="text/html"
		prop:text="link text"
		prop:ping="https://track.example.com"
	/>
)

// -- form --
const propForm = (
	<form
		prop:action="/submit"
		prop:method="post"
		prop:target="_self"
		prop:noValidate={true}
		prop:encoding="multipart/form-data"
		prop:enctype="multipart/form-data"
		prop:acceptCharset="utf-8"
		prop:name="myform"
	/>
)

// -- label / output --
const propLabel = <label prop:htmlFor="input-id" />
const propOutput = <output prop:value="result" prop:name="out" />

// -- button --
const propButton = (
	<button
		prop:disabled={true}
		prop:type="submit"
		prop:name="btn"
		prop:value="go"
	/>
)

// -- img --
const propImg = (
	<img
		prop:src="/photo.jpg"
		prop:alt="A photo"
		prop:width={300}
		prop:height={200}
		prop:loading="lazy"
		prop:decoding="async"
		prop:crossOrigin="anonymous"
	/>
)

// -- canvas --
const propCanvas = <canvas prop:width={640} prop:height={480} />

// -- video --
const propVideo = (
	<video
		prop:src="/movie.mp4"
		prop:poster="/thumb.jpg"
		prop:width={640}
		prop:height={360}
		prop:volume={0.8}
		prop:currentTime={10}
		prop:playbackRate={1.5}
		prop:defaultPlaybackRate={1}
		prop:muted={true}
		prop:autoplay={false}
		prop:loop={true}
		prop:controls={true}
		prop:preload="metadata"
		prop:crossOrigin="anonymous"
		prop:playsInline={true}
	/>
)

// -- audio --
const propAudio = (
	<audio
		prop:src="/track.mp3"
		prop:volume={0.5}
		prop:currentTime={0}
		prop:playbackRate={1}
		prop:muted={false}
		prop:autoplay={false}
		prop:loop={false}
		prop:controls={true}
		prop:preload="auto"
	/>
)

// -- iframe --
const propIframe = (
	<iframe
		prop:src="https://example.com"
		prop:srcdoc="<p>hi</p>"
		prop:name="myframe"
		prop:width="800"
		prop:height="600"
		prop:loading="lazy"
	/>
)

// -- table cell --
const propTd = <td prop:colSpan={2} prop:rowSpan={3} />
const propTh = <th prop:colSpan={4} prop:rowSpan={1} />

// -- ol --
const propOl = (
	<ol prop:reversed={true} prop:start={5} prop:type="a" />
)

// -- li --
const propLi = <li prop:value={3} />

// -- dialog --
const propDialog = (
	<dialog prop:open={true} prop:returnValue="confirmed" />
)

// -- details --
const propDetails = (
	<details prop:open={true}>
		<summary>expand</summary>
	</details>
)

// -- fieldset --
const propFieldset = (
	<fieldset prop:disabled={true} prop:name="group" />
)

// -- optgroup / option --
const propOptgroup = (
	<optgroup prop:disabled={true} prop:label="Group A" />
)
const propOption = (
	<option
		prop:value="v"
		prop:label="Label"
		prop:disabled={true}
		prop:selected={true}
		prop:defaultSelected={false}
	/>
)

// -- progress / meter --
const propProgress = <progress prop:value={50} prop:max={100} />
const propMeter = (
	<meter
		prop:value={0.6}
		prop:min={0}
		prop:max={1}
		prop:low={0.2}
		prop:high={0.8}
		prop:optimum={0.5}
	/>
)

// -- track --
const propTrack = (
	<track
		prop:kind="subtitles"
		prop:src="/subs.vtt"
		prop:srclang="en"
		prop:label="English"
		prop:default={true}
	/>
)

// -- data / time --
const propData = <data prop:value="42" />

// ============================================
// Properties<T> — Accessor (signal) values
// ============================================
// Properties<T> wraps values as Accessor<T[K]>, so signals,
// functions, and plain values should all be accepted.

const [propSig] = signal('hello')

const propAccessorInput = (
	<input
		prop:value={propSig}
		prop:checked={() => true}
		prop:disabled={false}
		prop:placeholder={memo(() => 'search...')}
	/>
)

const propAccessorAnchor = (
	<a prop:href={propSig} prop:target={() => '_blank'} />
)

const [propNumSig] = signal(10)
const propAccessorVideo = (
	<video
		prop:volume={() => 0.5}
		prop:currentTime={propNumSig}
		prop:muted={() => false}
	/>
)

// ============================================
// Properties<T> — negative tests (should NOT exist)
// ============================================
// These verify the Properties<T> filter chain: readonly keys,
// base-class keys (SkipPropsFrom), non-primitive keys, and
// aria-prefixed keys are all excluded from prop:*.

// -- readonly properties (IsReadonlyKey catches these) --
// These are the cases IsSingletonLiteral used to guard:
// singleton literals like tagName:"INPUT" are always readonly
// in lib.dom.d.ts, so IsReadonlyKey is sufficient.

// @ts-expect-error tagName is readonly on HTMLInputElement
const negReadonlyTagName = <input prop:tagName="INPUT" />

// @ts-expect-error form is readonly (& not primitive) on input
const negReadonlyForm = <input prop:form={null} />

// @ts-expect-error naturalWidth is readonly on img
const negReadonlyNatW = <img prop:naturalWidth={100} />

// @ts-expect-error naturalHeight is readonly on img
const negReadonlyNatH = <img prop:naturalHeight={100} />

// @ts-expect-error complete is readonly on img
const negReadonlyComplete = <img prop:complete={true} />

// @ts-expect-error videoWidth is readonly on video
const negReadonlyVidW = <video prop:videoWidth={1920} />

// @ts-expect-error videoHeight is readonly on video
const negReadonlyVidH = <video prop:videoHeight={1080} />

// @ts-expect-error duration is readonly on media
const negReadonlyDuration = <video prop:duration={120} />

// @ts-expect-error paused is readonly on media
const negReadonlyPaused = <video prop:paused={false} />

// @ts-expect-error ended is readonly on media
const negReadonlyEnded = <audio prop:ended={false} />

// @ts-expect-error readyState is readonly on media
const negReadonlyRS = <video prop:readyState={4} />

// @ts-expect-error cellIndex is readonly on td
const negReadonlyCellIdx = <td prop:cellIndex={0} />

// @ts-expect-error type is readonly on select
const negReadonlySelType = <select prop:type="select-one" />

// -- base-class properties (SkipPropsFrom catches these) --
// Writable props on HTMLElement/Element/Node are filtered
// because they're shared by all elements — use them as
// regular attributes instead.

// @ts-expect-error title is on HTMLElement (SkipPropsFrom)
const negBaseTitle = <div prop:title="hello" />

// @ts-expect-error lang is on HTMLElement (SkipPropsFrom)
const negBaseLang = <div prop:lang="en" />

// @ts-expect-error dir is on HTMLElement (SkipPropsFrom)
const negBaseDir = <div prop:dir="ltr" />

// @ts-expect-error className is on Element (SkipPropsFrom)
const negBaseClassName = <div prop:className="cls" />

// @ts-expect-error tabIndex is on HTMLElement (SkipPropsFrom)
const negBaseTabIndex = <div prop:tabIndex={0} />

// @ts-expect-error contentEditable on HTMLElement (SkipPropsFrom)
const negBaseCE = <div prop:contentEditable="true" />

// -- non-primitive properties (type filter catches these) --
// Properties<T> only includes T[K] extends string|number|boolean|null

// @ts-expect-error files is FileList|null — not primitive
const negNonPrimFiles = <input prop:files={null} />

// @ts-expect-error validity is ValidityState — not primitive
const negNonPrimValidity = <input prop:validity={{}} />

// @ts-expect-error style is CSSStyleDeclaration — not primitive
const negNonPrimStyle = <div prop:style={{}} />

// @ts-expect-error classList is DOMTokenList — not primitive
const negNonPrimClassList = <div prop:classList={{}} />

// -- aria-prefixed keys (template literal filter) --

// @ts-expect-error aria props are handled by AriaAttributes
const negAriaLabel = <div prop:ariaLabel="hi" />

// @ts-expect-error aria props filtered from prop:*
const negAriaHidden = <div prop:ariaHidden="true" />

// -- completely bogus prop:* names --

// @ts-expect-error nonexistent property
const negBogus = <div prop:doesNotExist="x" />

// @ts-expect-error nonexistent property on input
const negBogusInput = <input prop:fakeProperty={true} />

// ============================================
// Properties<T> — type correctness
// ============================================
// Verify prop:* accepts the correct type for the property,
// not arbitrary values.

// @ts-expect-error prop:checked expects boolean, not string
const negTypeChecked = <input prop:checked="yes" />

// @ts-expect-error prop:selectedIndex expects number, not string
const negTypeSelIdx = <select prop:selectedIndex="0" />

// @ts-expect-error prop:colSpan expects number, not string
const negTypeColSpan = <td prop:colSpan="2" />

// @ts-expect-error prop:volume expects number, not string
const negTypeVolume = <video prop:volume="loud" />

// @ts-expect-error prop:open expects boolean, not string
const negTypeOpen = <dialog prop:open="true" />

// @ts-expect-error prop:reversed expects boolean, not number
const negTypeReversed = <ol prop:reversed={1} />

// @ts-expect-error prop:noValidate expects boolean, not string
const negTypeNoValidate = <form prop:noValidate="yes" />

// @ts-expect-error prop:width on canvas is number, not string
const negTypeCanvasW = <canvas prop:width="640" />

// ============================================
// Hand-coded prop:* from jsx.d.ts
// ============================================
// These are explicitly declared in the hand-maintained attribute
// interfaces because Properties<T> filters them (they're on base
// classes in SkipPropsFrom or have non-primitive types).

// prop:innerHTML and prop:textContent — on ElementAttributes
const handCodedElement = (
	<div prop:innerHTML="<b>bold</b>" prop:textContent="plain" />
)

// prop:innerText — on HTMLAttributes
const handCodedHTML = <span prop:innerText="text" />

// prop:srcObject — auto-generated by Properties<T>
// `PropValue` in properties.d.ts includes MediaStream | MediaSource |
// Blob | File, so the mapped type emits `prop:srcObject` on audio /
// video without any hand-coded declaration. Covers all four union
// members plus a signal-wrapped form, plus a negative.
const mediaStream = new MediaStream()
declare const mediaSource: MediaSource
const blob = new Blob()
declare const file: File
declare const srcSignal: SignalAccessor<MediaStream>

const propSrcObjectStream = <video prop:srcObject={mediaStream} />
const propSrcObjectSource = <video prop:srcObject={mediaSource} />
const propSrcObjectBlob = <video prop:srcObject={blob} />
const propSrcObjectFile = <video prop:srcObject={file} />
const propSrcObjectAudio = <audio prop:srcObject={mediaStream} />
const propSrcObjectSignal = <video prop:srcObject={srcSignal} />
const propSrcObjectBad = (
	// @ts-expect-error prop:srcObject does not accept string
	<video prop:srcObject="not-a-stream" />
)

// prop:indeterminate — on HTMLInputElementAttributes
// Auto-generated by Properties<HTMLInputElement> — boolean +
// writable + element-specific. Covers true/false/signal/negative.
declare const indetSignal: SignalAccessor<boolean>

const propIndetTrue = <input prop:indeterminate={true} />
const propIndetFalse = <input prop:indeterminate={false} />
const propIndetSignal = <input prop:indeterminate={indetSignal} />
const propIndetBad = (
	// @ts-expect-error prop:indeterminate does not accept string
	<input prop:indeterminate="yes" />
)

// prop:value — on HTMLTextAreaElementAttributes
// Auto-generated by Properties<HTMLTextAreaElement>.
declare const taValueSignal: SignalAccessor<string>

const propTAValuePlain = <textarea prop:value="text" />
const propTAValueEmpty = <textarea prop:value="" />
const propTAValueSignal = <textarea prop:value={taValueSignal} />
// string-typed props on primitive elements accept number too
// (Properties<T> widens `string` → `string | number` for JSX
// ergonomics, since HTML coerces)
const propTAValueNum = <textarea prop:value={42} />
const propTAValueBad = (
	// @ts-expect-error still rejects boolean on a string-typed prop
	<textarea prop:value={true} />
)

// hand-coded + Properties coexist on same element
const handAndProps = (
	<input
		prop:indeterminate={true}
		prop:value="from Properties"
		prop:checked={false}
	/>
)

// ============================================
// Properties<T> widening: string-literal preservation
// ============================================
// Widening `string → string | number` must NOT clobber string
// literal unions — users still need narrowing / autocomplete for
// e.g. `autocapitalize`, `enterKeyHint`, `contentEditable`.

// Literal-union valued props stay narrow (no widening to string|number).
// HTMLImageElement.loading / decoding / fetchPriority are element-
// specific literal unions in lib.dom.d.ts.
const propLiteralKeep = (
	<img
		src="x.png"
		prop:loading="lazy"
		prop:decoding="async"
		prop:fetchPriority="high"
	/>
)

const propLiteralBad1 = (
	// @ts-expect-error 'nope' is not a valid loading value
	<img src="x.png" prop:loading="nope" />
)
const propLiteralBad2 = (
	// @ts-expect-error number does not narrow into the literal union
	<img src="x.png" prop:decoding={42} />
)

// A plain `string` prop on the same element still widens to
// string|number — proves the two branches of WidenPropValue coexist.
const propStringWidenOnImg = <img src="x.png" prop:alt={42} />

// Boolean props stay exact (no string|number widening there)
// Regression guard: HTMLFormElement has a `[name: string]: any`
// index signature. A naive widening would collapse specific boolean
// props like `noValidate` into Accessor<string|number>.
const propFormBool = (
	<form
		prop:action="/submit"
		prop:method="post"
		prop:noValidate={true}
	/>
)
const propFormBoolBad = (
	// @ts-expect-error prop:noValidate expects boolean
	<form prop:noValidate="true" />
)

// ============================================
// Element-ref prop values (popover / command APIs)
// ============================================
// `Element` is in PropValue so `Element | null`-typed props auto-
// generate. Covers HTMLButtonElement.popoverTargetElement and
// commandForElement (and the same on <input> via the PopoverTargetAttributes mixin).

declare const targetEl: HTMLElement

const propPopoverEl = (
	<button prop:popoverTargetElement={targetEl}>menu</button>
)
const propPopoverNull = (
	<button prop:popoverTargetElement={null}>menu</button>
)
const propCommandEl = (
	<button prop:commandForElement={targetEl}>go</button>
)
const propPopoverOnInput = (
	<input type="button" prop:popoverTargetElement={targetEl} />
)
const propPopoverBad = (
	// @ts-expect-error prop:popoverTargetElement expects Element | null
	<button prop:popoverTargetElement="not-an-element" />
)

// ============================================
// Recently-added attributes
// ============================================

// webkitdirectory on <input type=file> — directory picker
const webkitDirInput = (
	<input type="file" webkitdirectory multiple />
)
const webkitDirTrue = <input type="file" webkitdirectory="" />

// capture widened: bare attribute + enum values + arbitrary string
const captureBare = <input type="file" capture />
const captureUser = <input type="file" capture="user" />
const captureEnv = <input type="file" capture="environment" />

// anchor attribute (CSS Anchor Positioning, global)
const anchorGlobal = (
	<>
		<button id="trigger">toggle</button>
		<div popover="auto" anchor="trigger">
			anchored to the button
		</div>
	</>
)

// <link as="manifest">
const linkManifest = (
	<link rel="modulepreload" as="manifest" href="/manifest.webmanifest" />
)

const inputTypes = (
	<>
		<input type="range" min={0} max={100} step={5} />
		<input type="number" min={0} max={999} step={0.1} />
		<input type="file" accept="image/*" multiple={true} />
		<input type="date" min="2024-01-01" max="2025-12-31" />
		<input type="color" value="#ff0000" />
		<input type="email" multiple={true} autocomplete="email" />
		<input type="search" placeholder="search..." spellcheck="true" />
		<input type="url" pattern="https://.*" />
		<input type="tel" pattern="[0-9]{3}-[0-9]{4}" />
		<input type="password" minlength={8} maxlength={64} />
		<input type="hidden" name="csrf" value="token" />
	</>
)

// textarea specific attrs
const textareaAttrs = (
	<textarea
		cols={40}
		rows={10}
		wrap="hard"
		maxlength={500}
		placeholder="type here"
		dirname="text.dir"
	/>
)

// ============================================
// Button + popover API
// ============================================

const popoverTest = (
	<>
		<button popovertarget="my-popover" popovertargetaction="toggle">
			Toggle
		</button>
		<div popover="auto" id="my-popover">
			Popover content
		</div>
	</>
)

// ============================================
// Enumerated attributes (type-restricted)
// ============================================

const enumeratedAttrs = (
	<>
		<div
			contenteditable="true"
			dir="rtl"
			draggable="true"
			hidden="until-found"
			inputmode="numeric"
			spellcheck="true"
			translate="yes"
		/>
		<div
			contenteditable="plaintext-only"
			dir="auto"
			enterkeyhint="search"
		/>
		{/* @ts-expect-error invalid dir value */}
		<div dir="invalid" />
	</>
)

// ============================================
// HTML attributes with Accessor wrapping
// ============================================

const [strSignalForAttr] = signal('search')
// all attribute values can be reactive (Accessor<T>)
const reactiveAttrs = (
	<input
		type={() => 'text'}
		placeholder={strSignalForAttr}
		disabled={() => false}
		maxlength={derived(() => 100)}
	/>
)

// ============================================
// MathML elements
// ============================================

const mathTest = (
	<math>
		<mrow>
			<mi>x</mi>
			<mo>=</mo>
			<mfrac>
				<mrow>
					<mo>-</mo>
					<mi>b</mi>
				</mrow>
				<mrow>
					<mn>2</mn>
					<mi>a</mi>
				</mrow>
			</mfrac>
		</mrow>
	</math>
)

// ============================================
// data-* attributes (catch-all)
// ============================================

const dataAttrs = (
	<div data-testid="hello" data-anything="works" data-123="numbers" />
)

// custom element with declared type (only lala + HTML attrs)
const customAttrs = <my-component lala="hello" />

// ============================================
// Empty/void elements — no children allowed
// ============================================

const voidElements = (
	<>
		<br />
		<hr />
		<img src="" alt="" />
		<input />
		<meta content="" />
		<link rel="stylesheet" href="" />
		<col span={2} />
		<base href="/" />
		<source src="" />
		<track src="" />
		<wbr />
		<embed src="" type="" />
	</>
)

// ============================================
// Empty fragment / nested fragments / promises
// ============================================

// empty fragment
const emptyFrag = <></>

// deeply nested fragments
const deepFrag = (
	<>
		<>
			<>
				<div>deep</div>
			</>
		</>
	</>
)

// conditional JSX
const conditional = (
	<div>{count() > 0 ? <span>yes</span> : <span>no</span>}</div>
)

// promise as child
const promiseChild = (
	<div>{Promise.resolve(<span>async</span>)}</div>
)

// signal as on:click handler
const [handler] = signal((e: MouseEvent) => {})
const signalHandler = <div on:click={handler} />

// deeply nested reactive children
const deepReactive = (
	<div>{() => () => () => <span>deep lazy</span>}</div>
)

// array of signals as children
const [signalA] = signal('a')
const [signalB] = signal('b')
const signalChildren = (
	<div>
		{signalA}
		{signalB}
	</div>
)

// ============================================
// Component utility types — direct assertions
// ============================================

// Component<P> — function component with typed props
const PlainComp: Component<{ label: string }> = props => (
	<p>{props.label}</p>
)
const plainUsage = <PlainComp label="hi" />

// Component<P> — no props (defaults to {})
const NoPropsComp: Component = () => <span>no-props</span>
const noPropsUsage = <NoPropsComp />

// ComponentType<P> — function or class form
const ctFunc: ComponentType<{ x: number }> = props => (
	<span>{props.x}</span>
)
class CtClassComp extends Pota {
	render(props: Record<string, unknown>) {
		return <span>{String(props.x)}</span>
	}
}
const ctClass: ComponentType<{ x: number }> = CtClassComp

// ParentComponent<P> — receives children
const ParentComp: ParentComponent<{ title: string }> = ({
	title,
	children,
}) => (
	<section>
		<h2>{title}</h2>
		{children}
	</section>
)
const parentUsage = (
	<ParentComp title="T">
		<span>child</span>
	</ParentComp>
)

// VoidComponent<P> — no children
const VoidComp: VoidComponent<{ msg: string }> = ({ msg }) => (
	<p>{msg}</p>
)
const voidUsage = <VoidComp msg="ok" />

// FlowComponent<P, C> — callback children
const FlowComp: FlowComponent<
	{ items: string[] },
	Children<(item: string) => JSX.Element>
> = () => <div />
const flowUsageCallback = (
	<FlowComp items={['a', 'b']}>
		{item => <span>{item}</span>}
	</FlowComp>
)
const flowUsageArray = (
	<FlowComp items={['a']}>
		{[item => <span>{item}</span>, <p>static</p>]}
	</FlowComp>
)

// Children<C> — wrapped callback children type
type CbChildren = Children<(n: number) => JSX.Element>
const cbChildrenSingle: CbChildren = n => <span>{n}</span>
const cbChildrenArray: CbChildren = [
	n => <span>{n}</span>,
	<p>static</p>,
]

// Context<T> as a type — mirror what `context()` returns
const MyThemeCtx = context({ theme: 'dark' as 'dark' | 'light' })
const themeCtxAsType: Context<{ theme: 'dark' | 'light' }> =
	MyThemeCtx

// Dynamic<T, P> — props for the Dynamic component
type DynamicH1Props = Dynamic<'h1'>
const dynamicH1Props: DynamicH1Props = { component: 'h1' }

type DynamicCardProps = Dynamic<typeof Card>
const dynamicCardProps: DynamicCardProps = {
	component: Card,
	title: 'hi',
}

// Dynamic<T, P> with a custom P override
type DynamicCardCustomP = Dynamic<typeof Card, { title: string }>
const dynamicCardCustomP: DynamicCardCustomP = {
	component: Card,
	title: 'x',
}
