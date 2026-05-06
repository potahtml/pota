// Bench runner — captures the dev benchmark page's memory profile,
// invokes the page's own `#bench` button (which prints per-action
// timing numbers to the console), and records V8 deopt sites.
//
// Writes two files in this directory:
//   - results.md       — full block for the latest run (overwritten)
//   - results-short.md — multi-line history, newest entry prepended
//
// Pass `--no-write` (or `-n`) to measure-only — prints the report to
// the console and skips both files. Useful for A/B comparisons where
// the history file would only churn.
//
// Requires the bench page to be reachable. Defaults to pota.docs's
// kompiler dev server (http://localhost:37808/pages/benchmark/dev/).
//
// Run from repo root: `npm run bench`

import puppeteer from 'puppeteer'
import prettier from 'prettier'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '../..')

const NO_WRITE =
	process.argv.includes('--no-write') || process.argv.includes('-n')

const URL = 'http://localhost:37808/pages/benchmark/dev/index.html'

const RESULTS = path.join(__dirname, 'results.md')
const RESULTS_SHORT = path.join(__dirname, 'results-short.md')

// Chromium flags that stabilize timing for benchmarking — disable
// the periodic / opportunistic work that can otherwise inject noise
// into measurements (timer throttling on occluded / backgrounded
// renderers, background networking + sync + autofill + translate
// pings, component / safebrowsing updates, crash reporting,
// keychain / password-store probes, the hang monitor, IPC flood
// protection, audio bookkeeping). Applied to every browser the
// runner launches.
const STABILIZATION_FLAGS = [
	'--disable-background-networking',
	'--disable-background-timer-throttling',
	'--disable-backgrounding-occluded-windows',
	'--disable-breakpad',
	'--disable-component-update',
	'--disable-default-apps',
	'--disable-domain-reliability',
	'--disable-extensions',
	'--disable-features=Translate,AutofillServerCommunication',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-renderer-backgrounding',
	'--disable-sync',
	'--metrics-recording-only',
	'--mute-audio',
	'--no-default-browser-check',
	'--no-first-run',
	'--password-store=basic',
	'--use-mock-keychain',
]

function git(args) {
	try {
		return execSync(`git ${args}`, {
			cwd: REPO,
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.toString()
			.trim()
	} catch {
		return ''
	}
}

const pkg = JSON.parse(
	fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'),
)
const headSha = git('rev-parse --short HEAD') || '?'
const dirty = !!git('status --porcelain')
const date = new Date().toISOString().replace('T', ' ').slice(0, 19)

try {
	const r = await fetch(URL, { signal: AbortSignal.timeout(2000) })
	if (!r.ok) throw new Error(`HTTP ${r.status}`)
} catch (e) {
	console.error(`[bench] cannot reach ${URL}`)
	console.error(`        reason: ${e.message || e}`)
	console.error(
		`        Start the bench page: in pota.docs run \`npm run dev\`.`,
	)
	process.exit(1)
}

console.log(`[bench] target: ${URL}`)
console.log(
	`[bench] pota ${pkg.version}${dirty ? ' (dirty)' : ''} @ ${headSha}`,
)

const ROWS_FULL = expr =>
	`() => document.querySelectorAll('tbody tr').length === ${expr}`

async function cycle(page) {
	await page.click('#runlots')
	await page.waitForFunction(ROWS_FULL(10_000), { timeout: 0 })
	await page.click('#clear')
	await page.waitForFunction(ROWS_FULL(0), { timeout: 0 })
}

// Write `content` to `filePath`, formatted with the project's
// Prettier config (resolved from `package.json` / .prettierrc /
// etc.). The parser is inferred from the path's extension.
async function writeFormatted(filePath, content) {
	const config = await prettier.resolveConfig(filePath)
	const formatted = await prettier.format(content, {
		...config,
		filepath: filePath,
	})
	fs.writeFileSync(filePath, formatted)
}

// Parse output the page's `#bench` button writes to the console.
// Each line carries one or more `<name> <value>` pairs where `name`
// starts with `create` or `clear` (e.g. `createLarge 53.33 clearLarge 8.40`).
// Multiple lines = multiple iterations; values per name are collected
// in insertion order (first time seen → first key in the Map).
function parseBenchLines(lines) {
	const metrics = new Map()
	const re = /\b(create\w*|clear\w*)\s+(\d+(?:\.\d+)?)/g
	for (const line of lines) {
		let m
		while ((m = re.exec(line)) !== null) {
			const [, name, valStr] = m
			if (!metrics.has(name)) metrics.set(name, [])
			metrics.get(name).push(parseFloat(valStr))
		}
	}
	return metrics
}

// --- Phase 1: heap + page bench ---

console.log('[bench] heap + page bench...')

const browser1 = await puppeteer.launch({
	headless: true,
	args: [
		'--no-sandbox',
		'--js-flags=--expose-gc',
		...STABILIZATION_FLAGS,
	],
})

const heap = await (async () => {
	const page = await browser1.newPage()
	const client = await page.createCDPSession()
	await client.send('HeapProfiler.enable')

	// Capture every console message — we'll filter for bench output
	// after clicking the `#bench` button.
	const consoleLines = []
	page.on('console', msg => {
		consoleLines.push(msg.text())
	})

	const used = async () =>
		(await client.send('Runtime.getHeapUsage')).usedSize
	const gc = async () => {
		await client.send('HeapProfiler.collectGarbage')
		await new Promise(r => setTimeout(r, 100))
	}

	await page.goto(URL, { waitUntil: 'load' })

	// Warmup: a couple of full cycles so V8 has tiered up the hot
	// paths before the heap snapshot. The page's #bench likely does
	// its own warmup too, so a deep warmup here would be redundant.
	for (let i = 0; i < 2; i++) await cycle(page)
	await gc()
	const empty1 = await used()

	// Load 10k rows for the "full heap" measurement.
	await page.click('#runlots')
	await page.waitForFunction(ROWS_FULL(10_000), { timeout: 0 })
	await gc()
	const full = await used()

	// Clear, then measure post-clear heap (any retained leak shows here).
	await page.click('#clear')
	await page.waitForFunction(ROWS_FULL(0), { timeout: 0 })
	await gc()
	const empty2 = await used()

	// Run the page's own bench (it cycles internally and prints
	// `<name> <ms>` pairs to the console). Wait until output settles
	// — 3s without a new line means the bench is done. No hard cap;
	// however long the bench takes, we wait it out.
	console.log('[bench] running page bench (#bench)...')
	const startCount = consoleLines.length
	await page.click('#bench')
	let lastCount = startCount
	let stableSince = Date.now()
	while (Date.now() - stableSince < 3000) {
		if (consoleLines.length > lastCount) {
			lastCount = consoleLines.length
			stableSince = Date.now()
		}
		await new Promise(r => setTimeout(r, 200))
	}
	const bench = parseBenchLines(consoleLines.slice(startCount))

	return {
		empty1,
		full,
		empty2,
		perRow: (full - empty1) / 10_000,
		retainedLeak: empty2 - empty1,
		bench,
	}
})()

const browserVersion = await browser1.version()
await browser1.close()

console.log(
	`[bench] heap: per-row ${heap.perRow.toFixed(0)}B, full ${(heap.full / 1024).toFixed(0)}KB`,
)
if (heap.bench.size === 0) {
	console.log(`[bench] page bench: no metrics captured`)
} else {
	console.log(`[bench] page bench:`)
	for (const [name, vs] of heap.bench) {
		console.log(
			`  ${name}: best ${Math.min(...vs).toFixed(2)}ms (${vs.length} run${vs.length === 1 ? '' : 's'})`,
		)
	}
}

// --- Phase 2: deopts ---

console.log('[bench] deopts...')

const deoptLines = []

const browser2 = await puppeteer.launch({
	headless: true,
	args: [
		'--no-sandbox',
		// --trace-deopt prints `[bailout` lines per deopt;
		// --trace-deopt-verbose adds the source position of each on the
		// next line as `;;; deoptimize at <url:line:col>`.
		'--js-flags=--trace-deopt --trace-deopt-verbose',
		...STABILIZATION_FLAGS,
	],
})

// V8's --trace-deopt writes to stdout (not stderr). Listen on both
// to be safe; puppeteer leaves them as Readables on browser.process().
//
// We also capture the `;;; deoptimize at <url:line:col>` line that
// follows each [bailout] when --trace-deopt-verbose is on, so we can
// associate each deopt with a source position.
let buf = ''
const onChunk = chunk => {
	buf += chunk.toString('utf8')
	let i
	while ((i = buf.indexOf('\n')) !== -1) {
		const line = buf.slice(0, i)
		buf = buf.slice(i + 1)
		if (
			line.startsWith('[bailout (kind:') ||
			line.includes(';;; deoptimize at')
		)
			deoptLines.push(line)
	}
}
const proc = browser2.process()
proc?.stdout?.on('data', onChunk)
proc?.stderr?.on('data', onChunk)

try {
	const page2 = await browser2.newPage()
	await page2.goto(URL, { waitUntil: 'load' })
	// warmup
	await cycle(page2)
	// 1 measured
	await cycle(page2)
	await new Promise(r => setTimeout(r, 200))
} finally {
	await browser2.close()
}

const deoptRe =
	/^\[bailout \(kind: ([^,]+), reason: ([^)]+)\): begin\. deoptimizing [^<]*<JSFunction (\S+)/
const posRe = /;;; deoptimize at <([^>]+)>/
const sites = new Map()
let pendingKey = null
for (const line of deoptLines) {
	const m = line.match(deoptRe)
	if (m) {
		const [, kind, reason, fn] = m
		if (reason.includes('on stack replacement')) {
			pendingKey = null // OSR; normal — skip
			continue
		}
		if (kind.includes('lazy')) {
			pendingKey = null // cascade
			continue
		}
		pendingKey = `${fn} :: ${reason}`
		const cur = sites.get(pendingKey) || {
			count: 0,
			positions: new Set(),
		}
		cur.count++
		sites.set(pendingKey, cur)
	} else {
		const p = line.match(posRe)
		if (p && pendingKey) {
			// strip the http://host:port prefix to keep the report short
			const pos = p[1].replace(/^https?:\/\/[^/]+/, '')
			sites.get(pendingKey).positions.add(pos)
			pendingKey = null
		}
	}
}
const totalDeopts = [...sites.values()].reduce(
	(a, v) => a + v.count,
	0,
)
const uniqueDeopts = sites.size

console.log(
	`[bench] deopts: ${uniqueDeopts} unique, ${totalDeopts} total`,
)

// --- Write results.md (overwritten) and results-short.md (prepended) ---

const versionTag = `${pkg.version}${dirty ? ' (dirty)' : ''} @ ${headSha}`

// Pair create/clear bench metrics by their suffix (e.g.
// `createLarge` + `clearLarge`) and translate the suffix to a
// row-count label that matches how the bench page advertises the
// scenario in the UI.
const SUFFIX_LABELS = new Map([
	['Large', '10k'],
	['Small', '1k'],
])
const benchPairs = (() => {
	const pairs = new Map()
	for (const [name, values] of heap.bench) {
		const m = /^(create|clear)(.*)$/i.exec(name)
		if (!m) continue
		const [, kind, suffix] = m
		if (!pairs.has(suffix)) pairs.set(suffix, {})
		pairs.get(suffix)[kind.toLowerCase()] = values
	}
	return pairs
})()
const benchPairLines = [...benchPairs.entries()].map(
	([suffix, kinds]) => {
		const label = SUFFIX_LABELS.get(suffix) || suffix
		const create =
			kinds.create && Math.min(...kinds.create).toFixed(2)
		const clear = kinds.clear && Math.min(...kinds.clear).toFixed(2)
		if (create && clear)
			return { label, body: `\`${create}ms\` clear \`${clear}ms\`` }
		if (create) return { label, body: `\`${create}ms\`` }
		return { label, body: `clear \`${clear}ms\`` }
	},
)

const benchRows =
	benchPairLines
		.map(({ label, body }) => `| **${label}** | **${body}** |`)
		.join('\n') || '| (no #bench output captured) | — |'

const block = `# pota bench — latest run

Overwritten on each \`npm run bench\`. See \`results-short.md\` for
the multi-line history.

## ${date} — pota ${versionTag}

| metric | value |
| --- | --- |
| empty heap (post-warmup, GC) | ${(heap.empty1 / 1024).toFixed(0)} KB |
| 10k rows attached | ${(heap.full / 1024).toFixed(0)} KB |
| empty heap (post-clear, GC) | ${(heap.empty2 / 1024).toFixed(0)} KB |
| **per-row retained** | **${heap.perRow.toFixed(0)} bytes** |
| retained leak after clear | ${(heap.retainedLeak / 1024).toFixed(0)} KB |
${benchRows}
| unique deopts (warmup + 1 measured) | ${uniqueDeopts} |
| total deopts | ${totalDeopts} |
| chrome | ${browserVersion} |

### deopts
${
	[...sites.entries()]
		.sort((a, b) => b[1].count - a[1].count)
		.map(([k, v]) => {
			const where = [...v.positions].join(', ')
			return `- ${v.count}× \`${k}\`${where ? ' @ `' + where + '`' : ''}`
		})
		.join('\n') || '- (none)'
}
`

console.log()
console.log(block.trim())
console.log()

if (NO_WRITE) {
	console.log(`[bench] --no-write: skipping results.md / results-short.md`)
} else {
	await writeFormatted(RESULTS, block)

	const benchShortLines = benchPairLines
		.map(({ label, body }) => `- ${label} ${body}\n`)
		.join('')

	const shortEntry =
		`## ${versionTag} — ${browserVersion}\n\n` +
		benchShortLines +
		`- per-row \`${heap.perRow.toFixed(0)}B\` full \`${(heap.full / 1024).toFixed(0)}KB\` leak \`${(heap.retainedLeak / 1024).toFixed(0)}KB\`\n` +
		`- deopts \`${uniqueDeopts}/${totalDeopts}\`\n\n`

	const SHORT_HEADER =
		'# pota bench — short history\n\n' +
		'Compact log of `npm run bench` runs. Newest entry at the top.\n\n'

	let existingEntries = ''
	if (fs.existsSync(RESULTS_SHORT)) {
		const content = fs.readFileSync(RESULTS_SHORT, 'utf8')
		if (content.startsWith(SHORT_HEADER)) {
			existingEntries = content.slice(SHORT_HEADER.length)
		}
	}
	await writeFormatted(
		RESULTS_SHORT,
		SHORT_HEADER + shortEntry + existingEntries,
	)

	console.log(`[bench] wrote ${path.relative(REPO, RESULTS)}`)
	console.log(
		`[bench] prepended to ${path.relative(REPO, RESULTS_SHORT)}`,
	)
}
