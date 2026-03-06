<!--
  - SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcAppSettingsDialog
		v-model:open="settingsOpen"
		:name="t('contacts', 'Team settings')"
		:show-navigation="true">
		<NcAppSettingsSection
			id="name-and-description"
			:name="t('contacts', 'Name and description')">
			<div class="circle-settings__name">
				<NcTextField
					v-model="newDisplayName"
					:label="t('contacts', 'Team name')"
					:disabled="loadingName"
					@blur="saveName"
					@keypress.enter.prevent="saveName" />
				<NcLoadingIcon v-if="loadingName" :size="20" />
			</div>
			<NcTextArea
				v-model="newDescription"
				:label="t('contacts', 'Description')"
				:placeholder="t('contacts', 'Enter a description for the team')"
				:disabled="loadingDescription"
				:maxlength="1024"
				@blur="saveDescription" />
		</NcAppSettingsSection>

		<NcAppSettingsSection
			v-for="(configs, title) in PUBLIC_CIRCLE_CONFIG"
			:id="sectionId(title)"
			:key="title"
			:name="title">
			<ul class="circle-config__list">
				<NcCheckboxRadioSwitch
					v-for="(label, config) in configs"
					:key="'circle-config' + config"
					:model-value="isChecked(config)"
					:loading="loading === config"
					:disabled="loading !== false"
					type="switch"
					wrapper-element="li"
					@update:model-value="onChange(Number(config), $event)">
					{{ typeof label === 'string' ? label : label.label }}
					<template v-if="typeof label === 'object' && label.description" #description>
						{{ label.description }}
					</template>
				</NcCheckboxRadioSwitch>
			</ul>
		</NcAppSettingsSection>

		<NcAppSettingsSection
			id="privacy"
			:name="t('contacts', 'Privacy')">
			<ul class="circle-config__list">
				<NcCheckboxRadioSwitch
					:model-value="isChecked(CircleConfigs.VISIBLE)"
					:loading="loading === CircleConfigs.VISIBLE"
					:disabled="loading !== false"
					type="switch"
					wrapper-element="li"
					@update:model-value="onChange(CircleConfigs.VISIBLE, $event)">
					{{ t('contacts', 'Visible to everyone') }}
				</NcCheckboxRadioSwitch>
			</ul>
			<CirclePasswordSettings :circle="circle" />
		</NcAppSettingsSection>

		<NcAppSettingsSection
			id="actions"
			:name="t('contacts', 'Actions')">
			<div class="circle-settings__actions">
				<!-- leave circle -->
				<NcButton
					v-if="circle.canLeave"
					variant="warning"
					@click="onLeave">
					<template #icon>
						<IconLogout :size="16" />
					</template>
					{{ t('contacts', 'Leave team') }}
				</NcButton>

				<!-- delete circle -->
				<NcButton
					v-if="circle.canDelete"
					variant="error"
					@click="onDelete">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete team') }}
				</NcButton>
			</div>
		</NcAppSettingsSection>
	</NcAppSettingsDialog>
</template>

<script lang="ts">
import { showError } from '@nextcloud/dialogs'
import { t } from '@nextcloud/l10n'
import {
	NcAppSettingsDialog,
	NcAppSettingsSection,
} from '@nextcloud/vue'
import { defineComponent } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcCheckboxRadioSwitch from '@nextcloud/vue/components/NcCheckboxRadioSwitch'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcTextArea from '@nextcloud/vue/components/NcTextArea'
import NcTextField from '@nextcloud/vue/components/NcTextField'
import IconLogout from 'vue-material-design-icons/Logout.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import CirclePasswordSettings from './CirclePasswordSettings.vue'
import CircleActionsMixin from '../../mixins/CircleActionsMixin.js'
import { CircleConfigs, PUBLIC_CIRCLE_CONFIG } from '../../models/constants.ts'
import { CircleEdit, editCircle } from '../../services/circles.ts'

export default defineComponent({
	name: 'CircleSettings',
	components: {
		CirclePasswordSettings,
		IconDelete,
		IconLogout,
		NcAppSettingsDialog,
		NcAppSettingsSection,
		NcButton,
		NcCheckboxRadioSwitch,
		NcLoadingIcon,
		NcTextArea,
		NcTextField,
	},

	mixins: [CircleActionsMixin],

	props: {
		circle: {
			type: Object,
			required: true,
		},

		open: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:open'],
	setup() {
		return { t, CircleConfigs }
	},

	data() {
		return {
			PUBLIC_CIRCLE_CONFIG,
			loading: false,
			newDisplayName: '',
			newDescription: '',
			loadingName: false,
			loadingDescription: false,
		}
	},

	computed: {
		settingsOpen: {
			get() {
				return this.open
			},

			set(value: boolean) {
				this.$emit('update:open', value)
			},
		},
	},

	watch: {
		settingsOpen(isOpen: boolean) {
			if (isOpen) {
				this.newDisplayName = this.circle.displayName
				this.newDescription = this.circle.description
			}
		},
	},

	methods: {
		sectionId(title: string) {
			return 'circle-' + title.toLowerCase().replace(/\s+/g, '-')
		},

		async saveName() {
			const trimmed = this.newDisplayName.trim()
			if (!trimmed || trimmed === this.circle.displayName) {
				this.newDisplayName = this.circle.displayName
				return
			}
			this.loadingName = true
			try {
				await editCircle(this.circle.id, CircleEdit.Name, trimmed)
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.displayName = trimmed
			} catch (error) {
				this.logger.error('Unable to edit team name', { error })
				showError(t('contacts', 'An error happened while saving the name'))
				this.newDisplayName = this.circle.displayName
			} finally {
				this.loadingName = false
			}
		},

		async saveDescription() {
			const trimmed = this.newDescription.trim()
			if (trimmed === this.circle.description) {
				return
			}
			this.loadingDescription = true
			try {
				await editCircle(this.circle.id, CircleEdit.Description, trimmed)
				// eslint-disable-next-line vue/no-mutating-props
				this.circle.description = trimmed
			} catch (error) {
				this.logger.error('Unable to edit team description', { error })
				showError(t('contacts', 'An error happened while saving the description'))
				this.newDescription = this.circle.description
			} finally {
				this.loadingDescription = false
			}
		},

		onLeave() {
			this.$emit('update:open', false)
			this.confirmLeaveCircle()
		},

		onDelete() {
			this.$emit('update:open', false)
			this.confirmDeleteCircle()
		},

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

			if (checked && config === CircleConfigs.FEDERATED) {
				const confirmed = await this.confirmEnableFederationForCircle()
				if (!confirmed) {
					return
				}
			}

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
.circle-settings__name {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.circle-settings__actions {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
</style>
