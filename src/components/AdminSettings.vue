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
				@change="updateSetting('allowSocialSync')">
			<label for="allow-social-sync">{{ t('contacts', 'Allow updating avatars from social media') }}</label>
		</p>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { loadState } from '@nextcloud/initial-state'
import { generateUrl } from '@nextcloud/router'
export default {
	name: 'AdminSettings',
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') === 'yes',
		}
	},

	methods: {
		updateSetting(setting) {
			axios.put(generateUrl('apps/contacts/api/v1/social/config/global/' + setting), {
				allow: this[setting] ? 'yes' : 'no',
			})
		},
	},
}
</script>
