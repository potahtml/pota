// Keeps the bench running against the latest *stable* Chrome instead
// of whatever build puppeteer pinned at install time.
//
// `puppeteer.executablePath()` returns the Chrome build tied to the
// installed puppeteer version, which lags behind Chrome stable — so
// without this the bench silently tracks a stale engine even when a
// newer Chrome sits in the cache. Before each run we resolve the
// current stable build, download it into puppeteer's own cache if
// missing (a no-op once cached), and hand its path to
// `puppeteer.launch({ executablePath })`.
//
// `stable`, not `latest`: `latest` resolves to a canary/dev build,
// which is the wrong baseline for a benchmark.

import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer'
import {
	Browser,
	detectBrowserPlatform,
	install,
	resolveBuildId,
} from '@puppeteer/browsers'

/**
 * Resolve + install the latest stable Chrome into puppeteer's cache.
 * Falls back to puppeteer's bundled build (returns no
 * `executablePath`) if the update can't be done — e.g. offline — so
 * the bench still runs.
 *
 * @param {string} [tag] Log prefix matching the calling script
 *   (`bench` / `prof`).
 * @returns {Promise<{ executablePath?: string; buildId?: string }>}
 */
export async function installLatestChrome(tag = 'bench') {
	try {
		const cacheDir =
			puppeteer.configuration?.cacheDirectory ||
			path.join(os.homedir(), '.cache', 'puppeteer')
		const platform = detectBrowserPlatform()
		if (!platform) throw new Error('unsupported browser platform')

		const buildId = await resolveBuildId(
			Browser.CHROME,
			platform,
			'stable',
		)

		let lastPct = -1
		const installed = await install({
			browser: Browser.CHROME,
			platform,
			buildId,
			cacheDir,
			// Only fires on an actual download (cache hits are silent).
			downloadProgressCallback: (downloaded, total) => {
				if (!total) return
				const pct = Math.floor((downloaded / total) * 100)
				if (pct === lastPct) return
				lastPct = pct
				process.stderr.write(
					`\r[${tag}] downloading Chrome ${buildId}: ${pct}%${
						pct === 100 ? '\n' : ''
					}`,
				)
			},
		})

		return { executablePath: installed.executablePath, buildId }
	} catch (e) {
		console.warn(
			`[${tag}] could not update Chrome (${e.message || e}); using puppeteer's bundled build`,
		)
		return {}
	}
}
