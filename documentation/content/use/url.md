---
title: url
subpath: pota/use/url
topic: Routing
desc:
  Small URL string helpers — protocol/origin checks, a safe
  decodeURIComponent, and replaceParams.
---

# `pota/use/url`

Small URL string helpers — protocol / origin checks, a safe
`decodeURIComponent`, and the `replaceParams` primitive used
internally by the [`<A/>`](/components/A) route builder.

## Exports

- [`cleanLink(href)`](/use/url/cleanLink) — strip trailing punctuation
  picked up from prose
- [`isFileProtocol(href)`](/use/url/isFileProtocol) — `file://`?
- [`hasProtocol(href)`](/use/url/hasProtocol) — matches `scheme://`
  (incl. nested)
- [`removeNestedProtocol(href)`](/use/url/removeNestedProtocol) —
  `blob:http://…` → `http://…`
- [`isAbsolute(href)`](/use/url/isAbsolute) — starts with `/` or has a
  protocol
- [`isRelative(href)`](/use/url/isRelative) — `!isAbsolute`
- [`isHash(url)`](/use/url/isHash) — starts with `#`
- [`isExternal(href)`](/use/url/isExternal) — not under the current
  origin
- [`encodeURIComponent`](/use/url/encodeURIComponent) — platform
  passthrough
- [`decodeURIComponent(s)`](/use/url/decodeURIComponent) — safe
  decode, never throws
- [`paramsRegExp`](/use/url/paramsRegExp) — the `:name` placeholder
  regex
- [`replaceParams(href, params)`](/use/url/replaceParams) — substitute
  `:name` placeholders
