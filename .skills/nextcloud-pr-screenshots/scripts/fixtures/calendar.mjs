/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Replace the events of the "personal" calendar with events in the current week
// (or the week of NC_SHOTS_DATE, to match a fixed clock)

import { LONG_TEXT, SIZES } from '../lib/data.mjs'

const TITLES = ['Team sync', 'Design review', 'Lunch', '1:1', 'Planning', 'Release prep', 'Workshop', 'Focus time']
const stamp = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')

export default async function({ env, auth, dav, davList, pool }, set) {
	const cal = `/calendars/${env.user.id}/personal/`
	await pool((await davList(env, auth, cal)).filter((h) => h.endsWith('.ics')), (ev) => dav(env, auth, 'DELETE', ev))

	const day = new Date(process.env.NC_SHOTS_DATE ?? Date.now())
	const monday = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() - (day.getUTCDay() + 6) % 7, 9)
	await pool(Array.from({ length: SIZES[set] ?? SIZES.some }, (_, i) => i), (i) => {
		const start = new Date(monday + (i % 5) * 86400000 + (Math.floor(i / 5) % 8) * 3600000)
		return dav(env, auth, 'PUT', `${cal}shots-${i}.ics`, [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//nc-pr-shots//EN',
			'BEGIN:VEVENT',
			`UID:shots-${i}`,
			`DTSTAMP:${stamp(start)}`,
			`DTSTART:${stamp(start)}`,
			`DTEND:${stamp(new Date(start.getTime() + 3600000))}`,
			`SUMMARY:${set === 'long' ? LONG_TEXT : TITLES[i % TITLES.length]}`,
			'END:VEVENT',
			'END:VCALENDAR',
		].join('\r\n'), { 'Content-Type': 'text/calendar' })
	})
}
