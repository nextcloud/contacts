<!--
  - @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<Actions>
		<ActionButton @click="deleteProperty">
			<template #icon>
				<IconDelete :size="20" />
			</template>
			{{ t('contacts', 'Delete') }}
		</ActionButton>
		<component :is="action"
			v-for="action in actions"
			:key="action.name"
			:component="propertyComponent" />
	</Actions>
</template>

<script>
import Actions from '@nextcloud/vue/dist/Components/NcActions.js'
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton.js'
import IconDelete from 'vue-material-design-icons/Delete.vue'

export default {
	name: 'PropertyActions',

	components: {
		Actions,
		ActionButton,
		IconDelete,
	},

	props: {
		actions: {
			type: Array,
			default: () => [],
		},
		propertyComponent: {
			type: Object,
			required: true,
		},
	},

	methods: {
		deleteProperty() {
			this.$emit('delete')
		},
	},
}
</script>
