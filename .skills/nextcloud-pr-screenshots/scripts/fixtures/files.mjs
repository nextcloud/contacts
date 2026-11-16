/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Files: replace the user's skeleton files with a neutral set of folders and text files

import { SET_SIZES } from '../lib/data.mjs'

const SOME = [
	'Documents/',
	'Photos/',
	'Projects/',
	'Documents/Meeting notes.md',
	'Documents/Budget 2026.csv',
	'Projects/Roadmap.md',
	'Readme.md',
	'Todo.txt',
]

export default async function files({ env, auth, dav, davList, pool }, set) {
	const root = `/files/${env.user.id}/`
	await pool(await davList(env, auth, root), (entry) => dav(env, auth, 'DELETE', entry))

	let paths = []
	if (set === 'some') {
		paths = SOME
	} else if (set === 'many') {
		paths = ['Archive/', ...Array.from({ length: SET_SIZES.many }, (_, i) => `Archive/Report ${String(i + 1).padStart(3, '0')}.md`), ...SOME]
	} else if (set === 'long') {
		paths = ['Projektunterlagen für die Verkehrsinfrastrukturplanung 2026/', 'Projektunterlagen für die Verkehrsinfrastrukturplanung 2026/Zusammenfassung der Abstimmungsergebnisse mit allen Beteiligten.md', 'Donaudampfschifffahrtsgesellschaftskapitänsmütze.txt']
	}

	const create = async (p) => {
		const isDir = p.endsWith('/')
		const { status } = await dav(
			env,
			auth,
			isDir ? 'MKCOL' : 'PUT',
			root + p.split('/').map(encodeURIComponent).join('/'),
			isDir ? undefined : `# ${p.split('/').pop()}\n\nSample content.\n`,
		)
		if (status >= 300 && status !== 405) {
			throw new Error(`Creating ${p} failed (HTTP ${status})`)
		}
	}
	// Folders first, then the files inside them
	await pool(paths.filter((p) => p.endsWith('/')), create)
	await pool(paths.filter((p) => !p.endsWith('/')), create)
}
