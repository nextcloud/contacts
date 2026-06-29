<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcActions :inline="3" force-name variant="tertiary">
		<NcActionButton
			v-if="!invitationUrl"
			@click="createInvitationLink()">
			<template #icon>
				<LinkPlus :size="20" />
			</template>
			{{ t('contacts', 'Create link') }}
		</NcActionButton>
		<template v-else>
			<NcActionLink
				:href="invitationUrl"
				:icon="copyLinkIcon"
				@click.stop.prevent="copyToClipboard(invitationUrl)">
				{{ copyButtonText }}
			</NcActionLink>

			<NcActionButton
				@click="confirm(
					t('contacts', 'This action will make it impossible to join the team using the current link. Do we really want to change the link?'),
					() => createInvitationLink(),
				)">
				<template #icon>
					<Autorenew :size="20" />
				</template>
				{{ t('contacts', 'Reset link') }}
			</NcActionButton>

			<NcActionButton
				@click="confirm(
					t('contacts', 'This action will make it impossible to join the team using the current link. Do we really want to delete the link?'),
					() => revokeInvitationLink(),
				)">
				<template #icon>
					<LinkOff :size="20" />
				</template>
				{{ t('contacts', 'Reject link') }}
			</NcActionButton>
		</template>
	</NcActions>
</template>

<script>
import { generateUrl, getBaseUrl } from '@nextcloud/router'
import { NcActionButton, NcActionLink, NcActions } from '@nextcloud/vue'
import Autorenew from 'vue-material-design-icons/Autorenew.vue'
import LinkOff from 'vue-material-design-icons/LinkOff.vue'
import LinkPlus from 'vue-material-design-icons/LinkPlus.vue'
import CopyToClipboardMixin from '../../../mixins/CopyToClipboardMixin.js'
import Circle from '../../../models/circle.ts'

export default {
	name: 'InvitationLink',
	components: {
		LinkOff,
		Autorenew,
		LinkPlus,
		NcActions,
		NcActionLink,
		NcActionButton,
	},

	mixins: [CopyToClipboardMixin],
	props: {
		circle: {
			type: Circle,
			required: true,
		},
	},

	computed: {
		invitationUrl() {
			if (!this.circle.invitationCode) {
				return null
			}

			return getBaseUrl() + generateUrl(
				'apps/contacts/join/{invitationCode}',
				{ invitationCode: this.circle.invitationCode.match(/.{1,4}/g).join('-') },
			)
		},

		copyButtonText() {
			if (this.copied) {
				return this.copySuccess
					? t('contacts', 'Copied')
					: t('contacts', 'Could not copy')
			}
			return t('contacts', 'Copy link')
		},
	},

	methods: {
		async createInvitationLink() {
			const circleId = this.circle.id
			await this.$store.dispatch('createInvitationLink', { circleId })

			await this.copyToClipboard(this.invitationUrl)
		},

		async revokeInvitationLink() {
			const circleId = this.circle.id
			await this.$store.dispatch('revokeInvitationLink', { circleId })
		},

		confirm(message, action) {
			if (window.confirm(message)) {
				action()
			}
		},
	},
}
</script>
