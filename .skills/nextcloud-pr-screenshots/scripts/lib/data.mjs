/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// Neutral sample data for fixtures: invented names, example.* domains, 555 numbers

const FIRST = ['Alex', 'Blake', 'Casey', 'Dana', 'Emery', 'Finley', 'Harper', 'Jordan', 'Kai', 'Morgan', 'Quinn', 'Riley']
const LAST = ['Morgan', 'Rivera', 'Lee', 'Kim', 'Chen', 'Park', 'Novak', 'Silva', 'Okafor', 'Haddad', 'Larsen', 'Ito']
const ORGS = ['Acme Corp', 'Bluefield Labs', 'Harbor & Co', 'Lumen Works', 'Northpeak Logistics', 'Example GmbH']
export const LONG_TEXT = 'Bundesanstalt für Verkehrsinfrastrukturplanung und Straßenbaumanagement'

/** Items per fixture set */
export const SIZES = { empty: 0, some: 6, many: 60, long: 6 }

/**
 * People with a rotating mix of organization, email and phone, so lists show varied content
 *
 * @param {'empty'|'some'|'many'|'long'} set fixture set
 */
export function people(set) {
	return Array.from({ length: SIZES[set] ?? SIZES.some }, (_, i) => {
		const first = set === 'long' ? 'Maximilian-Alexander' : FIRST[i % FIRST.length]
		const last = set === 'long' ? 'Schwarzenberger-Hohenlohe' : LAST[(i + Math.floor(i / FIRST.length)) % LAST.length]
		const n = String(i + 1).padStart(2, '0')
		return {
			uid: `shots-${set}-${n}`,
			first,
			last,
			org: i % 2 === 0 ? (set === 'long' ? LONG_TEXT : ORGS[i % ORGS.length]) : undefined,
			email: i % 6 !== 2 && i % 6 !== 3 ? `${first}.${last}${n}@example.com`.toLowerCase() : undefined,
			tel: i % 6 < 4 ? `+1 555 01${n}` : undefined,
		}
	})
}
