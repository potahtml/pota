// JSX intrinsic declarations for the custom elements registered in
// `custom-element.jsx`. Each tag mirrors the attribute set the
// matching test exercises so the JSX call sites typecheck without
// relying on `any`.

declare namespace JSX {
	interface IntrinsicElements {
		'pota-test-custom-element-slots': HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>

		'pota-test-custom-element-tracking': HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement> & {
				'string-attribute'?: Attribute<string>
				stringattribute?: Attribute<string>
				propcasetest?: Attribute<string>
				propCASEtest?: Attribute<string>
				boolean?: Attribute<boolean>
			}

		'pota-test-custom-element-missing-slot': HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>

		'pota-test-custom-element-query-null': HTMLElementAttributes<HTMLElement> &
			Properties<HTMLElement>
	}
}
