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

const copyNtoFN = ({ contact, updateContact }) => () => {
	if (contact.vCard.hasProperty('n')) {
		// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
		// -> John Stevenson
		const n = contact.vCard.getFirstPropertyValue('n')
		contact.fullName = n.slice(0, 2).reverse().join(' ')
		updateContact()
	}
}

const properties = component => ({
	nickname: {
		readableName: t('contacts', 'Nickname'),
		icon: 'icon-user'
	},
	n: {
		readableName: t('contacts', 'Detailed name'),
		readableValues: [
			t('contacts', 'Last name'),
			t('contacts', 'First name'),
			t('contacts', 'Additional names'),
			t('contacts', 'Prefix'),
			t('contacts', 'Suffix')
		],
		displayOrder: [3, 1, 2, 0, 4],
		defaultValue: {
			value: ['', '', '', '', '']
		},
		icon: 'icon-user',
		actions: [
			{
				text: t('contacts', 'Copy to full name'),
				icon: 'icon-up',
				action: copyNtoFN(component)
			}
		]
	},
	note: {
		readableName: t('contacts', 'Notes'),
		icon: 'icon-rename'
	},
	url: {
		multiple: true,
		readableName: t('contacts', 'Website'),
		icon: 'icon-public'
	},
	cloud: {
		multiple: true,
		icon: 'icon-public',
		readableName: t('contacts', 'Federated Cloud ID'),
		force: 'text',
		defaultValue: {
			value: [''],
			type: ['HOME']
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') }
		]
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
			t('contacts', 'Country')
		],
		displayOrder: [0, 2, 1, 5, 3, 4, 6],
		icon: 'icon-address',
		default: true,
		defaultValue: {
			value: ['', '', '', '', '', '', ''],
			type: ['HOME']
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') }
		]
	},
	bday: {
		readableName: t('contacts', 'Birthday'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date())
		}
	},
	anniversary: {
		readableName: t('contacts', 'Anniversary'),
		info: t('contacts', 'The date of marriage, or equivalent, of this contact'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date())
		}
	},
	deathdate: {
		readableName: t('contacts', 'Date of death'),
		icon: 'icon-calendar-dark',
		force: 'date', // most ppl prefer date for birthdays, time is usually irrelevant
		defaultValue: {
			value: new VCardTime(null, null, 'date').fromJSDate(new Date())
		}
	},
	email: {
		multiple: true,
		readableName: t('contacts', 'Email'),
		icon: 'icon-mail',
		default: true,
		defaultValue: {
			value: '',
			type: ['HOME']
		},
		options: [
			{ id: 'HOME', name: t('contacts', 'Home') },
			{ id: 'WORK', name: t('contacts', 'Work') },
			{ id: 'OTHER', name: t('contacts', 'Other') }
		]
	},
	impp: {
		multiple: true,
		readableName: t('contacts', 'Instant messaging'),
		icon: 'icon-comment',
		defaultValue: {
			value: [''],
			type: ['SKYPE']
		},
		options: [
			{ id: 'IRC', name: 'IRC' },
			{ id: 'KIK', name: 'KiK' },
			{ id: 'SKYPE', name: 'Skype' },
			{ id: 'TELEGRAM', name: 'Telegram' },
			{ id: 'XMPP', name: 'XMPP' }
		]
	},
	tel: {
		multiple: true,
		readableName: t('contacts', 'Phone'),
		icon: 'icon-phone',
		default: true,
		defaultValue: {
			value: '',
			type: ['HOME', 'VOICE']
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
			{ id: 'WORK,PAGER', name: t('contacts', 'Work pager') }
		]
	},
	'x-socialprofile': {
		multiple: true,
		force: 'text',
		icon: 'icon-social',
		readableName: t('contacts', 'Social network'),
		defaultValue: {
			value: '',
			type: ['facebook']
		},
		info: t(
			'contacts',
			'The url of the profile. e.g. https://www.facebook.com/Nextclouders/ '
		),
		options: [
			{ id: 'FACEBOOK', name: 'Facebook' },
			{ id: 'GITHUB', name: 'GitHub' },
			{ id: 'GOOGLEPLUS', name: 'Google+' },
			{ id: 'INSTAGRAM', name: 'Instagram' },
			{ id: 'LINKEDIN', name: 'LinkedIn' },
			{ id: 'PINTEREST', name: 'Pinterest' },
			{ id: 'QZONE', name: 'QZone' },
			{ id: 'TUMBLR', name: 'Tumblr' },
			{ id: 'TWITTER', name: 'Twitter' },
			{ id: 'WECHAT', name: 'WeChat' },
			{ id: 'YOUTUBE', name: 'YouTube' },
			{ id: 'MASTODON', name: 'Mastodon' },
			{ id: 'DIASPORA', name: 'Diaspora' },
			{ id: 'OTHER', name: 'other Social Media' }
		]
	},
	relationship: {
		readableName: t('contacts', 'Relationship'),
		force: 'select',
		icon: 'icon-group',
		info: t(
			'contacts',
			'Specify a relationship between you and the entity represented by this vCard.'
		),
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
			{ id: 'ASSISTANT', name: t('contacts', 'Assistant') }
		]
	},
	related: {
		multiple: true,
		readableName: t('contacts', 'Related'),
		icon: 'icon-group',
		info: t(
			'contacts',
			'Specify a relationship between another entity and the entity represented by this vCard.'
		),
		defaultValue: {
			value: [''],
			type: ['CONTACT']
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
			{ id: 'RELATIVE', name: t('contacts', 'Relative') }
		]
	},
	gender: {
		readableName: t('contacts', 'Gender'),
		defaultValue: {
			// default to Female 🙋
			value: 'F'
		},
		force: 'select',
		options: [
			{ id: 'F', name: t('contacts', 'Female') },
			{ id: 'M', name: t('contacts', 'Male') },
			{ id: 'O', name: t('contacts', 'Other') },
			{ id: 'N', name: t('contacts', 'None') },
			{ id: 'U', name: t('contacts', 'Unknown') }
		]
	}
})

const fieldOrder = [
	'org',
	'title',
	'tel',
	'email',
	'adr',
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
	'gender'
]

export default { properties, fieldOrder }
