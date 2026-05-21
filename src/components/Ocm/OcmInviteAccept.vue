<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="contact-header__infos">
		<h5>
			{{ t('contacts', 'Accept invite to exchange contact info.') }}
		</h5>
		<p>{{ t('contacts', 'Accepting will add the inviter to your contacts list and in return, your contact info will be sent to the inviter. From there on you can start sharing data with each other.') }}</p>
		<dl class="invitation-details">
			<dt>{{ t('contacts', 'Invite code') }}</dt>
			<dd>
				<code class="ocm-invite-token" data-testid="ocm-invite-accept-token">{{ token }}</code>
			</dd>
			<dt>{{ t('contacts', 'Cloud provider') }}</dt>
			<dd>
				<bdi class="ocm-provider-host" data-testid="ocm-invite-accept-provider">{{ provider }}</bdi>
			</dd>
		</dl>
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
			required: true,
		},

		provider: {
			type: String,
			required: true,
		},
	},
}
</script>

<style lang="scss" scoped>
.contact-header__infos {
	margin: 1em;

	h5 {
		margin: 0 0 0.5em 0;
	}

	> p {
		margin-bottom: 1.5em;
		color: var(--color-text-maxcontrast);
	}
}

.invitation-details {
	margin: 0 0 1.5em 0;
	padding: 1em;
	background: var(--color-background-dark);
	border-radius: var(--border-radius-large);
	display: grid;
	grid-template-columns: max-content minmax(0, 1fr);
	column-gap: 1em;
	row-gap: 0.5em;
	align-items: baseline;

	dt {
		font-weight: 500;
		color: var(--color-text-maxcontrast);
		text-align: start;
	}

	dd {
		margin: 0;
		margin-inline-start: 0;
		min-width: 0;
		overflow-wrap: anywhere;
		text-align: start;
	}

	.ocm-invite-token {
		font-family: monospace;
	}
}

@media (max-width: 480px) {
	.invitation-details {
		grid-template-columns: 1fr;
		row-gap: 0.25em;

		dd {
			margin-bottom: 0.5em;
		}
	}
}
</style>
