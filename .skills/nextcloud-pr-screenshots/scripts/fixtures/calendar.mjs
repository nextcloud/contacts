/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Calendar: replace the events in the user's "personal" calendar with neutral events in the
// current week (or the week of NC_SHOTS_DATE, e.g. 2026-03-02, to match a fixed clock)

import { SET_SIZES } from '../lib/data.mjs'

const TITLES = ['Team sync', 'Design review', 'Lunch', '1:1', 'Planning', 'Release prep', 'Workshop', 'Focus time']
const LONG = 'Abstimmungsbesprechung zur Verkehrsinfrastrukturplanung mit allen Projektbeteiligten'

function stamp(d) {
	return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export default async function calendar({ env, auth, dav, davList, pool }, set) {
	const home = `/calendars/${env.user.id}/`
	await davList(env, auth, home)
	const cal = `${home}personal/`
	await pool((await davList(env, auth, cal)).filter((h) => h.endsWith('.ics')), (ev) => dav(env, auth, 'DELETE', ev))

	const base = process.env.NC_SHOTS_DATE ? new Date(process.env.NC_SHOTS_DATE) : new Date()
	const monday = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - ((base.getUTCDay() + 6) % 7), 9))
	const count = set === 'many' ? SET_SIZES.many / 2 : SET_SIZES[set] ?? SET_SIZES.some

	await pool(Array.from({ length: count }, (_, i) => i), async (i) => {
		const start = new Date(monday.getTime() + (i % 5) * 86400000 + (Math.floor(i / 5) % 8) * 3600000)
		const end = new Date(start.getTime() + 3600000)
		const uid = `shots-${set}-${i + 1}`
		const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//nc-pr-shots//EN', 'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp(monday)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${set === 'long' ? LONG : TITLES[i % TITLES.length]}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
		const { status } = await dav(env, auth, 'PUT', `${cal}${uid}.ics`, ics, { 'Content-Type': 'text/calendar' })
		if (status >= 300) {
			throw new Error(`Creating event ${uid} failed (HTTP ${status})`)
		}
	})
}
