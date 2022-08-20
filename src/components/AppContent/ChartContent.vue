<template>
	<AppContent>
		<OrgChart :data="transformData" />
	</AppContent>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/AppContent'

import OrgChart from '../OrgChart.vue'
import { getChart, transformNode } from '../../utils/chartUtils'

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
			const tempContacts = Object.keys(this.contactsList || {}).filter(key => this.contactsList[key].managersName).reduce((prev, cur) => {
				const contact = this.contactsList[cur]
				const manager = this.contactsList[contact.managersName]
				prev.push(transformNode(contact))
				if (manager && !manager.managersName && !headManagers.includes(manager?.uid)) {
					prev.push(transformNode(manager))
					headManagers.push(manager?.uid)
				}
				return prev
			}, [])

			return headManagers.map(id => getChart(tempContacts, id))
		},
	},
}
</script>
