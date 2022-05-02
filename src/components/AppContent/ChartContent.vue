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
			const tempContacts = Object.keys(this.contactsList || {})
				.reduce((prev, cur) => {
					const contact = this.contactsList[cur]
					if (!contact.orgManager) return prev

					// if (contact.orgManager !== 'HEAD' && !this.contactsList.find(c => contact.orgManager === c.uid)) return prev

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

			return tempContacts.filter(c => !c.parentNodeId || (tempContacts.find(tc => tc.nodeId === c.parentNodeId) && c.nodeId !== c.parentNodeId))
		},
	},
}
</script>
