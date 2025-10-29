<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcAppContentDetails>
		<!-- nothing selected or invite not found -->
		<NcEmptyContent v-if="!invite" class="empty-content" :name="t('contacts', 'No invite selected')"
			:description="t('contacts', 'Select an invite on the list to begin')">
			<template #icon>
				<IconAccountSwitchOutline :size="20" />
			</template>
		</NcEmptyContent>

		<template v-else>
			<div class="contact-header__infos">
				<h2>
					{{ t('contacts', 'OCM invite') }}
				</h2>
				<div class="invitation-recipientemail property__row">
					<div class="property__label">
						<span>{{ t('contacts', 'Sent to') }}:</span>
					</div>
					<div class="property__value">
						<input id="invite-recipientemail" readonly="readonly" v-model="invite.recipientEmail" type="text"
							name="recipientemail">
					</div>
				</div>
				<div class="invitation-createdat property__row">
					<div class="property__label">
						<span>{{ t('contacts', 'Sent at') }}:</span>
					</div>
					<div class="property__value">
						<input id="invite-createdat" readonly="readonly" :value="formatDate(invite.createdAt)" type="text"
							name="createdat">
					</div>
				</div>
				<div class="invitation-expiredat property__row">
					<div class="property__label">
						<span>{{ t('contacts', 'Expires at') }}:</span>
					</div>
					<div class="property__value">
						<input id="invite-expiredat" readonly="readonly" :value="formatDate(invite.expiredAt)" type="text"
							name="expiredat">
					</div>
				</div>
				<div class="invitation-token property__row">
					<div class="property__label">
						<span>{{ t('contacts', 'Token') }}:</span>
					</div>
					<div class="property__value">
						<input id="invite-token" readonly="readonly" v-model="invite.token" type="text" name="token">
					</div>
				</div>
				<div class="invite-revoke__buttons-row">
					<NcButton type="secondary" @click="onResend">
						<template #icon>
							<CheckIcon :size="20" />
						</template>
						{{ t('contacts', 'Resend') }}
					</NcButton>
					<NcButton type="secondary" @click="onRevoke">
						<template #icon>
							<CheckIcon :size="20" />
						</template>
						{{ t('contacts', 'Revoke') }}
					</NcButton>
				</div>
			</div>
		</template>
	</NcAppContentDetails>
</template>

<script>

import {
	NcAppContentDetails,
	NcButton,
	NcEmptyContent,
} from '@nextcloud/vue'

import CheckIcon from 'vue-material-design-icons/Check.vue'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import moment from '@nextcloud/moment'

const dateFormat = 'lll'

export default {
	name: 'OcmInviteDetails',

	components: {
		CheckIcon,
		IconAccountSwitchOutline,
		NcAppContentDetails,
		NcButton,
		NcEmptyContent,
	},

	props: {
		inviteKey: {
			type: String,
			default: undefined,
		},
	},

	computed: {
		invite() {
			return this.$store.getters.getOcmInvite(this.inviteKey)
		},
	},

	methods: {
		formatDate(date) {
			// moment takes milliseconds
			return moment(date*1000).format(dateFormat)
		},
		async onResend() {
			try {
				const response = await this.$store.dispatch('resendOcmInvite', this.invite)
				window.open(response.data.invite, '_self')
			} catch(error) {
				const message = error.response.data.message
				showError(t('contacts', message))
			}
		},
		async onRevoke() {
			await this.$store.dispatch('deleteOcmInvite', this.invite)
		},
	},

}
</script>

<style lang="scss" scoped>
.empty-content {
	margin-top: 5em;
}

.contact-header__infos {
	h2 {
	display: flex;
	flex: 0 1 auto;
	justify-content: flex-end;
	width: 200px;
	min-width: 0;
	padding-top: 30px;
}
	button.button-vue {
		display: inline-flex;
		margin-inline-start: 1em;
	}
	margin-inline-start: 1em;
}

.invitation-recipientemail.property__row {
	.property__label, #invite-recipientemail {
		font-weight: bold;
	}
}
</style>
