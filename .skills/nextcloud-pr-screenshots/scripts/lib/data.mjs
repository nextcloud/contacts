/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Neutral, deterministic sample data shared by the fixtures. No real people, only example.* domains.

const FIRST = ['Alex', 'Blake', 'Casey', 'Dana', 'Emery', 'Finley', 'Harper', 'Jordan', 'Kai', 'Morgan', 'Quinn', 'Riley', 'Sasha', 'Taylor']
const LAST = ['Morgan', 'Rivera', 'Lee', 'Kim', 'Chen', 'Park', 'Novak', 'Silva', 'Okafor', 'Haddad', 'Larsen', 'Ito', 'Moreau', 'Weber']
const ORGS = ['Acme Corp', 'Bluefield Labs', 'Harbor & Co', 'Lumen Works', 'Northpeak Logistics', 'Example GmbH']
const LONG_FIRST = ['Maximilian-Alexander', 'Anna-Katharina', 'Friedrich-Wilhelm']
const LONG_LAST = ['Schwarzenberger-Hohenlohe', 'Oberkirchenrätin-Müller', 'Donaudampfschifffahrt']
const LONG_ORG = 'Bundesanstalt für Verkehrsinfrastrukturplanung und Straßenbaumanagement GmbH'

/**
 * Sizes of each set: empty, some (a handful), many (enough to scroll), long (long strings)
 */
export const SET_SIZES = { empty: 0, some: 6, many: 60, long: 6 }

/**
 * Build `count` people. Each one has a different mix of fields, so lists show varied content.
 *
 * @param {'empty'|'some'|'many'|'long'} set which set to build
 */
export function people(set = 'some') {
	const count = SET_SIZES[set] ?? SET_SIZES.some
	return Array.from({ length: count }, (_, i) => {
		const long = set === 'long'
		const first = long ? LONG_FIRST[i % LONG_FIRST.length] : FIRST[i % FIRST.length]
		const last = long ? LONG_LAST[i % LONG_LAST.length] : LAST[(i + Math.floor(i / FIRST.length)) % LAST.length]
		const slug = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '')
		const n = String(i + 1).padStart(2, '0')
		return {
			uid: `shots-${set}-${n}`,
			name: `${first} ${last}`,
			first,
			last,
			// rotate which fields are present: org+email+tel, email+tel, org+tel, tel, org+email, email
			org: [0, 2, 4].includes(i % 6) ? (long ? LONG_ORG : ORGS[i % ORGS.length]) : undefined,
			email: [0, 1, 4, 5].includes(i % 6) ? `${slug}@example.${['com', 'org', 'net'][i % 3]}` : undefined,
			tel: [0, 1, 2, 3].includes(i % 6) ? (long ? `+49 30 1234567${n}-999` : `+1 555 01${n}`) : undefined,
		}
	})
}
