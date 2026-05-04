<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="circle-settings">
		<ul>
			<li v-for="(config, title) in PUBLIC_CIRCLE_CONFIG" :key="title" class="circle-config">
				<ContentHeading class="circle-config__title">
					{{ title }}
				</ContentHeading>

				<component :is="config.component" v-bind="config.props" :circle="circle" />
			</li>
		</ul>

		<CirclePasswordSettings :circle="circle" />

		<!-- leave circle -->
		<NcButton
			v-if="circle.canLeave"
			variant="warning"
			@click="$emit('leave')">
			<template #icon>
				<IconLogout :size="16" />
			</template>
			{{ t('contacts', 'Leave team') }}
		</NcButton>

		<!-- delete circle -->
		<NcButton
			v-if="circle.canDelete"
			variant="error"
			href="#"
			@click.prevent.stop="$emit('delete')">
			<template #icon>
				<IconDelete :size="20" />
			</template>
			{{ t('contacts', 'Delete team') }}
		</NcButton>
	</div>
</template>

<script lang="ts">
import { t } from '@nextcloud/l10n'
import { defineComponent } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import IconLogout from 'vue-material-design-icons/Logout.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import CirclePasswordSettings from './CirclePasswordSettings.vue'
import ContentHeading from './ContentHeading.vue'
import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'

export default defineComponent({
	name: 'CircleSettings',
	components: {
		ContentHeading,
		CirclePasswordSettings,
		IconDelete,
		IconLogout,
		NcButton,
	},

	props: {
		circle: {
			type: Object,
			required: true,
		},
	},

	emits: ['leave', 'delete'],
	setup() {
		return { t }
	},

	data() {
		return {
			PUBLIC_CIRCLE_CONFIG,
		}
	},

})
</script>

<style lang="scss" scoped>
.circle-settings {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 400px;
}

.circle-config {
	&__title {
		user-select: none;
		margin-top: 22px;
	}
}
</style>
