<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div id="contacts" class="section">
		<h2>{{ t('contacts', 'Contacts') }}</h2>
		<p>
			<input
				id="allow-social-sync"
				v-model="allowSocialSync"
				type="checkbox"
				class="checkbox"
				@change="updateSocialSetting('allowSocialSync')">
			<label for="allow-social-sync">{{ t('contacts', 'Allow updating avatars from social media') }}</label>
		</p>

		<h3>{{ t('contacts', 'OCM invites') }}</h3>
		<p>
			<input
				id="ocm-invites-optional-mail"
				v-model="ocmInvitesConfig.optionalMail"
				type="checkbox"
				class="checkbox"
				@change="updateOcmSetting(ocmInviteConfigKeys.optionalMail, ocmInvitesConfig.optionalMail)">
			<label for="ocm-invites-optional-mail">{{ t('contacts', 'Allow creating invites without an email address (link-only)') }}</label>
		</p>
		<p>
			<input
				id="ocm-invites-cc-sender"
				v-model="ocmInvitesConfig.ccSender"
				type="checkbox"
				class="checkbox"
				@change="updateOcmSetting(ocmInviteConfigKeys.ccSender, ocmInvitesConfig.ccSender)">
			<label for="ocm-invites-cc-sender">{{ t('contacts', 'Offer the option to also send a copy of the invite to the sender') }}</label>
		</p>
		<p>
			<input
				id="ocm-invites-encoded-copy-button"
				v-model="ocmInvitesConfig.encodedCopyButton"
				type="checkbox"
				class="checkbox"
				@change="updateOcmSetting(ocmInviteConfigKeys.encodedCopyButton, ocmInvitesConfig.encodedCopyButton)">
			<label for="ocm-invites-encoded-copy-button">{{ t('contacts', 'Show the "Copy encoded invite code" button on invite details') }}</label>
		</p>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import { OCM_INVITES_CONFIG_KEYS } from '../models/constants.ts'

export default {
	name: 'AdminSettings',
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') === 'yes',
			ocmInviteConfigKeys: OCM_INVITES_CONFIG_KEYS,
			ocmInvitesConfig: loadState('contacts', 'ocmInvitesConfig', {
				optionalMail: false,
				ccSender: true,
				encodedCopyButton: false,
			}),
		}
	},

	methods: {
		updateSocialSetting(setting) {
			axios.put(generateUrl('apps/contacts/api/v1/social/config/global/' + setting), {
				allow: this[setting] ? 'yes' : 'no',
			}).catch(() => {
				showError(t('contacts', 'Could not save the setting'))
			})
		},

		updateOcmSetting(key, value) {
			axios.put(generateUrl('apps/contacts/ocm/admin/settings/{key}', { key }), {
				value: Boolean(value),
			}).catch(() => {
				showError(t('contacts', 'Could not save the setting'))
			})
		},
	},
}
</script>
