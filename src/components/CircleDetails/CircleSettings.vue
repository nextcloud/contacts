<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="circle-settings">
		<ul>
			<li v-for="(configs, title) in PUBLIC_CIRCLE_CONFIG" :key="title" class="circle-config">
				<ContentHeading class="circle-config__title">
					{{ title }}
				</ContentHeading>

				<ul class="circle-config__list">
					<NcCheckboxRadioSwitch
						v-for="(label, config) in configs"
						:key="'circle-config' + config"
						:model-value="isChecked(config)"
						:loading="loading === config"
						:disabled="loading !== false"
						wrapper-element="li"
						@update:model-value="onChange(config, $event)">
						{{ label }}
					</NcCheckboxRadioSwitch>
				</ul>
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
import { showError } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import { defineComponent } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcCheckboxRadioSwitch from '@nextcloud/vue/components/NcCheckboxRadioSwitch'
import IconLogout from 'vue-material-design-icons/Logout.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import CirclePasswordSettings from './CirclePasswordSettings.vue'
import ContentHeading from './ContentHeading.vue'
import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'
import { CircleEdit, editCircle } from '../../services/circles.ts'

export default defineComponent({
	name: 'CircleSettings',
	components: {
		ContentHeading,
		CirclePasswordSettings,
		IconDelete,
		IconLogout,
		NcButton,
		NcCheckboxRadioSwitch,
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
			loading: false,
		}
	},

	methods: {
		isChecked(config) {
			return (this.circle.config & config) !== 0
		},

		/**
		 * On toggle, add or remove the config bitwise
		 *
		 * @param config - The circle config to manage
		 * @param checked - Checked or not
		 */
		async onChange(config: number, checked: boolean) {
			this.logger.debug(`Circle config ${config} is set to ${checked}`)

			this.loading = config
			const prevConfig = this.circle.config
			if (checked) {
				config = prevConfig | config
			} else {
				config = prevConfig & ~config
			}

			try {
				const circleData = await editCircle(this.circle.id, CircleEdit.Config, config)
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.config = circleData.config
			} catch (error) {
				this.logger.error('Unable to edit circle config', { prevConfig, config, error })
				showError(t('contacts', 'An error happened during the config change'))
			} finally {
				this.loading = false
			}
		},
	},
})
</script>

<style lang="scss" scoped>
.circle-settings {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 320px;
}

.circle-config {
	&__title {
		user-select: none;
		margin-top: 22px;
	}
}
</style>
