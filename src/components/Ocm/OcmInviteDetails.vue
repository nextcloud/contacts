<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<AppContentDetails>
		<!-- nothing selected or invite not found -->
		<EmptyContent v-if="!invite"
			class="empty-content"
			:name="t('contacts', 'No invite selected')"
			:description="t('contacts', 'Select an invite on the list to begin')">
			<template #icon>
				<IconContact :size="20" />
			</template>
		</EmptyContent>

		<div class="contact-header__infos">
			<h2>
				{{ t('contacts', 'OCM invite') }}
			</h2>
			<div class="invitation-recipientemail property__row">
				<div class="property__label">
					<span>{{ t('contacts', 'Sent to') }}:</span>
				</div>
				<div class="property__value">
					<input 
						id="invite-recipientemail"
						readonly="readonly"
						v-model="invite.recipientEmail"
						type="text"
						name="recipientemail" >
				</div>
			</div>
			<div class="invitation-createdat property__row">
				<div class="property__label">
					<span>{{ t('contacts', 'Sent at') }}:</span>
				</div>
				<div class="property__value">
					<input 
						id="invite-createdat"
						readonly="readonly"
						:value="formatDate(invite.createdAt)"
						type="text"
						name="createdat" >
				</div>
			</div>
			<div class="invitation-expiredat property__row">
				<div class="property__label">
					<span>{{ t('contacts', 'Expires at') }}:</span>
				</div>
				<div class="property__value">
					<input 
						id="invite-expiredat"
						readonly="readonly"
						:value="formatDate(invite.expiredAt)"
						type="text"
						name="expiredat" >
				</div>
			</div>
			<div class="invitation-token property__row">
				<div class="property__label">
					<span>{{ t('contacts', 'Token') }}:</span>
				</div>
				<div class="property__value">
					<input 
						id="invite-token"
						readonly="readonly"
						v-model="invite.token"
						type="text"
						name="token" >
				</div>
			</div>
			<div class="actions">
				<slot name="invitation-actions" />
			</div>
		</div>
	</AppContentDetails>
</template>

<script>

import {
	NcAppContentDetails as AppContentDetails,
} from '@nextcloud/vue'

import IconContact from 'vue-material-design-icons/AccountMultiple.vue'
import moment from '@nextcloud/moment'

const dateFormat = 'lll'

export default {
	name: 'OcmInviteDetails',

	components: {
		IconContact,
		AppContentDetails,
	},

	props: {
		inviteKey: {
			type: String,
			default: undefined,
		},
		invites: {
			type: Array,
			default: () => [],
		},
		reloadBus: {
			type: Object,
			required: true,
		},
		desc: {
			type: String,
			required: false,
			default: '',
		},
	},

	computed: {
		invite() {
			return this.$store.getters.getOcmInvite(this.inviteKey)
		},
	},

	methods: {
		formatDate(date) {
			return moment(date).format(dateFormat)
		}
	}

}
</script>

<style lang="scss" scoped>
.contact-header__infos h2 {
	display: flex;
	flex: 0 1 auto;
	justify-content: flex-end;
	width: 200px;
	min-width: 0;
	padding-top: 30px;
}
.invitation-recipientemail.property__row {
	.property__label, #invite-recipientemail {
		font-weight: bold;
	}
}
</style>