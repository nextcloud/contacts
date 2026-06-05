<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContentList class="content-list">
		<div class="contacts-list__header">
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search invites …')">
			</div>
		</div>
		<VList
			v-slot="{ item }"
			ref="scroller"
			class="contacts-list"
			:data="filteredList">
			<OcmInvitesListItem
				:source="item" />
		</VList>
	</AppContentList>
</template>

<script>
import { NcAppContentList as AppContentList } from '@nextcloud/vue'
import { VList } from 'virtua/vue'
import OcmInvitesListItem from './OcmInvitesListItem.vue'
import { getOcmInviteSearchData } from '../../models/ocminvite.ts'

const _default = {
	name: 'OcmInvitesList',

	components: {
		AppContentList,
		OcmInvitesListItem,
		VList,
	},

	props: {
		list: {
			type: Array,
			required: true,
		},
		invites: {
			type: Object,
			required: true,
		},
		searchQuery: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			query: '',
		}
	},

	computed: {
		selectedInvite() {
			return this.$route.params.selectedInvite
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		filteredList() {
			let invitesList = this.list
				.filter((item) => this.matchSearch(this.invites[item.key]))
				.map((item) => this.invites[item.key])

			invitesList = invitesList.filter((item) => item !== undefined)
			return invitesList
		},
	},

	watch: {
		selectedInvite(key) {
			this.$nextTick(() => {
				this.scrollToInvite(key)
			})
		},
		list(val, old) {
			// we just loaded the list and the url already have a selected contact
			// if not, the selectedInvite watcher will take over
			// to select the first entry
			if (val.length !== 0 && old.length === 0 && this.selectedInvite) {
				this.$nextTick(() => {
					this.scrollToInvite(this.selectedInvite)
				})
			}
		},
	},

	mounted() {
		this.query = this.searchQuery
	},

	methods: {
		/**
		 * Scroll to the desired contact if in the list and not visible
		 *
		 * @param {string} key the contact unique key
		 */
		scrollToInvite(key) {
			const index = this.filteredList.findIndex((invite) => invite.key === key)
			if (index < 0) {
				return
			}

			const item = this.$el.querySelector(`#invite-${key}`)
			if (!item) {
				this.$refs.scroller?.scrollToIndex(index)
				return
			}

			const itemRect = item.getBoundingClientRect()
			const listRect = this.$el.getBoundingClientRect()
			const isAbove = itemRect.top < listRect.top + 50 // account for list header
			const isBelow = itemRect.bottom > listRect.bottom
			if (isAbove || isBelow) {
				this.$refs.scroller?.scrollToIndex(index)
			}
		},

		/**
		 * Is this matching the current search ?
		 *
		 * @param {OcmInvite} invite the invite to search
		 * @return {boolean}
		 */
		matchSearch(invite) {
			if (this.query.trim() !== '') {
				return getOcmInviteSearchData(invite).toLowerCase().includes(this.query.trim().toLowerCase())
			}
			return true
		},
	},
}
export default _default

</script>

<style lang="scss" scoped>
// Make virtual scroller scrollable
.contacts-list {
	flex: 1 auto;
}

// Add empty header to contacts-list that solves overlapping of contacts with app-navigation-toogle
.contacts-list__header {
	min-height: calc(var(--default-grid-baseline) * 12)
}

// Search field
.search-contacts-field {
	padding: var(--default-grid-baseline) calc(var(--default-grid-baseline) * 2) var(--default-grid-baseline) calc(var(--default-grid-baseline) * 12);

	> input {
		width: 100%;
	}
}

.content-list {
	overflow-y: auto;
	padding: 0 var(--default-grid-baseline);
}

</style>
