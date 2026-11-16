#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Put the composite image into a PR, inside the <!-- screenshots:start/end --> block.
// Usage: node post.mjs --pr <n> --image <png> --notes <file> [--repo owner/name]
//                      [--to description|comment] [--footer "<sub>…</sub>"] [--dry-run]
//
// --notes   text under the image: the "Captured: …" / "Not captured: …" lines
// --to      description (default): replace the block in the PR body, or append it
//           comment: edit the existing screenshots comment, or post a new one
// --footer  appended after the block when posting a comment (e.g. an AI-assistance line)
// Needs gh ≥ 2.99 (for --attach) and push access to the repo. Without push access, see
// "Hosting the image" in SKILL.md.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from './lib/env.mjs'

const START = '<!-- screenshots:start -->'
const END = '<!-- screenshots:end -->'
const args = parseArgs(process.argv.slice(2))
for (const required of ['pr', 'image', 'notes']) {
	if (typeof args[required] !== 'string') {
		console.error(`Missing --${required}. Usage: node post.mjs --pr <n> --image <png> --notes <file> [--repo owner/name] [--to description|comment] [--footer text] [--dry-run]`)
		process.exit(2)
	}
}
const to = args.to ?? 'description'
const image = path.resolve(args.image)
const imageName = path.basename(image)
const sha = imageName.match(/screenshots-([^.]+)\.png$/)?.[1] ?? ''
const notes = fs.readFileSync(args.notes, 'utf8').trim()
const repoArgs = typeof args.repo === 'string' ? ['--repo', args.repo] : []
const gh = (ghArgs, opts = {}) => execFileSync('gh', ghArgs, { encoding: 'utf8', cwd: path.dirname(image), ...opts }).trim()

const block = `${START}
<details>
<summary>📸 Screenshots${sha ? ` — <code>${sha}</code>` : ''}</summary>

![Screenshots, see the list below](./${imageName})

${notes}
</details>
${END}`

function replaceBlock(text) {
	const start = text.indexOf(START)
	const end = text.indexOf(END)
	if (start !== -1 && end > start) {
		return text.slice(0, start) + block + text.slice(end + END.length)
	}
	return `${text.trimEnd()}\n\n${block}\n`
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nc-pr-shots-'))
const bodyFile = path.join(tmp, 'body.md')
const attach = ['--attach', `./${imageName}#Screenshots of the change`]

if (to === 'description') {
	const body = gh(['pr', 'view', args.pr, ...repoArgs, '--json', 'body', '-q', '.body'])
	fs.writeFileSync(bodyFile, replaceBlock(body))
	if (args['dry-run']) {
		console.log(fs.readFileSync(bodyFile, 'utf8'))
		process.exit(0)
	}
	gh(['pr', 'edit', args.pr, ...repoArgs, '--body-file', bodyFile, ...attach], { stdio: 'inherit' })
	const after = gh(['pr', 'view', args.pr, ...repoArgs, '--json', 'body', '-q', '.body'])
	const url = after.slice(after.indexOf(START)).match(/\((https:\/\/github\.com\/user-attachments\/[^)]+)\)/)?.[1]
	console.log(url ? `Description updated, image at ${url}` : 'Description updated, but no uploaded image URL found in the block — check the PR')
} else if (to === 'comment') {
	const footer = typeof args.footer === 'string' ? `\n\n${args.footer}` : ''
	fs.writeFileSync(bodyFile, block + footer + '\n')
	if (args['dry-run']) {
		console.log(fs.readFileSync(bodyFile, 'utf8'))
		process.exit(0)
	}
	const me = gh(['api', 'user', '-q', '.login'])
	const view = JSON.parse(gh(['pr', 'view', args.pr, ...repoArgs, '--json', 'comments,url']))
	const mine = view.comments.filter((c) => c.author.login === me)
	const existing = mine.filter((c) => c.body.includes(START)).at(-1)
	if (existing && mine.at(-1) === existing) {
		// gh can only attach while editing the user's most recent comment
		gh(['pr', 'comment', args.pr, ...repoArgs, '--edit-last', '--body-file', bodyFile, ...attach], { stdio: 'inherit' })
		console.log(`Screenshots comment updated: ${existing.url}`)
	} else {
		const url = gh(['pr', 'comment', args.pr, ...repoArgs, '--body-file', bodyFile, ...attach])
		console.log(`Screenshots comment posted: ${url}`)
		if (existing) {
			const id = existing.url.match(/issuecomment-(\d+)/)?.[1]
			const [owner, repo] = new URL(view.url).pathname.split('/').slice(1, 3)
			const superseded = existing.body.slice(0, existing.body.indexOf(START))
				+ `<sub>Screenshots replaced by a newer version: ${url}</sub>`
				+ existing.body.slice(existing.body.indexOf(END) + END.length)
			gh(['api', '-X', 'PATCH', `repos/${owner}/${repo}/issues/comments/${id}`, '-f', `body=${superseded}`])
			console.log(`Older screenshots comment now points to the new one: ${existing.url}`)
		}
	}
} else {
	console.error('--to must be "description" or "comment"')
	process.exit(2)
}
