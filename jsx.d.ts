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
 * - CSS typings could be improved
 * - SVG typings are non-existent
 */

import * as csstype from 'csstype'

/* ACCESSOR */

export type Accessor<T> = T | SignalAccessor<T> | (() => Accessor<T>)

/* CORE */

interface PotaAttributes<Element> {
	children?: JSX.Element

	ref?: SignalSetter<Element> | ((element: Element) => void)

	'on:mount'?: (element: Element) => void
	'on:unmount'?: (element: Element) => void

	// [attr: `plugin:${string}`]: any - TODO
}

/* CSS */

type NSStyle = {
	[Key in Exclude<
		keyof csstype.PropertiesHyphen,
		`-${string}`
	> as `style:${Key}`]?: csstype.PropertiesHyphen[Key]
}

interface CSSProperties extends csstype.PropertiesHyphen {
	[key: `-${string}`]: number | string | undefined
}

interface CSSAttributes extends NSStyle {
	class?: Accessor<string>
	style?: Accessor<CSSProperties | string>

	css?: Accessor<string | CSSStyleSheet> // TODO

	// css
	[attr: `class:${string}`]: Accessor<any> // TODO
	[attr: `style:${string}`]: Accessor<any> // TODO
	[attr: `var:${string}`]: Accessor<string> // TODO
}

/* EVENTS */

type Events<Event, Element> =
	| ((e: Event & { currentTarget: Element }) => void)
	| ({
			handleEvent: (e: Event & { currentTarget: Element }) => void
	  } & AddEventListenerOptions)

/* EVENTS */

type BooleanAttribute = boolean | ''

type EnumeratedPseudoBoolean = 'false' | 'true'

/** Pota namespace JSX */
export namespace JSX {
	type DOMElement =
		| HTMLElement
		| SVGElement
		| MathMLElement
		| globalThis.Element

	// JSX.ElementAttributesProperty - name of the `props` argument

	interface ElementAttributesProperty {
		props: unknown
	}

	// JSX.ElementChildrenAttribute - name of the `children` prop

	interface ElementChildrenAttribute {
		children
	}

	// JSX.ElementType - shape of a `component`

	type ElementType =
		| keyof IntrinsicElements
		| ((props?) => Element)
		| ((props?) => ElementClass)
		| (new (props?) => ElementClass)

	// JSX.ElementClass - shape of `class` component

	type ElementClass = {
		ready?: () => void
		cleanup?: () => void
		render: (props?) => Element
	}

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
		// html
		| globalThis.Element
		// recurse
		| (() => Element)
		| Promise<Element>
		| Element[]

	/* Interfaces */

	// all elements

	interface IntrinsicElements
		extends HTMLDeprecatedElements,
			MathMLDeprecatedElements,
			HTMLWebViewElements,
			MathMLElements,
			SVGElements,
			HTMLElements {}

	/* Namespaced */

	/**
	 * Force as property.
	 *
	 * ```html
	 * <my-element prop:myFoo="bar" />
	 * ```
	 */
	interface NSAttributes<Element> {}

	/*
		JSX.IntrinsicClassAttributes // class attributes
		JSX.IntrinsicElements // tags
		JSX.IntrinsicAttributes // leaks to class and functional components
	*/

	/* Attributes */

	interface ElementAttributes<Element>
		extends PotaAttributes<Element>,
			CSSAttributes,
			AriaAttributes,
			ElementEventHandlers<Element>,
			NSAttributes<Element> {
		// properties
		'prop:innerHTML'?: Accessor<number | string>
		'prop:textContent'?: Accessor<number | string>

		// xml
		[attr: `xmlns:${string}`]: Accessor<string>
		xmlns?: Accessor<string>

		// attributes
		autofocus?: Accessor<BooleanAttribute>
		elementtiming?: Accessor<string>
		id?: Accessor<string>
		nonce?: Accessor<string>
		part?: Accessor<string>
		slot?: Accessor<string>
		tabindex?: Accessor<number | string>
	}

	interface HTMLAttributes<Element>
		extends ElementAttributes<Element> {
		// properties
		'prop:innerText'?: Accessor<number | string>

		// attributes
		accesskey?: Accessor<string>
		autocapitalize?: Accessor<
			'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
		>
		autocorrect?: Accessor<'on' | 'off'>
		contenteditable?: Accessor<
			EnumeratedPseudoBoolean | 'plaintext-only' | 'inherit' | ''
		>
		dir?: Accessor<'ltr' | 'rtl' | 'auto'>
		draggable?: Accessor<EnumeratedPseudoBoolean>
		enterkeyhint?: Accessor<
			| 'enter'
			| 'done'
			| 'go'
			| 'next'
			| 'previous'
			| 'search'
			| 'send'
		>
		exportparts?: Accessor<string>
		hidden?: Accessor<'' | 'hidden' | 'until-found'>
		inert?: Accessor<BooleanAttribute>
		inputmode?: Accessor<
			| 'decimal'
			| 'email'
			| 'none'
			| 'numeric'
			| 'search'
			| 'tel'
			| 'text'
			| 'url'
		>
		is?: Accessor<string>
		lang?: Accessor<string>
		popover?: Accessor<'' | 'manual' | 'auto' | 'hint'>
		spellcheck?: Accessor<'' | EnumeratedPseudoBoolean>
		title?: Accessor<string>
		translate?: Accessor<'yes' | 'no'>

		// microdata
		itemid?: Accessor<string>
		itemprop?: Accessor<string>
		itemref?: Accessor<string>
		itemscope?: Accessor<BooleanAttribute>
		itemtype?: Accessor<string>

		// RDFa attributes
		about?: Accessor<string>
		datatype?: Accessor<string>
		inlist?: Accessor<any>
		prefix?: Accessor<string>
		property?: Accessor<string>
		resource?: Accessor<string>
		typeof?: Accessor<string>
		vocab?: Accessor<string>

		/** @experimental */
		virtualkeyboardpolicy?: Accessor<'' | 'auto' | 'manual'>
		/** @experimental */
		writingsuggestions?: Accessor<EnumeratedPseudoBoolean>

		/** @deprecated */
		contextmenu?: Accessor<string>
	}
	interface SVGAttributes<Element>
		extends ElementAttributes<Element> {
		[attr: `${string}`]: Accessor<any> // catch all TODO
	}
	interface MathMLAttributes<Element>
		extends ElementAttributes<Element> {
		dir?: Accessor<'ltr' | 'rtl' | 'auto'>
		displaystyle?: Accessor<BooleanAttribute>
		scriptlevel?: Accessor<string>

		/** @deprecated */
		href?: Accessor<string>
		/** @deprecated */
		mathbackground?: Accessor<string>
		/** @deprecated */
		mathcolor?: Accessor<string>
		/** @deprecated */
		mathsize?: Accessor<string>
	}

	/* SPECIAL INTERFACES */

	interface HTMLMediaHTMLAttributes<Element> {
		autoplay?: Accessor<BooleanAttribute>
		controls?: Accessor<BooleanAttribute>
		controlslist?: Accessor<
			| 'nodownload'
			| 'nofullscreen'
			| 'noplaybackrate'
			| 'noremoteplayback'
			| (string & {})
		>
		crossorigin?: Accessor<'anonymous' | 'use-credentials' | ''>
		disableremoteplayback?: Accessor<BooleanAttribute>
		loop?: Accessor<BooleanAttribute>
		muted?: Accessor<BooleanAttribute>
		preload?: Accessor<'none' | 'metadata' | 'auto' | ''>
		src?: Accessor<string>

		'on:encrypted'?: Events<MediaEncryptedEvent, Element>
		'on:waitingforkey'?: Events<Event, Element>

		/** @deprecated */
		mediagroup?: Accessor<string>
	}

	/* SPECIAL ELEMENTS */

	interface HTMLWebViewElementAttributes<Element>
		extends HTMLAttributes<Element> {
		allowpopups?: Accessor<BooleanAttribute>
		disableblinkfeatures?: Accessor<string>
		disablewebsecurity?: Accessor<BooleanAttribute>
		enableblinkfeatures?: Accessor<string>
		httpreferrer?: Accessor<string>
		nodeintegration?: Accessor<BooleanAttribute>
		nodeintegrationinsubframes?: Accessor<BooleanAttribute>
		partition?: Accessor<string>
		plugins?: Accessor<BooleanAttribute>
		preload?: Accessor<string>
		src?: Accessor<string>
		useragent?: Accessor<string>
		webpreferences?: Accessor<string>

		// does this exists?
		allowfullscreen?: Accessor<BooleanAttribute>
		autosize?: Accessor<BooleanAttribute>

		/** @deprecated */
		blinkfeatures?: Accessor<string>
		/** @deprecated */
		disableguestresize?: Accessor<BooleanAttribute>
		/** @deprecated */
		guestinstance?: Accessor<string>
	}

	/* HTMLElements */

	interface HTMLAnchorElementAttributes<Element>
		extends HTMLAttributes<Element> {
		download?: Accessor<string>
		href?: Accessor<string>
		hreflang?: Accessor<string>
		ping?: Accessor<string>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Accessor<string>
		target?: Accessor<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
		type?: Accessor<string>

		/** @experimental */
		attributionsrc?: Accessor<string>

		/** @deprecated */
		charset?: Accessor<string>
		/** @deprecated */
		coords?: Accessor<string>
		/** @deprecated */
		name?: Accessor<string>
		/** @deprecated */
		rev?: Accessor<string>
		/** @deprecated */
		shape?: Accessor<'rect' | 'circle' | 'poly' | 'default'>
	}
	interface HTMLAreaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		alt?: Accessor<string>
		coords?: Accessor<string>
		download?: Accessor<string>
		href?: Accessor<string>
		ping?: Accessor<string>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Accessor<string>
		shape?: Accessor<'rect' | 'circle' | 'poly' | 'default'>
		target?: Accessor<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>

		/** @experimental */
		attributionsrc?: Accessor<string>

		/** @deprecated */
		nohref?: Accessor<BooleanAttribute>
	}
	interface HTMLAudioElementAttributes<Element>
		extends HTMLAttributes<Element>,
			HTMLMediaHTMLAttributes<Element> {}
	interface HTMLBRElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		clear?: Accessor<string>
	}
	interface HTMLBaseElementAttributes<Element>
		extends HTMLAttributes<Element> {
		href?: Accessor<string>
		target?: Accessor<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
	}
	interface HTMLBdoElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLBodyElementAttributes<Element>
		extends HTMLAttributes<Element>,
			WindowEventHandlers<Element> {
		/** @deprecated */
		alink?: Accessor<string>
		/** @deprecated */
		background?: Accessor<string>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		bottommargin?: Accessor<number | string>
		/** @deprecated */
		leftmargin?: Accessor<number | string>
		/** @deprecated */
		link?: Accessor<string>
		/** @deprecated */
		rightmargin?: Accessor<number | string>
		/** @deprecated */
		text?: Accessor<string>
		/** @deprecated */
		topmargin?: Accessor<number | string>
		/** @deprecated */
		vlink?: Accessor<string>
	}
	interface HTMLButtonElementAttributes<Element>
		extends HTMLAttributes<Element> {
		command?: Accessor<
			| 'show-modal'
			| 'close'
			| 'show-popover'
			| 'hide-popover'
			| 'toggle-popover'
			| (string & {})
		>
		commandfor?: Accessor<string>
		disabled?: Accessor<BooleanAttribute>
		form?: Accessor<string>
		formaction?: Accessor<string>
		formenctype?: Accessor<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		formmethod?: Accessor<'post' | 'get' | 'dialog'>
		formnovalidate?: Accessor<BooleanAttribute>
		formtarget?: Accessor<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>
		name?: Accessor<string>
		popovertarget?: Accessor<string>
		popovertargetaction?: Accessor<'hide' | 'show' | 'toggle'>
		type?: Accessor<'submit' | 'reset' | 'button' | 'menu'>
		value?: Accessor<number | string>
	}
	interface HTMLCanvasElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Accessor<number | string>
		width?: Accessor<number | string>

		/** @deprecated */
		'moz-opaque'?: Accessor<BooleanAttribute>
	}
	interface HTMLDListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Accessor<BooleanAttribute>
	}
	interface HTMLDataElementAttributes<Element>
		extends HTMLAttributes<Element> {
		value?: Accessor<number | string>
	}
	interface HTMLDataListElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLDetailsElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Accessor<string>
		open?: Accessor<BooleanAttribute>
	}
	interface HTMLDialogElementAttributes<Element>
		extends HTMLAttributes<Element> {
		open?: Accessor<BooleanAttribute>
		tabindex?: never

		/** @experimental */
		closedby?: Accessor<'any' | 'closerequest' | 'none'>
	}
	interface HTMLDivElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLEmbedElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Accessor<number | string>
		src?: Accessor<string>
		type?: Accessor<string>
		width?: Accessor<number | string>

		/** @deprecated */
		align?: Accessor<'left' | 'right' | 'justify' | 'center'>
		/** @deprecated */
		name?: Accessor<string>
	}
	interface HTMLFieldSetElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Accessor<BooleanAttribute>
		form?: Accessor<string>
		name?: Accessor<string>
	}
	interface HTMLFormElementAttributes<Element>
		extends HTMLAttributes<Element> {
		'accept-charset'?: Accessor<string>
		action?: Accessor<string>
		autocomplete?: Accessor<'on' | 'off'>
		encoding?: Accessor<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		enctype?: Accessor<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		method?: Accessor<'post' | 'get' | 'dialog'>
		name?: Accessor<string>
		novalidate?: Accessor<BooleanAttribute>
		rel?: Accessor<string>
		target?: Accessor<
			'_self' | '_blank' | '_parent' | '_top' | (string & {})
		>

		/** @deprecated */
		accept?: Accessor<string>
	}
	interface HTMLHRElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<string>
		/** @deprecated */
		color?: Accessor<string>
		/** @deprecated */
		noshade?: Accessor<BooleanAttribute>
		/** @deprecated */
		size?: Accessor<string>
		/** @deprecated */
		width?: Accessor<string>
	}
	interface HTMLHeadElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		profile?: Accessor<string>
	}
	interface HTMLHeadingElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLHtmlElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		version?: Accessor<string>
	}
	interface HTMLIFrameElementAttributes<Element>
		extends HTMLAttributes<Element> {
		allow?: Accessor<string>
		allowfullscreen?: Accessor<BooleanAttribute>
		height?: Accessor<number | string>
		loading?: Accessor<'eager' | 'lazy'>
		name?: Accessor<string>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		sandbox?: Accessor<
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
		src?: Accessor<string>
		srcdoc?: Accessor<string>
		width?: Accessor<number | string>

		/** @non-standard */
		browsingtopics?: Accessor<BooleanAttribute>

		/** @experimental */
		credentialless?: Accessor<BooleanAttribute>
		/** @experimental */
		csp?: Accessor<string>
		/** @experimental */
		sharedstoragewritable?: Accessor<BooleanAttribute>
		/** @experimental */
		adauctionheaders?: Accessor<BooleanAttribute>
		/** @experimental */
		privatetoken?: Accessor<string>

		/** @deprecated */
		allowpaymentrequest?: Accessor<BooleanAttribute>
		/** @deprecated */
		allowtransparency?: Accessor<BooleanAttribute>
		/** @deprecated */
		align?: Accessor<string>
		/** @deprecated */
		frameborder?: Accessor<number | string>
		/** @deprecated */
		longdesc?: Accessor<string>
		/** @deprecated */
		marginheight?: Accessor<number | string>
		/** @deprecated */
		marginwidth?: Accessor<number | string>
		/** @deprecated */
		scrolling?: Accessor<'yes' | 'no' | 'auto'>
		/** @deprecated */
		seamless?: Accessor<BooleanAttribute>
	}
	interface HTMLImageElementAttributes<Element>
		extends HTMLAttributes<Element> {
		alt?: Accessor<string>
		attributionsrc?: Accessor<string>
		browsingtopics?: Accessor<string>
		crossorigin?: Accessor<'anonymous' | 'use-credentials' | ''>
		decoding?: Accessor<'sync' | 'async' | 'auto'>
		fetchpriority?: Accessor<'high' | 'low' | 'auto'>
		height?: Accessor<number | string>
		ismap?: Accessor<BooleanAttribute>
		loading?: Accessor<'eager' | 'lazy'>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		sizes?: Accessor<string>
		src?: Accessor<string>
		srcset?: Accessor<string>
		usemap?: Accessor<string>
		width?: Accessor<number | string>

		/** @experimental */
		sharedstoragewritable?: Accessor<boolean>

		/** @deprecated */
		align?: Accessor<'top' | 'middle' | 'bottom' | 'left' | 'right'>
		/** @deprecated */
		border?: Accessor<string>
		/** @deprecated */
		hspace?: Accessor<number | string>
		/** @deprecated */
		intrinsicsize?: Accessor<string>
		/** @deprecated */
		longdesc?: Accessor<string>
		/** @deprecated */
		lowsrc?: Accessor<string>
		/** @deprecated */
		name?: Accessor<string>
		/** @deprecated */
		vspace?: Accessor<number | string>
	}
	interface HTMLInputElementAttributes<Element>
		extends HTMLAttributes<Element> {
		accept?: Accessor<string>
		alt?: Accessor<string>
		alpha?: Accessor<BooleanAttribute>
		autocomplete?: Accessor<
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
		capture?: Accessor<'user' | 'environment'>
		checked?: Accessor<BooleanAttribute>
		colorspace?: Accessor<string>
		dirname?: Accessor<string>
		disabled?: Accessor<BooleanAttribute>
		form?: Accessor<string>
		formaction?: Accessor<string>
		formenctype?: Accessor<
			| 'application/x-www-form-urlencoded'
			| 'multipart/form-data'
			| 'text/plain'
		>
		formmethod?: Accessor<'post' | 'get' | 'dialog'>
		formnovalidate?: Accessor<BooleanAttribute>
		formtarget?: Accessor<string>
		height?: Accessor<number | string>
		incremental?: Accessor<BooleanAttribute>
		list?: Accessor<string>
		max?: Accessor<number | string>
		maxlength?: Accessor<number | string>
		min?: Accessor<number | string>
		minlength?: Accessor<number | string>
		multiple?: Accessor<BooleanAttribute>
		name?: Accessor<string>
		pattern?: Accessor<string>
		placeholder?: Accessor<string>
		popovertarget?: Accessor<string>
		popovertargetaction?: Accessor<'hide' | 'show' | 'toggle'>
		readonly?: Accessor<BooleanAttribute>
		required?: Accessor<BooleanAttribute>
		results?: Accessor<number | string>
		size?: Accessor<number | string>
		src?: Accessor<string>
		step?: Accessor<number | string>
		type?: Accessor<
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
		value?: Accessor<number | string>
		width?: Accessor<number | string>

		/** @deprecated */
		align?: Accessor<string>
		/** @deprecated */
		usemap?: Accessor<string>
	}
	interface HTMLLIElementAttributes<Element>
		extends HTMLAttributes<Element> {
		value?: Accessor<number | string>

		/** @deprecated */
		type?: Accessor<'1' | 'a' | 'A' | 'i' | 'I'>
	}
	interface HTMLLabelElementAttributes<Element>
		extends HTMLAttributes<Element> {
		for?: Accessor<string>
		form?: Accessor<string>
	}
	interface HTMLLegendElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<string>
	}
	interface HTMLLinkElementAttributes<Element>
		extends HTMLAttributes<Element> {
		as?: Accessor<
			| 'audio'
			| 'document'
			| 'embed'
			| 'fetch'
			| 'font'
			| 'image'
			| 'object'
			| 'script'
			| 'style'
			| 'track'
			| 'video'
			| 'worker'
		>
		color?: Accessor<string>
		crossorigin?: Accessor<'anonymous' | 'use-credentials' | ''>
		disabled?: Accessor<BooleanAttribute>
		fetchpriority?: Accessor<'high' | 'low' | 'auto'>
		href?: Accessor<string>
		hreflang?: Accessor<string>
		imagesizes?: Accessor<string>
		imagesrcset?: Accessor<string>
		integrity?: Accessor<string>
		media?: Accessor<string>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		rel?: Accessor<string>
		sizes?: Accessor<string>
		type?: Accessor<string>

		/** @experimental */
		blocking?: Accessor<'render'>

		/** @deprecated */
		charset?: Accessor<string>
		/** @deprecated */
		rev?: Accessor<string>
		/** @deprecated */
		target?: Accessor<string>
	}
	interface HTMLMapElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Accessor<string>
	}
	interface HTMLMenuElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Accessor<BooleanAttribute>
		/** @deprecated */
		label?: Accessor<string>
		/** @deprecated */
		type?: Accessor<'context' | 'toolbar'>
	}
	interface HTMLMetaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		charset?: Accessor<string>
		content?: Accessor<string>
		'http-equiv'?: Accessor<
			| 'content-security-policy'
			| 'content-type'
			| 'default-style'
			| 'x-ua-compatible'
			| 'refresh'
		>
		media?: Accessor<string>
		name?: Accessor<string>

		/** @deprecated */
		scheme?: Accessor<string>
	}
	interface HTMLMeterElementAttributes<Element>
		extends HTMLAttributes<Element> {
		form?: Accessor<string>
		high?: Accessor<number | string>
		low?: Accessor<number | string>
		max?: Accessor<number | string>
		min?: Accessor<number | string>
		optimum?: Accessor<number | string>
		value?: Accessor<number | string>
	}
	interface HTMLModElementAttributes<Element>
		extends HTMLAttributes<Element> {
		cite?: Accessor<string>
		datetime?: Accessor<string>
	}
	interface HTMLOListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		reversed?: Accessor<BooleanAttribute>
		start?: Accessor<number | string>
		type?: Accessor<'1' | 'a' | 'A' | 'i' | 'I'>

		/** @deprecated */
		compact?: Accessor<BooleanAttribute>
	}
	interface HTMLObjectElementAttributes<Element>
		extends HTMLAttributes<Element> {
		data?: Accessor<string>
		form?: Accessor<string>
		height?: Accessor<number | string>
		name?: Accessor<string>
		type?: Accessor<string>
		width?: Accessor<number | string>
		wmode?: Accessor<string>

		/** @deprecated */
		align?: Accessor<string>
		/** @deprecated */
		archive?: Accessor<string>
		/** @deprecated */
		border?: Accessor<string>
		/** @deprecated */
		classid?: Accessor<string>
		/** @deprecated */
		code?: Accessor<string>
		/** @deprecated */
		codebase?: Accessor<string>
		/** @deprecated */
		codetype?: Accessor<string>
		/** @deprecated */
		declare?: Accessor<BooleanAttribute>
		/** @deprecated */
		hspace?: Accessor<number | string>
		/** @deprecated */
		standby?: Accessor<string>
		/** @deprecated */
		typemustmatch?: Accessor<BooleanAttribute>
		/** @deprecated */
		usemap?: Accessor<string>
		/** @deprecated */
		vspace?: Accessor<number | string>
	}
	interface HTMLOptGroupElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Accessor<BooleanAttribute>
		label?: Accessor<string>
	}
	interface HTMLOptionElementAttributes<Element>
		extends HTMLAttributes<Element> {
		disabled?: Accessor<BooleanAttribute>
		label?: Accessor<string>
		selected?: Accessor<BooleanAttribute>
		value?: Accessor<number | string>
	}
	interface HTMLOutputElementAttributes<Element>
		extends HTMLAttributes<Element> {
		for?: Accessor<string>
		form?: Accessor<string>
		name?: Accessor<string>
	}
	interface HTMLParagraphElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'right' | 'justify' | 'center'>
	}
	interface HTMLPictureElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLPreElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Accessor<number | string>
		/** @deprecated */
		wrap?: Accessor<string>
	}
	interface HTMLPreElementListingAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLPreElementXmpAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLProgressElementAttributes<Element>
		extends HTMLAttributes<Element> {
		max?: Accessor<number | string>
		value?: Accessor<number | string>
	}
	interface HTMLQuoteElementAttributes<Element>
		extends HTMLAttributes<Element> {
		cite?: Accessor<string>
	}
	interface HTMLScriptElementAttributes<Element>
		extends HTMLAttributes<Element> {
		async?: Accessor<BooleanAttribute>
		crossorigin?: Accessor<'anonymous' | 'use-credentials' | ''>
		defer?: Accessor<BooleanAttribute>
		fetchpriority?: Accessor<'high' | 'low' | 'auto'>
		for?: Accessor<string>
		integrity?: Accessor<string>
		nomodule?: Accessor<BooleanAttribute>
		referrerpolicy?: Accessor<
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		>
		src?: Accessor<string>
		type?: Accessor<
			'importmap' | 'module' | 'speculationrules' | (string & {})
		>

		/** @experimental */
		attributionsrc?: Accessor<string>
		/** @experimental */
		blocking?: Accessor<'render'>

		/** @deprecated */
		charset?: Accessor<string>
		/** @deprecated */
		event?: Accessor<string>
		/** @deprecated */
		language?: Accessor<string>
	}
	interface HTMLSelectElementAttributes<Element>
		extends HTMLAttributes<Element> {
		autocomplete?: Accessor<
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
		disabled?: Accessor<BooleanAttribute>
		form?: Accessor<string>
		multiple?: Accessor<BooleanAttribute>
		name?: Accessor<string>
		required?: Accessor<BooleanAttribute>
		size?: Accessor<number | string>
		value?: Accessor<number | string>
	}
	interface HTMLSlotElementAttributes<Element>
		extends HTMLAttributes<Element> {
		name?: Accessor<string>
	}
	interface HTMLSourceElementAttributes<Element>
		extends HTMLAttributes<Element> {
		height?: Accessor<number | string>
		media?: Accessor<string>
		sizes?: Accessor<string>
		src?: Accessor<string>
		srcset?: Accessor<string>
		type?: Accessor<string>
		width?: Accessor<number | string>
	}
	interface HTMLSpanElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLStyleElementAttributes<Element>
		extends HTMLAttributes<Element> {
		media?: Accessor<string>

		/** @experimental */
		blocking?: Accessor<'render'>

		/** @deprecated */
		scoped?: Accessor<BooleanAttribute>
		/** @deprecated */
		type?: Accessor<string>
	}
	interface HTMLTableCaptionElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right'>
	}
	interface HTMLTableCellTdElementAttributes<Element>
		extends HTMLAttributes<Element> {
		colspan?: Accessor<number | string>
		headers?: Accessor<string>
		rowspan?: Accessor<number | string>

		/** @deprecated */
		abbr?: Accessor<string>
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		axis?: Accessor<string>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		height?: Accessor<number | string>
		/** @deprecated */
		nowrap?: Accessor<BooleanAttribute>
		/** @deprecated */
		scope?: Accessor<'col' | 'row' | 'rowgroup' | 'colgroup'>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLTableCellThElementAttributes<Element>
		extends HTMLAttributes<Element> {
		abbr?: Accessor<string>
		colspan?: Accessor<number | string>
		headers?: Accessor<string>
		rowspan?: Accessor<number | string>
		scope?: Accessor<'col' | 'row' | 'rowgroup' | 'colgroup'>

		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		axis?: Accessor<string>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		height?: Accessor<string>
		/** @deprecated */
		nowrap?: Accessor<BooleanAttribute>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLTableColElementAttributes<Element>
		extends HTMLAttributes<Element> {
		span?: Accessor<number | string>

		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLTableElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		border?: Accessor<number | string>
		/** @deprecated */
		cellpadding?: Accessor<number | string>
		/** @deprecated */
		cellspacing?: Accessor<number | string>
		/** @deprecated */
		frame?: Accessor<
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
		rules?: Accessor<'none' | 'groups' | 'rows' | 'cols' | 'all'>
		/** @deprecated */
		summary?: Accessor<string>
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLTableRowElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLTableSectionBodyElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionFootElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTableSectionHeadElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		align?: Accessor<'left' | 'center' | 'right' | 'justify' | 'char'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		char?: Accessor<string>
		/** @deprecated */
		charoff?: Accessor<string>
		/** @deprecated */
		valign?: Accessor<'baseline' | 'bottom' | 'middle' | 'top'>
	}
	interface HTMLTemplateElementAttributes<Element>
		extends HTMLAttributes<Element> {
		shadowrootclonable?: Accessor<BooleanAttribute>
		shadowrootcustomelementregistry?: Accessor<BooleanAttribute>
		shadowrootdelegatesfocus?: Accessor<BooleanAttribute>
		shadowrootmode?: Accessor<'open' | 'closed'>
		shadowrootserializable?: Accessor<BooleanAttribute>
	}
	interface HTMLTextAreaElementAttributes<Element>
		extends HTMLAttributes<Element> {
		'prop:value'?: Accessor<string>

		autocomplete?: Accessor<
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
		cols?: Accessor<number | string>
		dirname?: Accessor<string>
		disabled?: Accessor<BooleanAttribute>
		form?: Accessor<string>
		maxlength?: Accessor<number | string>
		minlength?: Accessor<number | string>
		name?: Accessor<string>
		placeholder?: Accessor<string>
		readonly?: Accessor<BooleanAttribute>
		required?: Accessor<BooleanAttribute>
		rows?: Accessor<number | string>
		wrap?: Accessor<'hard' | 'soft' | 'off'>
	}
	interface HTMLTimeElementAttributes<Element>
		extends HTMLAttributes<Element> {
		datetime?: Accessor<string>
	}
	interface HTMLTitleElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLTrackElementAttributes<Element>
		extends HTMLAttributes<Element> {
		default?: Accessor<BooleanAttribute>
		kind?: Accessor<
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
		label?: Accessor<string>
		src?: Accessor<string>
		srclang?: Accessor<string>
	}
	interface HTMLUListElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Accessor<BooleanAttribute>
		/** @deprecated */
		type?: Accessor<'circle' | 'disc' | 'square'>
	}
	interface HTMLVideoElementAttributes<Element>
		extends HTMLAttributes<Element>,
			HTMLMediaHTMLAttributes<Element> {
		disablepictureinpicture?: Accessor<BooleanAttribute>
		height?: Accessor<number | string>
		playsinline?: Accessor<BooleanAttribute>
		poster?: Accessor<string>
		width?: Accessor<number | string>

		'on:enterpictureinpicture'?: Events<
			PictureInPictureEvent,
			Element
		>
		'on:leavepictureinpicture'?: Events<
			PictureInPictureEvent,
			Element
		>
	}

	/* HTMLDeprecatedElements */

	interface HTMLDirectoryElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		compact?: Accessor<BooleanAttribute>
	}

	interface HTMLFontElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		color?: Accessor<string>
		/** @deprecated */
		face?: Accessor<string>
		/** @deprecated */
		size?: Accessor<string>
	}
	interface HTMLFrameElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		frameborder?: Accessor<string>
		/** @deprecated */
		longdesc?: Accessor<string>
		/** @deprecated */
		marginheight?: Accessor<string>
		/** @deprecated */
		marginwidth?: Accessor<string>
		/** @deprecated */
		name?: Accessor<string>
		/** @deprecated */
		noresize?: Accessor<BooleanAttribute>
		/** @deprecated */
		scrolling?: Accessor<'yes' | 'no'>
		/** @deprecated */
		src?: Accessor<string>
	}
	interface HTMLFrameSetElementAttributes<Element>
		extends HTMLAttributes<Element>,
			WindowEventHandlers<Element> {
		/** @deprecated */
		cols?: Accessor<number | string>
		/** @deprecated */
		rows?: Accessor<number | string>
	}
	interface HTMLMarqueeElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		behavior?: Accessor<'scroll' | 'slide' | 'alternate'>
		/** @deprecated */
		bgcolor?: Accessor<string>
		/** @deprecated */
		direction?: Accessor<'left' | 'right' | 'up' | 'down'>
		/** @deprecated */
		height?: Accessor<number | string>
		/** @deprecated */
		hspace?: Accessor<number | string>
		/** @deprecated */
		loop?: Accessor<number | string>
		/** @deprecated */
		scrollamount?: Accessor<number | string>
		/** @deprecated */
		scrolldelay?: Accessor<number | string>
		/** @deprecated */
		truespeed?: Accessor<BooleanAttribute>
		/** @deprecated */
		vspace?: Accessor<number | string>
		/** @deprecated */
		width?: Accessor<number | string>
	}
	interface HTMLParamElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		name?: Accessor<string>
		/** @deprecated */
		value?: Accessor<number | string>
		/** @deprecated */
		type?: Accessor<string>
		/** @deprecated */
		valuetype?: Accessor<'data' | 'ref' | 'object'>
	}

	interface HTMLUnknownElementAttributes<Element>
		extends HTMLAttributes<Element> {}
	interface HTMLKeygenElementAttributes<Element>
		extends HTMLAttributes<Element> {
		/** @deprecated */
		challenge?: Accessor<string>
		/** @deprecated */
		disabled?: Accessor<BooleanAttribute>
		/** @deprecated */
		form?: Accessor<string>
		/** @deprecated */
		keyparams?: Accessor<string>
		/** @deprecated */
		keytype?: Accessor<string>
		/** @deprecated */
		name?: Accessor<string>
	}

	/* MathMLElements */

	interface MathMLAnnotationElementAttributes<Element>
		extends MathMLAttributes<Element> {
		encoding?: Accessor<string>

		/** @deprecated */
		src?: Accessor<string>
	}
	interface MathMLAnnotationXmlElementAttributes<Element>
		extends MathMLAttributes<Element> {
		encoding?: Accessor<string>

		/** @deprecated */
		src?: Accessor<string>
	}

	interface MathMLMathElementAttributes<Element>
		extends MathMLAttributes<Element> {
		display?: Accessor<'block' | 'inline'>
	}
	interface MathMLMerrorElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMfracElementAttributes<Element>
		extends MathMLAttributes<Element> {
		linethickness?: Accessor<string>

		/** @deprecated */
		denomalign?: Accessor<'center' | 'left' | 'right'>
		/** @deprecated */
		numalign?: Accessor<'center' | 'left' | 'right'>
	}
	interface MathMLMiElementAttributes<Element>
		extends MathMLAttributes<Element> {
		mathvariant?: Accessor<'normal'>
	}

	interface MathMLMmultiscriptsElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Accessor<string>
		/** @deprecated */
		superscriptshift?: Accessor<string>
	}
	interface MathMLMnElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMoElementAttributes<Element>
		extends MathMLAttributes<Element> {
		fence?: Accessor<BooleanAttribute>
		form?: Accessor<'prefix' | 'infix' | 'postfix'>
		largeop?: Accessor<BooleanAttribute>
		lspace?: Accessor<string>
		maxsize?: Accessor<string>
		minsize?: Accessor<string>
		movablelimits?: Accessor<BooleanAttribute>
		rspace?: Accessor<string>
		separator?: Accessor<BooleanAttribute>
		stretchy?: Accessor<BooleanAttribute>
		symmetric?: Accessor<BooleanAttribute>

		/** @non-standard */
		accent?: Accessor<BooleanAttribute>
	}
	interface MathMLMoverElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accent?: Accessor<BooleanAttribute>
	}
	interface MathMLMpaddedElementAttributes<Element>
		extends MathMLAttributes<Element> {
		depth?: Accessor<string>
		height?: Accessor<string>
		lspace?: Accessor<string>
		voffset?: Accessor<string>
		width?: Accessor<string>
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
		lquote?: Accessor<string>
		/** @deprecated */
		rquote?: Accessor<string>
	}
	interface MathMLMspaceElementAttributes<Element>
		extends MathMLAttributes<Element> {
		depth?: Accessor<string>
		height?: Accessor<string>
		width?: Accessor<string>
	}
	interface MathMLMsqrtElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMstyleElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		background?: Accessor<string>
		/** @deprecated */
		color?: Accessor<string>
		/** @deprecated */
		fontsize?: Accessor<string>
		/** @deprecated */
		fontstyle?: Accessor<string>
		/** @deprecated */
		fontweight?: Accessor<string>
		/** @deprecated */
		scriptminsize?: Accessor<string>
		/** @deprecated */
		scriptsizemultiplier?: Accessor<string>
	}
	interface MathMLMsubElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Accessor<string>
	}
	interface MathMLMsubsupElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		subscriptshift?: Accessor<string>
		/** @deprecated */
		superscriptshift?: Accessor<string>
	}
	interface MathMLMsupElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		superscriptshift?: Accessor<string>
	}
	interface MathMLMtableElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		align?: Accessor<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
		/** @non-standard */
		columnalign?: Accessor<'center' | 'left' | 'right'>
		/** @non-standard */
		columnlines?: Accessor<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		columnspacing?: Accessor<string>
		/** @non-standard */
		frame?: Accessor<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		framespacing?: Accessor<string>
		/** @non-standard */
		rowalign?: Accessor<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
		/** @non-standard */
		rowlines?: Accessor<'dashed' | 'none' | 'solid'>
		/** @non-standard */
		rowspacing?: Accessor<string>
		/** @non-standard */
		width?: Accessor<string>
	}
	interface MathMLMtdElementAttributes<Element>
		extends MathMLAttributes<Element> {
		columnspan?: Accessor<number | string>
		rowspan?: Accessor<number | string>
		/** @non-standard */
		columnalign?: Accessor<'center' | 'left' | 'right'>
		/** @non-standard */
		rowalign?: Accessor<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
	}
	interface MathMLMtextElementAttributes<Element>
		extends MathMLAttributes<Element> {}
	interface MathMLMtrElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		columnalign?: Accessor<'center' | 'left' | 'right'>
		/** @non-standard */
		rowalign?: Accessor<
			'axis' | 'baseline' | 'bottom' | 'center' | 'top'
		>
	}
	interface MathMLMunderElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accentunder?: Accessor<BooleanAttribute>
	}
	interface MathMLMunderoverElementAttributes<Element>
		extends MathMLAttributes<Element> {
		accent?: Accessor<BooleanAttribute>
		accentunder?: Accessor<BooleanAttribute>
	}
	interface MathMLSemanticsElementAttributes<Element>
		extends MathMLAttributes<Element> {}

	/* MathMLDeprecatedElements */

	interface MathMLMactionElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @deprecated */
		actiontype?: Accessor<'statusline' | 'toggle'>
		/** @deprecated */
		selection?: Accessor<string>
	}

	interface MathMLMencloseElementAttributes<Element>
		extends MathMLAttributes<Element> {
		/** @non-standard */
		notation?: Accessor<string>
	}
	interface MathMLMfencedElementAttributes<Element>
		extends MathMLAttributes<Element> {
		close?: Accessor<string>
		open?: Accessor<string>
		separators?: Accessor<string>
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
			WindowEventHandlers<Element> {}
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

	interface HTMLWebViewElements {
		/** @url https://www.electronjs.org/docs/latest/api/webview-tag */
		webview: HTMLWebViewElementAttributes<HTMLElement>
	}

	interface HTMLElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
		 */
		a: HTMLAnchorElementAttributes<HTMLAnchorElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		abbr: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		address: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement
		 */
		area: HTMLAreaElementAttributes<HTMLAreaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		article: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		aside: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
		 */
		audio: HTMLAudioElementAttributes<HTMLAudioElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		b: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBaseElement
		 */

		base: HTMLBaseElementAttributes<HTMLBaseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		bdi: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		bdo: HTMLBdoElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
		 */

		blockquote: HTMLQuoteElementAttributes<HTMLQuoteElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement
		 */

		body: HTMLBodyElementAttributes<HTMLBodyElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBRElement
		 */

		br: HTMLBRElementAttributes<HTMLBRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement
		 */

		button: HTMLButtonElementAttributes<HTMLButtonElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
		 */

		canvas: HTMLCanvasElementAttributes<HTMLCanvasElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCaptionElement
		 */

		caption: HTMLTableCaptionElementAttributes<HTMLTableCaptionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		cite: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */

		code: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
		 */

		col: HTMLTableColElementAttributes<HTMLTableColElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
		 */

		colgroup: HTMLTableColElementAttributes<HTMLTableColElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataElement
		 */

		data: HTMLDataElementAttributes<HTMLDataElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataListElement
		 */
		datalist: HTMLDataListElementAttributes<HTMLDataListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dd: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
		 */
		del: HTMLModElementAttributes<HTMLModElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement
		 */
		details: HTMLDetailsElementAttributes<HTMLDetailsElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dfn: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
		 */
		dialog: HTMLDialogElementAttributes<HTMLDialogElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement
		 */
		div: HTMLDivElementAttributes<HTMLDivElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDListElement
		 */
		dl: HTMLDListElementAttributes<HTMLDListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		dt: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		em: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLEmbedElement
		 */
		embed: HTMLEmbedElementAttributes<HTMLEmbedElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement
		 */
		fieldset: HTMLFieldSetElementAttributes<HTMLFieldSetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		figcaption: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		figure: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		footer: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement
		 */
		form: HTMLFormElementAttributes<HTMLFormElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h1: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h2: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h3: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h4: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h5: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
		 */
		h6: HTMLHeadingElementAttributes<HTMLHeadingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadElement
		 */
		head: HTMLHeadElementAttributes<HTMLHeadElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		header: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		hgroup: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHRElement
		 */
		hr: HTMLHRElementAttributes<HTMLHRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHtmlElement
		 */
		html: HTMLHtmlElementAttributes<HTMLHtmlElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		i: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
		 */
		iframe: HTMLIFrameElementAttributes<HTMLIFrameElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement
		 */
		img: HTMLImageElementAttributes<HTMLImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement
		 */
		input: HTMLInputElementAttributes<HTMLInputElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
		 */
		ins: HTMLModElementAttributes<HTMLModElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		kbd: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement
		 */
		label: HTMLLabelElementAttributes<HTMLLabelElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLegendElement
		 */
		legend: HTMLLegendElementAttributes<HTMLLegendElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLIElement
		 */
		li: HTMLLIElementAttributes<HTMLLIElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement
		 */
		link: HTMLLinkElementAttributes<HTMLLinkElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		main: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement
		 */
		map: HTMLMapElementAttributes<HTMLMapElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		mark: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMenuElement
		 */
		menu: HTMLMenuElementAttributes<HTMLMenuElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMetaElement
		 */
		meta: HTMLMetaElementAttributes<HTMLMetaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMeterElement
		 */
		meter: HTMLMeterElementAttributes<HTMLMeterElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		nav: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noscript: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement
		 */
		object: HTMLObjectElementAttributes<HTMLObjectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOListElement
		 */
		ol: HTMLOListElementAttributes<HTMLOListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptGroupElement
		 */
		optgroup: HTMLOptGroupElementAttributes<HTMLOptGroupElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
		 */
		option: HTMLOptionElementAttributes<HTMLOptionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOutputElement
		 */
		output: HTMLOutputElementAttributes<HTMLOutputElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParagraphElement
		 */
		p: HTMLParagraphElementAttributes<HTMLParagraphElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPictureElement
		 */
		picture: HTMLPictureElementAttributes<HTMLPictureElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		pre: HTMLPreElementAttributes<HTMLPreElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement
		 */
		progress: HTMLProgressElementAttributes<HTMLProgressElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
		 */
		q: HTMLQuoteElementAttributes<HTMLQuoteElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rp: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rt: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		ruby: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		s: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		samp: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
		 */
		script: HTMLScriptElementAttributes<HTMLScriptElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		search: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		section: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
		 */
		select: HTMLSelectElementAttributes<HTMLSelectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
		 */
		slot: HTMLSlotElementAttributes<HTMLSlotElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		small: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSourceElement
		 */
		source: HTMLSourceElementAttributes<HTMLSourceElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSpanElement
		 */
		span: HTMLSpanElementAttributes<HTMLSpanElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		strong: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement
		 */
		style: HTMLStyleElementAttributes<HTMLStyleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		sub: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		summary: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		sup: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
		 */
		table: HTMLTableElementAttributes<HTMLTableElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		tbody: HTMLTableSectionBodyElementAttributes<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
		 */
		td: HTMLTableCellTdElementAttributes<HTMLTableCellElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
		 */
		template: HTMLTemplateElementAttributes<HTMLTemplateElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement
		 */
		textarea: HTMLTextAreaElementAttributes<HTMLTextAreaElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		tfoot: HTMLTableSectionFootElementAttributes<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
		 */
		th: HTMLTableCellThElementAttributes<HTMLTableCellElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
		 */
		thead: HTMLTableSectionHeadElementAttributes<HTMLTableSectionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTimeElement
		 */
		time: HTMLTimeElementAttributes<HTMLTimeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTitleElement
		 */
		title: HTMLTitleElementAttributes<HTMLTitleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
		 */
		tr: HTMLTableRowElementAttributes<HTMLTableRowElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement
		 */
		track: HTMLTrackElementAttributes<HTMLTrackElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		u: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUListElement
		 */
		ul: HTMLUListElementAttributes<HTMLUListElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		var: HTMLElementAttributes<HTMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
		 */
		video: HTMLVideoElementAttributes<HTMLVideoElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		wbr: HTMLElementAttributes<HTMLElement>
	}

	// HTMLDeprecatedElements

	interface HTMLDeprecatedElements {
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/acronym
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		acronym: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		applet: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/basefont
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		basefont: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		bgsound: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		big: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		blink: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		center: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDirectoryElement
		 */
		dir: HTMLDirectoryElementAttributes<HTMLDirectoryElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFontElement
		 */
		font: HTMLFontElementAttributes<HTMLFontElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameElement
		 */
		frame: HTMLFrameElementAttributes<HTMLFrameElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameSetElement
		 */
		frameset: HTMLFrameSetElementAttributes<HTMLFrameSetElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		isindex: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		keygen: HTMLKeygenElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/listing
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		listing: HTMLPreElementListingAttributes<HTMLPreElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMarqueeElement
		 */
		marquee: HTMLMarqueeElementAttributes<HTMLMarqueeElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		menuitem: HTMLElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/multicol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		multicol: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nextid
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		nextid: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		nobr: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noembed: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noindex
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		noindex: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		noframes: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParamElement
		 */
		param: HTMLParamElementAttributes<HTMLParamElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		plaintext: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rb: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rtc
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		rtc: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/spacer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
		 */
		spacer: HTMLUnknownElementAttributes<HTMLUnknownElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strike
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		strike: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
		 */
		tt: HTMLElementAttributes<HTMLElement>
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
		 */
		xmp: HTMLPreElementXmpAttributes<HTMLPreElement>
	}

	// MathMLElements

	interface MathMLElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		annotation: MathMLAnnotationElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation-xml
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		'annotation-xml': MathMLAnnotationXmlElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		math: MathMLMathElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/merror
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		merror: MathMLMerrorElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mfrac: MathMLMfracElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mi
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mi: MathMLMiElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mmultiscripts: MathMLMmultiscriptsElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mn
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mn: MathMLMnElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mo: MathMLMoElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mover
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mover: MathMLMoverElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mpadded
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mpadded: MathMLMpaddedElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mphantom
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mphantom: MathMLMphantomElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mprescripts
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mprescripts: MathMLMprescriptsElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mroot
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mroot: MathMLMrootElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mrow
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mrow: MathMLMrowElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		ms: MathMLMsElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mspace
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mspace: MathMLMspaceElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msqrt
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msqrt: MathMLMsqrtElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mstyle: MathMLMstyleElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msub
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msub: MathMLMsubElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msubsup: MathMLMsubsupElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msup
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		msup: MathMLMsupElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtable: MathMLMtableElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtd: MathMLMtdElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtext
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtext: MathMLMtextElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mtr: MathMLMtrElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munder
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		munder: MathMLMunderElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munderover
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		munderover: MathMLMunderoverElementAttributes<MathMLElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/semantics
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		semantics: MathMLSemanticsElementAttributes<MathMLElement>
		/**
		 * @non-standard
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		menclose: MathMLMencloseElementAttributes<MathMLElement>
	}

	// MathMLDeprecatedElements

	interface MathMLDeprecatedElements {
		/**
		 * @deprecated
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		maction: MathMLMactionElementAttributes<MathMLElement>
		/**
		 * @deprecated
		 * @non-standard
		 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfenced
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
		 */
		mfenced: MathMLMfencedElementAttributes<MathMLElement>
	}

	// SVGElements

	interface SVGElements {
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateElement
		 */
		animate: SVGAnimateElementAttributes<SVGAnimateElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateMotionElement
		 */
		animateMotion: SVGAnimateMotionElementAttributes<SVGAnimateMotionElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateTransformElement
		 */
		animateTransform: SVGAnimateTransformElementAttributes<SVGAnimateTransformElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGCircleElement
		 */
		circle: SVGCircleElementAttributes<SVGCircleElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGClipPathElement
		 */
		clipPath: SVGClipPathElementAttributes<SVGClipPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDefsElement
		 */
		defs: SVGDefsElementAttributes<SVGDefsElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDescElement
		 */
		desc: SVGDescElementAttributes<SVGDescElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGEllipseElement
		 */
		ellipse: SVGEllipseElementAttributes<SVGEllipseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEBlendElement
		 */
		feBlend: SVGFEBlendElementAttributes<SVGFEBlendElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEColorMatrixElement
		 */
		feColorMatrix: SVGFEColorMatrixElementAttributes<SVGFEColorMatrixElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEComponentTransferElement
		 */
		feComponentTransfer: SVGFEComponentTransferElementAttributes<SVGFEComponentTransferElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFECompositeElement
		 */
		feComposite: SVGFECompositeElementAttributes<SVGFECompositeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEConvolveMatrixElement
		 */
		feConvolveMatrix: SVGFEConvolveMatrixElementAttributes<SVGFEConvolveMatrixElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDiffuseLightingElement
		 */
		feDiffuseLighting: SVGFEDiffuseLightingElementAttributes<SVGFEDiffuseLightingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDisplacementMapElement
		 */
		feDisplacementMap: SVGFEDisplacementMapElementAttributes<SVGFEDisplacementMapElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDistantLightElement
		 */
		feDistantLight: SVGFEDistantLightElementAttributes<SVGFEDistantLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDropShadowElement
		 */
		feDropShadow: SVGFEDropShadowElementAttributes<SVGFEDropShadowElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFloodElement
		 */
		feFlood: SVGFEFloodElementAttributes<SVGFEFloodElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncAElement
		 */
		feFuncA: SVGFEFuncAElementAttributes<SVGFEFuncAElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncBElement
		 */
		feFuncB: SVGFEFuncBElementAttributes<SVGFEFuncBElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncGElement
		 */
		feFuncG: SVGFEFuncGElementAttributes<SVGFEFuncGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncRElement
		 */
		feFuncR: SVGFEFuncRElementAttributes<SVGFEFuncRElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEGaussianBlurElement
		 */
		feGaussianBlur: SVGFEGaussianBlurElementAttributes<SVGFEGaussianBlurElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEImageElement
		 */
		feImage: SVGFEImageElementAttributes<SVGFEImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeElement
		 */
		feMerge: SVGFEMergeElementAttributes<SVGFEMergeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeNodeElement
		 */
		feMergeNode: SVGFEMergeNodeElementAttributes<SVGFEMergeNodeElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMorphologyElement
		 */
		feMorphology: SVGFEMorphologyElementAttributes<SVGFEMorphologyElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEOffsetElement
		 */
		feOffset: SVGFEOffsetElementAttributes<SVGFEOffsetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEPointLightElement
		 */
		fePointLight: SVGFEPointLightElementAttributes<SVGFEPointLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpecularLightingElement
		 */
		feSpecularLighting: SVGFESpecularLightingElementAttributes<SVGFESpecularLightingElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpotLightElement
		 */
		feSpotLight: SVGFESpotLightElementAttributes<SVGFESpotLightElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETileElement
		 */
		feTile: SVGFETileElementAttributes<SVGFETileElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETurbulenceElement
		 */
		feTurbulence: SVGFETurbulenceElementAttributes<SVGFETurbulenceElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFilterElement
		 */
		filter: SVGFilterElementAttributes<SVGFilterElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGForeignObjectElement
		 */
		foreignObject: SVGForeignObjectElementAttributes<SVGForeignObjectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGGElement
		 */
		g: SVGGElementAttributes<SVGGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGImageElement
		 */
		image: SVGImageElementAttributes<SVGImageElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLineElement
		 */
		line: SVGLineElementAttributes<SVGLineElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLinearGradientElement
		 */
		linearGradient: SVGLinearGradientElementAttributes<SVGLinearGradientElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMarkerElement
		 */
		marker: SVGMarkerElementAttributes<SVGMarkerElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMaskElement
		 */
		mask: SVGMaskElementAttributes<SVGMaskElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMetadataElement
		 */
		metadata: SVGMetadataElementAttributes<SVGMetadataElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMPathElement
		 */
		mpath: SVGMPathElementAttributes<SVGMPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
		 */
		path: SVGPathElementAttributes<SVGPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPatternElement
		 */
		pattern: SVGPatternElementAttributes<SVGPatternElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolygonElement
		 */
		polygon: SVGPolygonElementAttributes<SVGPolygonElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolylineElement
		 */
		polyline: SVGPolylineElementAttributes<SVGPolylineElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRadialGradientElement
		 */
		radialGradient: SVGRadialGradientElementAttributes<SVGRadialGradientElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRectElement
		 */
		rect: SVGRectElementAttributes<SVGRectElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSetElement
		 */
		set: SVGSetElementAttributes<SVGSetElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGStopElement
		 */
		stop: SVGStopElementAttributes<SVGStopElement>

		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
		 */
		svg: SVGSVGElementAttributes<SVGSVGElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSwitchElement
		 */
		switch: SVGSwitchElementAttributes<SVGSwitchElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement
		 */
		symbol: SVGSymbolElementAttributes<SVGSymbolElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextElement
		 */
		text: SVGTextElementAttributes<SVGTextElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextPathElement
		 */
		textPath: SVGTextPathElementAttributes<SVGTextPathElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTSpanElement
		 */
		tspan: SVGTSpanElementAttributes<SVGTSpanElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGUseElement
		 */
		use: SVGUseElementAttributes<SVGUseElement>
		/**
		 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view
		 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGViewElement
		 */
		view: SVGViewElementAttributes<SVGViewElement>
	}

	/** EVENTS */

	// element

	interface ElementEventHandlers<Element> {
		'on:abort'?: Events<UIEvent, Element>
		'on:animationcancel'?: Events<AnimationEvent, Element>
		'on:animationend'?: Events<AnimationEvent, Element>
		'on:animationiteration'?: Events<AnimationEvent, Element>
		'on:animationstart'?: Events<AnimationEvent, Element>
		'on:auxclick'?: Events<MouseEvent, Element>
		'on:beforeinput'?: Events<InputEvent, Element>
		'on:beforetoggle'?: Events<ToggleEvent, Element>
		'on:blur'?: Events<FocusEvent, Element>
		'on:cancel'?: Events<Event, Element>
		'on:canplay'?: Events<Event, Element>
		'on:canplaythrough'?: Events<Event, Element>
		'on:change'?: Events<Event, Element>
		'on:click'?: Events<MouseEvent, Element>
		'on:close'?: Events<Event, Element>
		'on:compositionend'?: Events<CompositionEvent, Element>
		'on:compositionstart'?: Events<CompositionEvent, Element>
		'on:compositionupdate'?: Events<CompositionEvent, Element>
		'on:contextlost'?: Events<Event, Element>
		'on:contextmenu'?: Events<MouseEvent, Element>
		'on:contextrestored'?: Events<Event, Element>
		'on:copy'?: Events<ClipboardEvent, Element>
		'on:cuechange'?: Events<Event, Element>
		'on:cut'?: Events<ClipboardEvent, Element>
		'on:dblclick'?: Events<MouseEvent, Element>
		'on:drag'?: Events<DragEvent, Element>
		'on:dragend'?: Events<DragEvent, Element>
		'on:dragenter'?: Events<DragEvent, Element>
		'on:dragleave'?: Events<DragEvent, Element>
		'on:dragover'?: Events<DragEvent, Element>
		'on:dragstart'?: Events<DragEvent, Element>
		'on:drop'?: Events<DragEvent, Element>
		'on:durationchange'?: Events<Event, Element>
		'on:emptied'?: Events<Event, Element>
		'on:ended'?: Events<Event, Element>
		'on:error'?: Events<ErrorEvent, Element>
		'on:focus'?: Events<FocusEvent, Element>
		'on:focusin'?: Events<FocusEvent, Element>
		'on:focusout'?: Events<FocusEvent, Element>
		'on:formdata'?: Events<FormDataEvent, Element>
		'on:fullscreenchange'?: Events<Event, Element>
		'on:fullscreenerror'?: Events<Event, Element>
		'on:gotpointercapture'?: Events<PointerEvent, Element>
		'on:input'?: Events<Event, Element>
		'on:invalid'?: Events<Event, Element>
		'on:keydown'?: Events<KeyboardEvent, Element>
		'on:keypress'?: Events<KeyboardEvent, Element>
		'on:keyup'?: Events<KeyboardEvent, Element>
		'on:load'?: Events<Event, Element>
		'on:loadeddata'?: Events<Event, Element>
		'on:loadedmetadata'?: Events<Event, Element>
		'on:loadstart'?: Events<Event, Element>
		'on:lostpointercapture'?: Events<PointerEvent, Element>
		'on:mousedown'?: Events<MouseEvent, Element>
		'on:mouseenter'?: Events<MouseEvent, Element>
		'on:mouseleave'?: Events<MouseEvent, Element>
		'on:mousemove'?: Events<MouseEvent, Element>
		'on:mouseout'?: Events<MouseEvent, Element>
		'on:mouseover'?: Events<MouseEvent, Element>
		'on:mouseup'?: Events<MouseEvent, Element>
		'on:paste'?: Events<ClipboardEvent, Element>
		'on:pause'?: Events<Event, Element>
		'on:play'?: Events<Event, Element>
		'on:playing'?: Events<Event, Element>
		'on:pointercancel'?: Events<PointerEvent, Element>
		'on:pointerdown'?: Events<PointerEvent, Element>
		'on:pointerenter'?: Events<PointerEvent, Element>
		'on:pointerleave'?: Events<PointerEvent, Element>
		'on:pointermove'?: Events<PointerEvent, Element>
		'on:pointerout'?: Events<PointerEvent, Element>
		'on:pointerover'?: Events<PointerEvent, Element>
		'on:pointerup'?: Events<PointerEvent, Element>
		'on:progress'?: Events<ProgressEvent, Element>
		'on:ratechange'?: Events<Event, Element>
		'on:reset'?: Events<Event, Element>
		'on:resize'?: Events<UIEvent, Element>
		'on:scroll'?: Events<Event, Element>
		'on:scrollend'?: Events<Event, Element>
		'on:securitypolicyviolation'?: Events<
			SecurityPolicyViolationEvent,
			Element
		>
		'on:seeked'?: Events<Event, Element>
		'on:seeking'?: Events<Event, Element>
		'on:select'?: Events<Event, Element>
		'on:selectionchange'?: Events<Event, Element>
		'on:selectstart'?: Events<Event, Element>
		'on:slotchange'?: Events<Event, Element>
		'on:stalled'?: Events<Event, Element>
		'on:submit'?: Events<SubmitEvent, Element>
		'on:suspend'?: Events<Event, Element>
		'on:timeupdate'?: Events<Event, Element>
		'on:toggle'?: Events<ToggleEvent, Element>
		'on:touchcancel'?: Events<TouchEvent, Element>
		'on:touchend'?: Events<TouchEvent, Element>
		'on:touchmove'?: Events<TouchEvent, Element>
		'on:touchstart'?: Events<TouchEvent, Element>
		'on:transitioncancel'?: Events<TransitionEvent, Element>
		'on:transitionend'?: Events<TransitionEvent, Element>
		'on:transitionrun'?: Events<TransitionEvent, Element>
		'on:transitionstart'?: Events<TransitionEvent, Element>
		'on:volumechange'?: Events<Event, Element>
		'on:waiting'?: Events<Event, Element>
		'on:wheel'?: Events<WheelEvent, Element>
	}

	// window

	interface WindowEventHandlers<Element> {
		'on:afterprint'?: Events<Event, Element>
		'on:beforeprint'?: Events<Event, Element>
		'on:beforeunload'?: Events<BeforeUnloadEvent, Element>
		'on:gamepadconnected'?: Events<GamepadEvent, Element>
		'on:gamepaddisconnected'?: Events<GamepadEvent, Element>
		'on:hashchange'?: Events<HashChangeEvent, Element>
		'on:languagechange'?: Events<Event, Element>
		'on:message'?: Events<MessageEvent, Element>
		'on:messageerror'?: Events<MessageEvent, Element>
		'on:offline'?: Events<Event, Element>
		'on:online'?: Events<Event, Element>
		'on:pagehide'?: Events<PageTransitionEvent, Element>
		// TODO `PageRevealEvent` is currently undefined on TS
		'on:pagereveal'?: Events<Event, Element>
		'on:pageshow'?: Events<PageTransitionEvent, Element>
		// TODO `PageSwapEvent` is currently undefined on TS
		'on:pageswap'?: Events<Event, Element>
		'on:popstate'?: Events<PopStateEvent, Element>
		'on:rejectionhandled'?: Events<PromiseRejectionEvent, Element>
		'on:storage'?: Events<StorageEvent, Element>
		'on:unhandledrejection'?: Events<PromiseRejectionEvent, Element>
		'on:unload'?: Events<Event, Element>
	}

	/** ARIA */

	interface AriaAttributes {
		/**
		 * Identifies the currently active element when DOM focus is on a
		 * composite widget, textbox, group, or application.
		 */
		'aria-activedescendant'?: Accessor<string>
		/**
		 * Indicates whether assistive technologies will present all, or
		 * only parts of, the changed region based on the change
		 * notifications defined by the aria-relevant attribute.
		 */
		'aria-atomic'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Similar to the global aria-label. Defines a string value that
		 * labels the current element, which is intended to be converted
		 * into Braille.
		 *
		 * @see aria-label.
		 */
		'aria-braillelabel'?: Accessor<string>
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
		'aria-brailleroledescription'?: Accessor<string>
		/**
		 * Indicates whether inputting text could trigger display of one
		 * or more predictions of the user's intended value for an input
		 * and specifies how predictions would be presented if they are
		 * made.
		 */
		'aria-autocomplete'?: Accessor<
			'none' | 'inline' | 'list' | 'both'
		>
		/**
		 * Indicates an element is being modified and that assistive
		 * technologies MAY want to wait until the modifications are
		 * complete before exposing them to the user.
		 */
		'aria-busy'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates the current "checked" state of checkboxes, radio
		 * buttons, and other widgets.
		 *
		 * @see aria-pressed @see aria-selected.
		 */
		'aria-checked'?: Accessor<EnumeratedPseudoBoolean | 'mixed'>
		/**
		 * Defines the total number of columns in a table, grid, or
		 * treegrid.
		 *
		 * @see aria-colindex.
		 */
		'aria-colcount'?: Accessor<number | string>
		/**
		 * Defines an element's column index or position with respect to
		 * the total number of columns within a table, grid, or treegrid.
		 *
		 * @see aria-colcount @see aria-colspan.
		 */
		'aria-colindex'?: Accessor<number | string>
		/**
		 * Defines a human-readable text alternative of the numeric
		 * aria-colindex.
		 */
		'aria-colindextext'?: Accessor<number | string>
		/**
		 * Defines the number of columns spanned by a cell or gridcell
		 * within a table, grid, or treegrid.
		 *
		 * @see aria-colindex @see aria-rowspan.
		 */
		'aria-colspan'?: Accessor<number | string>
		/**
		 * Identifies the element (or elements) whose contents or presence
		 * are controlled by the current element.
		 *
		 * @see aria-owns.
		 */
		'aria-controls'?: Accessor<string>
		/**
		 * Indicates the element that represents the current item within a
		 * container or set of related elements.
		 */
		'aria-current'?: Accessor<
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
		'aria-describedby'?: Accessor<string>
		/**
		 * Defines a string value that describes or annotates the current
		 * element.
		 *
		 * @see aria-describedby
		 */
		'aria-description'?: Accessor<string>
		/**
		 * Identifies the element that provides a detailed, extended
		 * description for the object.
		 *
		 * @see aria-describedby.
		 */
		'aria-details'?: Accessor<string>
		/**
		 * Indicates that the element is perceivable but disabled, so it
		 * is not editable or otherwise operable.
		 *
		 * @see aria-hidden @see aria-readonly.
		 */
		'aria-disabled'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates what functions can be performed when a dragged object
		 * is released on the drop target.
		 *
		 * @deprecated In ARIA 1.1
		 */
		'aria-dropeffect'?: Accessor<
			'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
		>
		/**
		 * Identifies the element that provides an error message for the
		 * object.
		 *
		 * @see aria-invalid @see aria-describedby.
		 */
		'aria-errormessage'?: Accessor<string>
		/**
		 * Indicates whether the element, or another grouping element it
		 * controls, is currently expanded or collapsed.
		 */
		'aria-expanded'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Identifies the next element (or elements) in an alternate
		 * reading order of content which, at the user's discretion,
		 * allows assistive technology to override the general default of
		 * reading in document source order.
		 */
		'aria-flowto'?: Accessor<string>
		/**
		 * Indicates an element's "grabbed" state in a drag-and-drop
		 * operation.
		 *
		 * @deprecated In ARIA 1.1
		 */
		'aria-grabbed'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates the availability and type of interactive popup
		 * element, such as menu or dialog, that can be triggered by an
		 * element.
		 */
		'aria-haspopup'?: Accessor<
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
		'aria-hidden'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates the entered value does not conform to the format
		 * expected by the application.
		 *
		 * @see aria-errormessage.
		 */
		'aria-invalid'?: Accessor<
			EnumeratedPseudoBoolean | 'grammar' | 'spelling'
		>
		/**
		 * Indicates keyboard shortcuts that an author has implemented to
		 * activate or give focus to an element.
		 */
		'aria-keyshortcuts'?: Accessor<string>
		/**
		 * Defines a string value that labels the current element.
		 *
		 * @see aria-labelledby.
		 */
		'aria-label'?: Accessor<string>
		/**
		 * Identifies the element (or elements) that labels the current
		 * element.
		 *
		 * @see aria-describedby.
		 */
		'aria-labelledby'?: Accessor<string>
		/**
		 * Defines the hierarchical level of an element within a
		 * structure.
		 */
		'aria-level'?: Accessor<number | string>
		/**
		 * Indicates that an element will be updated, and describes the
		 * types of updates the user agents, assistive technologies, and
		 * user can expect from the live region.
		 */
		'aria-live'?: Accessor<'off' | 'assertive' | 'polite'>
		/** Indicates whether an element is modal when displayed. */
		'aria-modal'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates whether a text box accepts multiple lines of input or
		 * only a single line.
		 */
		'aria-multiline'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates that the user may select more than one item from the
		 * current selectable descendants.
		 */
		'aria-multiselectable'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates whether the element's orientation is horizontal,
		 * vertical, or unknown/ambiguous.
		 */
		'aria-orientation'?: Accessor<'horizontal' | 'vertical'>
		/**
		 * Identifies an element (or elements) in order to define a
		 * visual, functional, or contextual parent/child relationship
		 * between DOM elements where the DOM hierarchy cannot be used to
		 * represent the relationship.
		 *
		 * @see aria-controls.
		 */
		'aria-owns'?: Accessor<string>
		/**
		 * Defines a short hint (a word or short phrase) intended to aid
		 * the user with data entry when the control has no value. A hint
		 * could be a sample value or a brief description of the expected
		 * format.
		 */
		'aria-placeholder'?: Accessor<string>
		/**
		 * Defines an element's number or position in the current set of
		 * listitems or treeitems. Not required if all elements in the set
		 * are present in the DOM.
		 *
		 * @see aria-setsize.
		 */
		'aria-posinset'?: Accessor<number | string>
		/**
		 * Indicates the current "pressed" state of toggle buttons.
		 *
		 * @see aria-checked @see aria-selected.
		 */
		'aria-pressed'?: Accessor<EnumeratedPseudoBoolean | 'mixed'>
		/**
		 * Indicates that the element is not editable, but is otherwise
		 * operable.
		 *
		 * @see aria-disabled.
		 */
		'aria-readonly'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Indicates what notifications the user agent will trigger when
		 * the accessibility tree within a live region is modified.
		 *
		 * @see aria-atomic.
		 */
		'aria-relevant'?: Accessor<
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
		'aria-required'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Defines a human-readable, author-localized description for the
		 * role of an element.
		 */
		'aria-roledescription'?: Accessor<string>
		/**
		 * Defines the total number of rows in a table, grid, or treegrid.
		 *
		 * @see aria-rowindex.
		 */
		'aria-rowcount'?: Accessor<number | string>
		/**
		 * Defines an element's row index or position with respect to the
		 * total number of rows within a table, grid, or treegrid.
		 *
		 * @see aria-rowcount @see aria-rowspan.
		 */
		'aria-rowindex'?: Accessor<number | string>
		/** Defines a human-readable text alternative of aria-rowindex. */
		'aria-rowindextext'?: Accessor<number | string>
		/**
		 * Defines the number of rows spanned by a cell or gridcell within
		 * a table, grid, or treegrid.
		 *
		 * @see aria-rowindex @see aria-colspan.
		 */
		'aria-rowspan'?: Accessor<number | string>
		/**
		 * Indicates the current "selected" state of various widgets.
		 *
		 * @see aria-checked @see aria-pressed.
		 */
		'aria-selected'?: Accessor<EnumeratedPseudoBoolean>
		/**
		 * Defines the number of items in the current set of listitems or
		 * treeitems. Not required if all elements in the set are present
		 * in the DOM.
		 *
		 * @see aria-posinset.
		 */
		'aria-setsize'?: Accessor<number | string>
		/**
		 * Indicates if items in a table or grid are sorted in ascending
		 * or descending order.
		 */
		'aria-sort'?: Accessor<
			'none' | 'ascending' | 'descending' | 'other'
		>
		/** Defines the maximum allowed value for a range widget. */
		'aria-valuemax'?: Accessor<number | string>
		/** Defines the minimum allowed value for a range widget. */
		'aria-valuemin'?: Accessor<number | string>
		/**
		 * Defines the current value for a range widget.
		 *
		 * @see aria-valuetext.
		 */
		'aria-valuenow'?: Accessor<number | string>
		/**
		 * Defines the human readable text alternative of aria-valuenow
		 * for a range widget.
		 */
		'aria-valuetext'?: Accessor<string>
		role?: Accessor<
			| 'alert'
			| 'alertdialog'
			| 'application'
			| 'article'
			| 'banner'
			| 'button'
			| 'cell'
			| 'checkbox'
			| 'columnheader'
			| 'combobox'
			| 'complementary'
			| 'contentinfo'
			| 'definition'
			| 'dialog'
			| 'directory'
			| 'document'
			| 'feed'
			| 'figure'
			| 'form'
			| 'grid'
			| 'gridcell'
			| 'group'
			| 'heading'
			| 'img'
			| 'link'
			| 'list'
			| 'listbox'
			| 'listitem'
			| 'log'
			| 'main'
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
			| 'switch'
			| 'tab'
			| 'table'
			| 'tablist'
			| 'tabpanel'
			| 'term'
			| 'textbox'
			| 'timer'
			| 'toolbar'
			| 'tooltip'
			| 'tree'
			| 'treegrid'
			| 'treeitem'
		>
	}
}

/**
 * 1. This prevents the other types in this file from leaking.
 * 2. This has to be the last thing of the file for some reason.
 */

export {}
