<template>
	<div class="circle-settings">
		<ul>
			<li v-for="(configs, title) in PUBLIC_CIRCLE_CONFIG" :key="title" class="circle-config">
				<ContentHeading class="circle-config__title">
					{{ title }}
				</ContentHeading>

				<ul class="circle-config__list">
					<CheckboxRadioSwitch v-for="(label, config) in configs"
						:key="'circle-config' + config"
						:checked="isChecked(config)"
						:loading="loading === config"
						:disabled="loading !== false"
						wrapper-element="li"
						@update:checked="onChange(config, $event)">
						{{ label }}
					</CheckboxRadioSwitch>
				</ul>
			</li>
		</ul>

		<CirclePasswordSettings :circle="circle" />

		<!-- leave circle -->
		<Button v-if="circle.canLeave"
			type="warning"
			@click="$emit('leave')">
			<template #icon>
				<Logout :size="16" />
			</template>
			{{ t('contacts', 'Leave team') }}
		</Button>

		<!-- delete circle -->
		<Button v-if="circle.canDelete"
			type="error"
			href="#"
			@click.prevent.stop="$emit('delete')">
			<template #icon>
				<IconDelete :size="20" />
			</template>
			{{ t('contacts', 'Delete team') }}
		</Button>
	</div>
</template>

<script>
import {
	NcButton as Button,
	NcCheckboxRadioSwitch as CheckboxRadioSwitch,
} from '@nextcloud/vue'
import CirclePasswordSettings from './CirclePasswordSettings.vue'
import ContentHeading from './ContentHeading.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import Logout from 'vue-material-design-icons/Logout.vue'
import { t } from '@nextcloud/l10n'
import { showError } from '@nextcloud/dialogs'

import { PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'
import { CircleEdit, editCircle } from '../../services/circles.ts'

export default {
	name: 'CircleSettings',
	components: {
		Button,
		CheckboxRadioSwitch,
		ContentHeading,
		CirclePasswordSettings,
		IconDelete,
		Logout,
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
		 * @param {number} config the circle config to manage
		 * @param {boolean} checked checked or not
		 */
		async onChange(config, checked) {
			this.logger.debug(`Circle config ${config} is set to ${checked}`)

			this.loading = config
			const prevConfig = this.circle.config
			if (checked) {
				// eslint-disable-next-line vue/no-mutating-props
				config = prevConfig | config
			} else {
				// eslint-disable-next-line vue/no-mutating-props
				config = prevConfig & ~config
			}

			try {
				const circleData = await editCircle(this.circle.id, CircleEdit.Config, config)
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.config = circleData.config

			} catch (error) {
				console.error('Unable to edit circle config', prevConfig, config, error)
				showError(t('contacts', 'An error happened during the config change'))
			} finally {
				this.loading = false
			}
		},
	},
}
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
