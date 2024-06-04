<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
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
import {
	NcActions as Actions,
	NcActionButton as ActionButton,
} from '@nextcloud/vue'
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
<style lang="scss" scoped>
.material-design-icon {
	opacity: 0.8;

	&:hover,
	&:focus {
		opacity: 1 !important;
	}
}
</style>
