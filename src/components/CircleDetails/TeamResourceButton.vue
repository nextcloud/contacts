<!--
  - SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcPopover
		:shown="isPopoverOpen"
		popup-role="dialog"
		@update:shown="handlePopoverToggle">
		<template #trigger>
			<NcButton
				variant="secondary"
				:aria-describedby="`tooltip-${resourceType.id}`"
				@click="openPopover">
				<template #icon>
					<slot name="icon" />
				</template>
				{{ resourceType.label }}
			</NcButton>
		</template>
		<div v-if="!resourceType.noInput" class="resource-creation-popover">
			<div class="popover-content">
				<NcTextField
					:model-value="inputValue"
					:placeholder="resourceType.placeholder"
					:label="resourceType.inputLabel"
					@update:value="updateInput"
					@input="updateInput" />
				<div class="popover-actions">
					<NcButton
						variant="secondary"
						:aria-label="t('contacts', 'Close')"
						@click="closePopover">
						<template #icon>
							<CloseOutlineIcon :size="20" />
						</template>
					</NcButton>
					<NcButton
						variant="primary"
						:aria-label="t('contacts', 'Save')"
						:disabled="!canCreate"
						@click="createResource">
						<template #icon>
							<CheckOutlineIcon :size="20" />
						</template>
					</NcButton>
				</div>
			</div>
		</div>
	</NcPopover>
</template>

<script>
import { NcButton, NcPopover, NcTextField } from '@nextcloud/vue'
import CheckOutlineIcon from 'vue-material-design-icons/Check.vue'
import CloseOutlineIcon from 'vue-material-design-icons/Close.vue'

export default {
	name: 'TeamResourceButton',

	components: {
		NcButton,
		NcPopover,
		NcTextField,
		CloseOutlineIcon,
		CheckOutlineIcon,
	},

	props: {
		resourceType: {
			type: Object,
			required: true,
		},

		value: {
			type: String,
			default: '',
		},

		isOpen: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:value', 'update:isOpen', 'create'],

	computed: {
		inputValue() {
			return this.value
		},

		isPopoverOpen: {
			get() {
				return this.isOpen
			},

			set(value) {
				this.$emit('update:isOpen', value)
			},
		},

		canCreate() {
			if (this.resourceType.noInput) {
				return this.resourceType.enabled !== false
			}
			const value = this.inputValue
			const hasValue = typeof value === 'string' && value.trim().length > 0
			return hasValue && this.resourceType.enabled !== false
		},
	},

	methods: {
		openPopover() {
			if (this.resourceType.noInput) {
				this.createResource()
			} else {
				this.isPopoverOpen = true
			}
		},

		closePopover() {
			this.isPopoverOpen = false
		},

		handlePopoverToggle(shown) {
			this.isPopoverOpen = shown
		},

		updateInput(value) {
			const actualValue = typeof value === 'string' ? value : value?.target?.value || value?.value || ''
			this.$emit('update:value', actualValue)
		},

		createResource() {
			if (this.canCreate) {
				if (this.resourceType.noInput) {
					this.$emit('create', {
						resourceType: this.resourceType,
						name: '',
					})
				} else {
					const value = this.inputValue
					const name = typeof value === 'string' ? value.trim() : ''
					if (name) {
						this.$emit('create', {
							resourceType: this.resourceType,
							name,
						})
					}
				}
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.resource-creation-popover {
	padding: calc(var(--default-grid-baseline) * 4);
	min-width: 320px;

	.popover-content {
		display: flex;
		align-items: flex-end;
		gap: calc(var(--default-grid-baseline) * 2);

		:deep(.input-field__main-wrapper) {
			flex: 1;
		}

		.popover-actions {
			display: flex;
			gap: var(--default-grid-baseline);
			align-items: center;
		}
	}
}
</style>
