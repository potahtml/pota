// JSX prop augmentations for the custom prop plugins registered in
// `plugins.jsx` via `propsPluginNS`. Declares the `qa:*` and
// `inspect:*` namespaces so the matching JSX call sites typecheck
// without `any`.

declare namespace JSX {
	interface ElementAttributes<Element> {
		[K: `qa:${string}`]: Attribute<string>
		[K: `inspect:${string}`]: Attribute<string>
	}
}
