<!--
  - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<AppContent :aria-label="t('contacts', 'Organization chart')">
		<EmptyContent v-if="loading" :name="t('contacts', 'Loading contacts …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
		<OrgChart v-else :data="transformData" />
	</AppContent>
</template>

<script>
import {
	NcAppContent as AppContent,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'
import OrgChart from '../OrgChart.vue'
import logger from '../../services/logger.js'
import { getChart, transformNode } from '../../utils/chartUtils.js'

export default {
	name: 'ChartContent',
	components: {
		AppContent,
		EmptyContent,
		IconLoading,
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
			loading: false,
		}
	},

	computed: {
		transformData() {
			const contactsByUid = {}
			const contacts = Object.keys(this.contactsList).map((key) => {
				const [uid, addressbook] = Buffer.from(key, 'base64').toString('utf-8').split('~')
				if (!contactsByUid[addressbook]) {
					contactsByUid[addressbook] = {}
				}
				return (contactsByUid[addressbook][uid] = this.contactsList[key])
			})

			const headManagers = []
			const tempContacts = contacts.filter((contact) => contact.managersName).reduce((prev, contact) => {
				prev.push(transformNode(contact))

				const manager = contactsByUid[contact.addressbook.id][contact.managersName]
				if (manager && !manager.managersName && !headManagers.some((m) => m.nodeId === manager.uid)) {
					prev.push(transformNode(manager))
					headManagers.push(transformNode(manager))
				}
				return prev
			}, [])

			const charts = headManagers.map((managerNode) => getChart(tempContacts, managerNode))
			// Debugging logs to figure out why a graph might not show. Leave this in place until the logic is bulletproof
			logger.debug('Org charts', {
				charts: charts.map((nodes, index) => nodes.map((n) => `list ${index} ${n.nodeId} (${n.fullName}) -> ${n.parentNodeId}`)),
			})
			return charts
		},

		hasMoreContacts() {
			return this.$store.getters.hasMoreContacts
		},
	},

	watch: {
		// the chart needs every contact, not only the loaded pages
		hasMoreContacts: {
			handler(hasMoreContacts) {
				if (hasMoreContacts) {
					this.loadAllContacts()
				}
			},

			immediate: true,
		},
	},

	methods: {
		async loadAllContacts() {
			if (this.loading) {
				return
			}

			this.loading = true
			try {
				await this.$store.dispatch('loadAllContacts')
			} catch (error) {
				logger.error('Unable to load all contacts for the organization chart', { error })
			} finally {
				this.loading = false
			}
		},
	},
}
</script>
