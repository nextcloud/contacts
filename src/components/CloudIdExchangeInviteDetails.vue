<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos">
		<h5 class="">
			{{ t('contacts', 'Invitation to exchange cloud IDs') }}
		</h5>
		<div class="invitation-name">
			<label>Name</label>
			<slot name="name" />
		</div>
		<div class="invitation-email">
			<label>Email</label>
			<slot name="email" />
		</div>
		<div class="invitation-personal-message">
			<label>Message</label>
			<slot name="personal-message" />
		</div>
		<div class="actions">
			<slot name="invitation-actions" />
		</div>
	</div>

</template>

<script>

export default {
	name: 'InvitationDetails',
}
</script>