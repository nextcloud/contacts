<template>
	<AppContent>
		<OrgChart :data="transformData" />
	</AppContent>
</template>

<script>
import AppContent from '@nextcloud/vue/dist/Components/NcAppContent'

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
			const contactsByUid = {}
			const contacts = Object.keys(this.contactsList).map(key => {
				const [uid, addressbook] = key.split('~')
				if (!contactsByUid[addressbook]) {
					contactsByUid[addressbook] = {}
				}
				return (contactsByUid[addressbook][uid] = this.contactsList[key])
			})

			const headManagers = []
			const tempContacts = contacts.filter(contact => contact.managersName).reduce((prev, contact) => {
				prev.push(transformNode(contact))

				const manager = contactsByUid[contact.addressbook.id][contact.managersName]
				if (manager && !manager.managersName && !headManagers.some(m => m.nodeId === manager.uid)) {
					prev.push(transformNode(manager))
					headManagers.push(transformNode(manager))
				}
				return prev
			}, [])

			const charts = headManagers.map(managerNode => getChart(tempContacts, managerNode))
			// Debugging logs to figure out why a graph might not show. Leave this in place until the logic is bulletproof
			console.debug('Org charts', charts.map((nodes, index) => nodes.map(n => `list ${index} ${n.nodeId} (${n.fullName}) -> ${n.parentNodeId}`)))
			return charts
		},
	},
}
</script>
