<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContent v-if="loading">
		<EmptyContent class="empty-content" :name="t('contacts', 'Loading invites …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="isEmptyGroup">
		<EmptyContent class="empty-content" :name="t('contacts', 'There are no invites')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else :show-details="showDetails">
		<!-- invites list -->
		<template #list>
			<OcmInvitesList :list="invitesList"
				:invites="invites"
				:search-query="searchQuery"
				:reload-bus="reloadBus" />
		</template>

		<!-- main invite details -->
		<OcmInviteDetails :invite-key="selectedInvite" :invites="sortedInvites" :reload-bus="reloadBus" />
	</AppContent>
</template>

<script>
import {
	NcAppContent as AppContent,
	NcButton as Button,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'

import OcmInviteDetails from '../Ocm/OcmInviteDetails.vue'
import OcmInvitesList from '../Ocm/OcmInvitesList.vue'
import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import RouterMixin from '../../mixins/RouterMixin.js'
import mitt from 'mitt'

export default {
	name: 'OcmInvitesContent',

	components: {
		AppContent,
		Button,
		OcmInviteDetails,
		OcmInvitesList,
		EmptyContent,
		IconContact,
		IconLoading,
	},

	mixins: [RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: true,
		},

		invitesList: {
			type: Array,
			required: true,
		},
	},

	data() {
		return {
			searchQuery: '',
			// communication for ContactListItem and OcmInviteDetails (reload avatar)
			reloadBus: mitt(),
		}
	},

	computed: {
		// store variables
		invites() {
			return this.$store.getters.getOcmInvites
		},
		sortedInvites() {
			return this.$store.getters.getSortedOcmInvites
		},

		selectedInvite() {
			return this.$route.params.selectedInvite
		},

		/**
		 * Is the invites group empty
		 *
		 * @return {boolean}
		 */
		isEmptyGroup() {
			return this.invitesList.length === 0
		},

		showDetails() {
			return !!this.selectedInvite
		},
	},

	methods: {
	},
}
</script>
<style lang="scss" scoped>
.empty-content {
	height: 100%;
}
</style>
