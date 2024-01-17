import { execSync } from 'child_process'
import fs from 'fs'

// get last used tag
const lastTag = fs
	.readFileSync('./src/version.js', 'utf8')
	.replace("export const version = '", '')
	.replace("'", '')

// get all commits since the last tag
const releaseNotes = execSync(
	`git log ${lastTag}..HEAD --no-merges --oneline`,
)
	.toString()
	.trim()
	.replace(/\r\n/g, '\n')

// bump version number
execSync('npm version patch --git-tag-version false')

// read version number
import('./package.json', {
	assert: { type: 'json' },
}).then(json => {
	// write version number to ./src/version.js
	const version = json.default.version
	fs.writeFileSync(
		'./src/version.js',
		"export const version = '" + version + "'",
	)

	// git add, commit with version number
	execSync('git add --all')
	execSync('git commit -m "v' + version + '"')
	// tag
	fs.writeFileSync('./release-notes', releaseNotes)
	execSync('git tag -a ' + version + ' --file="./release-notes"')
	fs.rmSync('./release-notes')
	// git push, tags / npm publish
	execSync('git push --all --prune')
	execSync('git push --tags --prune')
	execSync('npm publish')
})
