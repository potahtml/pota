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

type DOMElement = Element

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
		// fancy
		| object // such CSSStyleSheet
		// html
		| DOMElement
		// recurse
		| (() => Element)
		| Promise<Element>
		| Element[]

	/* Interfaces */

	// explicit attributes/properties

	/**
	 * Bypass attribute vs property heuristics.
	 *
	 * ```html
	 * <my-element prop:myFoo="bar" />
	 * ```
	 */
	interface ExplicitProperties {}
	/**
	 * Bypass attribute vs property heuristics.
	 *
	 * ```html
	 * <my-element attr:foo="bar" />
	 * ```
	 */
	interface ExplicitAttributes {}
	/**
	 * Bypass attribute vs property heuristics.
	 *
	 * ```html
	 * <my-element bool:foo="{true}" />
	 * ```
	 */
	interface ExplicitBooleans {
		[attr: `${string}`]: any // catch all booleans
	}

	// all elements

	interface IntrinsicElements
		extends HTMLDeprecatedElements,
			MathMLDeprecatedElements,
			HTMLWebViewElements,
			MathMLElements,
			SVGElements,
			HTMLElements {
		// typing custom elements
		[tagName: string]: any // catch-all
	}

	// custom attributes

	/** To add attributes to all HTML elements */
	interface IntrinsicHTMLAttributes {}

	/** To add attributes to all SVG elements */
	interface IntrinsicSVGAttributes {}

	/** To add attributes to all MathML elements */
	interface IntrinsicMathMLAttributes {}

	/*
		JSX.IntrinsicClassAttributes // class attributes
		JSX.IntrinsicElements // tags
		JSX.IntrinsicAttributes // leaks to class and functional components
	*/

	type HTMLAttributes<Element, Attributes, Events> = SharedAttributes<
		Element,
		Attributes,
		Events
	> &
		IntrinsicHTMLAttributes

	type SVGAttributes<Element, Attributes, Events> = SharedAttributes<
		Element,
		Attributes,
		Events
	> &
		AccessorMap<DOMSVGAttributes> &
		IntrinsicSVGAttributes

	type MathMLAttributes<Element, Attributes, Events> =
		SharedAttributes<Element, Attributes, Events> &
			AccessorMap<DOMMathMLAttributes> &
			IntrinsicMathMLAttributes

	/* exports */

	interface HTMLEvents<Element>
		extends ElementEvents<Element>,
			GlobalEvents<Element> {}

	interface MathMLEvents<Element>
		extends ElementEvents<Element>,
			GlobalEvents<Element> {}

	interface SVGEvents<Element>
		extends ElementEvents<Element>,
			GlobalEvents<Element> {}
}

/* CORE */

interface PotaAttributes<Element> {
	children?: JSX.Element

	ref?: SignalSetter<Element> | ((element: Element) => void)

	onMount?: (element: Element) => void
	onUnmount?: (element: Element) => void

	[attr: `plugin:${string}`]: any
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
	class?: string
	style?: CSSProperties | string

	css?: string | CSSStyleSheet

	// css
	[attr: `class:${string}`]: any
	[attr: `style:${string}`]: any
	[attr: `var:${string}`]: any
}

/* Namespaced */

type NSAttributeMap<attr, Map> = {
	[Key in keyof Map as `${string & attr}:${string & Key}`]?: Map[Key]
}

type NSProp = NSAttributeMap<'prop', JSX.ExplicitProperties>
type NSAttr = NSAttributeMap<'attr', JSX.ExplicitAttributes>
type NSBool = NSAttributeMap<'bool', JSX.ExplicitBooleans>

interface NSAttributes extends NSProp, NSAttr, NSBool {}

/* ACCESSOR */

export type Accessor<T> =
	| { (): Accessor<T> }
	| { (): T }
	| T
	| { (): SignalAccessor<T> }

type AccessorMap<T> = {
	[Key in keyof T]: Accessor<T[Key]>
}

/* Attributes */

type SharedAttributes<Element, Attributes, Events> = Events &
	PotaAttributes<Element> &
	NSAttributes &
	DOMEvents &
	AccessorMap<CSSAttributes> &
	AccessorMap<DOMProperties> &
	AccessorMap<DOMXMLAttributes> &
	AccessorMap<DOMHTMLAttributes> &
	AccessorMap<AriaAttributes> &
	AccessorMap<Attributes>

/* MAP */

type HTMLAttributes<Element, Attributes, Events> = JSX.HTMLAttributes<
	Element,
	Attributes,
	Events
>
type SVGAttributes<Element, Attributes, Events> = JSX.SVGAttributes<
	Element,
	Attributes,
	Events
>
type MathMLAttributes<Element, Attributes, Events> =
	JSX.MathMLAttributes<Element, Attributes, Events>

/* DOM */

interface DOMEvents {
	// events
	[attr: `on:${string}`]: any
}

interface DOMProperties {
	innerHTML?: number | string
	innerText?: number | string
	textContent?: number | string
}

interface DOMXMLAttributes {
	[attr: `xmlns:${string}`]: string
	xmlns?: string
}

interface DOMHTMLAttributes {
	about?: string
	accesskey?: string
	autocapitalize?:
		| 'off'
		| 'none'
		| 'on'
		| 'sentences'
		| 'words'
		| 'characters'

	color?: string
	contenteditable?:
		| 'true'
		| 'false'
		| 'plaintext-only'
		| 'inherit'
		| boolean
	contextmenu?: string
	datatype?: string
	dir?: 'ltr' | 'rtl' | 'auto'
	draggable?: 'true' | 'false' | boolean
	exportparts?: string
	hidden?: boolean | 'hidden' | 'until-found'
	id?: string
	inert?: 'true' | boolean
	inlist?: any
	inputmode?:
		| 'decimal'
		| 'email'
		| 'none'
		| 'numeric'
		| 'search'
		| 'tel'
		| 'text'
		| 'url'
	is?: string
	itemid?: string
	itemprop?: string
	itemref?: string
	itemscope?: 'true' | boolean
	itemtype?: string
	lang?: string
	part?: string
	popover?: boolean | 'manual' | 'auto'
	prefix?: string
	property?: string
	resource?: string
	slot?: string
	spellcheck?: 'true' | boolean
	tabindex?: number | string
	title?: string
	translate?: 'yes' | 'no'
	typeof?: string
	vocab?: string
}

interface DOMSVGAttributes {
	[attr: `${string}`]: any // catch all
}

interface DOMMathMLAttributes {
	displaystyle?: 'true' | boolean
	/** @deprecated */
	href?: string
	/** @deprecated */
	mathbackground?: string
	/** @deprecated */
	mathcolor?: string
	/** @deprecated */
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

/* SPECIAL ATTRIBUTES */

interface HTMLMediaHTMLAttributes {
	autoplay?: 'true' | boolean
	controls?: 'true' | boolean
	controlslist?: string
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	disableremoteplayback?: 'true' | boolean
	loop?: 'true' | boolean
	muted?: 'true' | boolean
	preload?: 'none' | 'metadata' | 'auto' | ''
	src?: string

	/** @deprecated */
	mediagroup?: string
}

/* SPECIAL ELEMENTS */

interface HTMLWebViewElementAttributes {
	allowpopups?: 'true' | boolean
	disableblinkfeatures?: string
	disablewebsecurity?: 'true' | boolean
	enableblinkfeatures?: string
	httpreferrer?: string
	nodeintegration?: 'true' | boolean
	nodeintegrationinsubframes?: 'true' | boolean
	partition?: string
	plugins?: 'true' | boolean
	preload?: string
	src?: string
	useragent?: string
	webpreferences?: string

	// does this exists?
	allowfullscreen?: boolean
	autofocus?: boolean
	autosize?: boolean

	/** @deprecated */
	blinkfeatures?: string
	/** @deprecated */
	disableguestresize?: 'true' | boolean
	/** @deprecated */
	guestinstance?: string
}

/* HTMLElements */

interface HTMLAnchorElementAttributes {
	download?: string
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
	rel?: string
	target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
	type?: string

	/** @experimental */
	attributionsrc?: string

	/** @deprecated */
	charset?: string
	/** @deprecated */
	coords?: string
	/** @deprecated */
	name?: string
	/** @deprecated */
	rev?: string
	/** @deprecated */
	shape?: 'rect' | 'circle' | 'poly' | 'default'
}
interface HTMLAreaElementAttributes {
	alt?: string
	coords?: string
	download?: string
	href?: string
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
	rel?: string
	shape?: 'rect' | 'circle' | 'poly' | 'default'
	target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})

	/** @deprecated */
	nohref?: 'true' | boolean
}
interface HTMLAudioElementAttributes
	extends HTMLMediaHTMLAttributes {}
interface HTMLBRElementAttributes {
	/** @deprecated */
	clear?: string
}
interface HTMLBaseElementAttributes {
	href?: string
	target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
}
interface HTMLBdoElementAttributes {
	dir?: 'rtl' | 'ltr'
}
interface HTMLBodyElementAttributes {
	/** @deprecated */
	alink?: string
	/** @deprecated */
	background?: string
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	bottommargin?: number | string
	/** @deprecated */
	leftmargin?: number | string
	/** @deprecated */
	link?: string
	/** @deprecated */
	rightmargin?: number | string
	/** @deprecated */
	text?: string
	/** @deprecated */
	topmargin?: number | string
	/** @deprecated */
	vlink?: string
}
interface HTMLButtonElementAttributes {
	autofocus?: boolean
	command?:
		| 'show-modal'
		| 'close'
		| 'show-popover'
		| 'hide-popover'
		| 'toggle-popover'
		| (string & {})
	commandfor?: string
	disabled?: 'true' | boolean
	form?: string
	formaction?: string
	formenctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formmethod?: 'post' | 'get' | 'dialog'
	formnovalidate?: 'true' | boolean
	formtarget?: '_self' | '_blank' | '_parent' | '_top' | (string & {})
	name?: string
	popovertarget?: string
	popovertargetaction?: 'hide' | 'show' | 'toggle'
	type?: 'submit' | 'reset' | 'button' | 'menu'
	value?: number | string
}
interface HTMLCanvasElementAttributes {
	height?: number | string
	width?: number | string

	/** @deprecated */
	'moz-opaque'?: 'true' | boolean
}
interface HTMLDListElementAttributes {
	/** @deprecated */
	compact?: 'true' | boolean
}
interface HTMLDataElementAttributes {
	value?: number | string
}
interface HTMLDataListElementAttributes {}
interface HTMLDetailsElementAttributes {
	name?: string
	open?: 'true' | boolean
}
interface HTMLDialogElementAttributes {
	open?: 'true' | boolean
	tabindex?: never
}
interface HTMLDivElementAttributes {
	/** @deprecated */
	align?: 'left' | 'right' | 'justify' | 'center'
}
interface HTMLElementAttributes {}
interface HTMLEmbedElementAttributes {
	height?: number | string
	src?: string
	type?: string
	width?: number | string

	/** @deprecated */
	align?: 'left' | 'right' | 'justify' | 'center'
	/** @deprecated */
	name?: string
}
interface HTMLFieldSetElementAttributes {
	disabled?: 'true' | boolean
	form?: string
	name?: string
}
interface HTMLFormElementAttributes {
	'accept-charset'?: string
	action?: string
	autocomplete?: 'on' | 'off'
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
	novalidate?: 'true' | boolean
	rel?: string
	target?: '_self' | '_blank' | '_parent' | '_top' | (string & {})

	/** @deprecated */
	accept?: string
}
interface HTMLHRElementAttributes {
	/** @deprecated */
	align?: string
	/** @deprecated */
	color?: string
	/** @deprecated */
	noshade?: 'true' | boolean
	/** @deprecated */
	size?: string
	/** @deprecated */
	width?: string
}
interface HTMLHeadElementAttributes {
	/** @deprecated */
	profile?: string
}
interface HTMLHeadingElementAttributes {
	/** @deprecated */
	align?: 'left' | 'right' | 'justify' | 'center'
}
interface HTMLHtmlElementAttributes {
	manifest?: string

	/** @deprecated */
	version?: string
}
interface HTMLIFrameElementAttributes {
	allow?: string
	allowfullscreen?: 'true' | boolean
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

	/** @non-standard */
	browsingtopics?: 'true' | boolean
	/** @experimental */
	credentialless?: 'true' | boolean
	/** @experimental */
	csp?: string
	/** @experimental */
	sharedstoragewritable?: 'true' | boolean

	/** @deprecated */
	allowpaymentrequest?: 'true' | boolean
	/** @deprecated */
	allowtransparency?: 'true' | boolean
	/** @deprecated */
	align?: string
	/** @deprecated */
	frameborder?: number | string
	/** @deprecated */
	longdesc?: string
	/** @deprecated */
	marginheight?: number | string
	/** @deprecated */
	marginwidth?: number | string
	/** @deprecated */
	scrolling?: 'yes' | 'no' | 'auto'
	/** @deprecated */
	seamless?: 'true' | boolean
}
interface HTMLImageElementAttributes {
	alt?: string
	attributionsrc?: string
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	decoding?: 'sync' | 'async' | 'auto'
	elementtiming?: string
	fetchpriority?: 'high' | 'low' | 'auto'
	height?: number | string
	ismap?: 'true' | boolean
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
	sizes?: string
	src?: string
	srcset?: string
	usemap?: string
	width?: number | string

	/** @deprecated */
	align?: 'top' | 'middle' | 'bottom' | 'left' | 'right'
	/** @deprecated */
	border?: string
	/** @deprecated */
	hspace?: number | string
	/** @deprecated */
	intrinsicsize?: string
	/** @deprecated */
	longdesc?: string
	/** @deprecated */
	lowsrc?: string
	/** @deprecated */
	name?: string
	/** @deprecated */
	vspace?: number | string
}
interface HTMLInputElementAttributes {
	accept?: string
	alt?: string
	autocomplete?:
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
	autocorrect?: 'on' | 'off'
	autofocus?: boolean
	capture?: 'user' | 'environment'
	checked?: 'true' | boolean
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	dirname?: string
	disabled?: 'true' | boolean
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
	formenctype?:
		| 'application/x-www-form-urlencoded'
		| 'multipart/form-data'
		| 'text/plain'
	formmethod?: 'post' | 'get' | 'dialog'
	formnovalidate?: 'true' | boolean
	formtarget?: string
	height?: number | string
	incremental?: 'true' | boolean
	list?: string
	max?: number | string
	maxlength?: number | string
	min?: number | string
	minlength?: number | string
	multiple?: 'true' | boolean
	name?: string
	pattern?: string
	placeholder?: string
	popovertarget?: string
	popovertargetaction?: 'hide' | 'show' | 'toggle'
	readonly?: 'true' | boolean
	required?: 'true' | boolean
	results?: number | string
	size?: number | string
	src?: string
	step?: number | string
	type?:
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
	value?: number | string
	width?: number | string

	/** @deprecated */
	align?: string
	/** @deprecated */
	usemap?: string
}
interface HTMLLIElementAttributes {
	value?: number | string

	/** @deprecated */
	type?: '1' | 'a' | 'A' | 'i' | 'I'
}
interface HTMLLabelElementAttributes {
	for?: string
	form?: string
}
interface HTMLLegendElementAttributes {
	/** @deprecated */
	align?: string
}
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
	disabled?: 'true' | boolean
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
	rel?: string
	sizes?: string
	type?: string

	/** @experimental */
	blocking?: 'render'

	/** @deprecated */
	charset?: string
	/** @deprecated */
	rev?: string
	/** @deprecated */
	target?: string
}
interface HTMLMapElementAttributes {
	name?: string
}
interface HTMLMenuElementAttributes {
	/** @deprecated */
	compact?: 'true' | boolean
	/** @deprecated */
	label?: string
	/** @deprecated */
	type?: 'context' | 'toolbar'
}
interface HTMLMetaElementAttributes {
	charset?: string
	content?: string
	'http-equiv'?:
		| 'content-security-policy'
		| 'content-type'
		| 'default-style'
		| 'x-ua-compatible'
		| 'refresh'
	media?: string
	name?: string

	/** @deprecated */
	scheme?: string
}
interface HTMLMeterElementAttributes {
	form?: string
	high?: number | string
	low?: number | string
	max?: number | string
	min?: number | string
	optimum?: number | string
	value?: number | string
}
interface HTMLModElementAttributes {
	cite?: string
	datetime?: string
}
interface HTMLOListElementAttributes {
	reversed?: 'true' | boolean
	start?: number | string
	type?: '1' | 'a' | 'A' | 'i' | 'I'

	/** @deprecated */
	compact?: 'true' | boolean
}
interface HTMLObjectElementAttributes {
	data?: string
	form?: string
	height?: number | string
	name?: string
	type?: string
	width?: number | string

	/** @deprecated */
	align?: string
	/** @deprecated */
	archive?: string
	/** @deprecated */
	border?: string
	/** @deprecated */
	classid?: string
	/** @deprecated */
	code?: string
	/** @deprecated */
	codebase?: string
	/** @deprecated */
	codetype?: string
	/** @deprecated */
	declare?: 'true' | boolean
	/** @deprecated */
	hspace?: number | string
	/** @deprecated */
	standby?: string
	/** @deprecated */
	typemustmatch?: boolean
	/** @deprecated */
	usemap?: string
	/** @deprecated */
	vspace?: number | string
}
interface HTMLOptGroupElementAttributes {
	disabled?: 'true' | boolean
	label?: string
}
interface HTMLOptionElementAttributes {
	disabled?: 'true' | boolean
	label?: string
	selected?: 'true' | boolean
	value?: number | string
}
interface HTMLOutputElementAttributes {
	for?: string
	form?: string
	name?: string
}
interface HTMLParagraphElementAttributes {
	/** @deprecated */
	align?: 'left' | 'right' | 'justify' | 'center'
}
interface HTMLPictureElementAttributes {}
interface HTMLPreElementAttributes {
	/** @deprecated */
	width?: number | string
	/** @deprecated */
	wrap?: string
}
interface HTMLPreElementListingAttributes {
	/** @deprecated */
	width?: number | string
}
interface HTMLPreElementXmpAttributes {
	/** @deprecated */
	width?: number | string
}
interface HTMLProgressElementAttributes {
	max?: number | string
	value?: number | string
}
interface HTMLQuoteElementAttributes {
	cite?: string
}
interface HTMLScriptElementAttributes {
	async?: 'true' | boolean
	crossorigin?: 'anonymous' | 'use-credentials' | ''
	defer?: 'true' | boolean
	fetchpriority?: 'high' | 'low' | 'auto'
	integrity?: string
	nomodule?: 'true' | boolean
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
	src?: string
	type?: 'importmap' | 'module' | 'speculationrules' | (string & {})

	/** @experimental */
	attributionsrc?: string
	/** @experimental */
	blocking?: string

	/** @deprecated */
	charset?: string
	/** @deprecated */
	event?: string
	/** @deprecated */
	language?: string
}
interface HTMLSelectElementAttributes {
	autocomplete?:
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
	autofocus?: boolean
	disabled?: 'true' | boolean
	form?: string
	multiple?: 'true' | boolean
	name?: string
	required?: 'true' | boolean
	size?: number | string
	value?: number | string
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
	title?: string

	/** @experimental */
	blocking?: string

	/** @deprecated */
	scoped?: 'true' | boolean
	/** @deprecated */
	type?: string
}
interface HTMLTableCaptionElementAttributes {
	/** @deprecated */
	align?: 'left' | 'top' | 'right' | 'bottom'
}
interface HTMLTableCellTdElementAttributes {
	colspan?: number | string
	headers?: string
	rowspan?: number | string

	/** @deprecated */
	abbr?: string
	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	axis?: string
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	height?: number | string
	/** @deprecated */
	nowrap?: 'true' | boolean
	/** @deprecated */
	scope?: 'col' | 'row' | 'rowgroup' | 'colgroup'
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
	/** @deprecated */
	width?: number | string
}
interface HTMLTableCellThElementAttributes {
	abbr?: string
	colspan?: number | string
	headers?: string
	rowspan?: number | string
	scope?: 'col' | 'row' | 'rowgroup' | 'colgroup'

	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	axis?: string
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	height?: string
	/** @deprecated */
	nowrap?: 'true' | boolean
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
	/** @deprecated */
	width?: number | string
}
interface HTMLTableColElementAttributes {
	span?: number | string

	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
	/** @deprecated */
	width?: number | string
}
interface HTMLTableElementAttributes {
	/** @deprecated */
	align?: 'left' | 'center' | 'right'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	border?: number | string
	/** @deprecated */
	cellpadding?: number | string
	/** @deprecated */
	cellspacing?: number | string
	/** @deprecated */
	frame?:
		| 'void'
		| 'above'
		| 'below'
		| 'hsides'
		| 'vsides'
		| 'lhs'
		| 'rhs'
		| 'box'
		| 'border'
	/** @deprecated */
	rules?: 'none' | 'groups' | 'rows' | 'cols' | 'all'
	/** @deprecated */
	summary?: string
	/** @deprecated */
	width?: number | string
}
interface HTMLTableRowElementAttributes {
	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
}
interface HTMLTableSectionElementAttributes {}
interface HTMLTableSectionBodyElementAttributes {
	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
}
interface HTMLTableSectionFootElementAttributes {
	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
}
interface HTMLTableSectionHeadElementAttributes {
	/** @deprecated */
	align?: 'left' | 'center' | 'right' | 'justify' | 'char'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	char?: string
	/** @deprecated */
	charoff?: string
	/** @deprecated */
	valign?: 'baseline' | 'bottom' | 'middle' | 'top'
}
interface HTMLTemplateElementAttributes {
	shadowrootclonable?: 'true' | boolean
	shadowrootdelegatesfocus?: 'true' | boolean
	shadowrootmode?: 'open' | 'closed'
	shadowrootserializable?: 'true' | boolean
}
interface HTMLTextAreaElementAttributes {
	autocomplete?:
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
	autocorrect?: 'on' | 'off'
	autofocus?: boolean
	cols?: number | string
	dirname?: string
	disabled?: 'true' | boolean
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
	minlength?: number | string
	name?: string
	placeholder?: string
	readonly?: 'true' | boolean
	required?: 'true' | boolean
	rows?: number | string
	value?: number | string
	wrap?: 'hard' | 'soft' | 'off'
}
interface HTMLTimeElementAttributes {
	datetime?: string
}
interface HTMLTitleElementAttributes {}
interface HTMLTrackElementAttributes {
	default?: 'true' | boolean
	kind?:
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
	label?: string
	src?: string
	srclang?: string
}
interface HTMLUListElementAttributes {
	/** @deprecated */
	compact?: 'true' | boolean
	/** @deprecated */
	type?: 'circle' | 'disc' | 'square'
}
interface HTMLVideoElementAttributes extends HTMLMediaHTMLAttributes {
	disablepictureinpicture?: 'true' | boolean
	height?: number | string
	playsinline?: 'true' | boolean
	poster?: string
	width?: number | string
}

/* HTMLDeprecatedElements */

interface HTMLDirectoryElementAttributes {
	/** @deprecated */
	compact?: 'true' | boolean
}
interface HTMLElementAttributes {}
interface HTMLFontElementAttributes {
	/** @deprecated */
	color?: string
	/** @deprecated */
	face?: string
	/** @deprecated */
	size?: string
}
interface HTMLFrameElementAttributes {
	/** @deprecated */
	frameborder?: string
	/** @deprecated */
	longdesc?: string
	/** @deprecated */
	marginheight?: string
	/** @deprecated */
	marginwidth?: string
	/** @deprecated */
	name?: string
	/** @deprecated */
	noresize?: 'true' | boolean
	/** @deprecated */
	scrolling?: 'yes' | 'no'
	/** @deprecated */
	src?: string
}
interface HTMLFrameSetElementAttributes {
	/** @deprecated */
	cols?: number | string
	/** @deprecated */
	rows?: number | string
}
interface HTMLMarqueeElementAttributes {
	/** @deprecated */
	behavior?: 'scroll' | 'slide' | 'alternate'
	/** @deprecated */
	bgcolor?: string
	/** @deprecated */
	direction?: 'left' | 'right' | 'up' | 'down'
	/** @deprecated */
	height?: number | string
	/** @deprecated */
	hspace?: number | string
	/** @deprecated */
	loop?: number | string
	/** @deprecated */
	scrollamount?: number | string
	/** @deprecated */
	scrolldelay?: number | string
	/** @deprecated */
	truespeed?: 'true' | boolean
	/** @deprecated */
	vspace?: number | string
	/** @deprecated */
	width?: number | string
}
interface HTMLParamElementAttributes {
	/** @deprecated */
	name?: string
	/** @deprecated */
	value?: number | string
	/** @deprecated */
	type?: string
	/** @deprecated */
	valuetype?: 'data' | 'ref' | 'object'
}

interface HTMLUnknownElementAttributes {}
interface HTMLKeygenElementAttributes {
	/** @deprecated */
	autofocus?: boolean
	/** @deprecated */
	challenge?: string
	/** @deprecated */
	disabled?: 'true' | boolean
	/** @deprecated */
	form?: string
	/** @deprecated */
	keyparams?: string
	/** @deprecated */
	keytype?: string
	/** @deprecated */
	name?: string
}

/* MathMLElements */

interface MathMLAnnotationElementAttributes {
	encoding?: string

	/** @deprecated */
	src?: string
}
interface MathMLAnnotationXmlElementAttributes {
	encoding?: string

	/** @deprecated */
	src?: string
}

interface MathMLMathElementAttributes {
	display?: 'block' | 'inline'
}
interface MathMLMerrorElementAttributes {}
interface MathMLMfracElementAttributes {
	linethickness?: string

	/** @deprecated */
	denomalign?: 'center' | 'left' | 'right'
	/** @deprecated */
	numalign?: 'center' | 'left' | 'right'
}
interface MathMLMiElementAttributes {
	mathvariant?: 'normal'
}

interface MathMLMmultiscriptsElementAttributes {
	/** @deprecated */
	subscriptshift?: string
	/** @deprecated */
	superscriptshift?: string
}
interface MathMLMnElementAttributes {}
interface MathMLMoElementAttributes {
	fence?: 'true' | boolean
	form?: 'prefix' | 'infix' | 'postfix'
	largeop?: 'true' | boolean
	lspace?: string
	maxsize?: string
	minsize?: string
	movablelimits?: 'true' | boolean
	rspace?: string
	separator?: 'true' | boolean
	stretchy?: 'true' | boolean
	symmetric?: 'true' | boolean

	/** @non-standard */
	accent?: 'true' | boolean
}
interface MathMLMoverElementAttributes {
	accent?: 'true' | boolean
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
	/** @deprecated */
	lquote?: string
	/** @deprecated */
	rquote?: string
}
interface MathMLMspaceElementAttributes {
	depth?: string
	height?: string
	width?: string
}
interface MathMLMsqrtElementAttributes {}
interface MathMLMstyleElementAttributes {
	/** @deprecated */
	background?: string
	/** @deprecated */
	color?: string
	/** @deprecated */
	fontsize?: string
	/** @deprecated */
	fontstyle?: string
	/** @deprecated */
	fontweight?: string
	/** @deprecated */
	scriptminsize?: string
	/** @deprecated */
	scriptsizemultiplier?: string
}
interface MathMLMsubElementAttributes {
	/** @deprecated */
	subscriptshift?: string
}
interface MathMLMsubsupElementAttributes {
	/** @deprecated */
	subscriptshift?: string
	/** @deprecated */
	superscriptshift?: string
}
interface MathMLMsupElementAttributes {
	/** @deprecated */
	superscriptshift?: string
}
interface MathMLMtableElementAttributes {
	/** @non-standard */
	align?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
	/** @non-standard */
	columnalign?: 'center' | 'left' | 'right'
	/** @non-standard */
	columnlines?: 'dashed' | 'none' | 'solid'
	/** @non-standard */
	columnspacing?: string
	/** @non-standard */
	frame?: 'dashed' | 'none' | 'solid'
	/** @non-standard */
	framespacing?: string
	/** @non-standard */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
	/** @non-standard */
	rowlines?: 'dashed' | 'none' | 'solid'
	/** @non-standard */
	rowspacing?: string
	/** @non-standard */
	width?: string
}
interface MathMLMtdElementAttributes {
	columnspan?: number | string
	rowspan?: number | string
	/** @non-standard */
	columnalign?: 'center' | 'left' | 'right'
	/** @non-standard */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
}
interface MathMLMtextElementAttributes {}
interface MathMLMtrElementAttributes {
	/** @non-standard */
	columnalign?: 'center' | 'left' | 'right'
	/** @non-standard */
	rowalign?: 'axis' | 'baseline' | 'bottom' | 'center' | 'top'
}
interface MathMLMunderElementAttributes {
	accentunder?: 'true' | boolean
}
interface MathMLMunderoverElementAttributes {
	accent?: 'true' | boolean
	accentunder?: 'true' | boolean
}
interface MathMLSemanticsElementAttributes {}

/* MathMLDeprecatedElements */

interface MathMLMactionElementAttributes {
	/** @deprecated */
	actiontype?: 'statusline' | 'toggle'
	/** @deprecated */
	selection?: string
}

interface MathMLMencloseElementAttributes {
	/** @non-standard */
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

// HTMLElements

interface HTMLWebViewElements {
	/** @url https://www.electronjs.org/docs/latest/api/webview-tag */
	webview: HTMLAttributes<
		HTMLElement,
		HTMLWebViewElementAttributes,
		HTMLEvents<HTMLElement>
	>
}

interface HTMLElements {
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
	 */
	a: HTMLAttributes<
		HTMLAnchorElement,
		HTMLAnchorElementAttributes,
		HTMLEvents<HTMLAnchorElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	abbr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	address: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAreaElement
	 */
	area: HTMLAttributes<
		HTMLAreaElement,
		HTMLAreaElementAttributes,
		HTMLEvents<HTMLAreaElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	article: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	aside: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
	 */
	audio: HTMLAttributes<
		HTMLAudioElement,
		HTMLAudioElementAttributes,
		HTMLMediaElementEvents<HTMLAudioElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */

	b: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBaseElement
	 */

	base: HTMLAttributes<
		HTMLBaseElement,
		HTMLBaseElementAttributes,
		HTMLEvents<HTMLBaseElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */

	bdi: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */

	bdo: HTMLAttributes<
		HTMLElement,
		HTMLBdoElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
	 */

	blockquote: HTMLAttributes<
		HTMLQuoteElement,
		HTMLQuoteElementAttributes,
		HTMLEvents<HTMLQuoteElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBodyElement
	 */

	body: HTMLAttributes<
		HTMLBodyElement,
		HTMLBodyElementAttributes,
		HTMLBodyElementEvents<HTMLBodyElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLBRElement
	 */

	br: HTMLAttributes<
		HTMLBRElement,
		HTMLBRElementAttributes,
		HTMLEvents<HTMLBRElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement
	 */

	button: HTMLAttributes<
		HTMLButtonElement,
		HTMLButtonElementAttributes,
		HTMLEvents<HTMLButtonElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
	 */

	canvas: HTMLAttributes<
		HTMLCanvasElement,
		HTMLCanvasElementAttributes,
		HTMLEvents<HTMLCanvasElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCaptionElement
	 */

	caption: HTMLAttributes<
		HTMLTableCaptionElement,
		HTMLTableCaptionElementAttributes,
		HTMLEvents<HTMLTableCaptionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */

	cite: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */

	code: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
	 */

	col: HTMLAttributes<
		HTMLTableColElement,
		HTMLTableColElementAttributes,
		HTMLEvents<HTMLTableColElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableColElement
	 */

	colgroup: HTMLAttributes<
		HTMLTableColElement,
		HTMLTableColElementAttributes,
		HTMLEvents<HTMLTableColElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataElement
	 */

	data: HTMLAttributes<
		HTMLDataElement,
		HTMLDataElementAttributes,
		HTMLEvents<HTMLDataElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDataListElement
	 */
	datalist: HTMLAttributes<
		HTMLDataListElement,
		HTMLDataListElementAttributes,
		HTMLEvents<HTMLDataListElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	dd: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
	 */
	del: HTMLAttributes<
		HTMLModElement,
		HTMLModElementAttributes,
		HTMLEvents<HTMLModElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement
	 */
	details: HTMLAttributes<
		HTMLDetailsElement,
		HTMLDetailsElementAttributes,
		HTMLEvents<HTMLDetailsElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	dfn: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
	 */
	dialog: HTMLAttributes<
		HTMLDialogElement,
		HTMLDialogElementAttributes,
		HTMLEvents<HTMLDialogElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement
	 */
	div: HTMLAttributes<
		HTMLDivElement,
		HTMLDivElementAttributes,
		HTMLEvents<HTMLDivElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDListElement
	 */
	dl: HTMLAttributes<
		HTMLDListElement,
		HTMLDListElementAttributes,
		HTMLEvents<HTMLDListElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	dt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	em: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLEmbedElement
	 */
	embed: HTMLAttributes<
		HTMLEmbedElement,
		HTMLEmbedElementAttributes,
		HTMLEvents<HTMLEmbedElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFieldSetElement
	 */
	fieldset: HTMLAttributes<
		HTMLFieldSetElement,
		HTMLFieldSetElementAttributes,
		HTMLEvents<HTMLFieldSetElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	figcaption: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	figure: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	footer: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement
	 */
	form: HTMLAttributes<
		HTMLFormElement,
		HTMLFormElementAttributes,
		HTMLEvents<HTMLFormElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h1: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h2: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h3: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h4: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h5: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadingElement
	 */
	h6: HTMLAttributes<
		HTMLHeadingElement,
		HTMLHeadingElementAttributes,
		HTMLEvents<HTMLHeadingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHeadElement
	 */
	head: HTMLAttributes<
		HTMLHeadElement,
		HTMLHeadElementAttributes,
		HTMLEvents<HTMLHeadElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	header: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	hgroup: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHRElement
	 */
	hr: HTMLAttributes<
		HTMLHRElement,
		HTMLHRElementAttributes,
		HTMLEvents<HTMLHRElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLHtmlElement
	 */
	html: HTMLAttributes<
		HTMLHtmlElement,
		HTMLHtmlElementAttributes,
		HTMLEvents<HTMLHtmlElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	i: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
	 */
	iframe: HTMLAttributes<
		HTMLIFrameElement,
		HTMLIFrameElementAttributes,
		HTMLEvents<HTMLIFrameElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement
	 */
	img: HTMLAttributes<
		HTMLImageElement,
		HTMLImageElementAttributes,
		HTMLEvents<HTMLImageElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement
	 */
	input: HTMLAttributes<
		HTMLInputElement,
		HTMLInputElementAttributes,
		HTMLEvents<HTMLInputElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLModElement
	 */
	ins: HTMLAttributes<
		HTMLModElement,
		HTMLModElementAttributes,
		HTMLEvents<HTMLModElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	kbd: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement
	 */
	label: HTMLAttributes<
		HTMLLabelElement,
		HTMLLabelElementAttributes,
		HTMLEvents<HTMLLabelElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLegendElement
	 */
	legend: HTMLAttributes<
		HTMLLegendElement,
		HTMLLegendElementAttributes,
		HTMLEvents<HTMLLegendElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLIElement
	 */
	li: HTMLAttributes<
		HTMLLIElement,
		HTMLLIElementAttributes,
		HTMLEvents<HTMLLIElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement
	 */
	link: HTMLAttributes<
		HTMLLinkElement,
		HTMLLinkElementAttributes,
		HTMLEvents<HTMLLinkElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	main: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement
	 */
	map: HTMLAttributes<
		HTMLMapElement,
		HTMLMapElementAttributes,
		HTMLEvents<HTMLMapElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	mark: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMenuElement
	 */
	menu: HTMLAttributes<
		HTMLMenuElement,
		HTMLMenuElementAttributes,
		HTMLEvents<HTMLMenuElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMetaElement
	 */
	meta: HTMLAttributes<
		HTMLMetaElement,
		HTMLMetaElementAttributes,
		HTMLEvents<HTMLMetaElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMeterElement
	 */
	meter: HTMLAttributes<
		HTMLMeterElement,
		HTMLMeterElementAttributes,
		HTMLEvents<HTMLMeterElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	nav: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	noscript: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement
	 */
	object: HTMLAttributes<
		HTMLObjectElement,
		HTMLObjectElementAttributes,
		HTMLEvents<HTMLObjectElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOListElement
	 */
	ol: HTMLAttributes<
		HTMLOListElement,
		HTMLOListElementAttributes,
		HTMLEvents<HTMLOListElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptGroupElement
	 */
	optgroup: HTMLAttributes<
		HTMLOptGroupElement,
		HTMLOptGroupElementAttributes,
		HTMLEvents<HTMLOptGroupElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement
	 */
	option: HTMLAttributes<
		HTMLOptionElement,
		HTMLOptionElementAttributes,
		HTMLEvents<HTMLOptionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLOutputElement
	 */
	output: HTMLAttributes<
		HTMLOutputElement,
		HTMLOutputElementAttributes,
		HTMLEvents<HTMLOutputElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParagraphElement
	 */
	p: HTMLAttributes<
		HTMLParagraphElement,
		HTMLParagraphElementAttributes,
		HTMLEvents<HTMLParagraphElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPictureElement
	 */
	picture: HTMLAttributes<
		HTMLPictureElement,
		HTMLPictureElementAttributes,
		HTMLEvents<HTMLPictureElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
	 */
	pre: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementAttributes,
		HTMLEvents<HTMLPreElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement
	 */
	progress: HTMLAttributes<
		HTMLProgressElement,
		HTMLProgressElementAttributes,
		HTMLEvents<HTMLProgressElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLQuoteElement
	 */
	q: HTMLAttributes<
		HTMLQuoteElement,
		HTMLQuoteElementAttributes,
		HTMLEvents<HTMLQuoteElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	rp: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	rt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	ruby: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	s: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	samp: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
	 */
	script: HTMLAttributes<
		HTMLScriptElement,
		HTMLScriptElementAttributes,
		HTMLEvents<HTMLScriptElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	search: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	section: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement
	 */
	select: HTMLAttributes<
		HTMLSelectElement,
		HTMLSelectElementAttributes,
		HTMLEvents<HTMLSelectElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
	 */
	slot: HTMLAttributes<
		HTMLSlotElement,
		HTMLSlotElementAttributes,
		HTMLEvents<HTMLSlotElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	small: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSourceElement
	 */
	source: HTMLAttributes<
		HTMLSourceElement,
		HTMLSourceElementAttributes,
		HTMLEvents<HTMLSourceElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLSpanElement
	 */
	span: HTMLAttributes<
		HTMLSpanElement,
		HTMLSpanElementAttributes,
		HTMLEvents<HTMLSpanElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	strong: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLStyleElement
	 */
	style: HTMLAttributes<
		HTMLStyleElement,
		HTMLStyleElementAttributes,
		HTMLEvents<HTMLStyleElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	sub: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	summary: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	sup: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableElement
	 */
	table: HTMLAttributes<
		HTMLTableElement,
		HTMLTableElementAttributes,
		HTMLEvents<HTMLTableElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
	 */
	tbody: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionBodyElementAttributes,
		HTMLEvents<HTMLTableSectionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
	 */
	td: HTMLAttributes<
		HTMLTableCellElement,
		HTMLTableCellTdElementAttributes,
		HTMLEvents<HTMLTableCellElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement
	 */
	template: HTMLAttributes<
		HTMLTemplateElement,
		HTMLTemplateElementAttributes,
		HTMLEvents<HTMLTemplateElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement
	 */
	textarea: HTMLAttributes<
		HTMLTextAreaElement,
		HTMLTextAreaElementAttributes,
		HTMLEvents<HTMLTextAreaElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
	 */
	tfoot: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionFootElementAttributes,
		HTMLEvents<HTMLTableSectionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableCellElement
	 */
	th: HTMLAttributes<
		HTMLTableCellElement,
		HTMLTableCellThElementAttributes,
		HTMLEvents<HTMLTableCellElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableSectionElement
	 */
	thead: HTMLAttributes<
		HTMLTableSectionElement,
		HTMLTableSectionHeadElementAttributes,
		HTMLEvents<HTMLTableSectionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTimeElement
	 */
	time: HTMLAttributes<
		HTMLTimeElement,
		HTMLTimeElementAttributes,
		HTMLEvents<HTMLTimeElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTitleElement
	 */
	title: HTMLAttributes<
		HTMLTitleElement,
		HTMLTitleElementAttributes,
		HTMLEvents<HTMLTitleElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement
	 */
	tr: HTMLAttributes<
		HTMLTableRowElement,
		HTMLTableRowElementAttributes,
		HTMLEvents<HTMLTableRowElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLTrackElement
	 */
	track: HTMLAttributes<
		HTMLTrackElement,
		HTMLTrackElementAttributes,
		HTMLEvents<HTMLTrackElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	u: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUListElement
	 */
	ul: HTMLAttributes<
		HTMLUListElement,
		HTMLUListElementAttributes,
		HTMLEvents<HTMLUListElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	var: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement
	 */
	video: HTMLAttributes<
		HTMLVideoElement,
		HTMLVideoElementAttributes,
		HTMLVideoElementEvents<HTMLVideoElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	wbr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
}

// HTMLDeprecatedElements

interface HTMLDeprecatedElements {
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/acronym
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	acronym: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	applet: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/basefont
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	basefont: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	bgsound: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	big: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	blink: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	center: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLDirectoryElement
	 */
	dir: HTMLAttributes<
		HTMLDirectoryElement,
		HTMLDirectoryElementAttributes,
		HTMLEvents<HTMLDirectoryElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFontElement
	 */
	font: HTMLAttributes<
		HTMLFontElement,
		HTMLFontElementAttributes,
		HTMLEvents<HTMLFontElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameElement
	 */
	frame: HTMLAttributes<
		HTMLFrameElement,
		HTMLFrameElementAttributes,
		HTMLEvents<HTMLFrameElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLFrameSetElement
	 */
	frameset: HTMLAttributes<
		HTMLFrameSetElement,
		HTMLFrameSetElementAttributes,
		HTMLFrameSetElementEvents<HTMLFrameSetElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	isindex: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	keygen: HTMLAttributes<
		HTMLUnknownElement,
		HTMLKeygenElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/listing
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
	 */
	listing: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementListingAttributes,
		HTMLEvents<HTMLPreElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLMarqueeElement
	 */
	marquee: HTMLAttributes<
		HTMLMarqueeElement,
		HTMLMarqueeElementAttributes,
		HTMLEvents<HTMLMarqueeElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	menuitem: HTMLAttributes<
		HTMLUnknownElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/multicol
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	multicol: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nextid
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	nextid: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	nobr: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	noembed: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noindex
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	noindex: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	noframes: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLParamElement
	 */
	param: HTMLAttributes<
		HTMLParamElement,
		HTMLParamElementAttributes,
		HTMLEvents<HTMLParamElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	plaintext: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	rb: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rtc
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	rtc: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/spacer
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
	 */
	spacer: HTMLAttributes<
		HTMLUnknownElement,
		HTMLUnknownElementAttributes,
		HTMLEvents<HTMLUnknownElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strike
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	strike: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tt
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	 */
	tt: HTMLAttributes<
		HTMLElement,
		HTMLElementAttributes,
		HTMLEvents<HTMLElement>
	>
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/HTMLPreElement
	 */
	xmp: HTMLAttributes<
		HTMLPreElement,
		HTMLPreElementXmpAttributes,
		HTMLEvents<HTMLPreElement>
	>
}

// MathMLElements

interface MathMLElements {
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	annotation: MathMLAttributes<
		MathMLElement,
		MathMLAnnotationElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/annotation-xml
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	'annotation-xml': MathMLAttributes<
		MathMLElement,
		MathMLAnnotationXmlElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	math: MathMLAttributes<
		MathMLElement,
		MathMLMathElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/merror
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	merror: MathMLAttributes<
		MathMLElement,
		MathMLMerrorElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mfrac: MathMLAttributes<
		MathMLElement,
		MathMLMfracElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mi
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mi: MathMLAttributes<
		MathMLElement,
		MathMLMiElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mmultiscripts
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mmultiscripts: MathMLAttributes<
		MathMLElement,
		MathMLMmultiscriptsElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mn
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mn: MathMLAttributes<
		MathMLElement,
		MathMLMnElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mo: MathMLAttributes<
		MathMLElement,
		MathMLMoElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mover
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mover: MathMLAttributes<
		MathMLElement,
		MathMLMoverElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mpadded
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mpadded: MathMLAttributes<
		MathMLElement,
		MathMLMpaddedElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mphantom
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mphantom: MathMLAttributes<
		MathMLElement,
		MathMLMphantomElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mprescripts
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mprescripts: MathMLAttributes<
		MathMLElement,
		MathMLMprescriptsElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mroot
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mroot: MathMLAttributes<
		MathMLElement,
		MathMLMrootElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mrow
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mrow: MathMLAttributes<
		MathMLElement,
		MathMLMrowElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/ms
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	ms: MathMLAttributes<
		MathMLElement,
		MathMLMsElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mspace
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mspace: MathMLAttributes<
		MathMLElement,
		MathMLMspaceElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msqrt
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	msqrt: MathMLAttributes<
		MathMLElement,
		MathMLMsqrtElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mstyle
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mstyle: MathMLAttributes<
		MathMLElement,
		MathMLMstyleElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msub
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	msub: MathMLAttributes<
		MathMLElement,
		MathMLMsubElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msubsup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	msubsup: MathMLAttributes<
		MathMLElement,
		MathMLMsubsupElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/msup
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	msup: MathMLAttributes<
		MathMLElement,
		MathMLMsupElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtable
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mtable: MathMLAttributes<
		MathMLElement,
		MathMLMtableElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtd
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mtd: MathMLAttributes<
		MathMLElement,
		MathMLMtdElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtext
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mtext: MathMLAttributes<
		MathMLElement,
		MathMLMtextElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mtr
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mtr: MathMLAttributes<
		MathMLElement,
		MathMLMtrElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munder
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	munder: MathMLAttributes<
		MathMLElement,
		MathMLMunderElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/munderover
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	munderover: MathMLAttributes<
		MathMLElement,
		MathMLMunderoverElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/semantics
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	semantics: MathMLAttributes<
		MathMLElement,
		MathMLSemanticsElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @non-standard
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	menclose: MathMLAttributes<
		MathMLElement,
		MathMLMencloseElementAttributes,
		MathMLEvents<MathMLElement>
	>
}

// MathMLDeprecatedElements

interface MathMLDeprecatedElements {
	/**
	 * @deprecated
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/maction
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	maction: MathMLAttributes<
		MathMLElement,
		MathMLMactionElementAttributes,
		MathMLEvents<MathMLElement>
	>
	/**
	 * @deprecated
	 * @non-standard
	 * @url https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfenced
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/MathMLElement
	 */
	mfenced: MathMLAttributes<
		MathMLElement,
		MathMLMfencedElementAttributes,
		MathMLEvents<MathMLElement>
	>
}

// SVGElements

interface SVGElements {
	/*
	// clashes with `html`
	a: SVGAttributes<
		SVGAElement,
		SVGAElementAttributes,
		SVGEvents<SVGAElement>
	>
	*/

	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateElement
	 */
	animate: SVGAttributes<
		SVGAnimateElement,
		SVGAnimateElementAttributes,
		SVGEvents<SVGAnimateElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateMotionElement
	 */
	animateMotion: SVGAttributes<
		SVGAnimateMotionElement,
		SVGAnimateMotionElementAttributes,
		SVGEvents<SVGAnimateMotionElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimateTransformElement
	 */
	animateTransform: SVGAttributes<
		SVGAnimateTransformElement,
		SVGAnimateTransformElementAttributes,
		SVGEvents<SVGAnimateTransformElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGCircleElement
	 */
	circle: SVGAttributes<
		SVGCircleElement,
		SVGCircleElementAttributes,
		SVGEvents<SVGCircleElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGClipPathElement
	 */
	clipPath: SVGAttributes<
		SVGClipPathElement,
		SVGClipPathElementAttributes,
		SVGEvents<SVGClipPathElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDefsElement
	 */
	defs: SVGAttributes<
		SVGDefsElement,
		SVGDefsElementAttributes,
		SVGEvents<SVGDefsElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGDescElement
	 */
	desc: SVGAttributes<
		SVGDescElement,
		SVGDescElementAttributes,
		SVGEvents<SVGDescElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGEllipseElement
	 */
	ellipse: SVGAttributes<
		SVGEllipseElement,
		SVGEllipseElementAttributes,
		SVGEvents<SVGEllipseElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEBlendElement
	 */
	feBlend: SVGAttributes<
		SVGFEBlendElement,
		SVGFEBlendElementAttributes,
		SVGEvents<SVGFEBlendElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEColorMatrixElement
	 */
	feColorMatrix: SVGAttributes<
		SVGFEColorMatrixElement,
		SVGFEColorMatrixElementAttributes,
		SVGEvents<SVGFEColorMatrixElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEComponentTransferElement
	 */
	feComponentTransfer: SVGAttributes<
		SVGFEComponentTransferElement,
		SVGFEComponentTransferElementAttributes,
		SVGEvents<SVGFEComponentTransferElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFECompositeElement
	 */
	feComposite: SVGAttributes<
		SVGFECompositeElement,
		SVGFECompositeElementAttributes,
		SVGEvents<SVGFECompositeElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEConvolveMatrixElement
	 */
	feConvolveMatrix: SVGAttributes<
		SVGFEConvolveMatrixElement,
		SVGFEConvolveMatrixElementAttributes,
		SVGEvents<SVGFEConvolveMatrixElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDiffuseLightingElement
	 */
	feDiffuseLighting: SVGAttributes<
		SVGFEDiffuseLightingElement,
		SVGFEDiffuseLightingElementAttributes,
		SVGEvents<SVGFEDiffuseLightingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDisplacementMapElement
	 */
	feDisplacementMap: SVGAttributes<
		SVGFEDisplacementMapElement,
		SVGFEDisplacementMapElementAttributes,
		SVGEvents<SVGFEDisplacementMapElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDistantLightElement
	 */
	feDistantLight: SVGAttributes<
		SVGFEDistantLightElement,
		SVGFEDistantLightElementAttributes,
		SVGEvents<SVGFEDistantLightElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEDropShadowElement
	 */
	feDropShadow: SVGAttributes<
		SVGFEDropShadowElement,
		SVGFEDropShadowElementAttributes,
		SVGEvents<SVGFEDropShadowElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFloodElement
	 */
	feFlood: SVGAttributes<
		SVGFEFloodElement,
		SVGFEFloodElementAttributes,
		SVGEvents<SVGFEFloodElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncAElement
	 */
	feFuncA: SVGAttributes<
		SVGFEFuncAElement,
		SVGFEFuncAElementAttributes,
		SVGEvents<SVGFEFuncAElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncBElement
	 */
	feFuncB: SVGAttributes<
		SVGFEFuncBElement,
		SVGFEFuncBElementAttributes,
		SVGEvents<SVGFEFuncBElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncGElement
	 */
	feFuncG: SVGAttributes<
		SVGFEFuncGElement,
		SVGFEFuncGElementAttributes,
		SVGEvents<SVGFEFuncGElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEFuncRElement
	 */
	feFuncR: SVGAttributes<
		SVGFEFuncRElement,
		SVGFEFuncRElementAttributes,
		SVGEvents<SVGFEFuncRElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEGaussianBlurElement
	 */
	feGaussianBlur: SVGAttributes<
		SVGFEGaussianBlurElement,
		SVGFEGaussianBlurElementAttributes,
		SVGEvents<SVGFEGaussianBlurElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEImageElement
	 */
	feImage: SVGAttributes<
		SVGFEImageElement,
		SVGFEImageElementAttributes,
		SVGEvents<SVGFEImageElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeElement
	 */
	feMerge: SVGAttributes<
		SVGFEMergeElement,
		SVGFEMergeElementAttributes,
		SVGEvents<SVGFEMergeElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMergeNodeElement
	 */
	feMergeNode: SVGAttributes<
		SVGFEMergeNodeElement,
		SVGFEMergeNodeElementAttributes,
		SVGEvents<SVGFEMergeNodeElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEMorphologyElement
	 */
	feMorphology: SVGAttributes<
		SVGFEMorphologyElement,
		SVGFEMorphologyElementAttributes,
		SVGEvents<SVGFEMorphologyElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEOffsetElement
	 */
	feOffset: SVGAttributes<
		SVGFEOffsetElement,
		SVGFEOffsetElementAttributes,
		SVGEvents<SVGFEOffsetElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFEPointLightElement
	 */
	fePointLight: SVGAttributes<
		SVGFEPointLightElement,
		SVGFEPointLightElementAttributes,
		SVGEvents<SVGFEPointLightElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpecularLightingElement
	 */
	feSpecularLighting: SVGAttributes<
		SVGFESpecularLightingElement,
		SVGFESpecularLightingElementAttributes,
		SVGEvents<SVGFESpecularLightingElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFESpotLightElement
	 */
	feSpotLight: SVGAttributes<
		SVGFESpotLightElement,
		SVGFESpotLightElementAttributes,
		SVGEvents<SVGFESpotLightElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETileElement
	 */
	feTile: SVGAttributes<
		SVGFETileElement,
		SVGFETileElementAttributes,
		SVGEvents<SVGFETileElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFETurbulenceElement
	 */
	feTurbulence: SVGAttributes<
		SVGFETurbulenceElement,
		SVGFETurbulenceElementAttributes,
		SVGEvents<SVGFETurbulenceElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGFilterElement
	 */
	filter: SVGAttributes<
		SVGFilterElement,
		SVGFilterElementAttributes,
		SVGEvents<SVGFilterElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGForeignObjectElement
	 */
	foreignObject: SVGAttributes<
		SVGForeignObjectElement,
		SVGForeignObjectElementAttributes,
		SVGEvents<SVGForeignObjectElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGGElement
	 */
	g: SVGAttributes<
		SVGGElement,
		SVGGElementAttributes,
		SVGEvents<SVGGElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGImageElement
	 */
	image: SVGAttributes<
		SVGImageElement,
		SVGImageElementAttributes,
		SVGEvents<SVGImageElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLineElement
	 */
	line: SVGAttributes<
		SVGLineElement,
		SVGLineElementAttributes,
		SVGEvents<SVGLineElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGLinearGradientElement
	 */
	linearGradient: SVGAttributes<
		SVGLinearGradientElement,
		SVGLinearGradientElementAttributes,
		SVGEvents<SVGLinearGradientElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMarkerElement
	 */
	marker: SVGAttributes<
		SVGMarkerElement,
		SVGMarkerElementAttributes,
		SVGEvents<SVGMarkerElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMaskElement
	 */
	mask: SVGAttributes<
		SVGMaskElement,
		SVGMaskElementAttributes,
		SVGEvents<SVGMaskElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMetadataElement
	 */
	metadata: SVGAttributes<
		SVGMetadataElement,
		SVGMetadataElementAttributes,
		SVGEvents<SVGMetadataElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGMPathElement
	 */
	mpath: SVGAttributes<
		SVGMPathElement,
		SVGMPathElementAttributes,
		SVGEvents<SVGMPathElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement
	 */
	path: SVGAttributes<
		SVGPathElement,
		SVGPathElementAttributes,
		SVGEvents<SVGPathElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPatternElement
	 */
	pattern: SVGAttributes<
		SVGPatternElement,
		SVGPatternElementAttributes,
		SVGEvents<SVGPatternElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolygonElement
	 */
	polygon: SVGAttributes<
		SVGPolygonElement,
		SVGPolygonElementAttributes,
		SVGEvents<SVGPolygonElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGPolylineElement
	 */
	polyline: SVGAttributes<
		SVGPolylineElement,
		SVGPolylineElementAttributes,
		SVGEvents<SVGPolylineElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRadialGradientElement
	 */
	radialGradient: SVGAttributes<
		SVGRadialGradientElement,
		SVGRadialGradientElementAttributes,
		SVGEvents<SVGRadialGradientElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGRectElement
	 */
	rect: SVGAttributes<
		SVGRectElement,
		SVGRectElementAttributes,
		SVGEvents<SVGRectElement>
	>
	/*
	// clashes with `html`
	script: SVGAttributes<
		SVGScriptElement,
		SVGScriptElementAttributes,
		SVGEvents<SVGScriptElement>
	>
	*/

	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSetElement
	 */
	set: SVGAttributes<
		SVGSetElement,
		SVGSetElementAttributes,
		SVGEvents<SVGSetElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGStopElement
	 */
	stop: SVGAttributes<
		SVGStopElement,
		SVGStopElementAttributes,
		SVGEvents<SVGStopElement>
	>

	/*
	// clashes with `html`
	style: SVGAttributes<
		SVGStyleElement,
		SVGStyleElementAttributes,
		SVGEvents<SVGStyleElement>
	>
	*/

	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
	 */
	svg: SVGAttributes<
		SVGSVGElement,
		SVGSVGElementAttributes,
		SVGSVGElementEvents<SVGSVGElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSwitchElement
	 */
	switch: SVGAttributes<
		SVGSwitchElement,
		SVGSwitchElementAttributes,
		SVGEvents<SVGSwitchElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGSymbolElement
	 */
	symbol: SVGAttributes<
		SVGSymbolElement,
		SVGSymbolElementAttributes,
		SVGEvents<SVGSymbolElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextElement
	 */
	text: SVGAttributes<
		SVGTextElement,
		SVGTextElementAttributes,
		SVGEvents<SVGTextElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTextPathElement
	 */
	textPath: SVGAttributes<
		SVGTextPathElement,
		SVGTextPathElementAttributes,
		SVGEvents<SVGTextPathElement>
	>
	/*
	// clashes with `html`
	title: SVGAttributes<
		SVGTitleElement,
		SVGTitleElementAttributes,
		SVGEvents<SVGTitleElement>
	>*/

	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGTSpanElement
	 */
	tspan: SVGAttributes<
		SVGTSpanElement,
		SVGTSpanElementAttributes,
		SVGEvents<SVGTSpanElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGUseElement
	 */
	use: SVGAttributes<
		SVGUseElement,
		SVGUseElementAttributes,
		SVGEvents<SVGUseElement>
	>
	/**
	 * @url https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/SVGViewElement
	 */
	view: SVGAttributes<
		SVGViewElement,
		SVGViewElementAttributes,
		SVGEvents<SVGViewElement>
	>
}

/* EVENTS */

type Events<Event, Element> =
	| ((e: Event & { currentTarget: Element }) => void)
	| ({
			handleEvent: (e: Event & { currentTarget: Element }) => void
	  } & AddEventListenerOptions)

/* MAP */

interface HTMLEvents<Element> extends JSX.HTMLEvents<Element> {}
interface SVGEvents<Element> extends JSX.SVGEvents<Element> {}
interface MathMLEvents<Element> extends JSX.MathMLEvents<Element> {}

/* global events */

interface ElementEvents<Element> {
	'on:fullscreenchange'?: Events<Event, Element>
	'on:fullscreenerror'?: Events<Event, Element>
}

interface GlobalEvents<Element> {
	'on:abort'?: Events<UIEvent, Element>
	'on:animationcancel'?: Events<AnimationEvent, Element>
	'on:animationend'?: Events<AnimationEvent, Element>
	'on:animationiteration'?: Events<AnimationEvent, Element>
	'on:animationstart'?: Events<AnimationEvent, Element>
	'on:auxclick'?: Events<MouseEvent, Element>
	'on:beforeinput'?: Events<InputEvent, Element>
	'on:beforetoggle'?: Events<Event, Element>
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
	'on:toggle'?: Events<Event, Element>
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

interface WindowEvents<Element> {
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
	'on:pagereveal'?: Events<Event, Element>
	'on:pageshow'?: Events<PageTransitionEvent, Element>
	'on:pageswap'?: Events<Event, Element>
	'on:popstate'?: Events<PopStateEvent, Element>
	'on:rejectionhandled'?: Events<PromiseRejectionEvent, Element>
	'on:storage'?: Events<StorageEvent, Element>
	'on:unhandledrejection'?: Events<PromiseRejectionEvent, Element>
	'on:unload'?: Events<Event, Element>
}

// html

interface HTMLBodyElementEvents<Element>
	extends HTMLEvents<Element>,
		WindowEvents<Element> {}
interface HTMLFrameSetElementEvents<Element>
	extends HTMLEvents<Element>,
		WindowEvents<Element> {}

interface HTMLMediaElementEvents<Element>
	extends HTMLEvents<Element> {
	'on:encrypted'?: Events<MediaEncryptedEvent, Element>
	'on:waitingforkey'?: Events<Event, Element>
}

interface HTMLVideoElementEvents<Element>
	extends HTMLMediaElementEvents<Element> {
	'on:enterpictureinpicture'?: Events<PictureInPictureEvent, Element>
	'on:leavepictureinpicture'?: Events<PictureInPictureEvent, Element>
}

// SVG

interface SVGSVGElementEvents<Element>
	extends SVGEvents<Element>,
		WindowEvents<Element> {}

/**
 * 1. This prevents the other types in this file from leaking.
 * 2. This has to be the last thing of the file for some reason.
 */

export {}
