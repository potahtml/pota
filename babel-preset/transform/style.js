import { types as t } from '@babel/core'

import { isNullUndefined, isPlainTemplateLiteral } from './literal.js'

/**
 * Folds a literal `style={{...}}` into `style="..."` so the value can
 * be baked into the partial HTML by `isAttributeLiteral` /
 * `buildAttributeIntoTag` downstream.
 *
 * Runs after `evaluateAndInline`, so any `evaluate().confident`
 * string/number has already been rewritten to a literal node. Runs
 * after the dedup pass (in `partial.js`), so in the non-spread case
 * there is at most one `style=` per element.
 *
 * Handles each `style=` attribute independently — no cross-attribute
 * merging. Merging multiple `style=` attrs would silently flip
 * "last-wins" (current pota semantics, enforced by the dedup pass and
 * by JS object-literal semantics in the spread path) into "merged",
 * so we don't.
 *
 * Per attr:
 *
 * 1. `style={null|undefined|void 0}` → drop the attribute.
 * 2. `style="..."` → leave alone (already literal; downstream bakes it).
 * 3. `style={`...`}` (no expressions) → collapse whitespace following
 *    `;`, drop trailing `;`, trim, then bake.
 * 4. `style={`...${x}...`}` → collapse whitespace following `;` in each
 *    quasi; expressions and boundary whitespace untouched. (Still
 *    dynamic — applied at runtime via `setStyle`.)
 * 5. `style={{}}` → drop the attribute.
 * 6. Object property whose value is `null|undefined|void 0` → drop that
 *    property.
 * 7. Object with every property foldable → replace the object with
 *    (static key + literal string/number a literal `style="..."`
 *    value, or computed key where both string. key and value evaluate
 *    confident)
 * 8. Otherwise → leave the object alone; the props pipeline will apply
 *    it via `setStyle`.
 */
export function inlineStyles(path) {
	const attrs = path
		.get('openingElement')
		.get('attributes')
		.filter(
			a =>
				a.isJSXAttribute() &&
				t.isJSXIdentifier(a.node.name) &&
				a.node.name.name === 'style',
		)

	for (const attr of attrs) {
		foldStyleAttribute(attr)
	}
}

function foldStyleAttribute(attr) {
	const value = unwrapValue(attr)
	if (!value) return

	if (isNullUndefined(value.node)) {
		attr.remove()
		return
	}

	if (value.isStringLiteral()) return

	if (value.isTemplateLiteral()) {
		if (isPlainTemplateLiteral(value.node)) {
			const css = value.node.quasis[0].value.cooked
				.replace(/;\s+/g, ';')
				.replace(/;\s*$/, '')
				.trim()

			if (css === '') {
				attr.remove()
				return
			}

			attr.get('value').replaceWith(t.stringLiteral(css))
			return
		}

		// has expressions — can't bake, but collapse whitespace after
		// `;` in each static quasi so the runtime string (passed to
		// `cssText`) is tidier
		for (const quasi of value.node.quasis) {
			quasi.value.cooked = quasi.value.cooked.replace(/;\s+/g, ';')
			quasi.value.raw = quasi.value.raw.replace(/;\s+/g, ';')
		}
		return
	}

	if (!value.isObjectExpression()) return

	// drop null/undefined-valued properties

	for (const prop of value.get('properties').slice().reverse()) {
		if (prop.isObjectProperty() && isNullUndefined(prop.node.value)) {
			prop.remove()
		}
	}

	if (value.node.properties.length === 0) {
		attr.remove()
		return
	}

	// only fold when every remaining property is a foldable key/value
	// pair — bail at the first dynamic piece rather than partially
	// folding (partial folding would need to split into a literal
	// string attr + a dynamic object attr, which reorders relative
	// to `setStyle` overlays).

	const pieces = []
	for (const prop of value.get('properties')) {
		if (!prop.isObjectProperty()) return

		const key = readKey(prop)
		if (key === null) return

		const propValue = readLiteralValue(prop.get('value'))
		if (propValue === null) return

		pieces.push(`${key}:${propValue}`)
	}

	const css = pieces
		.map(piece => piece.trim().replace(/;\s*$/, '').trim())
		.filter(Boolean)
		.join(';')
		.replace(/;\s+/g, ';')
		.trim()

	if (css === '') {
		attr.remove()
		return
	}

	attr.get('value').replaceWith(t.stringLiteral(css))
}

/** Unwraps a JSXAttribute value to the underlying expression path. */
function unwrapValue(attrPath) {
	const value = attrPath.get('value')
	if (!value || !value.node) return null
	if (value.isJSXExpressionContainer()) return value.get('expression')
	return value
}

/**
 * Returns the static key of an ObjectProperty as a string, or `null`
 * when it can't be resolved at compile time.
 */
function readKey(propPath) {
	const key = propPath.node.key

	if (!propPath.node.computed) {
		if (t.isIdentifier(key)) return key.name
		if (t.isStringLiteral(key)) return key.value
		if (t.isNumericLiteral(key)) return String(key.value)
		return null
	}

	const r = propPath.get('key').evaluate()
	if (
		r.confident &&
		(typeof r.value === 'string' || typeof r.value === 'number')
	) {
		return String(r.value)
	}
	return null
}

/**
 * Returns the literal string/number value of a property as a string,
 * or `null` when it can't be resolved.
 */
function readLiteralValue(valuePath) {
	const node = valuePath.node

	if (t.isStringLiteral(node)) return node.value
	if (t.isNumericLiteral(node)) return String(node.value)
	if (
		t.isUnaryExpression(node, { operator: '-' }) &&
		t.isNumericLiteral(node.argument)
	) {
		return '-' + node.argument.value
	}
	if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
		return node.quasis[0].value.cooked
	}
	if (t.isBigIntLiteral(node)) return node.value

	const r = valuePath.evaluate()
	if (
		r.confident &&
		(typeof r.value === 'string' || typeof r.value === 'number')
	) {
		return String(r.value)
	}
	return null
}
