<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="batch">
		<div class="merging__title">
			<h3>{{ t('contacts', 'Add contacts to group') }}</h3>
		</div>

		<span>{{ t('contacts', 'Selected contacts') }}</span>

		<div class="contacts-list">
			<div v-for="(contact, index) in contacts" :key="contact.key" class="contact-item">
				<ContactsListItem :key="contact.key"
					:index="index"
					:source="contact"
					:reload-bus="reloadBus"
					:is-static="true" />
			</div>
		</div>
	</div>
</template>

<script>
import ContactsListItem from './ContactsListItem.vue'

export default {
	name: 'Batch',

	components: {
		ContactsListItem,
	},

	props: {
		contacts: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			reloadBus: null,
		}
	},

	computed: {

	},

	mounted() {

	},

	methods: {

	},
}
</script>

<style lang="scss" scoped>

</style>
