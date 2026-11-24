/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import ICAL from 'ical.js'
import { readRev, writeRev } from '../../../src/utils/rev.js'

function vCard(version, rev) {
	const lines = ['BEGIN:VCARD', `VERSION:${version}`, 'FN:Test contact']
	if (rev !== undefined) {
		lines.push(rev)
	}
	lines.push('END:VCARD')
	return new ICAL.Component(ICAL.parse(lines.join('\r\n')))
}

function revLine(component) {
	return component.toString().split('\r\n').find((line) => line.startsWith('REV'))
}

describe('readRev', () => {
	test.each([
		['3.0', 'REV:20260717T092800Z', '2026-07-17T09:28:00.000Z'],
		['3.0', 'REV:2026-07-17T09:28:00Z', '2026-07-17T09:28:00.000Z'],
		['3.0', 'REV:20260717T0928Z', '2026-07-17T09:28:00.000Z'],
		['3.0', 'REV:2026-07-17T11:28:00+02:00', '2026-07-17T09:28:00.000Z'],
		['3.0', 'REV:2026-07-17', '2026-07-17T00:00:00.000Z'],
		['4.0', 'REV:20260717T092800Z', '2026-07-17T09:28:00.000Z'],
	])('reads a vCard %s %s', (version, rev, expected) => {
		const time = readRev(vCard(version, rev))

		expect(new Date(time.toUnixTime() * 1000).toISOString()).toBe(expected)
	})

	test.each([
		['3.0', 'REV:2026-08-04T10::24Z'],
		['3.0', 'REV:2026-07-17T09::::28Z'],
		['3.0', 'REV:2026-07-17T09:28Z'],
		['3.0', 'REV:not-a-date'],
		['3.0', 'REV:'],
		['4.0', 'REV:2026-08-04T10::24Z'],
		['4.0', 'REV:2026-07-17T09:28:00Z'],
		['4.0', 'REV;VALUE=TEXT:garbage'],
		['4.0', 'REV:'],
	])('returns null for a vCard %s %s', (version, rev) => {
		expect(readRev(vCard(version, rev))).toBeNull()
	})

	test('returns null without a REV', () => {
		expect(readRev(vCard('4.0'))).toBeNull()
	})
})

describe('writeRev', () => {
	const date = new Date('2026-11-05T12:34:56.789Z')

	test.each(['3.0', '4.0'])('writes a vCard %s timestamp with seconds and no value type', (version) => {
		const component = vCard(version)

		writeRev(component, date)

		expect(revLine(component)).toBe('REV:20261105T123456Z')
	})

	test.each([
		['3.0', 'REV:2026-08-04T10::24Z'],
		['3.0', 'REV;VALUE=DATE:20260717'],
		['4.0', 'REV;VALUE=TEXT:garbage'],
	])('replaces a vCard %s %s', (version, rev) => {
		const component = vCard(version, rev)

		writeRev(component, date)

		expect(component.getAllProperties('rev')).toHaveLength(1)
		expect(revLine(component)).toBe('REV:20261105T123456Z')
		expect(readRev(component).toUnixTime()).toBe(Math.floor(date.getTime() / 1000))
	})

	// decoding the written value again must not alter it,
	// otherwise it ends up as "2026-11-05T12::34Z" in other clients
	test('writes a vCard 3.0 value that survives being decoded twice', () => {
		const component = vCard('3.0')
		const design = ICAL.design.vcard3.value['date-time']

		writeRev(component, date)
		const value = revLine(component).split(':').slice(1).join(':')

		expect(design.fromICAL(design.fromICAL(value))).toBe('2026-11-05T12:34:56Z')
	})
})
