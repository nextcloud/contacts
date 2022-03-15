/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { VCardTime } from 'ical.js'
import { loadState } from '@nextcloud/initial-state'

import ActionCopyNtoFN from '../components/Actions/ActionCopyNtoFN'
import ActionToggleYear from '../components/Actions/ActionToggleYear'
import zones from './zones'

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
	nickname: {
		readableName: t('contacts', 'Nickname'),
		icon: 'icon-user',
	},
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
		icon: 'icon-user',
		actions: [
			ActionCopyNtoFN,
		],
	},
	'x-phonetic-first-name': {
		readableName: t('contacts', 'Phonetic first name'),
		force: 'text',
	},
	'x-phonetic-last-name': {
		readableName: t('contacts', 'Phonetic last name'),
		force: 'text',
	},
	note: {
		readableName: t('contacts', 'Notes'),
		icon: 'icon-rename',
	},
	url: {
		multiple: true,
		readableName: t('contacts', 'Website'),
		icon: 'icon-public',
	},
	geo: {
		multiple: true,
		readableName: t('contacts', 'Location'),
		icon: 'icon-address',
		defaultjCal: {
			'3.0': [{}, 'FLOAT', '90.000;0.000'],
			'4.0': [{}, 'URI', 'geo:90.000,0.000'],
		},
	},
	cloud: {
		multiple: true,
		icon: 'icon-public',
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
	},
	bday: {
		readableName: t('contacts', 'Birthday'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
		actions: [
			ActionToggleYear,
		],
	},
	anniversary: {
		readableName: t('contacts', 'Anniversary'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
	},
	deathdate: {
		readableName: t('contacts', 'Date of death'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date()),
		},
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
	},
	impp: {
		multiple: true,
		readableName: t('contacts', 'Instant messaging'),
		icon: 'icon-comment',
		defaultValue: {
			value: [''],
			type: ['SKYPE'],
		},
		options: [
			{ id: 'IRC', name: 'IRC' },
			{ id: 'KIK', name: 'KiK' },
			{ id: 'SKYPE', name: 'Skype' },
			{ id: 'TELEGRAM', name: 'Telegram' },
			{ id: 'XMPP', name: 'XMPP' },
			{ id: 'SIP', name: 'SIP' },
			{ id: 'QQ', name: 'QQ' },
			{ id: 'WECHAT', name: 'WeChat' },
			{ id: 'LINE', name: 'Line' },
			{ id: 'KAKAOTALK', name: 'KakaoTalk' },
			{ id: 'MATRIX', name: 'Matrix' },
			{ id: 'ZOOM', name: 'Zoom' },
		],
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
			{ id: 'OTHER', name: 'Other social media', placeholder: 'https://example.com/…' },
		],
	},
	relationship: {
		readableName: t('contacts', 'Relationship to you'),
		force: 'select',
		icon: 'icon-group',
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
			{ id: 'MANAGER', name: t('contacts', 'Manager') },
			{ id: 'ASSISTANT', name: t('contacts', 'Assistant') },
		],
	},
	related: {
		multiple: true,
		readableName: t('contacts', 'Related contacts'),
		icon: 'icon-group',
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
			{ id: 'MANAGER', name: t('contacts', 'Manager') },
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
	},
	gender: {
		readableName: t('contacts', 'Gender'),
		defaultValue: {
			// default to Female 🙋
			value: 'F',
		},
		force: 'select',
		options: [
			{ id: 'F', name: t('contacts', 'Female') },
			{ id: 'M', name: t('contacts', 'Male') },
			{ id: 'O', name: t('contacts', 'Other') },
			{ id: 'N', name: t('contacts', 'None') },
			{ id: 'U', name: t('contacts', 'Unknown') },
		],
	},
	tz: {
		readableName: t('contacts', 'Time zone'),
		force: 'select',
		icon: 'icon-timezone',
		options: zones.map(zone => ({
			id: zone,
			name: zone,
		})),
	},
	lang: {
		readableName: t('contacts', 'Spoken languages'),
		icon: 'icon-language',
		defaultValue: {
			value: 'en',
		},
		multiple: true,
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
	'org',
	'title',
	'x-phonetic-first-name',
	'x-phonetic-last-name',
	'tel',
	'email',
	'adr',
	'geo',
	'impp',
	'nick',
	'cloud',
	'bday',
	'anniversary',
	'deathdate',
	'url',
	'X-SOCIALPROFILE',
	'relationship',
	'related',
	'note',
	'categories',
	'role',
	'gender',
]

export default { properties, fieldOrder }
