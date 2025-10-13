import fs from 'fs'
import { execSync as $ } from 'child_process'

// bump version number
$('npm version patch --git-tag-version false')

// read version number
import('../../package.json', {
	with: { type: 'json' },
}).then(json => {
	// write version number to ./src/version.js
	const version = json.default.version
	fs.writeFileSync(
		'./src/version.js',
		"export const version = '" + version + "'",
	)

	// git add, commit with version number
	$('git add --all')
	$(`git commit -m "v${version}"`)

	// git push / npm publish
	$(`git tag -s -a v${version} -F ./src/release/breaking-changes.md`)
	$('git push --all --prune')
	$('git push --tags')
	$('npm publish')
})
