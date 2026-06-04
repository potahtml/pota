---
title: dom
subpath: pota/use/dom
topic: Internals
desc: The low-level DOM helper module the renderer itself uses.
---

# `pota/use/dom`

`pota/use/dom` is the low-level DOM helper module the renderer itself
uses. It re-exports a few platform globals pre-bound to `document` and
wraps the imperative APIs that pota's internals lean on — attribute /
class / part manipulation, tree walking, and a couple of niche
utilities like `isPlaying` and `cleanJSXText`. Most app code doesn't
need it; it's documented because it ships as a public subpath.

## Exports

- [`document`](/use/dom/document) — `window.document`
- [`head`](/use/dom/head) — `document.head`
- [`documentElement`](/use/dom/documentElement) —
  `document.documentElement`
- [`DocumentFragment`](/use/dom/DocumentFragment) — the constructor
- [`activeElement()`](/use/dom/activeElement) —
  `document.activeElement`
- [`createElement(tag)`](/use/dom/createElement) — HTML element
- [`createElementNS(ns, tag)`](/use/dom/createElementNS) — namespaced
  element
- [`createTextNode(text)`](/use/dom/createTextNode) — text node
- [`createComment(text)`](/use/dom/createComment) — comment / anchor
  node
- [`importNode(node, deep?)`](/use/dom/importNode) —
  `document.importNode`
- [`createTreeWalker(root, what?)`](/use/dom/createTreeWalker) —
  `document.createTreeWalker`
- [`isConnected(node)`](/use/dom/isConnected) — `node.isConnected`
- [`isPlaying(el)`](/use/dom/isPlaying) — is a media element
  progressing?
- [`setAttribute(node, …)`](/use/dom/setAttribute) — platform
  `setAttribute`
- [`hasAttribute(node, …)`](/use/dom/hasAttribute) — platform
  `hasAttribute`
- [`removeAttribute(node, …)`](/use/dom/removeAttribute) — platform
  `removeAttribute`
- [`addClass(node, str|array)`](/use/dom/addClass) — `classList.add`
- [`removeClass(node, str|array)`](/use/dom/removeClass) —
  `classList.remove`
- [`addPart(node, …)`](/use/dom/addPart) — `node.part.add`
- [`removePart(node, …)`](/use/dom/removePart) — `node.part.remove`
- [`tokenList(s)`](/use/dom/tokenList) — trim + split by whitespace
- [`querySelector(node, query)`](/use/dom/querySelector) — per-node
  `querySelector`
- [`querySelectorAll(node, query)`](/use/dom/querySelectorAll) —
  per-node `querySelectorAll`
- [`walkElements(node, max?, nodes?)`](/use/dom/walkElements) —
  depth-first element walk
- [`getDocumentForElement(node)`](/use/dom/getDocumentForElement) —
  owning `Document` / `ShadowRoot`
- [`cleanJSXText(value)`](/use/dom/cleanJSXText) — JSX whitespace
  normalisation
- [`getValueElement(value, ...args)`](/use/dom/getValueElement) —
  resolve a value to a `Node`
- [`toDiff(prev, next, short?)`](/use/dom/toDiff) — remove stale nodes
  for `<For/>`

## Notes

Pre-bound creators (`createElement`, `createTextNode`, …) are bound to
`document`, so calls are a method dispatch lighter than the platform
versions and can be passed around as values. The attribute / class /
part helpers are direct passthroughs over their `Element` counterparts
— prefer JSX attributes / properties or `class:*` in components; these
are imperative escape hatches for library code.
