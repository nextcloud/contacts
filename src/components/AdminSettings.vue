<template>
	<div>
		<SettingsSection
			:title="t('contacts', 'social sync configuration')"
			:description="t('contacts', '(de)activate social media integration')">
			<input
				id="allowSocialSync"
				v-model="allowSocialSync"
				type="checkbox"
				class="checkbox"
				@change="updateSetting('allowSocialSync')">
			<label for="allowSocialSync">{{ t('contacts', 'Allow updating avatars from social media') }}</label>
		</SettingsSection>
	</div>
</template>

<script>
import Axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import { SettingsSection } from '@nextcloud/vue'
export default {
	name: 'AdminSettings',
	components: {
		SettingsSection,
	},
	data() {
		return {
			'allowSocialSync': loadState('contacts', 'allowSocialSync') === 'yes',
		}
	},
	methods: {
		updateSetting(setting) {
			Axios.put(generateUrl('apps/contacts/api/v1/social/config/' + setting), {
				value: this[setting].toString(),
			})
		},
	},
}
</script>
