<!--
  - SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcActions>
		<NcActionButton @click="deleteProperty">
			<template #icon>
				<IconDelete :size="20" />
			</template>
			{{ t('contacts', 'Delete') }}
		</NcActionButton>
		<component
			:is="action"
			v-for="action in actions"
			:key="action.name"
			:component="propertyComponent" />
	</NcActions>
</template>

<script>
import {
	NcActionButton,
	NcActions,
} from '@nextcloud/vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'

export default {
	name: 'PropertyActions',

	components: {
		NcActions,
		NcActionButton,
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
