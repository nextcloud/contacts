<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="wrapper">
		<NcEmptyContent v-if="membershipStatus === 'LOADING'" :name="t('contacts', 'Loading')">
			<template #icon>
				<NcLoadingIcon />
			</template>
		</NcEmptyContent>

		<NcEmptyContent
			v-else-if="membershipStatus === 'MEMBER'"
			:name="t('contacts', 'Invitation to the circle')">
			<template #description>
				<div
					v-html="t('contacts', 'You are already a member of the circle <b>{circleName}</b>.', { circleName })" />
			</template>
			<template #action>
				<NcButton :href="circleUrl">
					{{ t('contacts', 'Go to circle page') }}
				</NcButton>
			</template>
		</NcEmptyContent>

		<NcEmptyContent
			v-else-if="membershipStatus === 'REQUESTED_MEMBERSHIP'"
			:name="t('contacts', 'Invitation to the circle')">
			<template #description>
				<div
					v-html="t('contacts', 'You are already requested join to the circle <b>{circleName}</b>.', { circleName })" />
			</template>
			<template #action>
				<NcButton :href="homeUrl">
					{{ t('contacts', 'Go back') }}
				</NcButton>
			</template>
		</NcEmptyContent>

		<NcEmptyContent
			v-else-if="membershipStatus === 'NOT_A_MEMBER'"
			:name="t('contacts', 'Invitation to the circle')">
			<template #description>
				<div
					v-html="t('contacts', 'Do you want to join to the circle <b>{circleName}</b>?', { circleName })" />
			</template>
			<template #action>
				<NcButton variant="primary" @click="acceptInvitation">
					{{ t('contacts', 'Join') }}
				</NcButton>
				<NcButton :href="homeUrl">
					{{ t('contacts', 'Go back') }}
				</NcButton>
			</template>
		</NcEmptyContent>
	</div>
</template>

<script>
import { showSuccess } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { t } from '@nextcloud/l10n'
import { generateUrl, getBaseUrl } from '@nextcloud/router'
import { NcButton, NcEmptyContent, NcLoadingIcon } from '@nextcloud/vue'
import { getInvitation, joinInvitation } from '../services/circles.ts'

export default {
	name: 'JoinInvitation',
	components: { NcButton, NcEmptyContent, NcLoadingIcon },
	data() {
		const invitationCode = loadState('contacts', 'invitationCode')

		return {
			invitationCode,
			circleId: '',
			circleName: '',
			membershipStatus: 'LOADING',
			homeUrl: generateUrl('/apps/contacts'),
		}
	},

	computed: {
		circleUrl() {
			return getBaseUrl() + generateUrl('apps/contacts/circle/{circleId}', { circleId: this.circleId })
		},
	},

	async mounted() {
		const invitation = await getInvitation(this.invitationCode)

		this.circleId = invitation.circleId
		this.circleName = invitation.circleName
		this.membershipStatus = invitation.membershipStatus
	},

	methods: {
		t,

		async acceptInvitation() {
			await joinInvitation(this.invitationCode)

			showSuccess(t('contacts', 'You have joined to the circle {circleName}.', { circleName: this.circleName }))

			window.setTimeout(() => {
				document.location.href = this.circleUrl
			}, 500)
		},
	},
}
</script>

<style lang="scss" scoped>
.wrapper {
	background-color: var(--color-main-background);
	margin: 100px auto;
	width: fit-content;
	padding: 20px;
}

:deep(.empty-content__action) {
	display: flex;
	align-items: center;
	gap: calc(var(--default-grid-baseline) * 2);
}
</style>
