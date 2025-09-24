<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos">
		<h5 class="">
			{{ t('contacts', ' Accept exchange of contact info ?') }}
		</h5>
		<p>{{ t('contacts', 'This will simplify federated sharing between you and the inviter.') }}</p>
		<div class="invitation-token">
			<label>Token</label><span style="margin: 05em;">{{ token }}</span>
		</div>
		<div class="invitation-provider">
			<label>Provider</label><span style="margin: 05em;">{{ providerDomain }}</span>
		</div>
		<div class="actions">
			<slot name="accept-invite-actions" />
		</div>
	</div>

</template>

<script>

export default {
	name: 'OcmInviteAccept',
	props: {
		token: {
			type: String,
			default: '',
			required: true,
		},
		providerDomain: {
			type: String,
			default: '',
			required: true,
		},
	}
}
</script>
<style lang="scss" scoped>
.contact-header__infos {
	margin: 1em;;
}
</style>
