import { $, read, write } from './utils.js'

// bump version number
$('npm version patch --git-tag-version false')

// read version number
const { version } = JSON.parse(read('./package.json'))

// write version number to ./src/version.js
write('./src/version.js', `export const version = '${version}'\n`)

// git add, commit with version number — explicit paths only so
// stray dirty files never end up in the release commit
$('git add --all')
$(`git commit -m "v${version}"`)

// tag the release, push the current branch and tags, then publish
$(`git tag -s -a v${version} -F ./documentation/breaking-changes.md`)
$('git push')
$('git push --tags')
$('npm publish')
