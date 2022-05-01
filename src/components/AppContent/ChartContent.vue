<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<AppContent>
		<OrgChart :data="transformData" />
	</AppContent>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import { GROUP_ALL_CONTACTS } from '../../models/constants.ts'

import OrgChart from '../OrgChart.vue'

import { generateUrl } from '@nextcloud/router'

export default {
	name: 'ChartContent',
	components: {
		AppContent,
		OrgChart,
	},
	props: {
		loading: {
			type: Boolean,
			default: false,
		},

		contactsList: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			data: [],
			searchQuery: '',
		}
	},
	computed: {
		transformData() {
			return Object.keys(this.contactsList || {})
				.reduce((prev, cur) => {
					const contact = this.contactsList[cur]
					if (!contact.orgManager) return prev

					return [...prev, {
						nodeId: contact.uid,
						parentNodeId: contact.orgManager === 'HEAD' ? null : contact.orgManager,
						fullName: contact.displayName,
						photoUrl: `${contact.url}?photo`,
						title: contact.title,
						link: generateUrl(`apps/contacts/${GROUP_ALL_CONTACTS}/${cur}`),
						expanded: contact.orgManager === 'HEAD',
					}]
				}, [])
		},
	},
}
</script>
