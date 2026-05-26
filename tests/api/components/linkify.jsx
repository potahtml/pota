/** @jsxImportSource pota */

// Tests for the Linkify component: markers (* / _ - | `), marker
// nesting and word boundaries, escape sequences, leading `>` quote
// and `/ ` italic prefixes, the trim option, the mark highlight, the
// emoji shortcode and unicode-emoji branches, URL → <Media> routing
// across image/audio/video/link, the spoiler click reveal, and
// disposal cleanup. Each test renders, asserts, and disposes.
import { $, test, body, childNodes } from '#test'

import { render } from 'pota'
import { Linkify } from 'pota/components'

// === Empty / trim defaults ===

await test('Linkify - empty text renders nothing', expect => {
	const dispose = render(<Linkify text="" />)
	expect(body()).toBe('')
	dispose()
})

await test('Linkify - undefined text renders nothing', expect => {
	const dispose = render(<Linkify />)
	expect(body()).toBe('')
	dispose()
})

await test('Linkify - plain text renders verbatim as a single text node', expect => {
	const dispose = render(<Linkify text="hello world" />)
	expect(body()).toBe('hello world')
	expect(childNodes()).toBe(1)
	expect(document.body.firstChild.nodeType).toBe(3)
	dispose()
})

await test('Linkify - trims surrounding whitespace by default', expect => {
	const dispose = render(<Linkify text="   hello   " />)
	expect(body()).toBe('hello')
	dispose()
})

// === Adjacent literals coalesce ===

await test('Linkify - adjacent literal pieces coalesce into one text node', expect => {
	const dispose = render(<Linkify text="alpha beta gamma delta" />)
	expect(body()).toBe('alpha beta gamma delta')
	expect(childNodes()).toBe(1)
	dispose()
})

// === Markers (each maps to a specific tag) ===

await test('Linkify - *text* renders as <b>', expect => {
	const dispose = render(<Linkify text="*bold*" />)
	expect(body()).toBe('<b>bold</b>')
	dispose()
})

await test('Linkify - /text/ renders as <em>', expect => {
	const dispose = render(<Linkify text="/italic/" />)
	expect(body()).toBe('<em>italic</em>')
	dispose()
})

await test('Linkify - _text_ renders as <u>', expect => {
	const dispose = render(<Linkify text="_under_" />)
	expect(body()).toBe('<u>under</u>')
	dispose()
})

await test('Linkify - -text- renders as <s>', expect => {
	const dispose = render(<Linkify text="-strike-" />)
	expect(body()).toBe('<s>strike</s>')
	dispose()
})

await test('Linkify - |text| renders as <span data-linkify-type="spoiler">', expect => {
	const dispose = render(<Linkify text="|secret|" />)
	expect(body()).toBe(
		'<span data-linkify-type="spoiler">secret</span>',
	)
	dispose()
})

await test('Linkify - `text` renders as <code> with surrounding backticks', expect => {
	const dispose = render(<Linkify text="`x = 1`" />)
	expect(body()).toBe('<code>`x = 1`</code>')
	dispose()
})

// === Markers honour word boundaries ===

await test('Linkify - mid-word markers are not treated as tags', expect => {
	const dispose = render(<Linkify text="a*b*c" />)
	expect(body()).toBe('a*b*c')
	dispose()
})

await test('Linkify - markers preceded by punctuation that opens (quote, paren) do open', expect => {
	// opener char before, then `*`
	const dispose = render(<Linkify text='"*bold*"' />)
	expect(body()).toBe('"<b>bold</b>"')
	dispose()
})

await test('Linkify - leading marker still opens at the beginning of input', expect => {
	const dispose = render(<Linkify text="*lead* tail" />)
	expect(body()).toBe('<b>lead</b> tail')
	dispose()
})

// === Marker nesting ===

await test('Linkify - markers nest', expect => {
	const dispose = render(<Linkify text="*foo /bar/ baz*" />)
	expect(body()).toBe('<b>foo <em>bar</em> baz</b>')
	dispose()
})

await test('Linkify - multiple sibling markers in one line', expect => {
	const dispose = render(
		<Linkify text="*bold* and /italic/ and _under_" />,
	)
	expect(body()).toBe(
		'<b>bold</b> and <em>italic</em> and <u>under</u>',
	)
	dispose()
})

// === Atomic backtick: no inner parsing ===

await test('Linkify - `...` is atomic — inner markers stay literal', expect => {
	const dispose = render(<Linkify text="`*not bold*`" />)
	expect(body()).toBe('<code>`*not bold*`</code>')
	dispose()
})

// === Escapes ===

await test('Linkify - \\* at a marker-open position renders the marker literally', expect => {
	// JSX attribute strings preserve backslashes literally, so use a
	// JS-expression child to get a single backslash through. The
	// escape only applies where a marker could open (after whitespace
	// or at the start), so `\*foo*` becomes `*foo*` (no <b>).
	const dispose = render(<Linkify text={'\\*foo*'} />)
	expect(body()).toBe('*foo*')
	dispose()
})

await test('Linkify - \\ mid-text (not at a marker-open position) is preserved', expect => {
	// canOpen() of the prev char must be true for the escape to fire.
	// In `a\\*b` the prev char of `\\` is `a` (non-whitespace), so the
	// backslash survives.
	const dispose = render(<Linkify text={'a\\*b'} />)
	expect(body()).toBe('a\\*b')
	dispose()
})

// === Newline behaviour: `*` and `-` close at the first newline ===

await test('Linkify - * does not span newlines (no close → literal)', expect => {
	const dispose = render(<Linkify text={'*foo\nbar*'} />)
	expect(body()).toBe('*foo\nbar*')
	dispose()
})

await test('Linkify - - does not span newlines (no close → literal)', expect => {
	const dispose = render(<Linkify text={'-foo\nbar-'} />)
	expect(body()).toBe('-foo\nbar-')
	dispose()
})

await test('Linkify - / spans newlines', expect => {
	const dispose = render(<Linkify text={'/foo\nbar/'} />)
	expect(body()).toBe('<em>foo\nbar</em>')
	dispose()
})

await test('Linkify - _ spans newlines', expect => {
	const dispose = render(<Linkify text={'_foo\nbar_'} />)
	expect(body()).toBe('<u>foo\nbar</u>')
	dispose()
})

await test('Linkify - | spans newlines', expect => {
	const dispose = render(<Linkify text={'|foo\nbar|'} />)
	expect(body()).toBe(
		'<span data-linkify-type="spoiler">foo\nbar</span>',
	)
	dispose()
})

await test('Linkify - ` spans newlines (atomic)', expect => {
	const dispose = render(<Linkify text={'`foo\nbar`'} />)
	expect(body()).toBe('<code>`foo\nbar`</code>')
	dispose()
})

// === Quote and italic prefixes ===

await test('Linkify - > prefix wraps the whole result in <q>', expect => {
	const dispose = render(<Linkify text="> a quote" />)
	expect(body()).toBe('<q>a quote</q>')
	dispose()
})

await test('Linkify - > with no space after still works', expect => {
	const dispose = render(<Linkify text=">tight" />)
	expect(body()).toBe('<q>tight</q>')
	dispose()
})

await test('Linkify - "/ " prefix wraps the whole result in <em>', expect => {
	const dispose = render(<Linkify text="/ italic block" />)
	expect(body()).toBe('<em>italic block</em>')
	dispose()
})

await test('Linkify - "/" without trailing space is not an italic prefix', expect => {
	const dispose = render(<Linkify text="/no-prefix" />)
	expect(body()).toBe('/no-prefix')
	dispose()
})

await test('Linkify - > and "/ " combine in order', expect => {
	const dispose = render(<Linkify text=">/ both" />)
	expect(body()).toBe('<q><em>both</em></q>')
	dispose()
})

await test('Linkify - prefixes coexist with inline markers', expect => {
	const dispose = render(<Linkify text="> hello *world*" />)
	expect(body()).toBe('<q>hello <b>world</b></q>')
	dispose()
})

// === Trim option ===

await test('Linkify - trim=false leaves per-line padding intact', expect => {
	const dispose = render(<Linkify text={' a \n b '} />)
	expect(body()).toBe('a \n b')
	dispose()
})

await test('Linkify - trim=true strips per-line padding but keeps newlines', expect => {
	const dispose = render(<Linkify text={' a \n b '} trim />)
	expect(body()).toBe('a\nb')
	dispose()
})

// === Mark highlight ===

await test('Linkify - mark wraps the whole matching token in <mark>', expect => {
	const dispose = render(<Linkify text="hello world" mark="world" />)
	expect(body()).toBe('hello <mark>world</mark>')
	dispose()
})

await test('Linkify - mark is case-insensitive', expect => {
	const dispose = render(<Linkify text="Hello WORLD" mark="world" />)
	expect(body()).toBe('Hello <mark>WORLD</mark>')
	dispose()
})

await test('Linkify - mark only matches whole whitespace-separated tokens', expect => {
	// "worldwide" is one token; "world" inside it should NOT highlight.
	const dispose = render(
		<Linkify text="worldwide stuff" mark="world" />,
	)
	expect(body()).toBe('worldwide stuff')
	dispose()
})

await test('Linkify - mark=false (default) does nothing', expect => {
	const dispose = render(<Linkify text="hello world" />)
	expect(body()).toBe('hello world')
	dispose()
})

// === Emoji ===

await test('Linkify - emoji=false leaves :smile: as literal text', expect => {
	const dispose = render(<Linkify text=":smile:" />)
	expect(body()).toBe(':smile:')
	dispose()
})

await test('Linkify - emoji=true substitutes :smile: via the shortcode map', expect => {
	const dispose = render(<Linkify text=":smile:" emoji />)
	expect(body()).toBe('<span data-linkify-type="emoji">😄</span>')
	dispose()
})

await test('Linkify - emoji=true substitutes :heart: via the shortcode map', expect => {
	const dispose = render(<Linkify text=":heart:" emoji />)
	expect(body()).toBe('<span data-linkify-type="emoji">❤</span>')
	dispose()
})

await test('Linkify - emoji=true # shortcodes render "<key> <value>"', expect => {
	const dispose = render(<Linkify text="#UY" emoji />)
	expect(body()).toBe('<span data-linkify-type="emoji">#UY 🇺🇾</span>')
	dispose()
})

await test('Linkify - emoji=true wraps bare unicode emoji', expect => {
	const dispose = render(<Linkify text="😀" emoji />)
	expect(body()).toBe('<span data-linkify-type="emoji">😀</span>')
	dispose()
})

await test('Linkify - emoji=true mixes shortcodes with surrounding text', expect => {
	const dispose = render(<Linkify text="hello :smile: world" emoji />)
	expect(body()).toBe(
		'hello <span data-linkify-type="emoji">😄</span> world',
	)
	dispose()
})

// === URL → Media routing ===

await test('Linkify - image URL renders <img> inside an anchor', expect => {
	const dispose = render(
		<Linkify text="https://example.com/pic.png" />,
	)
	const a = $('a')
	expect(a).not.toBe(null)
	expect(a.querySelector('img')).not.toBe(null)
	expect(a.querySelector('img').getAttribute('src')).toBe(
		'https://example.com/pic.png',
	)
	dispose()
})

await test('Linkify - video URL renders <video> inside an anchor', expect => {
	const dispose = render(
		<Linkify text="https://example.com/clip.mp4" />,
	)
	const a = $('a')
	expect(a).not.toBe(null)
	expect(a.querySelector('video')).not.toBe(null)
	expect(a.querySelector('video').getAttribute('src')).toBe(
		'https://example.com/clip.mp4',
	)
	dispose()
})

await test('Linkify - audio URL renders a bare <audio> element', expect => {
	const dispose = render(
		<Linkify text="https://example.com/song.mp3" />,
	)
	const audio = $('audio')
	expect(audio).not.toBe(null)
	expect(audio.getAttribute('src')).toBe(
		'https://example.com/song.mp3',
	)
	// audio is NOT wrapped in an anchor
	expect($('a')).toBe(null)
	dispose()
})

await test('Linkify - URL without a media extension renders a generic <a>', expect => {
	const dispose = render(<Linkify text="https://example.com/about" />)
	const a = $('a')
	expect(a).not.toBe(null)
	expect(a.getAttribute('href')).toBe('https://example.com/about')
	expect(a.querySelector('img')).toBe(null)
	expect(a.querySelector('video')).toBe(null)
	dispose()
})

await test('Linkify - off-origin URLs open in a new tab', expect => {
	const dispose = render(<Linkify text="https://example.com/about" />)
	const a = $('a')
	expect(a.getAttribute('target')).toBe('_blank')
	expect(a.getAttribute('rel')).toBe('noopener external')
	dispose()
})

await test('Linkify - same-origin URLs do not get target=_blank', expect => {
	// Build a URL that matches the test page's own origin.
	const here =
		window.location.protocol +
		'//' +
		window.location.host +
		'/some/path'
	const dispose = render(<Linkify text={here} />)
	const a = $('a')
	expect(a.getAttribute('target')).toBe(null)
	dispose()
})

await test('Linkify - URLs sit inline with surrounding text', expect => {
	const dispose = render(
		<Linkify text="see https://example.com/about ok" />,
	)
	expect(body()).toInclude('see ')
	expect(body()).toInclude(' ok')
	expect($('a').getAttribute('href')).toBe(
		'https://example.com/about',
	)
	dispose()
})

// === Spoiler click reveals contents ===

await test('Linkify - clicking a spoiler resets its background/color to inherit', expect => {
	const dispose = render(<Linkify text="|secret|" />)

	const span = $('[data-linkify-type="spoiler"]')
	expect(span).not.toBe(null)
	// before click, no inline style set by the component
	expect(span.style.backgroundColor).toBe('')
	expect(span.style.color).toBe('')

	span.dispatchEvent(new MouseEvent('click', { bubbles: true }))

	expect(span.style.backgroundColor).toBe('inherit')
	expect(span.style.color).toBe('inherit')

	dispose()
})

// === Dispose cleanup ===

await test('Linkify - dispose removes the rendered tree', expect => {
	const dispose = render(
		<Linkify text="*bold* and :smile: and https://example.com/pic.png" />,
	)
	expect(document.body.firstChild).not.toBe(null)
	dispose()
	expect(document.body.firstChild).toBe(null)
})
