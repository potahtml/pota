---
title: paramsRegExp
subpath: pota/use/url
topic: Routing
desc: The regex that matches :name placeholders in a route pattern.
---

# paramsRegExp

`paramsRegExp` is the regular expression (`/\:([a-z0-9_\-]+)/gi`) that
matches `:name` placeholders in a route pattern. It's what
[`replaceParams`](/use/url/replaceParams) uses to find substitution
points. Part of [`pota/use/url`](/use/url).
