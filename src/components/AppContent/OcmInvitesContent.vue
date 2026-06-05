<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContent v-if="loading">
		<EmptyContent class="empty-content" :name="t('contacts', 'Loading invites …')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="hasLoadError">
		<EmptyContent class="empty-content" :name="t('contacts', 'Could not load invites')">
			<template #icon>
				<IconAccountSwitchOutline :size="20" />
			</template>
		</EmptyContent>
		<div class="invite-retry__buttons-row">
			<NcButton @click="retryLoad">
				{{ t('contacts', 'Retry') }}
			</NcButton>
		</div>
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
			<OcmInvitesList
				:list="invitesList"
				:invites="invites"
				:search-query="searchQuery" />
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
	NcButton,
} from '@nextcloud/vue'
import { mapStores } from 'pinia'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import OcmInviteDetails from '../Ocm/OcmInviteDetails.vue'
import OcmInvitesList from '../Ocm/OcmInvitesList.vue'
import RouterMixin from '../../mixins/RouterMixin.js'
import useOcmInvitesStore from '../../store/ocminvites.ts'

export default {
	name: 'OcmInvitesContent',

	components: {
		AppContent,
		EmptyContent,
		IconAccountSwitchOutline,
		IconLoading,
		NcButton,
		OcmInviteDetails,
		OcmInvitesList,
	},

	mixins: [RouterMixin],

	props: {
		loading: {
			type: Boolean,
			default: false,
		},

		invitesList: {
			type: Array,
			required: true,
		},

		errorMessage: {
			type: String,
			default: '',
		},
	},

	emits: ['retry-load'],

	data() {
		return {
			searchQuery: '',
		}
	},

	computed: {
		...mapStores(useOcmInvitesStore),

		// store variables
		invites() {
			return this.ocminvitesStore.ocmInvites
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

		hasLoadError() {
			return this.errorMessage.trim() !== ''
		},

		showDetails() {
			return !!this.selectedInvite
		},
	},

	methods: {
		retryLoad() {
			this.$emit('retry-load')
		},
	},
}
</script>

<style lang="scss" scoped>
.empty-content {
	height: 100%;
}

.invite-retry__buttons-row {
	display: flex;
	justify-content: center;
	padding-bottom: calc(var(--default-grid-baseline) * 3);
}
</style>
