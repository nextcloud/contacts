<!--
  - @copyright Copyright (c) Matthias Heinisch <nextcloud@matthiasheinisch.de>
  -
  - @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div id="contacts" class="section">
		<h2>{{ t('contacts', 'Contacts') }}</h2>
		<p>
			<input id="allow-social-sync"
				v-model="allowSocialSync"
				type="checkbox"
				class="checkbox"
				@change="updateSetting('allowSocialSync')">
			<label for="allow-social-sync">{{ t('contacts', 'Allow updating avatars from social media') }}</label>
		</p>
		<p>
			<input id="allow-system-address-book"
			   v-model="allowSystemAddressBook"
			   type="checkbox"
			   class="checkbox"
			   @change="updateSetting('allowSystemAddressBook')">
			<label for="allow-system-address-book">{{ t('contacts', 'Allow users to see the system address book') }}</label>
		</p>
	</div>
</template>

<script>
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
export default {
	name: 'AdminSettings',
	data() {
		return {
			allowSocialSync: loadState('contacts', 'allowSocialSync') === 'yes',
			allowSystemAddressBook: loadState('dav', 'allowSystemAddressBook') === 'yes',
		}
	},
	methods: {
		updateSetting(setting) {
			// does this need to be the dav endpoint for the system address book?
			axios.put(generateUrl('apps/contacts/api/v1/social/config/global/' + setting), {
				allow: this[setting] ? 'yes' : 'no',
			})
		},
	},
}
</script>
