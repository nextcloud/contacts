/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Replace the user's files (including skeleton files) with a few folders and text files

import { LONG_TEXT, SIZES } from '../lib/data.mjs'

const SOME = ['Documents/', 'Photos/', 'Projects/', 'Documents/Meeting notes.md', 'Documents/Budget 2026.csv', 'Projects/Roadmap.md', 'Readme.md', 'Todo.txt']

export default async function({ env, auth, dav, davList, pool }, set) {
	const root = `/files/${env.user.id}/`
	await pool(await davList(env, auth, root), (entry) => dav(env, auth, 'DELETE', entry))

	const paths = {
		some: SOME,
		many: ['Archive/', ...Array.from({ length: SIZES.many }, (_, i) => `Archive/Report ${i + 1}.md`)],
		long: [`${LONG_TEXT}/`, `${LONG_TEXT}/${LONG_TEXT} – Zusammenfassung.md`],
	}[set] ?? []
	const create = (p) => dav(env, auth, p.endsWith('/') ? 'MKCOL' : 'PUT', root + p.split('/').map(encodeURIComponent).join('/'), p.endsWith('/') ? undefined : 'Sample content.\n')
	await pool(paths.filter((p) => p.endsWith('/')), create)
	await pool(paths.filter((p) => !p.endsWith('/')), create)
}
