import { loadState } from '@nextcloud/initial-state'
/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import ICAL from 'ical.js'
import ActionCopyNtoFN from '../components/Actions/ActionCopyNtoFN.vue'
import NcActionToggleYear from '../components/Actions/NcActionToggleYear.vue'
import { otherContacts } from '../utils/chartUtils.js'
import zones from './zones.js'

// Load the default profile (for example, home or work) configured by the user
const defaultProfileState = loadState('contacts', 'defaultProfile', 'HOME')
const localesState = loadState('contacts', 'locales', false)
const locales = localesState
	? localesState.map(({ code, name }) => ({
			id: code.toLowerCase().replace('_', '-'),
			name,
		}))
	: []

console.debug('Initial state loaded', 'defaultProfileState', defaultProfileState)
console.debug('Initial state loaded', 'localesState', localesState)

const properties = {
	n: {
		readableName: t('contacts', 'Detailed name'),
		readableValues: [
			t('contacts', 'Last name'),
			t('contacts', 'First name'),
			t('contacts', 'Additional names'),
			t('contacts', 'Prefix'),
			t('contacts', 'Suffix'),
		],
		displayOrder: [3, 1, 2, 0, 4],
		defaultValue: {
			value: ['', '', '', '', ''],
		},
		icon: 'icon-detailed-name',
		actions: [
			ActionCopyNtoFN,
		],
		primary: false,
	},
	nickname: {
		readableName: t('contacts', 'Nickname'),
		icon: 'icon-detailed-name',
		primary: false,
	},
	'x-phonetic-first-name': {
		readableName: t('contacts', 'Phonetic first name'),
		icon: 'icon-detailed-name',
		force: 'text',
		primary: false,
	},
	'x-phonetic-last-name': {
		readableName: t('contacts', 'Phonetic last name'),
		icon: 'icon-detailed-name',
		force: 'text',
		primary: false,
	},
	note: {
		readableName: t('contacts', 'Notes'),
		icon: 'icon-note',
		primary: true,
		default: true,
		defaultValue: {
			value: '',
		},
	},
	url: {
		multiple: true,
		readableName: t('contacts', 'Website'),
		icon: 'icon-public',
		primary: true,
	},
	geo: {
		multiple: true,
		readableName: t('contacts', 'Location'),
		icon: 'icon-location',
		defaultjCal: {
			'3.0': [{}, 'FLOAT', '90.000;0.000'],
			'4.0': [{}, 'URI', 'geo:90.000,0.000'],
		},
		primary: false,
	},
	cloud: {
		multiple: true,
		icon: 'icon-federated-cloud-id',
		readableName: t('contacts', 'Federated Cloud ID'),
		force: 'text',
		defaultValue: {
			value: [''],
			type: [defaultProfileState],
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') },
		],
		primary: false,
	},
	adr: {
		multiple: true,
		readableName: t('contacts', 'Address'),
		readableValues: [
			t('contacts', 'Post office box'),
			t('contacts', 'Extended address'),
			t('contacts', 'Address'),
			t('contacts', 'City'),
			t('contacts', 'State or province'),
			t('contacts', 'Postal code'),
			t('contacts', 'Country'),
		],
		displayOrder: [0, 2, 1, 5, 3, 4, 6],
		icon: 'icon-address',
		default: true,
		defaultValue: {
			value: ['', '', '', '', '', '', ''],
			type: [defaultProfileState],
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') },
		],
		primary: true,
	},
	bday: {
		readableName: t('contacts', 'Birthday'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new ICAL.VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
		actions: [
			NcActionToggleYear,
		],
		primary: true,
	},
	birthplace: {
		readableName: t('contacts', 'Place of birth'),
		icon: 'icon-location',
		force: 'text',
		primary: false,
	},
	anniversary: {
		readableName: t('contacts', 'Anniversary'),
		icon: 'icon-anniversary',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new ICAL.VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
		primary: false,
	},
	deathdate: {
		readableName: t('contacts', 'Date of death'),
		icon: 'icon-death-day',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new ICAL.VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
		primary: false,
	},
	deathplace: {
		readableName: t('contacts', 'Place of death'),
		icon: 'icon-location',
		force: 'text',
		primary: false,
	},
	email: {
		multiple: true,
		readableName: t('contacts', 'Email'),
		icon: 'icon-mail',
		default: true,
		defaultValue: {
			value: '',
			type: [defaultProfileState],
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') },
		],
		primary: true,
	},
	impp: {
		multiple: true,
		readableName: t('contacts', 'Instant messaging'),
		icon: 'icon-instant-message',
		defaultValue: {
			value: [''],
			type: ['SKYPE'],
		},
		options: [
			{ id: 'IRC', name: 'IRC' },
			{ id: 'KAKAOTALK', name: 'KakaoTalk' },
			{ id: 'KIK', name: 'KiK' },
			{ id: 'LINE', name: 'Line' },
			{ id: 'MATRIX', name: 'Matrix' },
			{ id: 'QQ', name: 'QQ' },
			{ id: 'SIGNAL', name: 'Signal' },
			{ id: 'SIP', name: 'SIP' },
			{ id: 'SKYPE', name: 'Skype' },
			{ id: 'TELEGRAM', name: 'Telegram' },
			{ id: 'THREEMA', name: 'Threema' },
			{ id: 'WECHAT', name: 'WeChat' },
			{ id: 'XMPP', name: 'XMPP' },
			{ id: 'ZOOM', name: 'Zoom' },
		],
		primary: false,
	},
	tel: {
		multiple: true,
		readableName: t('contacts', 'Phone'),
		icon: 'icon-phone',
		default: true,
		defaultValue: {
			value: '',
			type: [defaultProfileState, 'VOICE'],
		},
		options: [
			{ id: 'HOME,VOICE', name: t('contacts', 'Home') },
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK,VOICE', name: t('contacts', 'Work') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'CELL', name: t('contacts', 'Mobile') },
			{ id: 'CELL,VOICE', name: t('contacts', 'Mobile') },
			{ id: 'WORK,CELL', name: t('contacts', 'Work mobile') },
			{ id: 'HOME,CELL', name: t('contacts', 'Home mobile') },
			{ id: 'FAX', name: t('contacts', 'Fax') },
			{ id: 'HOME,FAX', name: t('contacts', 'Fax home') },
			{ id: 'WORK,FAX', name: t('contacts', 'Fax work') },
			{ id: 'PAGER', name: t('contacts', 'Pager') },
			{ id: 'VOICE', name: t('contacts', 'Voice') },
			{ id: 'CAR', name: t('contacts', 'Car') },
			{ id: 'WORK,PAGER', name: t('contacts', 'Work pager') },
		],
		primary: true,
	},
	'x-managersname': {
		multiple: false,
		force: 'select',
		// TRANSLATORS The supervisor of an employee
		readableName: t('contacts', 'Line manager'),
		icon: 'icon-manager',
		default: false,
		options({ contact, $store, selectType }) {
			// Only allow contacts of the same address book
			const contacts = otherContacts({
				$store,
				self: contact,
			})

			// Reduce to an object to eliminate duplicates
			return Object.values(contacts.reduce((prev, { key }) => {
				const contact = $store.getters.getContact(key)
				return {
					...prev,
					[contact.uid]: {
						id: contact.key,
						name: contact.displayName,
					},
				}
			}, selectType ? { [selectType.value]: selectType } : {}))
		},
		primary: true,
	},
	'x-socialprofile': {
		multiple: true,
		force: 'text',
		icon: 'icon-social',
		readableName: t('contacts', 'Social network'),
		defaultValue: {
			value: '',
			type: ['facebook'],
		},
		options: [
			{ id: 'FACEBOOK', name: 'Facebook', placeholder: 'https://facebook.com/…' },
			{ id: 'GITHUB', name: 'GitHub', placeholder: 'https://github.com/…' },
			{ id: 'GOOGLEPLUS', name: 'Google+', placeholder: 'https://plus.google.com/…' },
			{ id: 'INSTAGRAM', name: 'Instagram', placeholder: 'https://instagram.com/…' },
			{ id: 'LINKEDIN', name: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
			{ id: 'XING', name: 'Xing', placeholder: 'https://www.xing.com/profile/…' },
			{ id: 'PINTEREST', name: 'Pinterest', placeholder: 'https://pinterest.com/…' },
			{ id: 'QZONE', name: 'QZone', placeholder: 'https://qzone.com/…' },
			{ id: 'TUMBLR', name: 'Tumblr', placeholder: 'https://tumblr.com/…' },
			{ id: 'TWITTER', name: 'Twitter', placeholder: 'https://twitter.com/…' },
			{ id: 'WECHAT', name: 'WeChat', placeholder: 'https://wechat.com/…' },
			{ id: 'YOUTUBE', name: 'YouTube', placeholder: 'https://youtube.com/…' },
			{ id: 'MASTODON', name: 'Mastodon', placeholder: 'https://mastodon.social/…' },
			{ id: 'DIASPORA', name: 'Diaspora', placeholder: 'https://joindiaspora.com/…' },
			{ id: 'NEXTCLOUD', name: 'Nextcloud', placeholder: 'Link to profile page (https://nextcloud.example.com/…)' },
			{ id: 'OTHER', name: 'Other', placeholder: 'https://example.com/…' },
		],
		primary: true,
	},
	relationship: {
		readableName: t('contacts', 'Relationship to you'),
		force: 'select',
		icon: 'icon-relation-to-you',
		options: [
			{ id: 'SPOUSE', name: t('contacts', 'Spouse') },
			{ id: 'CHILD', name: t('contacts', 'Child') },
			{ id: 'MOTHER', name: t('contacts', 'Mother') },
			{ id: 'FATHER', name: t('contacts', 'Father') },
			{ id: 'PARENT', name: t('contacts', 'Parent') },
			{ id: 'BROTHER', name: t('contacts', 'Brother') },
			{ id: 'SISTER', name: t('contacts', 'Sister') },
			{ id: 'RELATIVE', name: t('contacts', 'Relative') },
			{ id: 'FRIEND', name: t('contacts', 'Friend') },
			{ id: 'COLLEAGUE', name: t('contacts', 'Colleague') },
			// TRANSLATORS The supervisor of an employee
			{ id: 'MANAGER', name: t('contacts', 'Line manager') },
			{ id: 'ASSISTANT', name: t('contacts', 'Assistant') },
		],
		primary: false,
	},
	related: {
		multiple: true,
		readableName: t('contacts', 'Related contacts'),
		icon: 'icon-related-contact',
		defaultValue: {
			value: [''],
			type: ['CONTACT'],
		},
		options: [
			{ id: 'CONTACT', name: t('contacts', 'Contact') },
			{ id: 'AGENT', name: t('contacts', 'Agent') },
			{ id: 'EMERGENCY', name: t('contacts', 'Emergency') },
			{ id: 'FRIEND', name: t('contacts', 'Friend') },
			{ id: 'COLLEAGUE', name: t('contacts', 'Colleague') },
			{ id: 'COWORKER', name: t('contacts', 'Co-worker') },
			// TRANSLATORS The supervisor of an employee
			{ id: 'MANAGER', name: t('contacts', 'Line manager') },
			{ id: 'ASSISTANT', name: t('contacts', 'Assistant') },
			{ id: 'SPOUSE', name: t('contacts', 'Spouse') },
			{ id: 'CHILD', name: t('contacts', 'Child') },
			{ id: 'MOTHER', name: t('contacts', 'Mother') },
			{ id: 'FATHER', name: t('contacts', 'Father') },
			{ id: 'PARENT', name: t('contacts', 'Parent') },
			{ id: 'BROTHER', name: t('contacts', 'Brother') },
			{ id: 'SISTER', name: t('contacts', 'Sister') },
			{ id: 'RELATIVE', name: t('contacts', 'Relative') },
		],
		primary: false,
	},
	gender: {
		readableName: t('contacts', 'Gender'),
		defaultValue: {
			// default to Female 🙋
			value: 'F',
		},
		icon: 'icon-gender',
		force: 'select',
		options: [
			{ id: 'F', name: t('contacts', 'Female') },
			{ id: 'M', name: t('contacts', 'Male') },
			{ id: 'O', name: t('contacts', 'Other') },
			{ id: 'N', name: t('contacts', 'None') },
			{ id: 'U', name: t('contacts', 'Unknown') },
		],
		primary: false,
	},
	tz: {
		readableName: t('contacts', 'Time zone'),
		force: 'select',
		icon: 'icon-timezone',
		options: zones.map((zone) => ({
			id: zone,
			name: zone,
		})),
		primary: false,
	},
	lang: {
		readableName: t('contacts', 'Spoken languages'),
		icon: 'icon-spoken-lang',
		defaultValue: {
			value: 'en',
		},
		multiple: true,
		primary: false,
	},
}

if (locales.length > 0) {
	properties.lang.force = 'select'
	properties.lang.options = locales
	properties.lang.greedyMatch = function(value, options) {
		// each locale already have the base code (e.g. fr in fr_ca)
		// in the list, meaning the only use case for this is a more
		// complete language tag than the short one we have
		// value: fr-ca-xxx... will be matched with option fr
		return options.find(({ id }) => {
			return id === value.split('-')[0]
		})
	}
}

const fieldOrder = [
	'title',
	'org',

	// primary fields
	'tel',
	'email',
	'adr',
	'bday',
	'url',
	'x-socialprofile',
	'x-managersname',

	// secondary fields
	'birthplace',
	'anniversary',
	'deathdate',
	'deathplace',
	'n',
	'nickname',
	'x-phonetic-first-name',
	'x-phonetic-last-name',
	'gender',
	'cloud',
	'impp',
	'geo',
	'note',
	'lang',
	'related',
	'relationship',
	'tz',

	'categories',
	'role',
]

export default { properties, fieldOrder }
