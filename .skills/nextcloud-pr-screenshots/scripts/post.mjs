#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Put the composite image and notes into the PR description (replacing an earlier screenshots
// block) or into a new comment. Needs gh ≥ 2.99 and push access to the repo.
// Usage: node post.mjs --pr <n> --image <png> --notes <file> [--repo owner/name]
//                      [--to description|comment] [--footer text] [--dry-run]

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from './lib/env.mjs'

const args = parseArgs(process.argv.slice(2))
if (![args.pr, args.image, args.notes].every((a) => typeof a === 'string')) {
	console.error('Usage: node post.mjs --pr <n> --image <png> --notes <file> [--repo owner/name] [--to description|comment] [--footer text] [--dry-run]')
	process.exit(2)
}
const START = '<!-- screenshots:start -->'
const END = '<!-- screenshots:end -->'
const image = path.resolve(args.image)
const name = path.basename(image)
const gh = (a, cwd) => execFileSync('gh', a, { encoding: 'utf8', cwd }).trim()
// gh runs next to the image so `--attach ./name` matches the reference in the body; so the repo
// has to be passed explicitly
const repo = typeof args.repo === 'string' ? args.repo : gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])

const block = `${START}
<details>
<summary>📸 Screenshots — <code>${name.replace(/^screenshots-|\.png$/g, '')}</code></summary>

![Screenshots of the change](./${name})

${fs.readFileSync(args.notes, 'utf8').trim()}
</details>
${END}`

let body
if (args.to === 'comment') {
	body = typeof args.footer === 'string' ? `${block}\n\n${args.footer}` : block
} else {
	const current = gh(['pr', 'view', args.pr, '--repo', repo, '--json', 'body', '-q', '.body'])
	const [start, end] = [current.indexOf(START), current.indexOf(END)]
	body = start !== -1 && end > start ? current.slice(0, start) + block + current.slice(end + END.length) : `${current.trimEnd()}\n\n${block}`
}
if (args['dry-run']) {
	console.log(body)
	process.exit(0)
}

const bodyFile = path.join(path.dirname(image), 'body.md')
fs.writeFileSync(bodyFile, body)
const command = args.to === 'comment' ? ['pr', 'comment'] : ['pr', 'edit']
console.log(gh([...command, args.pr, '--repo', repo, '--body-file', bodyFile, '--attach', `./${name}`], path.dirname(image)) || `Updated the description of ${repo}#${args.pr}`)
