/**
 * Table of Elements:
 *
 * - https://potahtml.github.io/namespace-jsx-project/index.html
 *
 * The fields are a mix of:
 *
 * - MDN - https://developer.mozilla.org/
 * - Solid - https://www.solidjs.com/
 * - Voby - https://github.com/vobyjs/voby
 * - Preact - https://preactjs.com/
 * - Vue - https://vuejs.org/
 * - Chrome - https://www.google.com/chrome/
 * - Firefox - https://www.mozilla.org/
 *
 * TODO
 *
 * - SVG typings are non-existent
 */

// CSS

/// <reference path="../public/pota.d.ts" />
/// <reference path="./properties.d.ts" />

type CSSProperties = import('csstype').PropertiesHyphen & {
	[key: `-${string}`]: number | string | undefined
}

type NSStyle = {
	[Key in Exclude<
		keyof import('csstype').PropertiesHyphen,
		`-${string}`
	> as `style:${Key}`]?: Attribute<
		import('csstype').PropertiesHyphen[Key]
	>
}

type CSSAttributes = NSStyle & {
	class?: Attribute<
		| string
		| Array<string | false | null | undefined>
		| Record<
				string,
				Attribute<string | boolean | number | null | undefined>
		  >
	>

	style?: Attribute<
		| { [P in keyof CSSProperties]: Attribute<CSSProperties[P]> }
		| string
	>

	'use:css'?: Attribute<string>

	[attr: `class:${string}`]: Attribute<
		string | boolean | number | null | undefined
	>
}

/** Pota namespace JSX */
declare namespace JSX {
	// JSX.ElementAttributesProperty - name of the `props` argument

	interface ElementAttributesProperty {
		props: unknown
	}

	// JSX.ElementChildrenAttribute - name of the `children` prop

	interface ElementChildrenAttribute {
		children: {}
	}

	/**
	 * Called by TS with the component type `C` and the inferred props
	 * shape `P` — the return type is what JSX actually validates against.
	 *
	 * For class components (extending `Pota` / any `ElementClass`), the
	 * runtime `createClass` merges JSX props on top of the class's
	 * `props` field defaults, so every individual prop is optional at
	 * the JSX call site. Wrapping `P` in `Partial` expresses that.
	 *
	 * Function components pass through unchanged — their props are
	 * whatever the function's signature declares.
	 */
	type LibraryManagedAttributes<C, P> = C extends abstract new (
		...args: any
	) => ElementClass
		? Partial<P>
		: P

	/*
		JSX.IntrinsicClassAttributes // class attributes
		JSX.IntrinsicElements // tags
		JSX.IntrinsicAttributes // leaks to class and functional components
	*/

	// JSX.Element - return `value` of components

	type Element =
		| string
		| number
		| bigint
		| boolean
		| symbol
		| undefined
		| void
		// fancy
		| object // such CSSStyleSheet
		// dom
		| DOMElement
		| ChildNode
		| ElementType
		// | DocumentFragment cannot be `children`, we use `childNodes` instead
		// recurse
		| (() => Element)
		| Promise<unknown>
		| Element[]

	// JSX.ElementType - shape of a `component`

	type ElementType =
		| keyof IntrinsicElements
		| (new (
				props?: Record<string, unknown>,
		  ) => ElementClass)
		| ((props?: Record<string, unknown>) => Element)
		| { toString(): Element }

	// JSX.ElementClass - shape of `class` component

	type ElementClass = {
		props?: Record<string, unknown>
		ready?: () => void
		cleanup?: () => void
		render: (props?: Record<string, unknown>) => Element
	}

	// TYPES

	type Props<T = {}> = T & { children?: Element }

	type BooleanAttribute = boolean | ''

	type EnumeratedPseudoBoolean = 'false' | 'true'

	type StyleAttribute = Attribute<CSSProperties | string>

	// EVENTS

	type EventHandler<Event, Element> =
		| EventFunction<Event, Element>
		| EventObject<Event, Element>
		| (EventObject<Event, Element> & EventHandlerOptions)

	type EventHandlers<Event, Element> =
		| EventHandler<Event, Element>
		| EventHandlers<Event, Element>[] // recursive type

	type EventEvent<Event, Element> = Event & {
		currentTarget: Element
	}

	type EventFunction<Event, Element> =
		| ((e?: EventEvent<Event, Element>) => void)
		| Function

	type EventObject<Event, Element> = {
		handleEvent(e: EventEvent<Event, Element>): void
	}

	type EventHandlerOptions = AddEventListenerOptions &
		EventListenerOptions

	// CALLBACKS

	type CallbackElement<Element> =
		| ((node: Element) => void)
		| CallbackElement<Element>[] // recursive type

	type CallbackEvent<Event> = (
		event: EventEvent<Event, unknown>,
	) => void

	type CallbackEventElement<Event, Element> = (
		event: EventEvent<Event, Element>,
		node: Element,
	) => void

	type CallbackBind = SignalFunction<any> | CallbackBind[] // recursive type

	// CORE

	interface PotaAttributes<Element> {
		children?: JSX.Element // This is `JSX.Element`! Not `Element` argument

		// rendering
		'use:normalize'?: true

		// lifecycles
		'use:ref'?: CallbackElement<Element>
		'use:connected'?: CallbackElement<Element>
		'use:disconnected'?: CallbackElement<Element>

		// PLUGINS

		'use:bind'?: CallbackBind // no `<Element>` !

		'use:clickoutside'?: CallbackEventElement<PointerEvent, Element>
		'use:clickoutsideonce'?: CallbackEventElement<
			PointerEvent,
			Element
		>

		'use:fullscreen'?:
			| true
			| CallbackEventElement<PointerEvent, Element>

		'use:clipboard'?:
			| true
			| string
			| number
			| ((
					e: EventEvent<PointerEvent, Element>,
			  ) => string | number | null)
	}

	// all elements

	interface IntrinsicElements
		extends HTMLDeprecatedElements,
			MathMLDeprecatedElements,
			MathMLElements,
			SVGElements,
			HTMLElements,
			HTMLSpecialElements {}

	interface Elements extends IntrinsicElements {}

	/* Attributes */

	interface ElementAttributes<Element>
		extends PotaAttributes<Element>,
			CSSAttributes,
			AriaAttributes,
			EventHandlersElement<Element> {
		// properties
		'prop:innerHTML'?: Attribute<number | string>
		'prop:textContent'?: Attribute<number | string>

		// attributes

		// xml
		xmlns?: Attribute<string>
		[attr: `xmlns:${string}`]: Attribute<string>

		autofocus?: Attribute<BooleanAttribute>
		elementtiming?: Attribute<string>
		id?: Attribute<string>
		nonce?: Attribute<string>
		part?: Attribute<string>
		slot?: Attribute<string>
		tabindex?: Attribute<number | string>
	}

	interface HTMLAttributes<Element>
		extends ElementAttributes<Element> {
		// properties
		'prop:innerText'?: Attribute<number | string>

		// attributes
		accesskey?: Attribute<string>
		anchor?: Attribute<string>
		autocapitalize?: Attribute<
			'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
		>
		autocorrect?: Attribute<'on' | 'off'>
		contenteditable?: Attribute<
			EnumeratedPseudoBoolean | 'plaintext-only' | 'inherit' | ''
		>
		dir?: Attribute<'ltr' | 'rtl' | 'auto'>
		draggable?: Attribute<EnumeratedPseudoBoolean>
		enterkeyhint?: Attribute<
			| 'enter'
			| 'done'
			| 'go'
			| 'next'
			| 'previous'
			| 'search'
			| 'send'
		>
		exportparts?: Attribute<string>
		hidden?: Attribute<'' | 'hidden' | 'until-found'>
		inert?: Attribute<BooleanAttribute>
		inputmode?: Attribute<
			| 'decimal'
			| 'email'
			| 'none'
			| 'numeric'
			| 'search'
			| 'tel'
			| 'text'
			| 'url'
		>
		is?: Attribute<string>
		lang?: Attribute<string>
		popover?: Attribute<'' | 'manual' | 'auto' | 'hint'>
		spellcheck?: Attribute<'' | EnumeratedPseudoBoolean>
		title?: Attribute<string>
		translate?: Attribute<'yes' | 'no'>

		// microdata
		itemid?: Attribute<string>
		itemprop?: Attribute<string>
		itemref?: Attribute<string>
		itemscope?: Attribute<BooleanAttribute>
		itemtype?: Attribute<string>

		// RDFa attributes
		about?: Attribute<string>
		datatype?: Attribute<string>
		inlist?: Attribute<any>
		prefix?: Attribute<string>
		property?: Attribute<string>
		resource?: Attribute<string>
		typeof?: Attribute<string>
		vocab?: Attribute<string>

		/** @experimental */
		virtualkeyboardpolicy?: Attribute<'' | 'auto' | 'manual'>
		/** @experimental */
		writingsuggestions?: Attribute<EnumeratedPseudoBoolean>

		/** @deprecated */
		contextmenu?: Attribute<string>
	}
	interface SVGAttributes<Element>
		extends ElementAttributes<Element> {
		[attr: `${string}`]: Attribute<any> // catch all TODO
	}
	interface MathMLAttributes<Element>
		extends ElementAttributes<Element> {
		dir?: Attribute<'ltr' | 'rtl' | 'auto'>
		displaystyle?: Attribute<BooleanAttribute>
		scriptlevel?: Attribute<string>

		/** @deprecated */
		href?: Attribute<string>
		/** @deprecated */
		mathbackground?: Attribute<string>
		/** @deprecated */
		mathcolor?: Attribute<string>
		/** @deprecated */
		mathsize?: Attribute<string>
	}

	/* SPECIAL INTERFACES */

	interface HTMLMediaHTMLAttributes<Element> {
		// attributes
		autoplay?: Attribute<BooleanAttribute>
		controls?: Attribute<BooleanAttribute>
		controlslist?: Attribute<
			| 'nodownload'
			| 'nofullscreen'
			| 'noplaybackrate'
			| 'noremoteplayback'
			| (string & {})
		>
		crossorigin?: Attribute<'anonymous' | 'use-credentials' | ''>
		disableremoteplayback?: Attribute<BooleanAttribute>
		loop?: Attribute<BooleanAttribute>
		muted?: Attribute<BooleanAttribute>
		preload?: Attribute<'none' | 'metadata' | 'auto' | ''>
		src?: Attribute<string>

		'on:encrypted'?: EventHandlers<MediaEncryptedEvent, Element>
		'on:waitingforkey'?: EventHandlers<Event, Element>

		/** @deprecated */
		mediagroup?: Attribute<string>
	}

	/* SPECIAL ELEMENTS */

	interface HTMLWebViewElementAttributes<Element>
		extends HTMLAttributes<Element> {
		allowpopups?: Attribute<BooleanAttribute>
		disableblinkfeatures?: Attribute<string>
		disablewebsecurity?: Attribute<BooleanAttribute>
		enableblinkfeatures?: Attribute<string>
		httpreferrer?: Attribute<string>
		nodeintegration?: Attribute<BooleanAttribute>
		nodeintegrationinsubframes?: Attribute<BooleanAttribute>
		partition?: Attribute<string>
		plugins?: Attribute<BooleanAttribute>
		preload?: Attribute<string>
		src?: Attribute<string>
		useragent?: Attribute<string>
		webpreferences?: Attribute<string>

		// does this exists?
		allowfullscreen?: Attribute<BooleanAttribute>
		autosize?: Attribute<BooleanAttribute>

		/** @deprecated */
		blinkfeatures?: Attribute<string>
		/** @deprecated */
		disableguestresize?: Attribute<BooleanAttribute>
		/** @deprecated */
		guestinstance?: Attribute<string>
	}

	/* HTMLElements */

	interface HTMLAnchorElementAttributes<Element>
		extends HTMLAttributes<Element> {
		download?: Attribute<string | BooleanAttribute>
		href?: Attribute<string>
		hreflang?: Attribute<string>
		ping?: Attribute<string>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Attribute<string>
		target?: Attribute<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
		type?: Attribute<string>

		/** @experimental */
		attributionsrc?: Attribute<string>

		/** @deprecated */
		charset?: Attribute<string>
		/** @deprecated */
		coords?: Attribute<string>
		/** @deprecated */
		name?: Attribute<string>
		/** @deprecated */
		rev?: Attribute<string>
		/** @deprecated */
		shape?: Attribute<'rect' | 'circle' | 'poly' | 'default'>
	}
	interface HTMLAreaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		alt?: Attribute<string>
		coords?: Attribute<string>
		download?: Attribute<string | BooleanAttribute>
		href?: Attribute<string>
		ping?: Attribute<string>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Attribute<string>
		shape?: Attribute<'rect' | 'circle' | 'poly' | 'default'>
		target?: Attribute<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>

		/** @experimental */
		attributionsrc?: Attribute<string>

		/** @deprecated */
		nohref?: Attribute<BooleanAttribute>
	}
	interface HTMLAudioElementAttributes<Element>
		extends HTMLAttributes<Element>,
			HTMLMediaHTMLAttributes<Element> {}
	interface HTMLBRElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		clear?: Attribute<string>
	}
	interface HTMLBaseElementAttributes<Element>
		extends HTMLAttributes<Element> {
		href?: Attribute<string>
		target?: Attribute<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
	}
	interface HTMLBdoElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLBodyElementAttributes<Element>
		extends HTMLAttributes<Element>,
			EventHandlersWindow<Element> {
		/** @deprecated */
		alink?: Attribute<string>
		/** @deprecated */
		background?: Attribute<string>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		bottommargin?: Attribute<number | string>
		/** @deprecated */
		leftmargin?: Attribute<number | string>
		/** @deprecated */
		link?: Attribute<string>
		/** @deprecated */
		rightmargin?: Attribute<number | string>
		/** @deprecated */
		text?: Attribute<string>
		/** @deprecated */
		topmargin?: Attribute<number | string>
		/** @deprecated */
		vlink?: Attribute<string>
	}
	interface HTMLButtonElementAttributes<Element>
		extends HTMLAttributes<Element> {
		command?: Attribute<
			| 'show-modal'
			| 'close'
			| 'show-popover'
			| 'hide-popover'
			| 'toggle-popover'
			| (string & {})
		>
		commandfor?: Attribute<string>
		disabled?: Attribute<BooleanAttribute>
		form?: Attribute<string>
		formaction?: Attribute<string>
		formenctype?: Attribute<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		formmethod?: Attribute<'post' | 'get' | 'dialog'>
		formnovalidate?: Attribute<BooleanAttribute>
		formtarget?: Attribute<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
		name?: Attribute<string>
		popovertarget?: Attribute<string>
		popovertargetaction?: Attribute<'hide' | 'show' | 'toggle'>
		type?: Attribute<'submit' | 'reset' | 'button' | 'menu'>
		value?: Attribute<number | string>
	}
	interface HTMLCanvasElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Attribute<number | string>
		width?: Attribute<number | string>

		/** @deprecated */
		'moz-opaque'?: Attribute<BooleanAttribute>
	}
	interface HTMLDListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Attribute<BooleanAttribute>
	}
	interface HTMLDataElementAttributes<Element>
		extends HTMLAttributes<Element> {
		value?: Attribute<number | string>
	}
	interface HTMLDataListElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLDetailsElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Attribute<string>
		open?: Attribute<BooleanAttribute>
	}
	interface HTMLDialogElementAttributes<Element>
		extends HTMLAttributes<Element> {
		open?: Attribute<BooleanAttribute>
		tabindex?: never
		'prop:tabindex'?: never

		/** @experimental */
		closedby?: Attribute<'any' | 'closerequest' | 'none'>
	}
	interface HTMLDivElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLEmbedElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Attribute<number | string>
		src?: Attribute<string>
		type?: Attribute<string>
		width?: Attribute<number | string>

		/** @deprecated */
		align?: Attribute<'left' | 'right' | 'justify' | 'center'>
		/** @deprecated */
		name?: Attribute<string>
	}
	interface HTMLFieldSetElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Attribute<BooleanAttribute>
		form?: Attribute<string>
		name?: Attribute<string>
	}
	interface HTMLFormElementAttributes<Element>
		extends HTMLAttributes<Element> {
		'accept-charset'?: Attribute<string>
		action?: Attribute<string>
		autocomplete?: Attribute<'on' | 'off'>
		encoding?: Attribute<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		enctype?: Attribute<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		method?: Attribute<'post' | 'get' | 'dialog'>
		name?: Attribute<string>
		novalidate?: Attribute<BooleanAttribute>
		rel?: Attribute<string>
		target?: Attribute<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>

		/** @deprecated */
		accept?: Attribute<string>
	}
	interface HTMLHRElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<string>
		/** @deprecated */
		color?: Attribute<string>
		/** @deprecated */
		noshade?: Attribute<BooleanAttribute>
		/** @deprecated */
		size?: Attribute<string>
		/** @deprecated */
		width?: Attribute<string>
	}
	interface HTMLHeadElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		profile?: Attribute<string>
	}
	interface HTMLHeadingElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLHtmlElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		version?: Attribute<string>
	}
	interface HTMLIFrameElementAttributes<Element>
		extends HTMLAttributes<Element> {
		allow?: Attribute<string>
		allowfullscreen?: Attribute<BooleanAttribute>
		height?: Attribute<number | string>
		loading?: Attribute<'eager' | 'lazy'>
		name?: Attribute<string>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		sandbox?: Attribute<
			| 'allow-downloads-without-user-activation'
			| 'allow-downloads'
			| 'allow-forms'
			| 'allow-modals'
			| 'allow-orientation-lock'
			| 'allow-pointer-lock'
			| 'allow-popups'
			| 'allow-popups-to-escape-sandbox'
			| 'allow-presentation'
			| 'allow-same-origin'
			| 'allow-scripts'
			| 'allow-storage-access-by-user-activation'
			| 'allow-top-navigation'
			| 'allow-top-navigation-by-user-activation'
			| 'allow-top-navigation-to-custom-protocols'
			| string
		>
		src?: Attribute<string>
		srcdoc?: Attribute<string>
		width?: Attribute<number | string>

		/** @non-standard */
		browsingtopics?: Attribute<BooleanAttribute>

		/** @experimental */
		credentialless?: Attribute<BooleanAttribute>
		/** @experimental */
		csp?: Attribute<string>
		/** @experimental */
		sharedstoragewritable?: Attribute<BooleanAttribute>
		/** @experimental */
		adauctionheaders?: Attribute<BooleanAttribute>
		/** @experimental */
		privatetoken?: Attribute<string>

		/** @deprecated */
		allowpaymentrequest?: Attribute<BooleanAttribute>
		/** @deprecated */
		allowtransparency?: Attribute<BooleanAttribute>
		/** @deprecated */
		align?: Attribute<string>
		/** @deprecated */
		frameborder?: Attribute<number | string>
		/** @deprecated */
		longdesc?: Attribute<string>
		/** @deprecated */
		marginheight?: Attribute<number | string>
		/** @deprecated */
		marginwidth?: Attribute<number | string>
		/** @deprecated */
		scrolling?: Attribute<'yes' | 'no' | 'auto'>
		/** @deprecated */
		seamless?: Attribute<BooleanAttribute>
	}
	interface HTMLImageElementAttributes<Element>
		extends HTMLAttributes<Element> {
		alt?: Attribute<string>
		attributionsrc?: Attribute<string>
		browsingtopics?: Attribute<string>
		crossorigin?: Attribute<'anonymous' | 'use-credentials' | ''>
		decoding?: Attribute<'sync' | 'async' | 'auto'>
		fetchpriority?: Attribute<'high' | 'low' | 'auto'>
		height?: Attribute<number | string>
		ismap?: Attribute<BooleanAttribute>
		loading?: Attribute<'eager' | 'lazy'>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		sizes?: Attribute<string>
		src?: Attribute<string>
		srcset?: Attribute<string>
		usemap?: Attribute<string>
		width?: Attribute<number | string>

		/** @experimental */
		sharedstoragewritable?: Attribute<BooleanAttribute>

		/** @deprecated */
		align?: Attribute<'top' | 'middle' | 'bottom' | 'left' | 'right'>
		/** @deprecated */
		border?: Attribute<string>
		/** @deprecated */
		hspace?: Attribute<number | string>
		/** @deprecated */
		intrinsicsize?: Attribute<string>
		/** @deprecated */
		longdesc?: Attribute<string>
		/** @deprecated */
		lowsrc?: Attribute<string>
		/** @deprecated */
		name?: Attribute<string>
		/** @deprecated */
		vspace?: Attribute<number | string>
	}
	interface HTMLInputElementAttributes<Element>
		extends HTMLAttributes<Element> {
		// attributes
		accept?: Attribute<string>
		alt?: Attribute<string>
		alpha?: Attribute<BooleanAttribute>
		autocomplete?: Attribute<
			| 'additional-name'
			| 'address-level1'
			| 'address-level2'
			| 'address-level3'
			| 'address-level4'
			| 'address-line1'
			| 'address-line2'
			| 'address-line3'
			| 'bday'
			| 'bday-day'
			| 'bday-month'
			| 'bday-year'
			| 'billing'
			| 'cc-additional-name'
			| 'cc-csc'
			| 'cc-exp'
			| 'cc-exp-month'
			| 'cc-exp-year'
			| 'cc-family-name'
			| 'cc-given-name'
			| 'cc-name'
			| 'cc-number'
			| 'cc-type'
			| 'country'
			| 'country-name'
			| 'current-password'
			| 'email'
			| 'family-name'
			| 'fax'
			| 'given-name'
			| 'home'
			| 'honorific-prefix'
			| 'honorific-suffix'
			| 'impp'
			| 'language'
			| 'mobile'
			| 'name'
			| 'new-password'
			| 'nickname'
			| 'off'
			| 'on'
			| 'organization'
			| 'organization-title'
			| 'pager'
			| 'photo'
			| 'postal-code'
			| 'sex'
			| 'shipping'
			| 'street-address'
			| 'tel'
			| 'tel-area-code'
			| 'tel-country-code'
			| 'tel-extension'
			| 'tel-local'
			| 'tel-local-prefix'
			| 'tel-local-suffix'
			| 'tel-national'
			| 'transaction-amount'
			| 'transaction-currency'
			| 'url'
			| 'username'
			| 'work'
			| (string & {})
		>
		capture?: Attribute<
			'user' | 'environment' | BooleanAttribute | (string & {})
		>
		checked?: Attribute<BooleanAttribute>
		colorspace?: Attribute<string>
		dirname?: Attribute<string>
		disabled?: Attribute<BooleanAttribute>
		form?: Attribute<string>
		formaction?: Attribute<string>
		formenctype?: Attribute<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		formmethod?: Attribute<'post' | 'get' | 'dialog'>
		formnovalidate?: Attribute<BooleanAttribute>
		formtarget?: Attribute<string>
		height?: Attribute<number | string>
		incremental?: Attribute<BooleanAttribute>
		list?: Attribute<string>
		max?: Attribute<number | string>
		maxlength?: Attribute<number | string>
		min?: Attribute<number | string>
		minlength?: Attribute<number | string>
		multiple?: Attribute<BooleanAttribute>
		name?: Attribute<string>
		pattern?: Attribute<string>
		placeholder?: Attribute<string>
		popovertarget?: Attribute<string>
		popovertargetaction?: Attribute<'hide' | 'show' | 'toggle'>
		readonly?: Attribute<BooleanAttribute>
		required?: Attribute<BooleanAttribute>
		results?: Attribute<number | string>
		size?: Attribute<number | string>
		src?: Attribute<string>
		step?: Attribute<number | string>
		type?: Attribute<
			| 'button'
			| 'checkbox'
			| 'color'
			| 'date'
			| 'datetime-local'
			| 'email'
			| 'file'
			| 'hidden'
			| 'image'
			| 'month'
			| 'number'
			| 'password'
			| 'radio'
			| 'range'
			| 'reset'
			| 'search'
			| 'submit'
			| 'tel'
			| 'text'
			| 'time'
			| 'url'
			| 'week'
		>
		value?: Attribute<number | string>
		webkitdirectory?: Attribute<BooleanAttribute>
		width?: Attribute<number | string>

		/** @deprecated */
		align?: Attribute<string>
		/** @deprecated */
		usemap?: Attribute<string>
	}
	interface HTMLLIElementAttributes<Element>
		extends HTMLAttributes<Element> {
		value?: Attribute<number | string>

		/** @deprecated */
		type?: Attribute<'1' | 'a' | 'A' | 'i' | 'I'>
	}
	interface HTMLLabelElementAttributes<Element>
		extends HTMLAttributes<Element> {
		for?: Attribute<string>
		form?: Attribute<string>
	}
	interface HTMLLegendElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<string>
	}
	interface HTMLLinkElementAttributes<Element>
		extends HTMLAttributes<Element> {
		as?: Attribute<
			| 'audio'
			| 'document'
			| 'embed'
			| 'fetch'
			| 'font'
			| 'image'
			| 'manifest'
			| 'object'
			| 'script'
			| 'style'
			| 'track'
			| 'video'
			| 'worker'
		>
		color?: Attribute<string>
		crossorigin?: Attribute<'anonymous' | 'use-credentials' | ''>
		disabled?: Attribute<BooleanAttribute>
		fetchpriority?: Attribute<'high' | 'low' | 'auto'>
		href?: Attribute<string>
		hreflang?: Attribute<string>
		imagesizes?: Attribute<string>
		imagesrcset?: Attribute<string>
		integrity?: Attribute<string>
		media?: Attribute<string>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Attribute<string>
		sizes?: Attribute<string>
		type?: Attribute<string>

		/** @experimental */
		blocking?: Attribute<'render'>

		/** @deprecated */
		charset?: Attribute<string>
		/** @deprecated */
		rev?: Attribute<string>
		/** @deprecated */
		target?: Attribute<string>
	}
	interface HTMLMapElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Attribute<string>
	}
	interface HTMLMenuElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Attribute<BooleanAttribute>
		/** @deprecated */
		label?: Attribute<string>
		/** @deprecated */
		type?: Attribute<'context' | 'toolbar'>
	}
	interface HTMLMetaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		charset?: Attribute<string>
		content?: Attribute<string>
		'http-equiv'?: Attribute<
			| 'content-security-policy'
			| 'content-type'
			| 'default-style'
			| 'x-ua-compatible'
			| 'refresh'
		>
		media?: Attribute<string>
		name?: Attribute<string>

		/** @deprecated */
		scheme?: Attribute<string>
	}
	interface HTMLMeterElementAttributes<Element>
		extends HTMLAttributes<Element> {
		form?: Attribute<string>
		high?: Attribute<number | string>
		low?: Attribute<number | string>
		max?: Attribute<number | string>
		min?: Attribute<number | string>
		optimum?: Attribute<number | string>
		value?: Attribute<number | string>
	}
	interface HTMLModElementAttributes<Element>
		extends HTMLAttributes<Element> {
		cite?: Attribute<string>
		datetime?: Attribute<string>
	}
	interface HTMLOListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		reversed?: Attribute<BooleanAttribute>
		start?: Attribute<number | string>
		type?: Attribute<'1' | 'a' | 'A' | 'i' | 'I'>

		/** @deprecated */
		compact?: Attribute<BooleanAttribute>
	}
	interface HTMLObjectElementAttributes<Element>
		extends HTMLAttributes<Element> {
		data?: Attribute<string>
		form?: Attribute<string>
		height?: Attribute<number | string>
		name?: Attribute<string>
		type?: Attribute<string>
		width?: Attribute<number | string>
		wmode?: Attribute<string>

		/** @deprecated */
		align?: Attribute<string>
		/** @deprecated */
		archive?: Attribute<string>
		/** @deprecated */
		border?: Attribute<string>
		/** @deprecated */
		classid?: Attribute<string>
		/** @deprecated */
		code?: Attribute<string>
		/** @deprecated */
		codebase?: Attribute<string>
		/** @deprecated */
		codetype?: Attribute<string>
		/** @deprecated */
		declare?: Attribute<BooleanAttribute>
		/** @deprecated */
		hspace?: Attribute<number | string>
		/** @deprecated */
		standby?: Attribute<string>
		/** @deprecated */
		typemustmatch?: Attribute<BooleanAttribute>
		/** @deprecated */
		usemap?: Attribute<string>
		/** @deprecated */
		vspace?: Attribute<number | string>
	}
	interface HTMLOptGroupElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Attribute<BooleanAttribute>
		label?: Attribute<string>
	}
	interface HTMLOptionElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Attribute<BooleanAttribute>
		label?: Attribute<string>
		selected?: Attribute<BooleanAttribute>
		value?: Attribute<number | string>
	}
	interface HTMLOutputElementAttributes<Element>
		extends HTMLAttributes<Element> {
		for?: Attribute<string>
		form?: Attribute<string>
		name?: Attribute<string>
	}
	interface HTMLParagraphElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLPictureElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLPreElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Attribute<number | string>
		/** @deprecated */
		wrap?: Attribute<string>
	}
	interface HTMLPreElementListingAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLPreElementXmpAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLProgressElementAttributes<Element>
		extends HTMLAttributes<Element> {
		max?: Attribute<number | string>
		value?: Attribute<number | string>
	}
	interface HTMLQuoteElementAttributes<Element>
		extends HTMLAttributes<Element> {
		cite?: Attribute<string>
	}
	interface HTMLScriptElementAttributes<Element>
		extends HTMLAttributes<Element> {
		async?: Attribute<BooleanAttribute>
		crossorigin?: Attribute<'anonymous' | 'use-credentials' | ''>
		defer?: Attribute<BooleanAttribute>
		fetchpriority?: Attribute<'high' | 'low' | 'auto'>
		for?: Attribute<string>
		integrity?: Attribute<string>
		nomodule?: Attribute<BooleanAttribute>
		referrerpolicy?: Attribute<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		src?: Attribute<string>
		type?: Attribute<
			'importmap' | 'module' | 'speculationrules' | (string & {})
		>

		/** @experimental */
		attributionsrc?: Attribute<string>
		/** @experimental */
		blocking?: Attribute<'render'>

		/** @deprecated */
		charset?: Attribute<string>
		/** @deprecated */
		event?: Attribute<string>
		/** @deprecated */
		language?: Attribute<string>
	}
	interface HTMLSelectElementAttributes<Element>
		extends HTMLAttributes<Element> {
		autocomplete?: Attribute<
			| 'additional-name'
			| 'address-level1'
			| 'address-level2'
			| 'address-level3'
			| 'address-level4'
			| 'address-line1'
			| 'address-line2'
			| 'address-line3'
			| 'bday'
			| 'bday-day'
			| 'bday-month'
			| 'bday-year'
			| 'billing'
			| 'cc-additional-name'
			| 'cc-csc'
			| 'cc-exp'
			| 'cc-exp-month'
			| 'cc-exp-year'
			| 'cc-family-name'
			| 'cc-given-name'
			| 'cc-name'
			| 'cc-number'
			| 'cc-type'
			| 'country'
			| 'country-name'
			| 'current-password'
			| 'email'
			| 'family-name'
			| 'fax'
			| 'given-name'
			| 'home'
			| 'honorific-prefix'
			| 'honorific-suffix'
			| 'impp'
			| 'language'
			| 'mobile'
			| 'name'
			| 'new-password'
			| 'nickname'
			| 'off'
			| 'on'
			| 'organization'
			| 'organization-title'
			| 'pager'
			| 'photo'
			| 'postal-code'
			| 'sex'
			| 'shipping'
			| 'street-address'
			| 'tel'
			| 'tel-area-code'
			| 'tel-country-code'
			| 'tel-extension'
			| 'tel-local'
			| 'tel-local-prefix'
			| 'tel-local-suffix'
			| 'tel-national'
			| 'transaction-amount'
			| 'transaction-currency'
			| 'url'
			| 'username'
			| 'work'
			| (string & {})
		>
		disabled?: Attribute<BooleanAttribute>
		form?: Attribute<string>
		multiple?: Attribute<BooleanAttribute>
		name?: Attribute<string>
		required?: Attribute<BooleanAttribute>
		size?: Attribute<number | string>
		value?: Attribute<number | string>
	}
	interface HTMLSlotElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Attribute<string>
	}
	interface HTMLSourceElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Attribute<number | string>
		media?: Attribute<string>
		sizes?: Attribute<string>
		src?: Attribute<string>
		srcset?: Attribute<string>
		type?: Attribute<string>
		width?: Attribute<number | string>
	}
	interface HTMLSpanElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLStyleElementAttributes<Element>
		extends HTMLAttributes<Element> {
		media?: Attribute<string>

		/** @experimental */
		blocking?: Attribute<'render'>

		/** @deprecated */
		scoped?: Attribute<BooleanAttribute>
		/** @deprecated */
		type?: Attribute<string>
	}
	interface HTMLTableCaptionElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<'left' | 'center' | 'right'>
	}
	interface HTMLTableCellTdElementAttributes<Element>
		extends HTMLAttributes<Element> {
		colspan?: Attribute<number | string>
		headers?: Attribute<string>
		rowspan?: Attribute<number | string>

		/** @deprecated */
		abbr?: Attribute<string>
		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		axis?: Attribute<string>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		height?: Attribute<number | string>
		/** @deprecated */
		nowrap?: Attribute<BooleanAttribute>
		/** @deprecated */
		scope?: Attribute<'col' | 'row' | 'rowgroup' | 'colgroup'>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLTableCellThElementAttributes<Element>
		extends HTMLAttributes<Element> {
		abbr?: Attribute<string>
		colspan?: Attribute<number | string>
		headers?: Attribute<string>
		rowspan?: Attribute<number | string>
		scope?: Attribute<'col' | 'row' | 'rowgroup' | 'colgroup'>

		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		axis?: Attribute<string>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		height?: Attribute<string>
		/** @deprecated */
		nowrap?: Attribute<BooleanAttribute>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLTableColElementAttributes<Element>
		extends HTMLAttributes<Element> {
		span?: Attribute<number | string>

		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLTableElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<'left' | 'center' | 'right'>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		border?: Attribute<number | string>
		/** @deprecated */
		cellpadding?: Attribute<number | string>
		/** @deprecated */
		cellspacing?: Attribute<number | string>
		/** @deprecated */
		frame?: Attribute<
			| 'void'
			| 'above'
			| 'below'
			| 'hsides'
			| 'vsides'
			| 'lhs'
			| 'rhs'
			| 'box'
			| 'border'
		>
		/** @deprecated */
		rules?: Attribute<'none' | 'groups' | 'rows' | 'cols' | 'all'>
		/** @deprecated */
		summary?: Attribute<string>
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLTableRowElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLTableSectionBodyElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionFootElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionHeadElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Attribute<
			'left' | 'center' | 'right' | 'justify' | 'char'
		>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		char?: Attribute<string>
		/** @deprecated */
		charoff?: Attribute<string>
		/** @deprecated */
		valign?: Attribute<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTemplateElementAttributes<Element>
		extends HTMLAttributes<Element> {
		shadowrootclonable?: Attribute<BooleanAttribute>
		shadowrootcustomelementregistry?: Attribute<BooleanAttribute>
		shadowrootdelegatesfocus?: Attribute<BooleanAttribute>
		shadowrootmode?: Attribute<'open' | 'closed'>
		shadowrootserializable?: Attribute<BooleanAttribute>
	}
	interface HTMLTextAreaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		autocomplete?: Attribute<
			| 'additional-name'
			| 'address-level1'
			| 'address-level2'
			| 'address-level3'
			| 'address-level4'
			| 'address-line1'
			| 'address-line2'
			| 'address-line3'
			| 'bday'
			| 'bday-day'
			| 'bday-month'
			| 'bday-year'
			| 'billing'
			| 'cc-additional-name'
			| 'cc-csc'
			| 'cc-exp'
			| 'cc-exp-month'
			| 'cc-exp-year'
			| 'cc-family-name'
			| 'cc-given-name'
			| 'cc-name'
			| 'cc-number'
			| 'cc-type'
			| 'country'
			| 'country-name'
			| 'current-password'
			| 'email'
			| 'family-name'
			| 'fax'
			| 'given-name'
			| 'home'
			| 'honorific-prefix'
			| 'honorific-suffix'
			| 'impp'
			| 'language'
			| 'mobile'
			| 'name'
			| 'new-password'
			| 'nickname'
			| 'off'
			| 'on'
			| 'organization'
			| 'organization-title'
			| 'pager'
			| 'photo'
			| 'postal-code'
			| 'sex'
			| 'shipping'
			| 'street-address'
			| 'tel'
			| 'tel-area-code'
			| 'tel-country-code'
			| 'tel-extension'
			| 'tel-local'
			| 'tel-local-prefix'
			| 'tel-local-suffix'
			| 'tel-national'
			| 'transaction-amount'
			| 'transaction-currency'
			| 'url'
			| 'username'
			| 'work'
			| (string & {})
		>
		cols?: Attribute<number | string>
		dirname?: Attribute<string>
		disabled?: Attribute<BooleanAttribute>
		form?: Attribute<string>
		maxlength?: Attribute<number | string>
		minlength?: Attribute<number | string>
		name?: Attribute<string>
		placeholder?: Attribute<string>
		readonly?: Attribute<BooleanAttribute>
		required?: Attribute<BooleanAttribute>
		rows?: Attribute<number | string>
		wrap?: Attribute<'hard' | 'soft' | 'off'>
	}
	interface HTMLTimeElementAttributes<Element>
		extends HTMLAttributes<Element> {
		datetime?: Attribute<string>
	}
	interface HTMLTitleElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLTrackElementAttributes<Element>
		extends HTMLAttributes<Element> {
		default?: Attribute<BooleanAttribute>
		kind?: Attribute<
			| 'alternative'
			| 'descriptions'
			| 'main'
			| 'main-desc'
			| 'translation'
			| 'commentary'
			// ??
			| 'subtitles'
			| 'captions'
			| 'chapters'
			| 'metadata'
		>
		label?: Attribute<string>
		src?: Attribute<string>
		srclang?: Attribute<string>
	}
	interface HTMLUListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Attribute<BooleanAttribute>
		/** @deprecated */
		type?: Attribute<'circle' | 'disc' | 'square'>
	}
	interface HTMLVideoElementAttributes<Element>
		extends HTMLAttributes<Element>,
			HTMLMediaHTMLAttributes<Element> {
		disablepictureinpicture?: Attribute<BooleanAttribute>
		height?: Attribute<number | string>
		playsinline?: Attribute<BooleanAttribute>
		poster?: Attribute<string>
		width?: Attribute<number | string>

		'on:enterpictureinpicture'?: EventHandlers<
			PictureInPictureEvent,
			Element
		>
		'on:leavepictureinpicture'?: EventHandlers<
			PictureInPictureEvent,
			Element
		>
	}

	/* HTMLDeprecatedElements */

	interface HTMLDirectoryElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Attribute<BooleanAttribute>
	}

	interface HTMLFontElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		color?: Attribute<string>
		/** @deprecated */
		face?: Attribute<string>
		/** @deprecated */
		size?: Attribute<string>
	}
	interface HTMLFrameElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		frameborder?: Attribute<string>
		/** @deprecated */
		longdesc?: Attribute<string>
		/** @deprecated */
		marginheight?: Attribute<string>
		/** @deprecated */
		marginwidth?: Attribute<string>
		/** @deprecated */
		name?: Attribute<string>
		/** @deprecated */
		noresize?: Attribute<BooleanAttribute>
		/** @deprecated */
		scrolling?: Attribute<'yes' | 'no'>
		/** @deprecated */
		src?: Attribute<string>
	}
	interface HTMLFrameSetElementAttributes<Element>
		extends HTMLAttributes<Element>,
			EventHandlersWindow<Element> {
		/** @deprecated */
		cols?: Attribute<number | string>
		/** @deprecated */
		rows?: Attribute<number | string>
	}
	interface HTMLMarqueeElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		behavior?: Attribute<'scroll' | 'slide' | 'alternate'>
		/** @deprecated */
		bgcolor?: Attribute<string>
		/** @deprecated */
		direction?: Attribute<'left' | 'right' | 'up' | 'down'>
		/** @deprecated */
		height?: Attribute<number | string>
		/** @deprecated */
		hspace?: Attribute<number | string>
		/** @deprecated */
		loop?: Attribute<number | string>
		/** @deprecated */
		scrollamount?: Attribute<number | string>
		/** @deprecated */
		scrolldelay?: Attribute<number | string>
		/** @deprecated */
		truespeed?: Attribute<BooleanAttribute>
		/** @deprecated */
		vspace?: Attribute<number | string>
		/** @deprecated */
		width?: Attribute<number | string>
	}
	interface HTMLParamElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		name?: Attribute<string>
		/** @deprecated */
		value?: Attribute<number | string>
		/** @deprecated */
		type?: Attribute<string>
		/** @deprecated */
		valuetype?: Attribute<'data' | 'ref' | 'object'>
	}

	interface HTMLUnknownElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLKeygenElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		challenge?: Attribute<string>
		/** @deprecated */
		disabled?: Attribute<BooleanAttribute>
		/** @deprecated */
		form?: Attribute<string>
		/** @deprecated */
		keyparams?: Attribute<string>
		/** @deprecated */
		keytype?: Attribute<string>
		/** @deprecated */
		name?: Attribute<string>
	}

	/* MathMLElements */

	interface MathMLAnnotationElementAttributes<Element>
		extends MathMLAttributes<Element> {
		encoding?: Attribute<string>

		/** @deprecated */
		src?: Attribute<string>
	}
	interface MathMLAnnotationXmlElementAttributes<Element>
		extends MathMLAttributes<Element> {
		encoding?: Attribute<string>

		/** @deprecated */
		src?: Attribute<string>
	}

	interface MathMLMathElementAttributes<Element>
		extends MathMLAttributes<Element> {
		display?: Attribute<'block' | 'inline'>
	}
	interface MathMLMerrorElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMfracElementAttributes<Element>
		extends MathMLAttributes<Element> {
		linethickness?: Attribute<string>

		/** @deprecated */
		denomalign?: Attribute<'center' | 'left' | 'right'>
		/** @deprecated */
		numalign?: Attribute<'center' | 'left' | 'right'>
	}
	interface MathMLMiElementAttributes<Element>
		extends MathMLAttributes<Element> {
		mathvariant?: Attribute<'normal'>
	}

	interface MathMLMmultiscriptsElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Attribute<string>
		/** @deprecated */
		superscriptshift?: Attribute<string>
	}
	interface MathMLMnElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMoElementAttributes<Element>
		extends MathMLAttributes<Element> {
		fence?: Attribute<BooleanAttribute>
		form?: Attribute<'prefix' | 'infix' | 'postfix'>
		largeop?: Attribute<BooleanAttribute>
		lspace?: Attribute<string>
		maxsize?: Attribute<string>
		minsize?: Attribute<string>
		movablelimits?: Attribute<BooleanAttribute>
		rspace?: Attribute<string>
		separator?: Attribute<BooleanAttribute>
		stretchy?: Attribute<BooleanAttribute>
		symmetric?: Attribute<BooleanAttribute>

		/** @non-standard */
		accent?: Attribute<BooleanAttribute>
	}
	interface MathMLMoverElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accent?: Attribute<BooleanAttribute>
	}
	interface MathMLMpaddedElementAttributes<Element>
		extends MathMLAttributes<Element> {
		depth?: Attribute<string>
		height?: Attribute<string>
		lspace?: Attribute<string>
		voffset?: Attribute<string>
		width?: Attribute<string>
	}
	interface MathMLMphantomElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMprescriptsElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMrootElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMrowElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMsElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		lquote?: Attribute<string>
		/** @deprecated */
		rquote?: Attribute<string>
	}
	interface MathMLMspaceElementAttributes<Element>
		extends MathMLAttributes<Element> {
		depth?: Attribute<string>
		height?: Attribute<string>
		width?: Attribute<string>
	}
	interface MathMLMsqrtElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMstyleElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		background?: Attribute<string>
		/** @deprecated */
		color?: Attribute<string>
		/** @deprecated */
		fontsize?: Attribute<string>
		/** @deprecated */
		fontstyle?: Attribute<string>
		/** @deprecated */
		fontweight?: Attribute<string>
		/** @deprecated */
		scriptminsize?: Attribute<string>
		/** @deprecated */
		scriptsizemultiplier?: Attribute<string>
	}
	interface MathMLMsubElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Attribute<string>
	}
	interface MathMLMsubsupElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Attribute<string>
		/** @deprecated */
		superscriptshift?: Attribute<string>
	}
	interface MathMLMsupElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		superscriptshift?: Attribute<string>
	}
	interface MathMLMtableElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		align?: Attribute<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
		/** @non-standard */
		columnalign?: Attribute<'center' | 'left' | 'right'>
		/** @non-standard */
		columnlines?: Attribute<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		columnspacing?: Attribute<string>
		/** @non-standard */
		frame?: Attribute<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		framespacing?: Attribute<string>
		/** @non-standard */
		rowalign?: Attribute<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
		/** @non-standard */
		rowlines?: Attribute<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		rowspacing?: Attribute<string>
		/** @non-standard */
		width?: Attribute<string>
	}
	interface MathMLMtdElementAttributes<Element>
		extends MathMLAttributes<Element> {
		columnspan?: Attribute<number | string>
		rowspan?: Attribute<number | string>
		/** @non-standard */
		columnalign?: Attribute<'center' | 'left' | 'right'>
		/** @non-standard */
		rowalign?: Attribute<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
	}
	interface MathMLMtextElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMtrElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		columnalign?: Attribute<'center' | 'left' | 'right'>
		/** @non-standard */
		rowalign?: Attribute<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
	}
	interface MathMLMunderElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accentunder?: Attribute<BooleanAttribute>
	}
	interface MathMLMunderoverElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accent?: Attribute<BooleanAttribute>
		accentunder?: Attribute<BooleanAttribute>
	}
	interface MathMLSemanticsElementAttributes<Element>
		extends MathMLAttributes<Element> {}

	/* MathMLDeprecatedElements */

	interface MathMLMactionElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		actiontype?: Attribute<'statusline' | 'toggle'>
		/** @deprecated */
		selection?: Attribute<string>
	}

	interface MathMLMencloseElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		notation?: Attribute<string>
	}
	interface MathMLMfencedElementAttributes<Element>
		extends MathMLAttributes<Element> {
		close?: Attribute<string>
		open?: Attribute<string>
		separators?: Attribute<string>
	}

	/* SVGElements */

	interface SVGAElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGAnimateElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGAnimateMotionElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGAnimateTransformElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGCircleElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGClipPathElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGDefsElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGDescElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGEllipseElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEBlendElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEColorMatrixElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEComponentTransferElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFECompositeElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEConvolveMatrixElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEDiffuseLightingElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEDisplacementMapElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEDistantLightElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEDropShadowElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEFloodElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEFuncAElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEFuncBElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEFuncGElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEFuncRElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEGaussianBlurElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEImageElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEMergeElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEMergeNodeElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEMorphologyElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEOffsetElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFEPointLightElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFESpecularLightingElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFESpotLightElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFETileElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFETurbulenceElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGFilterElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGForeignObjectElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGGElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGImageElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGLineElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGLinearGradientElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGMPathElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGMarkerElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGMaskElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGMetadataElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGPathElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGPatternElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGPolygonElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGPolylineElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGRadialGradientElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGRectElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGSVGElementAttributes<Element>
		extends SVGAttributes<Element>,
			EventHandlersWindow<Element> {}
	interface SVGScriptElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGSetElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGStopElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGStyleElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGSwitchElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGSymbolElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGTSpanElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGTextElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGTextPathElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGTitleElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGUseElementAttributes<Element>
		extends SVGAttributes<Element> {}
	interface SVGViewElementAttributes<Element>
		extends SVGAttributes<Element> {}

	// HTMLElements

	interface HTMLSpecialElements {
		/** @url https://www.electronjs.org/docs/latest/api/webview-tag */
		webview: HTMLWebViewElementAttributes<HTMLElement> &
			Properties<HTMLElement>
	}

	interface HTMLElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
		 */
		a: HTMLAnchorElementAttributes<HTMLAnchorElement> &
			Properties<HTMLAnchorElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		abbr: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		address: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement
		 */
		area: HTMLAreaElementAttributes<HTMLAreaElement> &
			Properties<HTMLAreaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		article: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		aside: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
		 */
		audio: HTMLAudioElementAttributes<HTMLAudioElement> &
			Properties<HTMLAudioElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		b: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBaseElement
		 */

		base: HTMLBaseElementAttributes<HTMLBaseElement> &
			Properties<HTMLBaseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		bdi: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		bdo: HTMLBdoElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
		 */

		blockquote: HTMLQuoteElementAttributes<HTMLQuoteElement> &
			Properties<HTMLQuoteElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement
		 */

		body: HTMLBodyElementAttributes<HTMLBodyElement> &
			Properties<HTMLBodyElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBRElement
		 */

		br: HTMLBRElementAttributes<HTMLBRElement> &
			Properties<HTMLBRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement
		 */

		button: HTMLButtonElementAttributes<HTMLButtonElement> &
			Properties<HTMLButtonElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
		 */

		canvas: HTMLCanvasElementAttributes<HTMLCanvasElement> &
			Properties<HTMLCanvasElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCaptionElement
		 */

		caption: HTMLTableCaptionElementAttributes<HTMLTableCaptionElement> &
			Properties<HTMLTableCaptionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		cite: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		code: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
		 */

		col: HTMLTableColElementAttributes<HTMLTableColElement> &
			Properties<HTMLTableColElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
		 */

		colgroup: HTMLTableColElementAttributes<HTMLTableColElement> &
			Properties<HTMLTableColElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataElement
		 */

		data: HTMLDataElementAttributes<HTMLDataElement> &
			Properties<HTMLDataElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataListElement
		 */
		datalist: HTMLDataListElementAttributes<HTMLDataListElement> &
			Properties<HTMLDataListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dd: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
		 */
		del: HTMLModElementAttributes<HTMLModElement> &
			Properties<HTMLModElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement
		 */
		details: HTMLDetailsElementAttributes<HTMLDetailsElement> &
			Properties<HTMLDetailsElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dfn: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
		 */
		dialog: HTMLDialogElementAttributes<HTMLDialogElement> &
			Properties<HTMLDialogElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement
		 */
		div: HTMLDivElementAttributes<HTMLDivElement> &
			Properties<HTMLDivElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDListElement
		 */
		dl: HTMLDListElementAttributes<HTMLDListElement> &
			Properties<HTMLDListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dt: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		em: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLEmbedElement
		 */
		embed: HTMLEmbedElementAttributes<HTMLEmbedElement> &
			Properties<HTMLEmbedElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement
		 */
		fieldset: HTMLFieldSetElementAttributes<HTMLFieldSetElement> &
			Properties<HTMLFieldSetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		figcaption: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		figure: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		footer: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement
		 */
		form: HTMLFormElementAttributes<HTMLFormElement> &
			Properties<HTMLFormElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h1: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h2: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h3: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h4: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h5: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h6: HTMLHeadingElementAttributes<HTMLHeadingElement> &
			Properties<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadElement
		 */
		head: HTMLHeadElementAttributes<HTMLHeadElement> &
			Properties<HTMLHeadElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		header: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		hgroup: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHRElement
		 */
		hr: HTMLHRElementAttributes<HTMLHRElement> &
			Properties<HTMLHRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHtmlElement
		 */
		html: HTMLHtmlElementAttributes<HTMLHtmlElement> &
			Properties<HTMLHtmlElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		i: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
		 */
		iframe: HTMLIFrameElementAttributes<HTMLIFrameElement> &
			Properties<HTMLIFrameElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement
		 */
		img: HTMLImageElementAttributes<HTMLImageElement> &
			Properties<HTMLImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement
		 */
		input: HTMLInputElementAttributes<HTMLInputElement> &
			Properties<HTMLInputElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
		 */
		ins: HTMLModElementAttributes<HTMLModElement> &
			Properties<HTMLModElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		kbd: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement
		 */
		label: HTMLLabelElementAttributes<HTMLLabelElement> &
			Properties<HTMLLabelElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLegendElement
		 */
		legend: HTMLLegendElementAttributes<HTMLLegendElement> &
			Properties<HTMLLegendElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLIElement
		 */
		li: HTMLLIElementAttributes<HTMLLIElement> &
			Properties<HTMLLIElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement
		 */
		link: HTMLLinkElementAttributes<HTMLLinkElement> &
			Properties<HTMLLinkElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		main: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement
		 */
		map: HTMLMapElementAttributes<HTMLMapElement> &
			Properties<HTMLMapElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		mark: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMenuElement
		 */
		menu: HTMLMenuElementAttributes<HTMLMenuElement> &
			Properties<HTMLMenuElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMetaElement
		 */
		meta: HTMLMetaElementAttributes<HTMLMetaElement> &
			Properties<HTMLMetaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMeterElement
		 */
		meter: HTMLMeterElementAttributes<HTMLMeterElement> &
			Properties<HTMLMeterElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		nav: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noscript: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement
		 */
		object: HTMLObjectElementAttributes<HTMLObjectElement> &
			Properties<HTMLObjectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOListElement
		 */
		ol: HTMLOListElementAttributes<HTMLOListElement> &
			Properties<HTMLOListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptGroupElement
		 */
		optgroup: HTMLOptGroupElementAttributes<HTMLOptGroupElement> &
			Properties<HTMLOptGroupElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
		 */
		option: HTMLOptionElementAttributes<HTMLOptionElement> &
			Properties<HTMLOptionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOutputElement
		 */
		output: HTMLOutputElementAttributes<HTMLOutputElement> &
			Properties<HTMLOutputElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParagraphElement
		 */
		p: HTMLParagraphElementAttributes<HTMLParagraphElement> &
			Properties<HTMLParagraphElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPictureElement
		 */
		picture: HTMLPictureElementAttributes<HTMLPictureElement> &
			Properties<HTMLPictureElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		pre: HTMLPreElementAttributes<HTMLPreElement> &
			Properties<HTMLPreElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement
		 */
		progress: HTMLProgressElementAttributes<HTMLProgressElement> &
			Properties<HTMLProgressElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
		 */
		q: HTMLQuoteElementAttributes<HTMLQuoteElement> &
			Properties<HTMLQuoteElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rp: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rt: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		ruby: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		s: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		samp: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
		 */
		script: HTMLScriptElementAttributes<HTMLScriptElement> &
			Properties<HTMLScriptElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		search: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		section: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
		 */
		select: HTMLSelectElementAttributes<HTMLSelectElement> &
			Properties<HTMLSelectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
		 */
		slot: HTMLSlotElementAttributes<HTMLSlotElement> &
			Properties<HTMLSlotElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		small: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSourceElement
		 */
		source: HTMLSourceElementAttributes<HTMLSourceElement> &
			Properties<HTMLSourceElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSpanElement
		 */
		span: HTMLSpanElementAttributes<HTMLSpanElement> &
			Properties<HTMLSpanElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		strong: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement
		 */
		style: HTMLStyleElementAttributes<HTMLStyleElement> &
			Properties<HTMLStyleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		sub: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		summary: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		sup: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
		 */
		table: HTMLTableElementAttributes<HTMLTableElement> &
			Properties<HTMLTableElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		tbody: HTMLTableSectionBodyElementAttributes<HTMLTableSectionElement> &
			Properties<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
		 */
		td: HTMLTableCellTdElementAttributes<HTMLTableCellElement> &
			Properties<HTMLTableCellElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
		 */
		template: HTMLTemplateElementAttributes<HTMLTemplateElement> &
			Properties<HTMLTemplateElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement
		 */
		textarea: HTMLTextAreaElementAttributes<HTMLTextAreaElement> &
			Properties<HTMLTextAreaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		tfoot: HTMLTableSectionFootElementAttributes<HTMLTableSectionElement> &
			Properties<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
		 */
		th: HTMLTableCellThElementAttributes<HTMLTableCellElement> &
			Properties<HTMLTableCellElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		thead: HTMLTableSectionHeadElementAttributes<HTMLTableSectionElement> &
			Properties<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTimeElement
		 */
		time: HTMLTimeElementAttributes<HTMLTimeElement> &
			Properties<HTMLTimeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTitleElement
		 */
		title: HTMLTitleElementAttributes<HTMLTitleElement> &
			Properties<HTMLTitleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
		 */
		tr: HTMLTableRowElementAttributes<HTMLTableRowElement> &
			Properties<HTMLTableRowElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement
		 */
		track: HTMLTrackElementAttributes<HTMLTrackElement> &
			Properties<HTMLTrackElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		u: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUListElement
		 */
		ul: HTMLUListElementAttributes<HTMLUListElement> &
			Properties<HTMLUListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		var: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
		 */
		video: HTMLVideoElementAttributes<HTMLVideoElement> &
			Properties<HTMLVideoElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		wbr: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
	}

	// HTMLDeprecatedElements

	interface HTMLDeprecatedElements {
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/acronym
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		acronym: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		applet: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/basefont
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		basefont: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		bgsound: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		big: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		blink: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		center: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDirectoryElement
		 */
		dir: HTMLDirectoryElementAttributes<HTMLDirectoryElement> &
			Properties<HTMLDirectoryElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFontElement
		 */
		font: HTMLFontElementAttributes<HTMLFontElement> &
			Properties<HTMLFontElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameElement
		 */
		frame: HTMLFrameElementAttributes<HTMLFrameElement> &
			Properties<HTMLFrameElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameSetElement
		 */
		frameset: HTMLFrameSetElementAttributes<HTMLFrameSetElement> &
			Properties<HTMLFrameSetElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		isindex: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		keygen: HTMLKeygenElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/listing
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		listing: HTMLPreElementListingAttributes<HTMLPreElement> &
			Properties<HTMLPreElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMarqueeElement
		 */
		marquee: HTMLMarqueeElementAttributes<HTMLMarqueeElement> &
			Properties<HTMLMarqueeElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		menuitem: HTMLElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/multicol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		multicol: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nextid
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		nextid: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		nobr: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noembed: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noindex
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		noindex: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noframes: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParamElement
		 */
		param: HTMLParamElementAttributes<HTMLParamElement> &
			Properties<HTMLParamElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		plaintext: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rb: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rtc
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rtc: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/spacer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		spacer: HTMLUnknownElementAttributes<HTMLUnknownElement> &
			Properties<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strike
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		strike: HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		tt: HTMLElementAttributes<HTMLElement> & Properties<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		xmp: HTMLPreElementXmpAttributes<HTMLPreElement> &
			Properties<HTMLPreElement>
	}

	// MathMLElements

	interface MathMLElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		annotation: MathMLAnnotationElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation-xml
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		'annotation-xml': MathMLAnnotationXmlElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		math: MathMLMathElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/merror
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		merror: MathMLMerrorElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mfrac: MathMLMfracElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mi
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mi: MathMLMiElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mmultiscripts: MathMLMmultiscriptsElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mn
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mn: MathMLMnElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mo: MathMLMoElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mover
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mover: MathMLMoverElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mpadded
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mpadded: MathMLMpaddedElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mphantom
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mphantom: MathMLMphantomElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mprescripts
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mprescripts: MathMLMprescriptsElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mroot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mroot: MathMLMrootElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mrow
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mrow: MathMLMrowElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		ms: MathMLMsElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mspace
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mspace: MathMLMspaceElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msqrt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msqrt: MathMLMsqrtElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mstyle: MathMLMstyleElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msub
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msub: MathMLMsubElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msubsup: MathMLMsubsupElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msup: MathMLMsupElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtable: MathMLMtableElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtd: MathMLMtdElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtext
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtext: MathMLMtextElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtr: MathMLMtrElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munder
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		munder: MathMLMunderElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munderover
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		munderover: MathMLMunderoverElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/semantics
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		semantics: MathMLSemanticsElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @non-standard
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		menclose: MathMLMencloseElementAttributes<MathMLElement> &
			Properties<MathMLElement>
	}

	// MathMLDeprecatedElements

	interface MathMLDeprecatedElements {
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		maction: MathMLMactionElementAttributes<MathMLElement> &
			Properties<MathMLElement>
		/**
		 * @deprecated
		 * @non-standard
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfenced
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mfenced: MathMLMfencedElementAttributes<MathMLElement> &
			Properties<MathMLElement>
	}

	// SVGElements

	interface SVGElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateElement
		 */
		animate: SVGAnimateElementAttributes<SVGAnimateElement> &
			Properties<SVGAnimateElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateMotionElement
		 */
		animateMotion: SVGAnimateMotionElementAttributes<SVGAnimateMotionElement> &
			Properties<SVGAnimateMotionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateTransformElement
		 */
		animateTransform: SVGAnimateTransformElementAttributes<SVGAnimateTransformElement> &
			Properties<SVGAnimateTransformElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGCircleElement
		 */
		circle: SVGCircleElementAttributes<SVGCircleElement> &
			Properties<SVGCircleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGClipPathElement
		 */
		clipPath: SVGClipPathElementAttributes<SVGClipPathElement> &
			Properties<SVGClipPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDefsElement
		 */
		defs: SVGDefsElementAttributes<SVGDefsElement> &
			Properties<SVGDefsElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDescElement
		 */
		desc: SVGDescElementAttributes<SVGDescElement> &
			Properties<SVGDescElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGEllipseElement
		 */
		ellipse: SVGEllipseElementAttributes<SVGEllipseElement> &
			Properties<SVGEllipseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEBlendElement
		 */
		feBlend: SVGFEBlendElementAttributes<SVGFEBlendElement> &
			Properties<SVGFEBlendElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEColorMatrixElement
		 */
		feColorMatrix: SVGFEColorMatrixElementAttributes<SVGFEColorMatrixElement> &
			Properties<SVGFEColorMatrixElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEComponentTransferElement
		 */
		feComponentTransfer: SVGFEComponentTransferElementAttributes<SVGFEComponentTransferElement> &
			Properties<SVGFEComponentTransferElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFECompositeElement
		 */
		feComposite: SVGFECompositeElementAttributes<SVGFECompositeElement> &
			Properties<SVGFECompositeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEConvolveMatrixElement
		 */
		feConvolveMatrix: SVGFEConvolveMatrixElementAttributes<SVGFEConvolveMatrixElement> &
			Properties<SVGFEConvolveMatrixElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDiffuseLightingElement
		 */
		feDiffuseLighting: SVGFEDiffuseLightingElementAttributes<SVGFEDiffuseLightingElement> &
			Properties<SVGFEDiffuseLightingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDisplacementMapElement
		 */
		feDisplacementMap: SVGFEDisplacementMapElementAttributes<SVGFEDisplacementMapElement> &
			Properties<SVGFEDisplacementMapElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDistantLightElement
		 */
		feDistantLight: SVGFEDistantLightElementAttributes<SVGFEDistantLightElement> &
			Properties<SVGFEDistantLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDropShadowElement
		 */
		feDropShadow: SVGFEDropShadowElementAttributes<SVGFEDropShadowElement> &
			Properties<SVGFEDropShadowElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFloodElement
		 */
		feFlood: SVGFEFloodElementAttributes<SVGFEFloodElement> &
			Properties<SVGFEFloodElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncAElement
		 */
		feFuncA: SVGFEFuncAElementAttributes<SVGFEFuncAElement> &
			Properties<SVGFEFuncAElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncBElement
		 */
		feFuncB: SVGFEFuncBElementAttributes<SVGFEFuncBElement> &
			Properties<SVGFEFuncBElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncGElement
		 */
		feFuncG: SVGFEFuncGElementAttributes<SVGFEFuncGElement> &
			Properties<SVGFEFuncGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncRElement
		 */
		feFuncR: SVGFEFuncRElementAttributes<SVGFEFuncRElement> &
			Properties<SVGFEFuncRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEGaussianBlurElement
		 */
		feGaussianBlur: SVGFEGaussianBlurElementAttributes<SVGFEGaussianBlurElement> &
			Properties<SVGFEGaussianBlurElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEImageElement
		 */
		feImage: SVGFEImageElementAttributes<SVGFEImageElement> &
			Properties<SVGFEImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeElement
		 */
		feMerge: SVGFEMergeElementAttributes<SVGFEMergeElement> &
			Properties<SVGFEMergeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeNodeElement
		 */
		feMergeNode: SVGFEMergeNodeElementAttributes<SVGFEMergeNodeElement> &
			Properties<SVGFEMergeNodeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMorphologyElement
		 */
		feMorphology: SVGFEMorphologyElementAttributes<SVGFEMorphologyElement> &
			Properties<SVGFEMorphologyElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEOffsetElement
		 */
		feOffset: SVGFEOffsetElementAttributes<SVGFEOffsetElement> &
			Properties<SVGFEOffsetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEPointLightElement
		 */
		fePointLight: SVGFEPointLightElementAttributes<SVGFEPointLightElement> &
			Properties<SVGFEPointLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpecularLightingElement
		 */
		feSpecularLighting: SVGFESpecularLightingElementAttributes<SVGFESpecularLightingElement> &
			Properties<SVGFESpecularLightingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpotLightElement
		 */
		feSpotLight: SVGFESpotLightElementAttributes<SVGFESpotLightElement> &
			Properties<SVGFESpotLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETileElement
		 */
		feTile: SVGFETileElementAttributes<SVGFETileElement> &
			Properties<SVGFETileElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETurbulenceElement
		 */
		feTurbulence: SVGFETurbulenceElementAttributes<SVGFETurbulenceElement> &
			Properties<SVGFETurbulenceElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFilterElement
		 */
		filter: SVGFilterElementAttributes<SVGFilterElement> &
			Properties<SVGFilterElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGForeignObjectElement
		 */
		foreignObject: SVGForeignObjectElementAttributes<SVGForeignObjectElement> &
			Properties<SVGForeignObjectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGGElement
		 */
		g: SVGGElementAttributes<SVGGElement> & Properties<SVGGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGImageElement
		 */
		image: SVGImageElementAttributes<SVGImageElement> &
			Properties<SVGImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLineElement
		 */
		line: SVGLineElementAttributes<SVGLineElement> &
			Properties<SVGLineElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLinearGradientElement
		 */
		linearGradient: SVGLinearGradientElementAttributes<SVGLinearGradientElement> &
			Properties<SVGLinearGradientElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMarkerElement
		 */
		marker: SVGMarkerElementAttributes<SVGMarkerElement> &
			Properties<SVGMarkerElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMaskElement
		 */
		mask: SVGMaskElementAttributes<SVGMaskElement> &
			Properties<SVGMaskElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMetadataElement
		 */
		metadata: SVGMetadataElementAttributes<SVGMetadataElement> &
			Properties<SVGMetadataElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMPathElement
		 */
		mpath: SVGMPathElementAttributes<SVGMPathElement> &
			Properties<SVGMPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
		 */
		path: SVGPathElementAttributes<SVGPathElement> &
			Properties<SVGPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPatternElement
		 */
		pattern: SVGPatternElementAttributes<SVGPatternElement> &
			Properties<SVGPatternElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolygonElement
		 */
		polygon: SVGPolygonElementAttributes<SVGPolygonElement> &
			Properties<SVGPolygonElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolylineElement
		 */
		polyline: SVGPolylineElementAttributes<SVGPolylineElement> &
			Properties<SVGPolylineElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRadialGradientElement
		 */
		radialGradient: SVGRadialGradientElementAttributes<SVGRadialGradientElement> &
			Properties<SVGRadialGradientElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRectElement
		 */
		rect: SVGRectElementAttributes<SVGRectElement> &
			Properties<SVGRectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSetElement
		 */
		set: SVGSetElementAttributes<SVGSetElement> &
			Properties<SVGSetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGStopElement
		 */
		stop: SVGStopElementAttributes<SVGStopElement> &
			Properties<SVGStopElement>

		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
		 */
		svg: SVGSVGElementAttributes<SVGSVGElement> &
			Properties<SVGSVGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSwitchElement
		 */
		switch: SVGSwitchElementAttributes<SVGSwitchElement> &
			Properties<SVGSwitchElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement
		 */
		symbol: SVGSymbolElementAttributes<SVGSymbolElement> &
			Properties<SVGSymbolElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextElement
		 */
		text: SVGTextElementAttributes<SVGTextElement> &
			Properties<SVGTextElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextPathElement
		 */
		textPath: SVGTextPathElementAttributes<SVGTextPathElement> &
			Properties<SVGTextPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTSpanElement
		 */
		tspan: SVGTSpanElementAttributes<SVGTSpanElement> &
			Properties<SVGTSpanElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGUseElement
		 */
		use: SVGUseElementAttributes<SVGUseElement> &
			Properties<SVGUseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGViewElement
		 */
		view: SVGViewElementAttributes<SVGViewElement> &
			Properties<SVGViewElement>
	}

	/** EVENTS */

	// element

	interface EventHandlersElement<Element> {
		'on:abort'?: EventHandlers<UIEvent, Element>
		'on:animationcancel'?: EventHandlers<AnimationEvent, Element>
		'on:animationend'?: EventHandlers<AnimationEvent, Element>
		'on:animationiteration'?: EventHandlers<AnimationEvent, Element>
		'on:animationstart'?: EventHandlers<AnimationEvent, Element>
		'on:auxclick'?: EventHandlers<PointerEvent, Element>
		'on:beforecopy'?: EventHandlers<ClipboardEvent, Element>
		'on:beforecut'?: EventHandlers<ClipboardEvent, Element>
		'on:beforeinput'?: EventHandlers<InputEvent, Element>
		'on:beforematch'?: EventHandlers<Event, Element>
		'on:beforepaste'?: EventHandlers<ClipboardEvent, Element>
		'on:beforetoggle'?: EventHandlers<ToggleEvent, Element>
		'on:beforexrselect'?: EventHandlers<Event, Element>
		'on:blur'?: EventHandlers<FocusEvent, Element>
		'on:cancel'?: EventHandlers<Event, Element>
		'on:canplay'?: EventHandlers<Event, Element>
		'on:canplaythrough'?: EventHandlers<Event, Element>
		'on:change'?: EventHandlers<Event, Element>
		'on:click'?: EventHandlers<PointerEvent, Element>
		'on:close'?: EventHandlers<Event, Element>
		'on:command'?: EventHandlers<CommandEvent, Element>
		'on:compositionend'?: EventHandlers<CompositionEvent, Element>
		'on:compositionstart'?: EventHandlers<CompositionEvent, Element>
		'on:compositionupdate'?: EventHandlers<CompositionEvent, Element>
		'on:contentvisibilityautostatechange'?: EventHandlers<
			ContentVisibilityAutoStateChangeEvent,
			Element
		>
		'on:contextlost'?: EventHandlers<Event, Element>
		'on:contextmenu'?: EventHandlers<PointerEvent, Element>
		'on:contextrestored'?: EventHandlers<Event, Element>
		'on:copy'?: EventHandlers<ClipboardEvent, Element>
		'on:cuechange'?: EventHandlers<Event, Element>
		'on:cut'?: EventHandlers<ClipboardEvent, Element>
		'on:dblclick'?: EventHandlers<MouseEvent, Element>
		'on:drag'?: EventHandlers<DragEvent, Element>
		'on:dragend'?: EventHandlers<DragEvent, Element>
		'on:dragenter'?: EventHandlers<DragEvent, Element>
		'on:dragexit'?: EventHandlers<DragEvent, Element>
		'on:dragleave'?: EventHandlers<DragEvent, Element>
		'on:dragover'?: EventHandlers<DragEvent, Element>
		'on:dragstart'?: EventHandlers<DragEvent, Element>
		'on:drop'?: EventHandlers<DragEvent, Element>
		'on:durationchange'?: EventHandlers<Event, Element>
		'on:emptied'?: EventHandlers<Event, Element>
		'on:ended'?: EventHandlers<Event, Element>
		'on:error'?: EventHandlers<ErrorEvent, Element>
		'on:focus'?: EventHandlers<FocusEvent, Element>
		'on:focusin'?: EventHandlers<FocusEvent, Element>
		'on:focusout'?: EventHandlers<FocusEvent, Element>
		'on:formdata'?: EventHandlers<FormDataEvent, Element>
		'on:fullscreenchange'?: EventHandlers<Event, Element>
		'on:fullscreenerror'?: EventHandlers<Event, Element>
		'on:gotpointercapture'?: EventHandlers<PointerEvent, Element>
		'on:input'?: EventHandlers<InputEvent, Element>
		'on:invalid'?: EventHandlers<Event, Element>
		'on:keydown'?: EventHandlers<KeyboardEvent, Element>
		'on:keypress'?: EventHandlers<KeyboardEvent, Element>
		'on:keyup'?: EventHandlers<KeyboardEvent, Element>
		'on:load'?: EventHandlers<Event, Element>
		'on:loadeddata'?: EventHandlers<Event, Element>
		'on:loadedmetadata'?: EventHandlers<Event, Element>
		'on:loadstart'?: EventHandlers<Event, Element>
		'on:lostpointercapture'?: EventHandlers<PointerEvent, Element>
		'on:mousedown'?: EventHandlers<MouseEvent, Element>
		'on:mouseenter'?: EventHandlers<MouseEvent, Element>
		'on:mouseleave'?: EventHandlers<MouseEvent, Element>
		'on:mousemove'?: EventHandlers<MouseEvent, Element>
		'on:mouseout'?: EventHandlers<MouseEvent, Element>
		'on:mouseover'?: EventHandlers<MouseEvent, Element>
		'on:mouseup'?: EventHandlers<MouseEvent, Element>
		'on:paste'?: EventHandlers<ClipboardEvent, Element>
		'on:pause'?: EventHandlers<Event, Element>
		'on:play'?: EventHandlers<Event, Element>
		'on:playing'?: EventHandlers<Event, Element>
		'on:pointercancel'?: EventHandlers<PointerEvent, Element>
		'on:pointerdown'?: EventHandlers<PointerEvent, Element>
		'on:pointerenter'?: EventHandlers<PointerEvent, Element>
		'on:pointerleave'?: EventHandlers<PointerEvent, Element>
		'on:pointermove'?: EventHandlers<PointerEvent, Element>
		'on:pointerout'?: EventHandlers<PointerEvent, Element>
		'on:pointerover'?: EventHandlers<PointerEvent, Element>
		'on:pointerrawupdate'?: EventHandlers<PointerEvent, Element>
		'on:pointerup'?: EventHandlers<PointerEvent, Element>
		'on:progress'?: EventHandlers<ProgressEvent, Element>
		'on:ratechange'?: EventHandlers<Event, Element>
		'on:reset'?: EventHandlers<Event, Element>
		'on:resize'?: EventHandlers<UIEvent, Element>
		'on:scroll'?: EventHandlers<Event, Element>
		'on:scrollend'?: EventHandlers<Event, Element>
		'on:scrollsnapchange'?: EventHandlers<Event, Element>
		'on:scrollsnapchanging'?: EventHandlers<Event, Element>
		'on:securitypolicyviolation'?: EventHandlers<
			SecurityPolicyViolationEvent,
			Element
		>
		'on:seeked'?: EventHandlers<Event, Element>
		'on:seeking'?: EventHandlers<Event, Element>
		'on:select'?: EventHandlers<Event, Element>
		'on:selectionchange'?: EventHandlers<Event, Element>
		'on:selectstart'?: EventHandlers<Event, Element>
		'on:slotchange'?: EventHandlers<Event, Element>
		'on:stalled'?: EventHandlers<Event, Element>
		'on:submit'?: EventHandlers<SubmitEvent, Element>
		'on:suspend'?: EventHandlers<Event, Element>
		'on:timeupdate'?: EventHandlers<Event, Element>
		'on:toggle'?: EventHandlers<ToggleEvent, Element>
		'on:touchcancel'?: EventHandlers<TouchEvent, Element>
		'on:touchend'?: EventHandlers<TouchEvent, Element>
		'on:touchmove'?: EventHandlers<TouchEvent, Element>
		'on:touchstart'?: EventHandlers<TouchEvent, Element>
		'on:transitioncancel'?: EventHandlers<TransitionEvent, Element>
		'on:transitionend'?: EventHandlers<TransitionEvent, Element>
		'on:transitionrun'?: EventHandlers<TransitionEvent, Element>
		'on:transitionstart'?: EventHandlers<TransitionEvent, Element>
		'on:volumechange'?: EventHandlers<Event, Element>
		'on:waiting'?: EventHandlers<Event, Element>
		'on:wheel'?: EventHandlers<WheelEvent, Element>
	}

	// window

	interface EventHandlersWindow<Element> {
		'on:afterprint'?: EventHandlers<Event, Element>
		'on:beforeprint'?: EventHandlers<Event, Element>
		'on:beforeunload'?: EventHandlers<BeforeUnloadEvent, Element>
		'on:clipboardchange'?: EventHandlers<Event, Element>
		'on:devicemotion'?: EventHandlers<DeviceMotionEvent, Element>
		'on:deviceorientation'?: EventHandlers<
			DeviceOrientationEvent,
			Element
		>
		'on:deviceorientationabsolute'?: EventHandlers<
			DeviceOrientationEvent,
			Element
		>
		'on:DOMContentLoaded'?: EventHandlers<Event, Element>
		'on:gamepadconnected'?: EventHandlers<GamepadEvent, Element>
		'on:gamepaddisconnected'?: EventHandlers<GamepadEvent, Element>
		'on:hashchange'?: EventHandlers<HashChangeEvent, Element>
		'on:languagechange'?: EventHandlers<Event, Element>
		'on:message'?: EventHandlers<MessageEvent, Element>
		'on:messageerror'?: EventHandlers<MessageEvent, Element>
		'on:offline'?: EventHandlers<Event, Element>
		'on:online'?: EventHandlers<Event, Element>
		/** @deprecated */
		'on:orientationchange'?: EventHandlers<Event, Element>
		'on:pagehide'?: EventHandlers<PageTransitionEvent, Element>
		'on:pagereveal'?: EventHandlers<PageRevealEvent, Element>
		'on:pageshow'?: EventHandlers<PageTransitionEvent, Element>
		'on:pageswap'?: EventHandlers<PageSwapEvent, Element>
		'on:pointerlockchange'?: EventHandlers<Event, Element>
		'on:pointerlockerror'?: EventHandlers<Event, Element>
		'on:popstate'?: EventHandlers<PopStateEvent, Element>
		'on:readystatechange'?: EventHandlers<Event, Element>
		'on:rejectionhandled'?: EventHandlers<
			PromiseRejectionEvent,
			Element
		>
		'on:storage'?: EventHandlers<StorageEvent, Element>
		'on:unhandledrejection'?: EventHandlers<
			PromiseRejectionEvent,
			Element
		>
		'on:unload'?: EventHandlers<Event, Element>
		'on:visibilitychange'?: EventHandlers<Event, Element>
	}

	// EventName = "click" | "mousedown" ...
	type EventName =
		| (keyof EventHandlersWindow<Element> extends `on:${infer T}`
				? T
				: never)
		| (keyof EventHandlersElement<Element> extends `on:${infer T}`
				? T
				: never)
		| (string & {})

	type ExtractEventType<T> = {
		[K in keyof T as K extends `on:${infer Name}`
			? Name
			: never]: T[K] extends EventHandlers<infer E, Element>
			? E
			: never
	}

	// EventType["click"] = MouseEvent
	type EventType = ExtractEventType<EventHandlersElement<Element>> &
		ExtractEventType<EventHandlersWindow<Element>>

	// EventTypeFor<"click"> = MouseEvent
	// EventTypeFor<"my-custom"> = CustomEvent
	type EventTypeFor<K> = K extends keyof EventType
		? EventType[K]
		: CustomEvent

	/** ARIA */

	interface AriaAttributes {
		/**
		 * Identifies the currently active element when DOM focus is on a
		 * composite widget, textbox, group, or application.
		 */
		'aria-activedescendant'?: Attribute<string>
		/**
		 * Indicates whether assistive technologies will present all, or
		 * only parts of, the changed region based on the change
		 * notifications defined by the aria-relevant attribute.
		 */
		'aria-atomic'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Similar to the global aria-label. Defines a string value that
		 * labels the current element, which is intended to be converted
		 * into Braille.
		 *
		 * @see aria-label.
		 */
		'aria-braillelabel'?: Attribute<string>
		/**
		 * Defines a human-readable, author-localized abbreviated
		 * description for the role of an element intended to be converted
		 * into Braille. Braille is not a one-to-one transliteration of
		 * letters and numbers, but rather it includes various
		 * abbreviations, contractions, and characters that represent
		 * words (known as logograms).
		 *
		 * Instead of converting long role descriptions to Braille, the
		 * aria-brailleroledescription attribute allows for providing an
		 * abbreviated version of the aria-roledescription value, which is
		 * a human-readable, author-localized description for the role of
		 * an element, for improved user experience with braille
		 * interfaces.
		 *
		 * @see aria-roledescription.
		 */
		'aria-brailleroledescription'?: Attribute<string>
		/**
		 * Indicates whether inputting text could trigger display of one
		 * or more predictions of the user's intended value for an input
		 * and specifies how predictions would be presented if they are
		 * made.
		 */
		'aria-autocomplete'?: Attribute<
			'none' | 'inline' | 'list' | 'both'
		>
		/**
		 * Indicates an element is being modified and that assistive
		 * technologies MAY want to wait until the modifications are
		 * complete before exposing them to the user.
		 */
		'aria-busy'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates the current "checked" state of checkboxes, radio
		 * buttons, and other widgets.
		 *
		 * @see aria-pressed @see aria-selected.
		 */
		'aria-checked'?: Attribute<EnumeratedPseudoBoolean | 'mixed'>
		/**
		 * Defines the total number of columns in a table, grid, or
		 * treegrid.
		 *
		 * @see aria-colindex.
		 */
		'aria-colcount'?: Attribute<number | string>
		/**
		 * Defines an element's column index or position with respect to
		 * the total number of columns within a table, grid, or treegrid.
		 *
		 * @see aria-colcount @see aria-colspan.
		 */
		'aria-colindex'?: Attribute<number | string>
		/**
		 * Defines a human-readable text alternative of the numeric
		 * aria-colindex.
		 */
		'aria-colindextext'?: Attribute<number | string>
		/**
		 * Defines the number of columns spanned by a cell or gridcell
		 * within a table, grid, or treegrid.
		 *
		 * @see aria-colindex @see aria-rowspan.
		 */
		'aria-colspan'?: Attribute<number | string>
		/**
		 * Identifies the element (or elements) whose contents or presence
		 * are controlled by the current element.
		 *
		 * @see aria-owns.
		 */
		'aria-controls'?: Attribute<string>
		/**
		 * Indicates the element that represents the current item within a
		 * container or set of related elements.
		 */
		'aria-current'?: Attribute<
			| EnumeratedPseudoBoolean
			| 'page'
			| 'step'
			| 'location'
			| 'date'
			| 'time'
		>
		/**
		 * Identifies the element (or elements) that describes the object.
		 *
		 * @see aria-labelledby
		 */
		'aria-describedby'?: Attribute<string>
		/**
		 * Defines a string value that describes or annotates the current
		 * element.
		 *
		 * @see aria-describedby
		 */
		'aria-description'?: Attribute<string>
		/**
		 * Identifies the element that provides a detailed, extended
		 * description for the object.
		 *
		 * @see aria-describedby.
		 */
		'aria-details'?: Attribute<string>
		/**
		 * Indicates that the element is perceivable but disabled, so it
		 * is not editable or otherwise operable.
		 *
		 * @see aria-hidden @see aria-readonly.
		 */
		'aria-disabled'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates what functions can be performed when a dragged object
		 * is released on the drop target.
		 *
		 * @deprecated In ARIA 1.1
		 */
		'aria-dropeffect'?: Attribute<
			'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
		>
		/**
		 * Identifies the element that provides an error message for the
		 * object.
		 *
		 * @see aria-invalid @see aria-describedby.
		 */
		'aria-errormessage'?: Attribute<string>
		/**
		 * Indicates whether the element, or another grouping element it
		 * controls, is currently expanded or collapsed.
		 */
		'aria-expanded'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Identifies the next element (or elements) in an alternate
		 * reading order of content which, at the user's discretion,
		 * allows assistive technology to override the general default of
		 * reading in document source order.
		 */
		'aria-flowto'?: Attribute<string>
		/**
		 * Indicates an element's "grabbed" state in a drag-and-drop
		 * operation.
		 *
		 * @deprecated In ARIA 1.1
		 */
		'aria-grabbed'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates the availability and type of interactive popup
		 * element, such as menu or dialog, that can be triggered by an
		 * element.
		 */
		'aria-haspopup'?: Attribute<
			| EnumeratedPseudoBoolean
			| 'menu'
			| 'listbox'
			| 'tree'
			| 'grid'
			| 'dialog'
		>
		/**
		 * Indicates whether the element is exposed to an accessibility
		 * API.
		 *
		 * @see aria-disabled.
		 */
		'aria-hidden'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates the entered value does not conform to the format
		 * expected by the application.
		 *
		 * @see aria-errormessage.
		 */
		'aria-invalid'?: Attribute<
			EnumeratedPseudoBoolean | 'grammar' | 'spelling'
		>
		/**
		 * Indicates keyboard shortcuts that an author has implemented to
		 * activate or give focus to an element.
		 */
		'aria-keyshortcuts'?: Attribute<string>
		/**
		 * Defines a string value that labels the current element.
		 *
		 * @see aria-labelledby.
		 */
		'aria-label'?: Attribute<string>
		/**
		 * Identifies the element (or elements) that labels the current
		 * element.
		 *
		 * @see aria-describedby.
		 */
		'aria-labelledby'?: Attribute<string>
		/**
		 * Defines the hierarchical level of an element within a
		 * structure.
		 */
		'aria-level'?: Attribute<number | string>
		/**
		 * Indicates that an element will be updated, and describes the
		 * types of updates the user agents, assistive technologies, and
		 * user can expect from the live region.
		 */
		'aria-live'?: Attribute<'off' | 'assertive' | 'polite'>
		/** Indicates whether an element is modal when displayed. */
		'aria-modal'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates whether a text box accepts multiple lines of input or
		 * only a single line.
		 */
		'aria-multiline'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates that the user may select more than one item from the
		 * current selectable descendants.
		 */
		'aria-multiselectable'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates whether the element's orientation is horizontal,
		 * vertical, or unknown/ambiguous.
		 */
		'aria-orientation'?: Attribute<'horizontal' | 'vertical'>
		/**
		 * Identifies an element (or elements) in order to define a
		 * visual, functional, or contextual parent/child relationship
		 * between DOM elements where the DOM hierarchy cannot be used to
		 * represent the relationship.
		 *
		 * @see aria-controls.
		 */
		'aria-owns'?: Attribute<string>
		/**
		 * Defines a short hint (a word or short phrase) intended to aid
		 * the user with data entry when the control has no value. A hint
		 * could be a sample value or a brief description of the expected
		 * format.
		 */
		'aria-placeholder'?: Attribute<string>
		/**
		 * Defines an element's number or position in the current set of
		 * listitems or treeitems. Not required if all elements in the set
		 * are present in the DOM.
		 *
		 * @see aria-setsize.
		 */
		'aria-posinset'?: Attribute<number | string>
		/**
		 * Indicates the current "pressed" state of toggle buttons.
		 *
		 * @see aria-checked @see aria-selected.
		 */
		'aria-pressed'?: Attribute<EnumeratedPseudoBoolean | 'mixed'>
		/**
		 * Indicates that the element is not editable, but is otherwise
		 * operable.
		 *
		 * @see aria-disabled.
		 */
		'aria-readonly'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Indicates what notifications the user agent will trigger when
		 * the accessibility tree within a live region is modified.
		 *
		 * @see aria-atomic.
		 */
		'aria-relevant'?: Attribute<
			| 'additions'
			| 'additions removals'
			| 'additions text'
			| 'all'
			| 'removals'
			| 'removals additions'
			| 'removals text'
			| 'text'
			| 'text additions'
			| 'text removals'
		>
		/**
		 * Indicates that user input is required on the element before a
		 * form may be submitted.
		 */
		'aria-required'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Defines a human-readable, author-localized description for the
		 * role of an element.
		 */
		'aria-roledescription'?: Attribute<string>
		/**
		 * Defines the total number of rows in a table, grid, or treegrid.
		 *
		 * @see aria-rowindex.
		 */
		'aria-rowcount'?: Attribute<number | string>
		/**
		 * Defines an element's row index or position with respect to the
		 * total number of rows within a table, grid, or treegrid.
		 *
		 * @see aria-rowcount @see aria-rowspan.
		 */
		'aria-rowindex'?: Attribute<number | string>
		/** Defines a human-readable text alternative of aria-rowindex. */
		'aria-rowindextext'?: Attribute<number | string>
		/**
		 * Defines the number of rows spanned by a cell or gridcell within
		 * a table, grid, or treegrid.
		 *
		 * @see aria-rowindex @see aria-colspan.
		 */
		'aria-rowspan'?: Attribute<number | string>
		/**
		 * Indicates the current "selected" state of various widgets.
		 *
		 * @see aria-checked @see aria-pressed.
		 */
		'aria-selected'?: Attribute<EnumeratedPseudoBoolean>
		/**
		 * Defines the number of items in the current set of listitems or
		 * treeitems. Not required if all elements in the set are present
		 * in the DOM.
		 *
		 * @see aria-posinset.
		 */
		'aria-setsize'?: Attribute<number | string>
		/**
		 * Indicates if items in a table or grid are sorted in ascending
		 * or descending order.
		 */
		'aria-sort'?: Attribute<
			'none' | 'ascending' | 'descending' | 'other'
		>
		/** Defines the maximum allowed value for a range widget. */
		'aria-valuemax'?: Attribute<number | string>
		/** Defines the minimum allowed value for a range widget. */
		'aria-valuemin'?: Attribute<number | string>
		/**
		 * Defines the current value for a range widget.
		 *
		 * @see aria-valuetext.
		 */
		'aria-valuenow'?: Attribute<number | string>
		/**
		 * Defines the human readable text alternative of aria-valuenow
		 * for a range widget.
		 */
		'aria-valuetext'?: Attribute<string>
		role?: Attribute<
			| 'alert'
			| 'alertdialog'
			| 'application'
			| 'article'
			| 'banner'
			| 'blockquote'
			| 'button'
			| 'caption'
			| 'cell'
			| 'checkbox'
			| 'code'
			| 'columnheader'
			| 'combobox'
			| 'complementary'
			| 'contentinfo'
			| 'definition'
			| 'deletion'
			| 'dialog'
			| 'directory'
			| 'document'
			| 'emphasis'
			| 'feed'
			| 'figure'
			| 'form'
			| 'generic'
			| 'grid'
			| 'gridcell'
			| 'group'
			| 'heading'
			| 'img'
			| 'insertion'
			| 'link'
			| 'list'
			| 'listbox'
			| 'listitem'
			| 'log'
			| 'main'
			| 'mark'
			| 'marquee'
			| 'math'
			| 'menu'
			| 'menubar'
			| 'menuitem'
			| 'menuitemcheckbox'
			| 'menuitemradio'
			| 'meter'
			| 'navigation'
			| 'none'
			| 'note'
			| 'option'
			| 'paragraph'
			| 'presentation'
			| 'progressbar'
			| 'radio'
			| 'radiogroup'
			| 'region'
			| 'row'
			| 'rowgroup'
			| 'rowheader'
			| 'scrollbar'
			| 'search'
			| 'searchbox'
			| 'separator'
			| 'slider'
			| 'spinbutton'
			| 'status'
			| 'strong'
			| 'subscript'
			| 'suggestion'
			| 'superscript'
			| 'switch'
			| 'tab'
			| 'table'
			| 'tablist'
			| 'tabpanel'
			| 'term'
			| 'textbox'
			| 'time'
			| 'timer'
			| 'toolbar'
			| 'tooltip'
			| 'tree'
			| 'treegrid'
			| 'treeitem'
		>
	}
}
