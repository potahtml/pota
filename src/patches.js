// isCustomElement

const ce = customElements
const define = ce.define.bind(ce)
ce.define = (name, constructor, options) => {
	constructor.prototype.isCustomElement = true
	define(name, constructor, options)
}
