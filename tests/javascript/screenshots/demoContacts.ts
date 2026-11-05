/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DemoContact {
	uid: string
	firstName: string
	lastName: string
	org?: string
	title?: string
	email?: string
	phone?: string
	address?: string[]
	birthday?: string
	groups?: string[]
	managerUid?: string
	note?: string
}

const ORG = 'Skyline Studio'

/**
 * Fictional people used to populate the App Store screenshots.
 * The org chart is built from managerUid: one head with two managers and their reports.
 */
export const demoContacts: DemoContact[] = [
	{
		uid: 'demo-amelia-hart',
		firstName: 'Amelia',
		lastName: 'Hart',
		org: ORG,
		title: 'Chief Executive Officer',
		email: 'amelia.hart@skyline.example',
		phone: '+49 30 1234567',
		address: ['', '', 'Friedrichstraße 123', 'Berlin', '', '10117', 'Germany'],
		birthday: '1984-03-14',
		groups: ['Work'],
		note: 'Prefers video calls before 10 am.',
	},
	{ uid: 'demo-noah-fischer', firstName: 'Noah', lastName: 'Fischer', org: ORG, title: 'Head of Engineering', email: 'noah.fischer@skyline.example', phone: '+49 30 1234568', groups: ['Work'], managerUid: 'demo-amelia-hart' },
	{ uid: 'demo-sofia-rossi', firstName: 'Sofia', lastName: 'Rossi', org: ORG, title: 'Head of Design', email: 'sofia.rossi@skyline.example', phone: '+49 30 1234569', groups: ['Work'], managerUid: 'demo-amelia-hart' },
	{ uid: 'demo-liam-novak', firstName: 'Liam', lastName: 'Novak', org: ORG, title: 'Backend Developer', email: 'liam.novak@skyline.example', groups: ['Work'], managerUid: 'demo-noah-fischer' },
	{ uid: 'demo-emma-larsen', firstName: 'Emma', lastName: 'Larsen', org: ORG, title: 'Frontend Developer', email: 'emma.larsen@skyline.example', groups: ['Work'], managerUid: 'demo-noah-fischer' },
	{ uid: 'demo-yuki-tanaka', firstName: 'Yuki', lastName: 'Tanaka', org: ORG, title: 'QA Engineer', email: 'yuki.tanaka@skyline.example', groups: ['Work'], managerUid: 'demo-noah-fischer' },
	{ uid: 'demo-lucas-martin', firstName: 'Lucas', lastName: 'Martin', org: ORG, title: 'Product Designer', email: 'lucas.martin@skyline.example', groups: ['Work'], managerUid: 'demo-sofia-rossi' },
	{ uid: 'demo-chloe-dubois', firstName: 'Chloé', lastName: 'Dubois', org: ORG, title: 'UX Researcher', email: 'chloe.dubois@skyline.example', groups: ['Work'], managerUid: 'demo-sofia-rossi' },
	{ uid: 'demo-ben-carter', firstName: 'Ben', lastName: 'Carter', email: 'ben.carter@mail.example', phone: '+44 20 7946 0958', groups: ['Friends'] },
	{ uid: 'demo-clara-schmidt', firstName: 'Clara', lastName: 'Schmidt', email: 'clara@schmidt.example', phone: '+49 89 4455667', birthday: '1990-07-02', groups: ['Family'] },
	{ uid: 'demo-david-kim', firstName: 'David', lastName: 'Kim', email: 'david.kim@mail.example', groups: ['Friends'] },
	{ uid: 'demo-elena-petrova', firstName: 'Elena', lastName: 'Petrova', email: 'elena.petrova@mail.example', phone: '+33 1 23 45 67 89', groups: ['Friends'] },
	{ uid: 'demo-felix-schmidt', firstName: 'Felix', lastName: 'Schmidt', email: 'felix@schmidt.example', groups: ['Family'] },
	{ uid: 'demo-grace-okafor', firstName: 'Grace', lastName: 'Okafor', org: 'Riverside Clinic', title: 'Dentist', phone: '+49 30 9988776', groups: ['Services'] },
	{ uid: 'demo-hugo-silva', firstName: 'Hugo', lastName: 'Silva', org: 'Silva Plumbing', phone: '+49 30 5566778', groups: ['Services'] },
	{ uid: 'demo-isabel-garcia', firstName: 'Isabel', lastName: 'García', email: 'isabel.garcia@mail.example', groups: ['Friends'] },
	{ uid: 'demo-jonas-berg', firstName: 'Jonas', lastName: 'Berg', email: 'jonas.berg@mail.example', phone: '+46 8 123 456 78', groups: ['Friends'] },
	{ uid: 'demo-maya-schmidt', firstName: 'Maya', lastName: 'Schmidt', email: 'maya@schmidt.example', birthday: '2015-11-23', groups: ['Family'] },
]

/**
 * Escape a vCard text value.
 *
 * @param value The raw value
 */
function escape(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/**
 * Serialize a demo contact as a vCard 3.0 document.
 *
 * @param contact The contact to serialize
 * @param contacts All contacts, used to resolve the manager name
 */
export function toVCard(contact: DemoContact, contacts: DemoContact[] = demoContacts): string {
	const fullName = `${contact.firstName} ${contact.lastName}`
	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		'PRODID:-//Nextcloud Contacts//Screenshots//EN',
		`UID:${contact.uid}`,
		`FN:${escape(fullName)}`,
		`N:${escape(contact.lastName)};${escape(contact.firstName)};;;`,
	]
	if (contact.org) {
		lines.push(`ORG:${escape(contact.org)}`)
	}
	if (contact.title) {
		lines.push(`TITLE:${escape(contact.title)}`)
	}
	if (contact.email) {
		lines.push(`EMAIL;TYPE=WORK:${contact.email}`)
	}
	if (contact.phone) {
		lines.push(`TEL;TYPE=CELL:${contact.phone}`)
	}
	if (contact.address) {
		lines.push(`ADR;TYPE=WORK:${contact.address.map(escape).join(';')}`)
	}
	if (contact.birthday) {
		lines.push(`BDAY:${contact.birthday}`)
	}
	if (contact.groups?.length) {
		lines.push(`CATEGORIES:${contact.groups.map(escape).join(',')}`)
	}
	if (contact.managerUid) {
		const manager = contacts.find((c) => c.uid === contact.managerUid)
		if (!manager) {
			throw new Error(`Unknown manager ${contact.managerUid} for ${contact.uid}`)
		}
		lines.push(`X-MANAGERSNAME;UID=${manager.uid}:${escape(`${manager.firstName} ${manager.lastName}`)}`)
	}
	if (contact.note) {
		lines.push(`NOTE:${escape(contact.note)}`)
	}
	lines.push('END:VCARD')
	return lines.join('\r\n') + '\r\n'
}
