<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos">
		<h5 class="">
			{{ t('contacts', 'Invite someone outside your organisation to collaborate.') }}
		</h5>
		<p>{{ t('contacts', 'After the invitee has accepted the invite both of you will appear in each others\' contacts list and you can start sharing data with each other.') }}</p>
		<div class="property__value">
			<NcTextField type="text" :label="t('contacts', 'Email invitee')" :placeholder="t('contacts', 'Email invitee')"
				:value="ocmInvite.email" :inputmode="email" @input="setEmail" />
		</div>
		<div class="property__value">
			<NcTextArea id="personal-message" ref="textarea" :label="t('contacts', 'Personal message')"
				:placeholder="t('contacts', 'Personal message')" :value="ocmInvite.message" @input="setMessage" />
		</div>
		<div class="actions">
			<slot name="new-invite-actions" />
		</div>
	</div>
</template>

<script>
import { NcTextArea, NcTextField } from '@nextcloud/vue'

export default {
	name: 'OcmInviteForm',
	components: {
		NcTextArea,
		NcTextField,
	},
	props: {
		ocmInvite: {
			type: Object,
			required: true,
		},
	},
	methods: {
		setEmail(e) {
			this.ocmInvite.email = e.target.value
		},
		setMessage(e) {
			this.ocmInvite.message = e.target.value
		},
	},
}
</script>
<style lang="scss" scoped>
.contact-header__infos {
	margin: 1em;

	p {
		margin-bottom: 1em;
	}

	div.property__value {
		margin-inline-start: .2em;
		width: 80%;
	}
}
</style>