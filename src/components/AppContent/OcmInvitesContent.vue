<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContent v-if="loading">
		<EmptyContent class="empty-content" :name="t('contacts', 'Loading invitations…')">
			<template #icon>
				<IconLoading :size="20" />
			</template>
		</EmptyContent>
	</AppContent>

	<AppContent v-else-if="hasLoadError">
		<EmptyContent class="empty-content" :name="t('contacts', 'Could not load invitations')">
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
		<EmptyContent class="empty-content" :name="t('contacts', 'There are no invitations')">
			<template #icon>
				<IconAccountSwitchOutline :size="20" />
			</template>
			<template #action>
				<NcButton variant="primary" @click="openCreateInvite()">
					{{ t('contacts', 'Create invitation') }}
				</NcButton>
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

		inviteActionsEnabled: {
			type: Boolean,
			default: false,
		},

		errorMessage: {
			type: String,
			default: '',
		},
	},

	emits: ['retry-load', 'open-create-invite'],

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

		openCreateInvite() {
			if (!this.inviteActionsEnabled) {
				return
			}
			this.$emit('open-create-invite')
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

.empty-content button {
	margin: var(--default-grid-baseline);
}
</style>
