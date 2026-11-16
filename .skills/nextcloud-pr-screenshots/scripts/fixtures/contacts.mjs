/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Contacts: replace the user's default address book with neutral contacts and hide the
// system "Accounts" address book, so only the seeded contacts are listed.

import { people } from '../lib/data.mjs'

export default async function contacts({ env, auth, dav, davList, pool }, set) {
	const home = `/addressbooks/users/${env.user.id}/`
	// A PROPFIND on the home creates the default address book if it doesn't exist yet
	const books = await davList(env, auth, home)
	const book = `${home}contacts/`
	if (!books.includes(book)) {
		throw new Error(`Default address book ${book} not found (have: ${books.join(', ')})`)
	}

	await pool(await davList(env, auth, book), (card) => dav(env, auth, 'DELETE', card))

	await pool(people(set), async (p) => {
		const lines = ['BEGIN:VCARD', 'VERSION:3.0', `UID:${p.uid}`, `FN:${p.name}`, `N:${p.last};${p.first};;;`]
		if (p.org) { lines.push(`ORG:${p.org}`) }
		if (p.email) { lines.push(`EMAIL;TYPE=WORK:${p.email}`) }
		if (p.tel) { lines.push(`TEL;TYPE=CELL:${p.tel}`) }
		lines.push('END:VCARD')
		const { status } = await dav(env, auth, 'PUT', `${book}${p.uid}.vcf`, lines.join('\r\n') + '\r\n', { 'Content-Type': 'text/vcard' })
		if (status >= 300) {
			throw new Error(`Creating contact ${p.name} failed (HTTP ${status})`)
		}
	})

	const system = books.find((b) => b.includes('z-server-generated--system'))
	if (system) {
		await dav(
			env,
			auth,
			'PROPPATCH',
			system,
			`<?xml version="1.0"?>
<d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:set><d:prop><oc:enabled>0</oc:enabled></d:prop></d:set></d:propertyupdate>`,
			{ 'Content-Type': 'application/xml' },
		)
	}
}
