<template>
	<AppContent>
		<OrgChart :data="transformData" />
	</AppContent>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/AppContent'
import { GROUP_ALL_CONTACTS } from '../../models/constants.ts'

import OrgChart from '../OrgChart.vue'
import { getChart } from '../../utils/chartUtils'

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
			const headManagers = []
			const tempContacts = Object.keys(this.contactsList || {}).filter(key => this.contactsList[key].orgManager && this.contactsList[key].orgManager !== 'HEAD').reduce((prev, cur) => {
				const contact = this.contactsList[cur]
				const orgManager = this.contactsList[contact.orgManager]
				prev.push({
					nodeId: contact.uid,
					parentNodeId: orgManager?.uid,
					fullName: contact.displayName,
					org: contact.org,
					photoUrl: `${contact.url}?photo`,
					title: contact.title,
					link: generateUrl(`apps/contacts/${GROUP_ALL_CONTACTS}/${cur}`),
					expanded: !contact.orgManager,
				})
				if (orgManager && (!orgManager.orgManager || orgManager.orgManager === 'HEAD') && !headManagers.includes(orgManager?.uid)) {
					prev.push({
						nodeId: orgManager.uid,
						parentNodeId: null,
						fullName: orgManager.displayName,
						org: orgManager.org,
						photoUrl: `${orgManager.url}?photo`,
						title: orgManager.title,
						link: generateUrl(`apps/contacts/${GROUP_ALL_CONTACTS}/${cur}`),
						expanded: true,
					})
					headManagers.push(orgManager?.uid)
				}
				return prev
			}, [])

			return headManagers.map(id => getChart(tempContacts, id))
		},
	},
}
</script>
