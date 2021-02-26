<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Charismatic Claire <charismatic.claire@noservice.noreply>
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
	<AppNavigationItem v-for="group in groupsMenu"
		:key="group.key"
		:to="group.router"
		:title="group.name"
		:icon="group.icon">
		<template slot="actions">
			<ActionButton
				icon="icon-add"
				@click="addContactsToGroup(group)">
				{{ t('contacts', 'Add contacts') }}
			</ActionButton>
			<ActionButton
				icon="icon-download"
				@click="downloadGroup(group)">
				{{ t('contacts', 'Download') }}
			</ActionButton>
		</template>

		<AppNavigationCounter v-if="group.contacts.length > 0" slot="counter">
			{{ group.contacts.length }}
		</AppNavigationCounter>
	</AppNavigationItem>
</template>

<script>
import AppNavigationItem from '@nextcloud/vue/dist/Components/AppNavigationItem'
export default {
	name: 'GroupsNavigation',

	components: {
		AppNavigationItem,
	},

	props: {
		groupsMenu: {
			type: Array,
			required: true,
		},
	},
}
</script>
