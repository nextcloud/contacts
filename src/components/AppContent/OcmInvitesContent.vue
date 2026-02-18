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
				<IconAccountSwitchOutline :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else :show-details="showDetails">
		<!-- OCM invites list -->
		<template #list>
			<OcmInvitesList :list="invitesList"
				:invites="invites"
				:search-query="searchQuery"
				:reload-bus="reloadBus" 
				@onRevoke="onRevoke" />
		</template>

		<!-- OCM invite details -->
		<OcmInviteDetails :invite-key="selectedInvite" />

</AppContent>
</template>

<script>
import {
	NcAppContent as AppContent,
	NcEmptyContent as EmptyContent,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'

import { generateUrl } from '@nextcloud/router'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import OcmInviteDetails from '../Ocm/OcmInviteDetails.vue'
import OcmInvitesList from '../Ocm/OcmInvitesList.vue'
import RouterMixin from '../../mixins/RouterMixin.js'
import mitt from 'mitt'

export default {
	name: 'OcmInvitesContent',

	components: {
		AppContent,
		EmptyContent,
		IconAccountSwitchOutline,
		IconLoading,
		OcmInviteDetails,
		OcmInvitesList,
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
}
</script>
<style lang="scss" scoped>
.empty-content {
	height: 100%;
}

.invite-revoke__buttons-row {
	margin-top: 1em;
	margin-inline-start: 4em;
}
</style>
