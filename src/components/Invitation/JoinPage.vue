<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div
		class="emptycontent"
		style="
	min-height: 5vw;
	width: 100%;
	max-width: 700px;
	margin-block: 10vh auto;
	margin-inline: auto;
	background-color: var(--color-main-background);
	color: var(--color-main-text);
	padding: calc(3 * var(--default-grid-baseline));
	border-radius: var(--border-radius-container);
	">
		<div>
			<h2>{{ t('contacts', 'Invitation to the circle') }}</h2>
			<template v-if="isAlreadyMemberOfCircle">
				<p
					style="margin-bottom: 5vh;"
					v-html="t('contacts', 'You are already a member of this circle <b>{circleName}</b>.', { circleName: circleNameToJoin })" />
				<div style="display: flex; gap: 12px; justify-content: center;">
					<NcButton :href="circleUrl">
						{{ t('contacts', 'Go to circle page') }}
					</NcButton>
				</div>
			</template>

			<template v-else>
				<p
					style="margin-bottom: 5vh;"
					v-html="t('contacts', 'Do you want to join the circle <b>{circleName}</b>?', { circleName: circleNameToJoin })" />
				<div style="display: flex; gap: 12px; justify-content: center;">
					<NcButton variant="primary" @click="acceptInvitation">
						{{ t('contacts', 'Join') }}
					</NcButton>
					<NcButton :href="homeUrl">
						{{ t('contacts', 'Go back') }}
					</NcButton>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { showSuccess } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { t } from '@nextcloud/l10n'
import { generateUrl, getBaseUrl } from '@nextcloud/router'
import { NcButton } from '@nextcloud/vue'

export default {
	name: 'JoinPage',
	components: { NcButton },
	data() {
		const circleIdToJoin = loadState('contacts', 'circleIdToJoin')
		const circleNameToJoin = loadState('contacts', 'circleNameToJoin')
		const invitationCode = loadState('contacts', 'invitationCode')
		const isAlreadyMemberOfCircle = loadState('contacts', 'isAlreadyMemberOfCircle')

		return {
			circleIdToJoin,
			circleNameToJoin,
			invitationCode,
			isAlreadyMemberOfCircle,
			homeUrl: generateUrl('/apps/contacts'),
			circleUrl: getBaseUrl() + generateUrl('apps/contacts/circle/{circleId}', { circleId: circleIdToJoin }),
		}
	},

	methods: {
		t,

		async acceptInvitation() {
			const response = await axios.post(generateUrl('apps/contacts/api/v1/join/{invitationCode}', { invitationCode: this.invitationCode }))

			showSuccess(t('contacts', 'You have joined the circle {circleName}.', { circleName: this.circleNameToJoin }))

			window.setTimeout(() => {
				document.location.href = this.circleUrl
			}, 500)
		},
	},
}
</script>
