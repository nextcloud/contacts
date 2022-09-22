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
				if (manager && !manager.managersName && !headManagers.includes(manager.uid)) {
					prev.push(transformNode(manager))
					headManagers.push(manager.uid)
				}
				return prev
			}, [])

			return headManagers.map(uid => getChart(tempContacts, uid))
		},
	},
}
</script>
