<!--
  - SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcSettingsSection :name="t('contacts', 'Contacts')">
		<p>
			<NcCheckboxRadioSwitch
				id="allow-social-sync"
				v-model="allowSocialSync"
				type="switch"
				@update:model-value="updateSocialSetting('allowSocialSync')">
				{{ t('contacts', 'Allow updating avatars from social media') }}
			</NcCheckboxRadioSwitch>
		</p>

		<h3>{{ t('contacts', 'External invitations') }}</h3>
		<p>
			<NcCheckboxRadioSwitch
				id="ocm-invites-optional-mail"
				v-model="ocmInvitesConfig.optionalMail"
				type="switch"
				@update:model-value="updateOcmSetting(ocmInviteConfigKeys.optionalMail, ocmInvitesConfig.optionalMail)">
				{{ t('contacts', 'Allow creating invites without an email address (link-only)') }}
			</NcCheckboxRadioSwitch>
		</p>
		<p>
			<NcCheckboxRadioSwitch
				id="ocm-invites-encoded-copy-button"
				v-model="ocmInvitesConfig.encodedCopyButton"
				type="switch"
				@update:model-value="updateOcmSetting(ocmInviteConfigKeys.encodedCopyButton, ocmInvitesConfig.encodedCopyButton)">
				{{ t('contacts', 'Show the "Copy encoded invite" button on invite details') }}
			</NcCheckboxRadioSwitch>
		</p>
	</NcSettingsSection>
</template>

<script>
import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
import { NcCheckboxRadioSwitch, NcSettingsSection } from '@nextcloud/vue'
import LegacyGlobalMixin from '../mixins/LegacyGlobalMixin.js'
import { OCM_INVITES_CONFIG_KEYS } from '../models/constants.ts'

export default {
	name: 'AdminSettings',
	components: {
		NcCheckboxRadioSwitch,
		NcSettingsSection,
	},

	mixins: [LegacyGlobalMixin],

	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync', true),
			ocmInviteConfigKeys: OCM_INVITES_CONFIG_KEYS,
			ocmInvitesConfig: loadState('contacts', 'ocmInvitesConfig', {
				optionalMail: false,
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
