/**
 * The interfaces for Events and Elements are auto-generated from
 * Typescript.
 *
 * The fields of the elements are a mix of:
 *
 * - MDN - https://developer.mozilla.org/
 * - Solid - https://www.solidjs.com/
 * - Voby - https://github.com/vobyjs/voby
 * - Preact - https://preactjs.com/
 * - Vue - https://vuejs.org/
 *
 * Todo
 *
 * - Export JSX from main
 * - CSS typings could be improved
 * - SVG typings are non-existent
 */

import * as csstype from 'csstype'

export namespace JSX {
	// JSX.ElementAttributesProperty - name of the `props` argument

	interface ElementAttributesProperty {
		props
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

		// [prop: string]: any // catch-all
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
		// recurse
		| (() => Element)
		| Promise<Element>
		| Element[]
	// | object // unsure
	// | DOMElements // unsure

	/* Interfaces */

	// explicit attributes/properties

	interface ExplicitProperties {}
	interface ExplicitAttributes {}
	interface ExplicitBooleans {}

	// all elements

	interface IntrinsicElements
		extends HTMLDeprecatedElements,
			MathMLDeprecatedElements,
			HTMLWebViewElements,
			MathMLElements,
			SVGElements,
			HTMLElements {
		// typing custom elements
		[elementName: string]: any // catch-all
	}

	/*
		JSX.IntrinsicClassAttributes // class attributes
		JSX.IntrinsicElements // tags
		JSX.IntrinsicAttributes // leaks to class and functional components
	*/
}

/* CORE */

interface PotaAttributes<Element> {
	children?: JSX.Element

	ref?: SignalSetter<Element> | ((element: Element) => void)

	onMount?: (element: Element) => void
	onUnmount?: (element: Element) => void
}

interface FallbackAttributes {
	// events
	[attr: `on:${string}`]: any

	// css
	[attr: `class:${string}`]: any
	[attr: `style:${string}`]: any
	[attr: `var:${string}`]: any
}

/* CSS */

type NSStyle = {
	[Key in Exclude<
		keyof csstype.PropertiesHyphen,
		`-${string}`
	> as `style:${Key}`]?: csstype.PropertiesHyphen[Key]
}

interface CSSProperties extends csstype.PropertiesHyphen {
	[key: `-${string}`]: string | number | undefined
}

interface CSSAttributes extends NSStyle {
	class?: string
	style?: CSSProperties | string

	css?: string | CSSStyleSheet
	cssText?: string
}

/* Namespaced */

type NSProp = NSAttributeMap<'prop', JSX.ExplicitProperties>
type NSAttr = NSAttributeMap<'attr', JSX.ExplicitAttributes>
type NSBool = NSAttributeMap<'bool', JSX.ExplicitBooleans>

interface NSAttributes extends NSProp, NSAttr, NSBool {}

/* UTILS */

type Accessor<T> = T | { (): Accessor<T> } | { (): T }

type AccessorMap<T> = {
	[Key in keyof T]: Accessor<T[Key]>
}

type Events<Event, Element> =
	| ((e: Event & { currentTarget: Element }) => void)
	| ({
			handleEvent: (e: Event & { currentTarget: Element }) => void
	  } & AddEventListenerOptions)

type NSAttributeMap<attr, Map> = {
	[Key in keyof Map as `${string & attr}:${string & Key}`]?: Map[Key]
}

/* Attributes */

type HTMLAttributes<Element, Attributes, Events> =
	FallbackAttributes &
		PotaAttributes<Element> &
		Events &
		CSSAttributes &
		NSAttributes &
		AccessorMap<DOMHTMLAttributes> &
		AccessorMap<AriaAttributes> &
		AccessorMap<Attributes>

type SVGAttributes<Element, Attributes, Events> = FallbackAttributes &
	PotaAttributes<Element> &
	Events &
	CSSAttributes &
	NSAttributes &
	AccessorMap<DOMSVGAttributes> &
	AccessorMap<AriaAttributes> &
	AccessorMap<Attributes>

type MathMLAttributes<Element, Attributes, Events> =
	FallbackAttributes &
		PotaAttributes<Element> &
		Events &
		CSSAttributes &
		NSAttributes &
		AccessorMap<DOMMathMLAttributes> &
		AccessorMap<AriaAttributes> &
		AccessorMap<Attributes>

/** DOM */

interface DOMHTMLAttributes {
	about?: string
	accessKey?: string
	autocapitalize?:
		| 'off'
		| 'none'
		| 'on'
		| 'sentences'
		| 'words'
		| 'characters'
	autoCapitalize?:
		| 'off'
		| 'none'
		| 'on'
		| 'sentences'
		| 'words'
		| 'characters'
	color?: string
	contenteditable?: boolean | 'plaintext-only' | 'inherit'
	contentEditable?: boolean | 'plaintext-only' | 'inherit'
	contextmenu?: string
	contextMenu?: string
	datatype?: string
	dir?: 'ltr' | 'rtl' | 'auto'
	draggable?: boolean | 'false' | 'true'
	exportparts?: string
	exportParts?: string
	hidden?: boolean | 'hidden' | 'until-found'
	id?: string
	inert?: boolean
	inlist?: any
	innerHTML?: string | number
	innerText?: string | number
	inputmode?:
		| 'none'
		| 'text'
		| 'tel'
		| 'url'
		| 'email'
		| 'numeric'
		| 'decimal'
		| 'search'
	inputMode?:
		| 'none'
		| 'text'
		| 'tel'
		| 'url'
		| 'email'
		| 'numeric'
		| 'decimal'
		| 'search'
	itemid?: string
	itemId?: string
	itemprop?: string
	itemProp?: string
	itemref?: string
	itemRef?: string
	itemscope?: boolean
	itemScope?: boolean
	itemtype?: string
	itemType?: string
	lang?: string
	part?: string
	popover?: boolean | 'manual' | 'auto'
	prefix?: string
	property?: string
	resource?: string
	slot?: string
	spellcheck?: boolean
	tabindex?: number | string
	tabIndex?: number | string
	textContent?: string | number
	title?: string
	translate?: 'yes' | 'no'
	typeof?: string
	vocab?: string
}

interface DOMSVGAttributes extends DOMHTMLAttributes {
	[attr: `${string}`]: any // catch all
}

interface DOMMathMLAttributes extends DOMHTMLAttributes {
	dir?: 'ltr' | 'rtl'
	displaystyle?: boolean
	/**
	 * @deprecated This feature is non-standard. See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes/href
	 */
	href?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes/mathbackground
	 */
	mathbackground?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes/mathcolor
	 */
	mathcolor?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes/mathsize
	 */
	mathsize?: string
	nonce?: string
	scriptlevel?: string
}

/** ARIA */

interface AriaAttributes {
	/**
	 * Identifies the currently active element when DOM focus is on a
	 * composite widget, textbox, group, or application.
	 */
	'aria-activedescendant'?: string
	/**
	 * Indicates whether assistive technologies will present all, or
	 * only parts of, the changed region based on the change
	 * notifications defined by the aria-relevant attribute.
	 */
	'aria-atomic'?: boolean | 'false' | 'true'
	/**
	 * Indicates whether inputting text could trigger display of one or
	 * more predictions of the user's intended value for an input and
	 * specifies how predictions would be presented if they are made.
	 */
	'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both'
	/**
	 * Indicates an element is being modified and that assistive
	 * technologies MAY want to wait until the modifications are
	 * complete before exposing them to the user.
	 */
	'aria-busy'?: boolean | 'false' | 'true'
	/**
	 * Indicates the current "checked" state of checkboxes, radio
	 * buttons, and other widgets.
	 *
	 * @see aria-pressed @see aria-selected.
	 */
	'aria-checked'?: boolean | 'false' | 'mixed' | 'true'
	/**
	 * Defines the total number of columns in a table, grid, or
	 * treegrid.
	 *
	 * @see aria-colindex.
	 */
	'aria-colcount'?: number | string
	/**
	 * Defines an element's column index or position with respect to the
	 * total number of columns within a table, grid, or treegrid.
	 *
	 * @see aria-colcount @see aria-colspan.
	 */
	'aria-colindex'?: number | string
	/**
	 * Defines the number of columns spanned by a cell or gridcell
	 * within a table, grid, or treegrid.
	 *
	 * @see aria-colindex @see aria-rowspan.
	 */
	'aria-colspan'?: number | string
	/**
	 * Identifies the element (or elements) whose contents or presence
	 * are controlled by the current element.
	 *
	 * @see aria-owns.
	 */
	'aria-controls'?: string
	/**
	 * Indicates the element that represents the current item within a
	 * container or set of related elements.
	 */
	'aria-current'?:
		| boolean
		| 'false'
		| 'true'
		| 'page'
		| 'step'
		| 'location'
		| 'date'
		| 'time'
	/**
	 * Identifies the element (or elements) that describes the object.
	 *
	 * @see aria-labelledby
	 */
	'aria-describedby'?: string
	/**
	 * Identifies the element that provides a detailed, extended
	 * description for the object.
	 *
	 * @see aria-describedby.
	 */
	'aria-details'?: string
	/**
	 * Indicates that the element is perceivable but disabled, so it is
	 * not editable or otherwise operable.
	 *
	 * @see aria-hidden @see aria-readonly.
	 */
	'aria-disabled'?: boolean | 'false' | 'true'
	/**
	 * Indicates what functions can be performed when a dragged object
	 * is released on the drop target.
	 *
	 * @deprecated In ARIA 1.1
	 */
	'aria-dropeffect'?:
		| 'none'
		| 'copy'
		| 'execute'
		| 'link'
		| 'move'
		| 'popup'
	/**
	 * Identifies the element that provides an error message for the
	 * object.
	 *
	 * @see aria-invalid @see aria-describedby.
	 */
	'aria-errormessage'?: string
	/**
	 * Indicates whether the element, or another grouping element it
	 * controls, is currently expanded or collapsed.
	 */
	'aria-expanded'?: boolean | 'false' | 'true'
	/**
	 * Identifies the next element (or elements) in an alternate reading
	 * order of content which, at the user's discretion, allows
	 * assistive technology to override the general default of reading
	 * in document source order.
	 */
	'aria-flowto'?: string
	/**
	 * Indicates an element's "grabbed" state in a drag-and-drop
	 * operation.
	 *
	 * @deprecated In ARIA 1.1
	 */
	'aria-grabbed'?: boolean | 'false' | 'true'
	/**
	 * Indicates the availability and type of interactive popup element,
	 * such as menu or dialog, that can be triggered by an element.
	 */
	'aria-haspopup'?:
		| boolean
		| 'false'
		| 'true'
		| 'menu'
		| 'listbox'
		| 'tree'
		| 'grid'
		| 'dialog'
	/**
	 * Indicates whether the element is exposed to an accessibility API.
	 *
	 * @see aria-disabled.
	 */
	'aria-hidden'?: boolean | 'false' | 'true'
	/**
	 * Indicates the entered value does not conform to the format
	 * expected by the application.
	 *
	 * @see aria-errormessage.
	 */
	'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
	/**
	 * Indicates keyboard shortcuts that an author has implemented to
	 * activate or give focus to an element.
	 */
	'aria-keyshortcuts'?: string
	/**
	 * Defines a string value that labels the current element.
	 *
	 * @see aria-labelledby.
	 */
	'aria-label'?: string
	/**
	 * Identifies the element (or elements) that labels the current
	 * element.
	 *
	 * @see aria-describedby.
	 */
	'aria-labelledby'?: string
	/** Defines the hierarchical level of an element within a structure. */
	'aria-level'?: number | string
	/**
	 * Indicates that an element will be updated, and describes the
	 * types of updates the user agents, assistive technologies, and
	 * user can expect from the live region.
	 */
	'aria-live'?: 'off' | 'assertive' | 'polite'
	/** Indicates whether an element is modal when displayed. */
	'aria-modal'?: boolean | 'false' | 'true'
	/**
	 * Indicates whether a text box accepts multiple lines of input or
	 * only a single line.
	 */
	'aria-multiline'?: boolean | 'false' | 'true'
	/**
	 * Indicates that the user may select more than one item from the
	 * current selectable descendants.
	 */
	'aria-multiselectable'?: boolean | 'false' | 'true'
	/**
	 * Indicates whether the element's orientation is horizontal,
	 * vertical, or unknown/ambiguous.
	 */
	'aria-orientation'?: 'horizontal' | 'vertical'
	/**
	 * Identifies an element (or elements) in order to define a visual,
	 * functional, or contextual parent/child relationship between DOM
	 * elements where the DOM hierarchy cannot be used to represent the
	 * relationship.
	 *
	 * @see aria-controls.
	 */
	'aria-owns'?: string
	/**
	 * Defines a short hint (a word or short phrase) intended to aid the
	 * user with data entry when the control has no value. A hint could
	 * be a sample value or a brief description of the expected format.
	 */
	'aria-placeholder'?: string
	/**
	 * Defines an element's number or position in the current set of
	 * listitems or treeitems. Not required if all elements in the set
	 * are present in the DOM.
	 *
	 * @see aria-setsize.
	 */
	'aria-posinset'?: number | string
	/**
	 * Indicates the current "pressed" state of toggle buttons.
	 *
	 * @see aria-checked @see aria-selected.
	 */
	'aria-pressed'?: boolean | 'false' | 'mixed' | 'true'
	/**
	 * Indicates that the element is not editable, but is otherwise
	 * operable.
	 *
	 * @see aria-disabled.
	 */
	'aria-readonly'?: boolean | 'false' | 'true'
	/**
	 * Indicates what notifications the user agent will trigger when the
	 * accessibility tree within a live region is modified.
	 *
	 * @see aria-atomic.
	 */
	'aria-relevant'?:
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
	/**
	 * Indicates that user input is required on the element before a
	 * form may be submitted.
	 */
	'aria-required'?: boolean | 'false' | 'true'
	/**
	 * Defines a human-readable, author-localized description for the
	 * role of an element.
	 */
	'aria-roledescription'?: string
	/**
	 * Defines the total number of rows in a table, grid, or treegrid.
	 *
	 * @see aria-rowindex.
	 */
	'aria-rowcount'?: number | string
	/**
	 * Defines an element's row index or position with respect to the
	 * total number of rows within a table, grid, or treegrid.
	 *
	 * @see aria-rowcount @see aria-rowspan.
	 */
	'aria-rowindex'?: number | string
	/**
	 * Defines the number of rows spanned by a cell or gridcell within a
	 * table, grid, or treegrid.
	 *
	 * @see aria-rowindex @see aria-colspan.
	 */
	'aria-rowspan'?: number | string
	/**
	 * Indicates the current "selected" state of various widgets.
	 *
	 * @see aria-checked @see aria-pressed.
	 */
	'aria-selected'?: boolean | 'false' | 'true'
	/**
	 * Defines the number of items in the current set of listitems or
	 * treeitems. Not required if all elements in the set are present in
	 * the DOM.
	 *
	 * @see aria-posinset.
	 */
	'aria-setsize'?: number | string
	/**
	 * Indicates if items in a table or grid are sorted in ascending or
	 * descending order.
	 */
	'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other'
	/** Defines the maximum allowed value for a range widget. */
	'aria-valuemax'?: number | string
	/** Defines the minimum allowed value for a range widget. */
	'aria-valuemin'?: number | string
	/**
	 * Defines the current value for a range widget.
	 *
	 * @see aria-valuetext.
	 */
	'aria-valuenow'?: number | string
	/**
	 * Defines the human readable text alternative of aria-valuenow for
	 * a range widget.
	 */
	'aria-valuetext'?: string
	role?:
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
}

/** ELEMENTS */

/* SPECIAL ELEMENTS */

interface HTMLWebViewElementAttributes {
	allowfullscreen?: boolean
	allowpopups?: boolean
	autoFocus?: boolean
	autosize?: boolean
	blinkfeatures?: string
	disableblinkfeatures?: string
	disableguestresize?: boolean
	disablewebsecurity?: boolean
	guestinstance?: string
	httpreferrer?: string
	nodeintegration?: boolean
	partition?: string
	plugins?: boolean
	preload?: string
	src?: string
	useragent?: string
	webpreferences?: string
}
interface HTMLWebViewElements {
	webview: HTMLAttributes<
		HTMLElement,
		HTMLWebViewElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
}

interface HTMLMediaHTMLAttributes {
	autoplay?: boolean
	controls?: boolean
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	crossOrigin?: 'anonymous' | 'use-credentials' | ''
	loop?: boolean
	mediagroup?: string
	mediaGroup?: string
	muted?: boolean
	preload?: 'none' | 'metadata' | 'auto' | ''
	src?: string
}

/* HTMLElements */

interface HTMLAnchorElementAttributes {
	download?: any
	href?: string
	hreflang?: string
	media?: string
	ping?: string
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	rel?: string
	target?: string
	type?: string
}
interface HTMLAreaElementAttributes {
	alt?: string
	coords?: string
	download?: any
	href?: string
	hreflang?: string
	ping?: string
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	rel?: string
	shape?: 'rect' | 'circle' | 'poly' | 'default'
	target?: string
}
interface HTMLAudioElementAttributes
	extends HTMLMediaHTMLAttributes {}
interface HTMLBRElementAttributes {}
interface HTMLBaseElementAttributes {
	href?: string
	target?: string
}
interface HTMLBodyElementAttributes {}
interface HTMLButtonElementAttributes {
	autofocus?: boolean
	disabled?: boolean
	form?: string
	formaction?: string
	formAction?: string
	formEnctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formenctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formMethod?: 'post' | 'get' | 'dialog'
	formmethod?: 'post' | 'get' | 'dialog'
	formnovalidate?: boolean
	formNoValidate?: boolean
	formtarget?: string
	formTarget?: string
	name?: string
	popovertarget?: string
	popoverTarget?: string
	popovertargetaction?: 'hide' | 'show' | 'toggle'
	popoverTargetAction?: 'hide' | 'show' | 'toggle'
	type?: 'submit' | 'reset' | 'button'
	value?: string
}
interface HTMLCanvasElementAttributes {
	height?: number | string
	width?: number | string
}
interface HTMLDListElementAttributes {}
interface HTMLDataElementAttributes {
	value?: string | string[] | number
}
interface HTMLDataListElementAttributes {}
interface HTMLDetailsElementAttributes {
	open?: boolean
}
interface HTMLDialogElementAttributes {
	open?: boolean
}
interface HTMLDivElementAttributes {}
interface HTMLElementAttributes {}
interface HTMLEmbedElementAttributes {
	height?: number | string
	src?: string
	type?: string
	width?: number | string
}
interface HTMLFieldSetElementAttributes {
	disabled?: boolean
	form?: string
	name?: string
}
interface HTMLFormElementAttributes {
	'accept-charset'?: string
	action?: string
	autocomplete?: string
	encoding?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	enctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	method?: 'post' | 'get' | 'dialog'
	name?: string
	novalidate?: boolean
	noValidate?: boolean
	target?: string
}
interface HTMLHRElementAttributes {}
interface HTMLHeadElementAttributes {}
interface HTMLHeadingElementAttributes {}
interface HTMLHtmlElementAttributes {}
interface HTMLIFrameElementAttributes {
	allow?: string
	allowfullscreen?: boolean
	height?: number | string
	loading?: 'eager' | 'lazy'
	name?: string
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	sandbox?:
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
	src?: string
	srcdoc?: string
	width?: number | string
}
interface HTMLImageElementAttributes {
	alt?: string
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	crossOrigin?: 'anonymous' | 'use-credentials' | ''
	decoding?: 'sync' | 'async' | 'auto'
	elementtiming?: string
	fetchpriority?: 'high' | 'low' | 'auto'
	height?: number | string
	ismap?: boolean
	isMap?: boolean
	loading?: 'eager' | 'lazy'
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	sizes?: string
	src?: string
	srcset?: string
	srcSet?: string
	usemap?: string
	useMap?: string
	width?: number | string
}
interface HTMLInputElementAttributes {
	accept?: string
	alt?: string
	autocomplete?: string
	autocorrect?: 'on' | 'off'
	autofocus?: boolean
	capture?: boolean | string
	checked?: boolean
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	crossOrigin?: 'anonymous' | 'use-credentials' | ''
	disabled?: boolean
	enterkeyhint?:
		| 'enter'
		| 'done'
		| 'go'
		| 'next'
		| 'previous'
		| 'search'
		| 'send'
	form?: string
	formaction?: string
	formAction?: string
	formenctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formEnctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formmethod?: 'post' | 'get' | 'dialog'
	formMethod?: 'post' | 'get' | 'dialog'
	formnovalidate?: boolean
	formNoValidate?: boolean
	formtarget?: string
	formTarget?: string
	height?: number | string
	incremental?: boolean
	list?: string
	max?: number | string
	maxlength?: number | string
	maxLength?: number | string
	min?: number | string
	minlength?: number | string
	minLength?: number | string
	multiple?: boolean
	name?: string
	pattern?: string
	placeholder?: string
	readonly?: boolean
	readOnly?: boolean
	required?: boolean
	results?: number
	size?: number | string
	src?: string
	step?: number | string
	type?: string
	value?: string | string[] | number
	width?: number | string
}
interface HTMLLIElementAttributes {
	value?: number | string
}
interface HTMLLabelElementAttributes {
	for?: string
	form?: string
}
interface HTMLLegendElementAttributes {}
interface HTMLLinkElementAttributes {
	as?:
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
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	crossOrigin?: 'anonymous' | 'use-credentials' | ''
	disabled?: boolean
	fetchpriority?: 'high' | 'low' | 'auto'
	href?: string
	hreflang?: string
	imagesizes?: string
	imagesrcset?: string
	integrity?: string
	media?: string
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	rel?: string
	sizes?: string
	type?: string
}
interface HTMLMapElementAttributes {
	name?: string
}
interface HTMLMenuElementAttributes {
	label?: string
	type?: 'context' | 'toolbar'
}
interface HTMLMetaElementAttributes {
	'http-equiv'?: string
	charset?: string
	content?: string
	media?: string
	name?: string
}
interface HTMLMeterElementAttributes {
	form?: string
	high?: number | string
	low?: number | string
	max?: number | string
	min?: number | string
	optimum?: number | string
	value?: string | string[] | number
}
interface HTMLModElementAttributes {
	cite?: string
	dateTime?: string
}
interface HTMLOListElementAttributes {
	reversed?: boolean
	start?: number | string
	type?: '1' | 'a' | 'A' | 'i' | 'I'
}
interface HTMLObjectElementAttributes {
	data?: string
	form?: string
	height?: number | string
	name?: string
	type?: string
	usemap?: string
	useMap?: string
	width?: number | string
}
interface HTMLOptGroupElementAttributes {
	disabled?: boolean
	label?: string
}
interface HTMLOptionElementAttributes {
	disabled?: boolean
	label?: string
	selected?: boolean
	value?: string | string[] | number
}
interface HTMLOutputElementAttributes {
	for?: string
	form?: string
	name?: string
}
interface HTMLParagraphElementAttributes {}
interface HTMLPictureElementAttributes {}
interface HTMLPreElementAttributes {}
interface HTMLProgressElementAttributes {
	max?: number | string
	value?: string | string[] | number
}
interface HTMLQuoteElementAttributes {
	cite?: string
}
interface HTMLScriptElementAttributes {
	async?: boolean
	charset?: string
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	crossOrigin?: 'anonymous' | 'use-credentials' | ''
	defer?: boolean
	integrity?: string
	nomodule?: boolean
	noModule?: boolean
	nonce?: string
	referrerpolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	referrerPolicy?:
		| 'no-referrer'
		| 'no-referrer-when-downgrade'
		| 'origin'
		| 'origin-when-cross-origin'
		| 'same-origin'
		| 'strict-origin'
		| 'strict-origin-when-cross-origin'
		| 'unsafe-url'
	src?: string
	type?: string
}
interface HTMLSelectElementAttributes {
	autocomplete?: string
	autofocus?: boolean
	disabled?: boolean
	form?: string
	multiple?: boolean
	name?: string
	required?: boolean
	size?: number | string
	value?: string | string[] | number
}
interface HTMLSlotElementAttributes {
	name?: string
}
interface HTMLSourceElementAttributes {
	height?: number | string
	media?: string
	sizes?: string
	src?: string
	srcset?: string
	type?: string
	width?: number | string
}
interface HTMLSpanElementAttributes {}
interface HTMLStyleElementAttributes {
	media?: string
	nonce?: string
	scoped?: boolean
	type?: string
}
interface HTMLTableCaptionElementAttributes {}
interface HTMLTableCellElementAttributes {
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	colspan?: number | string
	colSpan?: number | string
	headers?: string
	rowspan?: number | string
	rowSpan?: number | string
	scope?: 'col' | 'row' | 'rowgroup' | 'colgroup'
}
interface HTMLTableColElementAttributes {
	span?: number | string
	width?: number | string
}
interface HTMLTableElementAttributes {
	cellpadding?: number | string
	cellspacing?: number | string
	summary?: string
	width?: number | string
}
interface HTMLTableRowElementAttributes {}
interface HTMLTableSectionElementAttributes {}
interface HTMLTemplateElementAttributes {}
interface HTMLTextAreaElementAttributes {
	autocomplete?: string
	autofocus?: boolean
	cols?: number | string
	dirname?: string
	disabled?: boolean
	enterkeyhint?:
		| 'enter'
		| 'done'
		| 'go'
		| 'next'
		| 'previous'
		| 'search'
		| 'send'
	form?: string
	maxlength?: number | string
	maxLength?: number | string
	minlength?: number | string
	minLength?: number | string
	name?: string
	placeholder?: string
	readonly?: boolean
	readOnly?: boolean
	required?: boolean
	rows?: number | string
	value?: string | string[] | number
	wrap?: 'hard' | 'soft' | 'off'
}
interface HTMLTimeElementAttributes {
	datetime?: string
	dateTime?: string
}
interface HTMLTitleElementAttributes {}
interface HTMLTrackElementAttributes {
	default?: boolean
	kind?:
		| 'subtitles'
		| 'captions'
		| 'descriptions'
		| 'chapters'
		| 'metadata'
	label?: string
	src?: string
	srclang?: string
}
interface HTMLUListElementAttributes {}
interface HTMLVideoElementAttributes extends HTMLMediaHTMLAttributes {
	disablePictureInPicture?: boolean
	disableRemotePlayback?: boolean
	height?: number | string
	playsinline?: boolean
	poster?: string
	width?: number | string
}

/* HTMLDeprecatedElements */

interface HTMLDirectoryElementAttributes {}
interface HTMLElementAttributes {}
interface HTMLFontElementAttributes {}
interface HTMLFrameElementAttributes {}
interface HTMLFrameSetElementAttributes {}
interface HTMLMarqueeElementAttributes {
	behavior?: 'scroll' | 'slide' | 'alternate'
	bgColor?: string
	direction?: 'left' | 'right' | 'up' | 'down'
	height?: number | string
	hspace?: number | string
	loop?: number | string
	scrollAmount?: number | string
	scrollDelay?: number | string
	trueSpeed?: boolean
	vspace?: number | string
	width?: number | string
}
interface HTMLParamElementAttributes {
	name?: string
	value?: string | string[] | number
}
interface HTMLPreElementAttributes {}
interface HTMLUnknownElementAttributes {}
interface HTMLKeygenElementAttributes {
	autofocus?: boolean
	challenge?: string
	disabled?: boolean
	form?: string
	keyparams?: string
	keytype?: string
	name?: string
}

/* MathMLElements */

interface MathMLAnnotationElementAttributes {
	encoding?: string
}
interface MathMLAnnotationXmlElementAttributes {
	encoding?: string
}
interface MathMLMactionElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction#actiontype
	 */
	actiontype?: 'statusline' | 'toggle'
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction#selection
	 */
	selection?: string
}
interface MathMLMathElementAttributes {
	display?: 'block' | 'inline'
}
interface MathMLMerrorElementAttributes {}
interface MathMLMfracElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac#denomalign
	 */
	denomalign?: 'center' | 'left' | 'right'
	linethickness?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac#numalign
	 */
	numalign?: 'center' | 'left' | 'right'
}
interface MathMLMiElementAttributes {
	/**
	 * The only value allowed in the current specification is normal
	 * (case insensitive) See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mi#mathvariant
	 */
	mathvariant?:
		| 'normal'
		| 'bold'
		| 'italic'
		| 'bold-italic'
		| 'double-struck'
		| 'bold-fraktur'
		| 'script'
		| 'bold-script'
		| 'fraktur'
		| 'sans-serif'
		| 'bold-sans-serif'
		| 'sans-serif-italic'
		| 'sans-serif-bold-italic'
		| 'monospace'
		| 'initial'
		| 'tailed'
		| 'looped'
		| 'stretched'
}

interface MathMLMmultiscriptsElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts#subscriptshift
	 */
	subscriptshift?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts#superscriptshift
	 */
	superscriptshift?: string
}
interface MathMLMnElementAttributes {}
interface MathMLMoElementAttributes {
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo#accent
	 */
	accent?: boolean
	fence?: boolean
	largeop?: boolean
	lspace?: string
	maxsize?: string
	minsize?: string
	movablelimits?: boolean
	rspace?: string
	separator?: boolean
	stretchy?: boolean
	symmetric?: boolean
}
interface MathMLMoverElementAttributes {
	accent?: boolean
}
interface MathMLMpaddedElementAttributes {
	depth?: string
	height?: string
	lspace?: string
	voffset?: string
	width?: string
}
interface MathMLMphantomElementAttributes {}
interface MathMLMprescriptsElementAttributes {}
interface MathMLMrootElementAttributes {}
interface MathMLMrowElementAttributes {}
interface MathMLMsElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms#browser_compatibility
	 */
	lquote?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms#browser_compatibility
	 */
	rquote?: string
}
interface MathMLMspaceElementAttributes {
	depth?: string
	height?: string
	width?: string
}
interface MathMLMsqrtElementAttributes {}
interface MathMLMstyleElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#background
	 */
	background?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#color
	 */
	color?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#fontsize
	 */
	fontsize?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#fontstyle
	 */
	fontstyle?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#fontweight
	 */
	fontweight?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#scriptminsize
	 */
	scriptminsize?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle#scriptsizemultiplier
	 */
	scriptsizemultiplier?: string
}
interface MathMLMsubElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msub#subscriptshift
	 */
	subscriptshift?: string
}
interface MathMLMsubsupElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup#subscriptshift
	 */
	subscriptshift?: string
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup#superscriptshift
	 */
	superscriptshift?: string
}
interface MathMLMsupElementAttributes {
	/**
	 * @deprecated See
	 *   https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msup#superscriptshift
	 */
	superscriptshift?: string
}
interface MathMLMtableElementAttributes {
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#align
	 */
	align?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#columnalign
	 */
	columnalign?: 'center' | 'left' | 'right'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#columnlines
	 */
	columnlines?: 'dashed' | 'none' | 'solid'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#columnspacing
	 */
	columnspacing?: string
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#frame
	 */
	frame?: 'dashed' | 'none' | 'solid'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#framespacing
	 */
	framespacing?: string
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#rowalign
	 */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#rowlines
	 */
	rowlines?: 'dashed' | 'none' | 'solid'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#rowspacing
	 */
	rowspacing?: string
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable#width
	 */
	width?: string
}
interface MathMLMtdElementAttributes {
	columnspan?: number
	rowspan?: number
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd#columnalign
	 */
	columnalign?: 'center' | 'left' | 'right'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd#rowalign
	 */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
}
interface MathMLMtextElementAttributes {}
interface MathMLMtrElementAttributes {
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr#columnalign
	 */
	columnalign?: 'center' | 'left' | 'right'
	/**
	 * Non-standard attribute See
	 * https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr#rowalign
	 */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
}
interface MathMLMunderElementAttributes {
	accentunder?: boolean
}
interface MathMLMunderoverElementAttributes {
	accent?: boolean
	accentunder?: boolean
}
interface MathMLSemanticsElementAttributes {}

/* MathMLDeprecatedElements */

interface MathMLMencloseElementAttributes {
	notation?: string
}
interface MathMLMfencedElementAttributes {
	close?: string
	open?: string
	separators?: string
}

/* SVGElements */

interface SVGAElementAttributes {}
interface SVGAnimateElementAttributes {}
interface SVGAnimateMotionElementAttributes {}
interface SVGAnimateTransformElementAttributes {}
interface SVGCircleElementAttributes {}
interface SVGClipPathElementAttributes {}
interface SVGDefsElementAttributes {}
interface SVGDescElementAttributes {}
interface SVGEllipseElementAttributes {}
interface SVGFEBlendElementAttributes {}
interface SVGFEColorMatrixElementAttributes {}
interface SVGFEComponentTransferElementAttributes {}
interface SVGFECompositeElementAttributes {}
interface SVGFEConvolveMatrixElementAttributes {}
interface SVGFEDiffuseLightingElementAttributes {}
interface SVGFEDisplacementMapElementAttributes {}
interface SVGFEDistantLightElementAttributes {}
interface SVGFEDropShadowElementAttributes {}
interface SVGFEFloodElementAttributes {}
interface SVGFEFuncAElementAttributes {}
interface SVGFEFuncBElementAttributes {}
interface SVGFEFuncGElementAttributes {}
interface SVGFEFuncRElementAttributes {}
interface SVGFEGaussianBlurElementAttributes {}
interface SVGFEImageElementAttributes {}
interface SVGFEMergeElementAttributes {}
interface SVGFEMergeNodeElementAttributes {}
interface SVGFEMorphologyElementAttributes {}
interface SVGFEOffsetElementAttributes {}
interface SVGFEPointLightElementAttributes {}
interface SVGFESpecularLightingElementAttributes {}
interface SVGFESpotLightElementAttributes {}
interface SVGFETileElementAttributes {}
interface SVGFETurbulenceElementAttributes {}
interface SVGFilterElementAttributes {}
interface SVGForeignObjectElementAttributes {}
interface SVGGElementAttributes {}
interface SVGImageElementAttributes {}
interface SVGLineElementAttributes {}
interface SVGLinearGradientElementAttributes {}
interface SVGMPathElementAttributes {}
interface SVGMarkerElementAttributes {}
interface SVGMaskElementAttributes {}
interface SVGMetadataElementAttributes {}
interface SVGPathElementAttributes {}
interface SVGPatternElementAttributes {}
interface SVGPolygonElementAttributes {}
interface SVGPolylineElementAttributes {}
interface SVGRadialGradientElementAttributes {}
interface SVGRectElementAttributes {}
interface SVGSVGElementAttributes {}
interface SVGScriptElementAttributes {}
interface SVGSetElementAttributes {}
interface SVGStopElementAttributes {}
interface SVGStyleElementAttributes {}
interface SVGSwitchElementAttributes {}
interface SVGSymbolElementAttributes {}
interface SVGTSpanElementAttributes {}
interface SVGTextElementAttributes {}
interface SVGTextPathElementAttributes {}
interface SVGTitleElementAttributes {}
interface SVGUseElementAttributes {}
interface SVGViewElementAttributes {}

// HTMLElements (THIS IS AUTO GENERATED!)

interface HTMLElements {
	a: HTMLAttributes<
		HTMLAnchorElement,
		HTMLAnchorElementAttributes,
		HTMLElementEvents<HTMLAnchorElement>
	>
	abbr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	address: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	area: HTMLAttributes<
		HTMLAreaElement,
		HTMLAreaElementAttributes,
		HTMLElementEvents<HTMLAreaElement>
	>
	article: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	aside: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	audio: HTMLAttributes<
		HTMLAudioElement,
		HTMLAudioElementAttributes,
		HTMLMediaElementEvents<HTMLAudioElement>
	>
	b: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	base: HTMLAttributes<
		HTMLBaseElement,
		HTMLBaseElementAttributes,
		HTMLElementEvents<HTMLBaseElement>
	>
	bdi: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	bdo: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	blockquote: HTMLAttributes<
		HTMLQuoteElement,
		HTMLQuoteElementAttributes,
		HTMLElementEvents<HTMLQuoteElement>
	>
	body: HTMLAttributes<
		HTMLBodyElement,
		HTMLBodyElementAttributes,
		HTMLBodyElementEvents<HTMLBodyElement>
	>
	br: HTMLAttributes<
		HTMLBRElement,
		HTMLBRElementAttributes,
		HTMLElementEvents<HTMLBRElement>
	>
	button: HTMLAttributes<
		HTMLButtonElement,
		HTMLButtonElementAttributes,
		HTMLElementEvents<HTMLButtonElement>
	>
	canvas: HTMLAttributes<
		HTMLCanvasElement,
		HTMLCanvasElementAttributes,
		HTMLElementEvents<HTMLCanvasElement>
	>
	caption: HTMLAttributes<
		HTMLTableCaptionElement,
		HTMLTableCaptionElementAttributes,
		HTMLElementEvents<HTMLTableCaptionElement>
	>
	cite: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	code: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	col: HTMLAttributes<
		HTMLTableColElement,
		HTMLTableColElementAttributes,
		HTMLElementEvents<HTMLTableColElement>
	>
	colgroup: HTMLAttributes<
		HTMLTableColElement,
		HTMLTableColElementAttributes,
		HTMLElementEvents<HTMLTableColElement>
	>
	data: HTMLAttributes<
		HTMLDataElement,
		HTMLDataElementAttributes,
		HTMLElementEvents<HTMLDataElement>
	>
	datalist: HTMLAttributes<
		HTMLDataListElement,
		HTMLDataListElementAttributes,
		HTMLElementEvents<HTMLDataListElement>
	>
	dd: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	del: HTMLAttributes<
		HTMLModElement,
		HTMLModElementAttributes,
		HTMLElementEvents<HTMLModElement>
	>
	details: HTMLAttributes<
		HTMLDetailsElement,
		HTMLDetailsElementAttributes,
		HTMLElementEvents<HTMLDetailsElement>
	>
	dfn: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	dialog: HTMLAttributes<
		HTMLDialogElement,
		HTMLDialogElementAttributes,
		HTMLElementEvents<HTMLDialogElement>
	>
	div: HTMLAttributes<
		HTMLDivElement,
		HTMLDivElementAttributes,
		HTMLElementEvents<HTMLDivElement>
	>
	dl: HTMLAttributes<
		HTMLDListElement,
		HTMLDListElementAttributes,
		HTMLElementEvents<HTMLDListElement>
	>
	dt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	em: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	embed: HTMLAttributes<
		HTMLEmbedElement,
		HTMLEmbedElementAttributes,
		HTMLElementEvents<HTMLEmbedElement>
	>
	fieldset: HTMLAttributes<
		HTMLFieldSetElement,
		HTMLFieldSetElementAttributes,
		HTMLElementEvents<HTMLFieldSetElement>
	>
	figcaption: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	figure: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	footer: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	form: HTMLAttributes<
		HTMLFormElement,
		HTMLFormElementAttributes,
		HTMLElementEvents<HTMLFormElement>
	>
	h1: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	h2: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	h3: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	h4: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	h5: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	h6: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLElementEvents<HTMLHeadingElement>
	>
	head: HTMLAttributes<
		HTMLHeadElement,
		HTMLHeadElementAttributes,
		HTMLElementEvents<HTMLHeadElement>
	>
	header: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	hgroup: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	hr: HTMLAttributes<
		HTMLHRElement,
		HTMLHRElementAttributes,
		HTMLElementEvents<HTMLHRElement>
	>
	html: HTMLAttributes<
		HTMLHtmlElement,
		HTMLHtmlElementAttributes,
		HTMLElementEvents<HTMLHtmlElement>
	>
	i: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	iframe: HTMLAttributes<
		HTMLIFrameElement,
		HTMLIFrameElementAttributes,
		HTMLElementEvents<HTMLIFrameElement>
	>
	img: HTMLAttributes<
		HTMLImageElement,
		HTMLImageElementAttributes,
		HTMLElementEvents<HTMLImageElement>
	>
	input: HTMLAttributes<
		HTMLInputElement,
		HTMLInputElementAttributes,
		HTMLElementEvents<HTMLInputElement>
	>
	ins: HTMLAttributes<
		HTMLModElement,
		HTMLModElementAttributes,
		HTMLElementEvents<HTMLModElement>
	>
	kbd: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	label: HTMLAttributes<
		HTMLLabelElement,
		HTMLLabelElementAttributes,
		HTMLElementEvents<HTMLLabelElement>
	>
	legend: HTMLAttributes<
		HTMLLegendElement,
		HTMLLegendElementAttributes,
		HTMLElementEvents<HTMLLegendElement>
	>
	li: HTMLAttributes<
		HTMLLIElement,
		HTMLLIElementAttributes,
		HTMLElementEvents<HTMLLIElement>
	>
	link: HTMLAttributes<
		HTMLLinkElement,
		HTMLLinkElementAttributes,
		HTMLElementEvents<HTMLLinkElement>
	>
	main: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	map: HTMLAttributes<
		HTMLMapElement,
		HTMLMapElementAttributes,
		HTMLElementEvents<HTMLMapElement>
	>
	mark: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	menu: HTMLAttributes<
		HTMLMenuElement,
		HTMLMenuElementAttributes,
		HTMLElementEvents<HTMLMenuElement>
	>
	meta: HTMLAttributes<
		HTMLMetaElement,
		HTMLMetaElementAttributes,
		HTMLElementEvents<HTMLMetaElement>
	>
	meter: HTMLAttributes<
		HTMLMeterElement,
		HTMLMeterElementAttributes,
		HTMLElementEvents<HTMLMeterElement>
	>
	nav: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	noscript: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	object: HTMLAttributes<
		HTMLObjectElement,
		HTMLObjectElementAttributes,
		HTMLElementEvents<HTMLObjectElement>
	>
	ol: HTMLAttributes<
		HTMLOListElement,
		HTMLOListElementAttributes,
		HTMLElementEvents<HTMLOListElement>
	>
	optgroup: HTMLAttributes<
		HTMLOptGroupElement,
		HTMLOptGroupElementAttributes,
		HTMLElementEvents<HTMLOptGroupElement>
	>
	option: HTMLAttributes<
		HTMLOptionElement,
		HTMLOptionElementAttributes,
		HTMLElementEvents<HTMLOptionElement>
	>
	output: HTMLAttributes<
		HTMLOutputElement,
		HTMLOutputElementAttributes,
		HTMLElementEvents<HTMLOutputElement>
	>
	p: HTMLAttributes<
		HTMLParagraphElement,
		HTMLParagraphElementAttributes,
		HTMLElementEvents<HTMLParagraphElement>
	>
	picture: HTMLAttributes<
		HTMLPictureElement,
		HTMLPictureElementAttributes,
		HTMLElementEvents<HTMLPictureElement>
	>
	pre: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementAttributes,
		HTMLElementEvents<HTMLPreElement>
	>
	progress: HTMLAttributes<
		HTMLProgressElement,
		HTMLProgressElementAttributes,
		HTMLElementEvents<HTMLProgressElement>
	>
	q: HTMLAttributes<
		HTMLQuoteElement,
		HTMLQuoteElementAttributes,
		HTMLElementEvents<HTMLQuoteElement>
	>
	rp: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	rt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	ruby: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	s: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	samp: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	script: HTMLAttributes<
		HTMLScriptElement,
		HTMLScriptElementAttributes,
		HTMLElementEvents<HTMLScriptElement>
	>
	search: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	section: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	select: HTMLAttributes<
		HTMLSelectElement,
		HTMLSelectElementAttributes,
		HTMLElementEvents<HTMLSelectElement>
	>
	slot: HTMLAttributes<
		HTMLSlotElement,
		HTMLSlotElementAttributes,
		HTMLElementEvents<HTMLSlotElement>
	>
	small: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	source: HTMLAttributes<
		HTMLSourceElement,
		HTMLSourceElementAttributes,
		HTMLElementEvents<HTMLSourceElement>
	>
	span: HTMLAttributes<
		HTMLSpanElement,
		HTMLSpanElementAttributes,
		HTMLElementEvents<HTMLSpanElement>
	>
	strong: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	style: HTMLAttributes<
		HTMLStyleElement,
		HTMLStyleElementAttributes,
		HTMLElementEvents<HTMLStyleElement>
	>
	sub: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	summary: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	sup: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	table: HTMLAttributes<
		HTMLTableElement,
		HTMLTableElementAttributes,
		HTMLElementEvents<HTMLTableElement>
	>
	tbody: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionElementAttributes,
		HTMLElementEvents<HTMLTableSectionElement>
	>
	td: HTMLAttributes<
		HTMLTableCellElement,
		HTMLTableCellElementAttributes,
		HTMLElementEvents<HTMLTableCellElement>
	>
	template: HTMLAttributes<
		HTMLTemplateElement,
		HTMLTemplateElementAttributes,
		HTMLElementEvents<HTMLTemplateElement>
	>
	textarea: HTMLAttributes<
		HTMLTextAreaElement,
		HTMLTextAreaElementAttributes,
		HTMLElementEvents<HTMLTextAreaElement>
	>
	tfoot: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionElementAttributes,
		HTMLElementEvents<HTMLTableSectionElement>
	>
	th: HTMLAttributes<
		HTMLTableCellElement,
		HTMLTableCellElementAttributes,
		HTMLElementEvents<HTMLTableCellElement>
	>
	thead: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionElementAttributes,
		HTMLElementEvents<HTMLTableSectionElement>
	>
	time: HTMLAttributes<
		HTMLTimeElement,
		HTMLTimeElementAttributes,
		HTMLElementEvents<HTMLTimeElement>
	>
	title: HTMLAttributes<
		HTMLTitleElement,
		HTMLTitleElementAttributes,
		HTMLElementEvents<HTMLTitleElement>
	>
	tr: HTMLAttributes<
		HTMLTableRowElement,
		HTMLTableRowElementAttributes,
		HTMLElementEvents<HTMLTableRowElement>
	>
	track: HTMLAttributes<
		HTMLTrackElement,
		HTMLTrackElementAttributes,
		HTMLElementEvents<HTMLTrackElement>
	>
	u: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	ul: HTMLAttributes<
		HTMLUListElement,
		HTMLUListElementAttributes,
		HTMLElementEvents<HTMLUListElement>
	>
	var: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	video: HTMLAttributes<
		HTMLVideoElement,
		HTMLVideoElementAttributes,
		HTMLVideoElementEvents<HTMLVideoElement>
	>
	wbr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
}

// HTMLDeprecatedElements (THIS IS AUTO GENERATED!)

interface HTMLDeprecatedElements {
	/** @deprecated */
	acronym: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	applet: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	basefont: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	bgsound: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	big: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	blink: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	center: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	dir: HTMLAttributes<
		HTMLDirectoryElement,
		HTMLDirectoryElementAttributes,
		HTMLElementEvents<HTMLDirectoryElement>
	>
	/** @deprecated */
	font: HTMLAttributes<
		HTMLFontElement,
		HTMLFontElementAttributes,
		HTMLElementEvents<HTMLFontElement>
	>
	/** @deprecated */
	frame: HTMLAttributes<
		HTMLFrameElement,
		HTMLFrameElementAttributes,
		HTMLElementEvents<HTMLFrameElement>
	>
	/** @deprecated */
	frameset: HTMLAttributes<
		HTMLFrameSetElement,
		HTMLFrameSetElementAttributes,
		HTMLFrameSetElementEvents<HTMLFrameSetElement>
	>
	/** @deprecated */
	isindex: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	keygen: HTMLAttributes<
		HTMLElement,
		HTMLKeygenElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	listing: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementAttributes,
		HTMLElementEvents<HTMLPreElement>
	>
	/** @deprecated */
	marquee: HTMLAttributes<
		HTMLMarqueeElement,
		HTMLMarqueeElementAttributes,
		HTMLElementEvents<HTMLMarqueeElement>
	>
	/** @deprecated */
	menuitem: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	multicol: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	nextid: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	nobr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	noembed: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	noframes: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	param: HTMLAttributes<
		HTMLParamElement,
		HTMLParamElementAttributes,
		HTMLElementEvents<HTMLParamElement>
	>
	/** @deprecated */
	plaintext: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	rb: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	rtc: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	spacer: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLElementEvents<HTMLUnknownElement>
	>
	/** @deprecated */
	strike: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	tt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLElementEvents<HTMLElement>
	>
	/** @deprecated */
	xmp: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementAttributes,
		HTMLElementEvents<HTMLPreElement>
	>
}

// MathMLElements (THIS IS AUTO GENERATED!)

interface MathMLElements {
	annotation: MathMLAttributes<
		MathMLElement,
		MathMLAnnotationElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	'annotation-xml': MathMLAttributes<
		MathMLElement,
		MathMLAnnotationXmlElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	maction: MathMLAttributes<
		MathMLElement,
		MathMLMactionElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	math: MathMLAttributes<
		MathMLElement,
		MathMLMathElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	merror: MathMLAttributes<
		MathMLElement,
		MathMLMerrorElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mfrac: MathMLAttributes<
		MathMLElement,
		MathMLMfracElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mi: MathMLAttributes<
		MathMLElement,
		MathMLMiElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mmultiscripts: MathMLAttributes<
		MathMLElement,
		MathMLMmultiscriptsElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mn: MathMLAttributes<
		MathMLElement,
		MathMLMnElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mo: MathMLAttributes<
		MathMLElement,
		MathMLMoElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mover: MathMLAttributes<
		MathMLElement,
		MathMLMoverElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mpadded: MathMLAttributes<
		MathMLElement,
		MathMLMpaddedElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mphantom: MathMLAttributes<
		MathMLElement,
		MathMLMphantomElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mprescripts: MathMLAttributes<
		MathMLElement,
		MathMLMprescriptsElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mroot: MathMLAttributes<
		MathMLElement,
		MathMLMrootElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mrow: MathMLAttributes<
		MathMLElement,
		MathMLMrowElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	ms: MathMLAttributes<
		MathMLElement,
		MathMLMsElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mspace: MathMLAttributes<
		MathMLElement,
		MathMLMspaceElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	msqrt: MathMLAttributes<
		MathMLElement,
		MathMLMsqrtElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mstyle: MathMLAttributes<
		MathMLElement,
		MathMLMstyleElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	msub: MathMLAttributes<
		MathMLElement,
		MathMLMsubElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	msubsup: MathMLAttributes<
		MathMLElement,
		MathMLMsubsupElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	msup: MathMLAttributes<
		MathMLElement,
		MathMLMsupElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mtable: MathMLAttributes<
		MathMLElement,
		MathMLMtableElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mtd: MathMLAttributes<
		MathMLElement,
		MathMLMtdElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mtext: MathMLAttributes<
		MathMLElement,
		MathMLMtextElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	mtr: MathMLAttributes<
		MathMLElement,
		MathMLMtrElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	munder: MathMLAttributes<
		MathMLElement,
		MathMLMunderElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	munderover: MathMLAttributes<
		MathMLElement,
		MathMLMunderoverElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	semantics: MathMLAttributes<
		MathMLElement,
		MathMLSemanticsElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
}

// MathMLDeprecatedElements (THIS IS AUTO GENERATED!)

interface MathMLDeprecatedElements {
	/** @deprecated */
	menclose: MathMLAttributes<
		MathMLElement,
		MathMLMencloseElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
	/** @deprecated */
	mfenced: MathMLAttributes<
		MathMLElement,
		MathMLMfencedElementAttributes,
		MathMLElementEvents<MathMLElement>
	>
}

// SVGElements (THIS IS AUTO GENERATED!)

interface SVGElements {
	/*
	// clashes with `html`
	a: SVGAttributes<
		SVGAElement,
		SVGAElementAttributes,
		SVGElementEvents<SVGAElement>
	>
	*/
	animate: SVGAttributes<
		SVGAnimateElement,
		SVGAnimateElementAttributes,
		SVGElementEvents<SVGAnimateElement>
	>
	animateMotion: SVGAttributes<
		SVGAnimateMotionElement,
		SVGAnimateMotionElementAttributes,
		SVGElementEvents<SVGAnimateMotionElement>
	>
	animateTransform: SVGAttributes<
		SVGAnimateTransformElement,
		SVGAnimateTransformElementAttributes,
		SVGElementEvents<SVGAnimateTransformElement>
	>
	circle: SVGAttributes<
		SVGCircleElement,
		SVGCircleElementAttributes,
		SVGElementEvents<SVGCircleElement>
	>
	clipPath: SVGAttributes<
		SVGClipPathElement,
		SVGClipPathElementAttributes,
		SVGElementEvents<SVGClipPathElement>
	>
	defs: SVGAttributes<
		SVGDefsElement,
		SVGDefsElementAttributes,
		SVGElementEvents<SVGDefsElement>
	>
	desc: SVGAttributes<
		SVGDescElement,
		SVGDescElementAttributes,
		SVGElementEvents<SVGDescElement>
	>
	ellipse: SVGAttributes<
		SVGEllipseElement,
		SVGEllipseElementAttributes,
		SVGElementEvents<SVGEllipseElement>
	>
	feBlend: SVGAttributes<
		SVGFEBlendElement,
		SVGFEBlendElementAttributes,
		SVGElementEvents<SVGFEBlendElement>
	>
	feColorMatrix: SVGAttributes<
		SVGFEColorMatrixElement,
		SVGFEColorMatrixElementAttributes,
		SVGElementEvents<SVGFEColorMatrixElement>
	>
	feComponentTransfer: SVGAttributes<
		SVGFEComponentTransferElement,
		SVGFEComponentTransferElementAttributes,
		SVGElementEvents<SVGFEComponentTransferElement>
	>
	feComposite: SVGAttributes<
		SVGFECompositeElement,
		SVGFECompositeElementAttributes,
		SVGElementEvents<SVGFECompositeElement>
	>
	feConvolveMatrix: SVGAttributes<
		SVGFEConvolveMatrixElement,
		SVGFEConvolveMatrixElementAttributes,
		SVGElementEvents<SVGFEConvolveMatrixElement>
	>
	feDiffuseLighting: SVGAttributes<
		SVGFEDiffuseLightingElement,
		SVGFEDiffuseLightingElementAttributes,
		SVGElementEvents<SVGFEDiffuseLightingElement>
	>
	feDisplacementMap: SVGAttributes<
		SVGFEDisplacementMapElement,
		SVGFEDisplacementMapElementAttributes,
		SVGElementEvents<SVGFEDisplacementMapElement>
	>
	feDistantLight: SVGAttributes<
		SVGFEDistantLightElement,
		SVGFEDistantLightElementAttributes,
		SVGElementEvents<SVGFEDistantLightElement>
	>
	feDropShadow: SVGAttributes<
		SVGFEDropShadowElement,
		SVGFEDropShadowElementAttributes,
		SVGElementEvents<SVGFEDropShadowElement>
	>
	feFlood: SVGAttributes<
		SVGFEFloodElement,
		SVGFEFloodElementAttributes,
		SVGElementEvents<SVGFEFloodElement>
	>
	feFuncA: SVGAttributes<
		SVGFEFuncAElement,
		SVGFEFuncAElementAttributes,
		SVGElementEvents<SVGFEFuncAElement>
	>
	feFuncB: SVGAttributes<
		SVGFEFuncBElement,
		SVGFEFuncBElementAttributes,
		SVGElementEvents<SVGFEFuncBElement>
	>
	feFuncG: SVGAttributes<
		SVGFEFuncGElement,
		SVGFEFuncGElementAttributes,
		SVGElementEvents<SVGFEFuncGElement>
	>
	feFuncR: SVGAttributes<
		SVGFEFuncRElement,
		SVGFEFuncRElementAttributes,
		SVGElementEvents<SVGFEFuncRElement>
	>
	feGaussianBlur: SVGAttributes<
		SVGFEGaussianBlurElement,
		SVGFEGaussianBlurElementAttributes,
		SVGElementEvents<SVGFEGaussianBlurElement>
	>
	feImage: SVGAttributes<
		SVGFEImageElement,
		SVGFEImageElementAttributes,
		SVGElementEvents<SVGFEImageElement>
	>
	feMerge: SVGAttributes<
		SVGFEMergeElement,
		SVGFEMergeElementAttributes,
		SVGElementEvents<SVGFEMergeElement>
	>
	feMergeNode: SVGAttributes<
		SVGFEMergeNodeElement,
		SVGFEMergeNodeElementAttributes,
		SVGElementEvents<SVGFEMergeNodeElement>
	>
	feMorphology: SVGAttributes<
		SVGFEMorphologyElement,
		SVGFEMorphologyElementAttributes,
		SVGElementEvents<SVGFEMorphologyElement>
	>
	feOffset: SVGAttributes<
		SVGFEOffsetElement,
		SVGFEOffsetElementAttributes,
		SVGElementEvents<SVGFEOffsetElement>
	>
	fePointLight: SVGAttributes<
		SVGFEPointLightElement,
		SVGFEPointLightElementAttributes,
		SVGElementEvents<SVGFEPointLightElement>
	>
	feSpecularLighting: SVGAttributes<
		SVGFESpecularLightingElement,
		SVGFESpecularLightingElementAttributes,
		SVGElementEvents<SVGFESpecularLightingElement>
	>
	feSpotLight: SVGAttributes<
		SVGFESpotLightElement,
		SVGFESpotLightElementAttributes,
		SVGElementEvents<SVGFESpotLightElement>
	>
	feTile: SVGAttributes<
		SVGFETileElement,
		SVGFETileElementAttributes,
		SVGElementEvents<SVGFETileElement>
	>
	feTurbulence: SVGAttributes<
		SVGFETurbulenceElement,
		SVGFETurbulenceElementAttributes,
		SVGElementEvents<SVGFETurbulenceElement>
	>
	filter: SVGAttributes<
		SVGFilterElement,
		SVGFilterElementAttributes,
		SVGElementEvents<SVGFilterElement>
	>
	foreignObject: SVGAttributes<
		SVGForeignObjectElement,
		SVGForeignObjectElementAttributes,
		SVGElementEvents<SVGForeignObjectElement>
	>
	g: SVGAttributes<
		SVGGElement,
		SVGGElementAttributes,
		SVGElementEvents<SVGGElement>
	>
	image: SVGAttributes<
		SVGImageElement,
		SVGImageElementAttributes,
		SVGElementEvents<SVGImageElement>
	>
	line: SVGAttributes<
		SVGLineElement,
		SVGLineElementAttributes,
		SVGElementEvents<SVGLineElement>
	>
	linearGradient: SVGAttributes<
		SVGLinearGradientElement,
		SVGLinearGradientElementAttributes,
		SVGElementEvents<SVGLinearGradientElement>
	>
	marker: SVGAttributes<
		SVGMarkerElement,
		SVGMarkerElementAttributes,
		SVGElementEvents<SVGMarkerElement>
	>
	mask: SVGAttributes<
		SVGMaskElement,
		SVGMaskElementAttributes,
		SVGElementEvents<SVGMaskElement>
	>
	metadata: SVGAttributes<
		SVGMetadataElement,
		SVGMetadataElementAttributes,
		SVGElementEvents<SVGMetadataElement>
	>
	mpath: SVGAttributes<
		SVGMPathElement,
		SVGMPathElementAttributes,
		SVGElementEvents<SVGMPathElement>
	>
	path: SVGAttributes<
		SVGPathElement,
		SVGPathElementAttributes,
		SVGElementEvents<SVGPathElement>
	>
	pattern: SVGAttributes<
		SVGPatternElement,
		SVGPatternElementAttributes,
		SVGElementEvents<SVGPatternElement>
	>
	polygon: SVGAttributes<
		SVGPolygonElement,
		SVGPolygonElementAttributes,
		SVGElementEvents<SVGPolygonElement>
	>
	polyline: SVGAttributes<
		SVGPolylineElement,
		SVGPolylineElementAttributes,
		SVGElementEvents<SVGPolylineElement>
	>
	radialGradient: SVGAttributes<
		SVGRadialGradientElement,
		SVGRadialGradientElementAttributes,
		SVGElementEvents<SVGRadialGradientElement>
	>
	rect: SVGAttributes<
		SVGRectElement,
		SVGRectElementAttributes,
		SVGElementEvents<SVGRectElement>
	>
	/*
	// clashes with `html`
	script: SVGAttributes<
		SVGScriptElement,
		SVGScriptElementAttributes,
		SVGElementEvents<SVGScriptElement>
	>
	*/
	set: SVGAttributes<
		SVGSetElement,
		SVGSetElementAttributes,
		SVGElementEvents<SVGSetElement>
	>
	stop: SVGAttributes<
		SVGStopElement,
		SVGStopElementAttributes,
		SVGElementEvents<SVGStopElement>
	>
	/*
	// clashes with `html`
	style: SVGAttributes<
		SVGStyleElement,
		SVGStyleElementAttributes,
		SVGElementEvents<SVGStyleElement>
	>
	*/
	svg: SVGAttributes<
		SVGSVGElement,
		SVGSVGElementAttributes,
		SVGSVGElementEvents<SVGSVGElement>
	>
	switch: SVGAttributes<
		SVGSwitchElement,
		SVGSwitchElementAttributes,
		SVGElementEvents<SVGSwitchElement>
	>
	symbol: SVGAttributes<
		SVGSymbolElement,
		SVGSymbolElementAttributes,
		SVGElementEvents<SVGSymbolElement>
	>
	text: SVGAttributes<
		SVGTextElement,
		SVGTextElementAttributes,
		SVGElementEvents<SVGTextElement>
	>
	textPath: SVGAttributes<
		SVGTextPathElement,
		SVGTextPathElementAttributes,
		SVGElementEvents<SVGTextPathElement>
	>
	/*
	// clashes with `html`
	title: SVGAttributes<
		SVGTitleElement,
		SVGTitleElementAttributes,
		SVGElementEvents<SVGTitleElement>
	>*/
	tspan: SVGAttributes<
		SVGTSpanElement,
		SVGTSpanElementAttributes,
		SVGElementEvents<SVGTSpanElement>
	>
	use: SVGAttributes<
		SVGUseElement,
		SVGUseElementAttributes,
		SVGElementEvents<SVGUseElement>
	>
	view: SVGAttributes<
		SVGViewElement,
		SVGViewElementAttributes,
		SVGElementEvents<SVGViewElement>
	>
}

/* EVENTS (THIS IS AUTO GENERATED!) */

interface ElementEvents<Element> {
	onFullscreenChange?: Events<Event, Element>
	onFullscreenError?: Events<Event, Element>
}
interface GlobalEventHandlersEvents<Element> {
	onAbort?: Events<UIEvent, Element>
	onAnimationCancel?: Events<AnimationEvent, Element>
	onAnimationEnd?: Events<AnimationEvent, Element>
	onAnimationIteration?: Events<AnimationEvent, Element>
	onAnimationStart?: Events<AnimationEvent, Element>
	onAuxClick?: Events<MouseEvent, Element>
	onBeforeInput?: Events<InputEvent, Element>
	onBeforeToggle?: Events<Event, Element>
	onBlur?: Events<FocusEvent, Element>
	onCancel?: Events<Event, Element>
	onCanPlay?: Events<Event, Element>
	onCanPlayThrough?: Events<Event, Element>
	onChange?: Events<Event, Element>
	onClick?: Events<MouseEvent, Element>
	onClose?: Events<Event, Element>
	onCompositionEnd?: Events<CompositionEvent, Element>
	onCompositionStart?: Events<CompositionEvent, Element>
	onCompositionUpdate?: Events<CompositionEvent, Element>
	onContextLost?: Events<Event, Element>
	onContextMenu?: Events<MouseEvent, Element>
	onContextRestored?: Events<Event, Element>
	onCopy?: Events<ClipboardEvent, Element>
	onCueChange?: Events<Event, Element>
	onCut?: Events<ClipboardEvent, Element>
	onDblClick?: Events<MouseEvent, Element>
	onDrag?: Events<DragEvent, Element>
	onDragEnd?: Events<DragEvent, Element>
	onDragEnter?: Events<DragEvent, Element>
	onDragLeave?: Events<DragEvent, Element>
	onDragOver?: Events<DragEvent, Element>
	onDragStart?: Events<DragEvent, Element>
	onDrop?: Events<DragEvent, Element>
	onDurationChange?: Events<Event, Element>
	onEmptied?: Events<Event, Element>
	onEnded?: Events<Event, Element>
	onError?: Events<ErrorEvent, Element>
	onFocus?: Events<FocusEvent, Element>
	onFocusIn?: Events<FocusEvent, Element>
	onFocusOut?: Events<FocusEvent, Element>
	onFormData?: Events<FormDataEvent, Element>
	onGotPointerCapture?: Events<PointerEvent, Element>
	onInput?: Events<Event, Element>
	onInvalid?: Events<Event, Element>
	onKeyDown?: Events<KeyboardEvent, Element>
	onKeyPress?: Events<KeyboardEvent, Element>
	onKeyUp?: Events<KeyboardEvent, Element>
	onLoad?: Events<Event, Element>
	onLoadedData?: Events<Event, Element>
	onLoadedMetadata?: Events<Event, Element>
	onLoadStart?: Events<Event, Element>
	onLostPointerCapture?: Events<PointerEvent, Element>
	onMouseDown?: Events<MouseEvent, Element>
	onMouseEnter?: Events<MouseEvent, Element>
	onMouseLeave?: Events<MouseEvent, Element>
	onMouseMove?: Events<MouseEvent, Element>
	onMouseOut?: Events<MouseEvent, Element>
	onMouseOver?: Events<MouseEvent, Element>
	onMouseUp?: Events<MouseEvent, Element>
	onPaste?: Events<ClipboardEvent, Element>
	onPause?: Events<Event, Element>
	onPlay?: Events<Event, Element>
	onPlaying?: Events<Event, Element>
	onPointerCancel?: Events<PointerEvent, Element>
	onPointerDown?: Events<PointerEvent, Element>
	onPointerEnter?: Events<PointerEvent, Element>
	onPointerLeave?: Events<PointerEvent, Element>
	onPointerMove?: Events<PointerEvent, Element>
	onPointerOut?: Events<PointerEvent, Element>
	onPointerOver?: Events<PointerEvent, Element>
	onPointerUp?: Events<PointerEvent, Element>
	onProgress?: Events<ProgressEvent, Element>
	onRateChange?: Events<Event, Element>
	onReset?: Events<Event, Element>
	onResize?: Events<UIEvent, Element>
	onScroll?: Events<Event, Element>
	onScrollEnd?: Events<Event, Element>
	onSecurityPolicyViolation?: Events<
		SecurityPolicyViolationEvent,
		Element
	>
	onSeeked?: Events<Event, Element>
	onSeeking?: Events<Event, Element>
	onSelect?: Events<Event, Element>
	onSelectionChange?: Events<Event, Element>
	onSelectStart?: Events<Event, Element>
	onSlotChange?: Events<Event, Element>
	onStalled?: Events<Event, Element>
	onSubmit?: Events<SubmitEvent, Element>
	onSuspend?: Events<Event, Element>
	onTimeUpdate?: Events<Event, Element>
	onToggle?: Events<Event, Element>
	onTouchCancel?: Events<TouchEvent, Element>
	onTouchEnd?: Events<TouchEvent, Element>
	onTouchMove?: Events<TouchEvent, Element>
	onTouchStart?: Events<TouchEvent, Element>
	onTransitionCancel?: Events<TransitionEvent, Element>
	onTransitionEnd?: Events<TransitionEvent, Element>
	onTransitionRun?: Events<TransitionEvent, Element>
	onTransitionStart?: Events<TransitionEvent, Element>
	onVolumeChange?: Events<Event, Element>
	onWaiting?: Events<Event, Element>
	onWebKitAnimationEnd?: Events<Event, Element>
	onWebKitAnimationIteration?: Events<Event, Element>
	onWebKitAnimationStart?: Events<Event, Element>
	onWebKitTransitionEnd?: Events<Event, Element>
	onWheel?: Events<WheelEvent, Element>
}
interface HTMLBodyElementEvents<Element>
	extends HTMLElementEvents<Element>,
		WindowEventHandlersEvents<Element> {}
interface HTMLElementEvents<Element>
	extends ElementEvents<Element>,
		GlobalEventHandlersEvents<Element> {}
interface HTMLFrameSetElementEvents<Element>
	extends HTMLElementEvents<Element>,
		WindowEventHandlersEvents<Element> {}
interface HTMLMediaElementEvents<Element>
	extends HTMLElementEvents<Element> {
	onEncrypted?: Events<MediaEncryptedEvent, Element>
	onWaitingForKey?: Events<Event, Element>
}
interface HTMLVideoElementEvents<Element>
	extends HTMLMediaElementEvents<Element> {
	onEnterPictureInPicture?: Events<Event, Element>
	onLeavePictureInPicture?: Events<Event, Element>
}
interface MathMLElementEvents<Element>
	extends ElementEvents<Element>,
		GlobalEventHandlersEvents<Element> {}
interface SVGElementEvents<Element>
	extends ElementEvents<Element>,
		GlobalEventHandlersEvents<Element> {}
interface SVGSVGElementEvents<Element>
	extends SVGElementEvents<Element>,
		WindowEventHandlersEvents<Element> {}
interface WindowEventHandlersEvents<Element> {
	onAfterPrint?: Events<Event, Element>
	onBeforePrint?: Events<Event, Element>
	onBeforeUnload?: Events<BeforeUnloadEvent, Element>
	onGamepadConnected?: Events<GamepadEvent, Element>
	onGamepadDisconnected?: Events<GamepadEvent, Element>
	onHashChange?: Events<HashChangeEvent, Element>
	onLanguageChange?: Events<Event, Element>
	onMessage?: Events<MessageEvent, Element>
	onMessageError?: Events<MessageEvent, Element>
	onOffline?: Events<Event, Element>
	onOnline?: Events<Event, Element>
	onPageHide?: Events<PageTransitionEvent, Element>
	onPageShow?: Events<PageTransitionEvent, Element>
	onPopState?: Events<PopStateEvent, Element>
	onRejectionHandled?: Events<PromiseRejectionEvent, Element>
	onStorage?: Events<StorageEvent, Element>
	onUnhandledRejection?: Events<PromiseRejectionEvent, Element>
	onUnload?: Events<Event, Element>
}

/*
	type ElementsFilter<TagNameMap> = Pick<TagNameMap, Exclude<keyof TagNameMap, keyof HTMLElementTagNameMap>>
	type EventsCapitalMap<Events> = {
		[Key in keyof Events as `on${Capitalize<string & Key>}`]?: (e: Events[Key]) => void
	}
	type EventsNSMap<Events> = {
		[Key in keyof Events as `on:${string & Key}`]?: (e: Events[Key]) => void
	}
*/

/**
 * 1. This prevents the other types in this file from leaking.
 * 2. This has to be the last thing of the file for some reason.
 */

export {}
