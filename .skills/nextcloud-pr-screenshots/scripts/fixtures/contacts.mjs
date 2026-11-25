/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Replace the default address book's contacts and hide the system "Accounts" address book

import { people } from '../lib/data.mjs'

export default async function({ env, auth, dav, davList, pool }, set) {
	const home = `/addressbooks/users/${env.user.id}/`
	const book = `${home}contacts/`
	const books = await davList(env, auth, home)
	await pool(await davList(env, auth, book), (card) => dav(env, auth, 'DELETE', card))
	await pool(people(set), (p) => dav(env, auth, 'PUT', `${book}${p.uid}.vcf`, [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`UID:${p.uid}`,
		`FN:${p.first} ${p.last}`,
		`N:${p.last};${p.first};;;`,
		p.org && `ORG:${p.org}`,
		p.email && `EMAIL;TYPE=WORK:${p.email}`,
		p.tel && `TEL;TYPE=CELL:${p.tel}`,
		'END:VCARD',
	].filter(Boolean).join('\r\n'), { 'Content-Type': 'text/vcard' }))

	const system = books.find((b) => b.includes('z-server-generated--system'))
	if (system) {
		await dav(env, auth, 'PROPPATCH', system, '<d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:set><d:prop><oc:enabled>0</oc:enabled></d:prop></d:set></d:propertyupdate>')
	}
}
