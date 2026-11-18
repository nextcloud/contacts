<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcFormBox>
		<div class="subtitle-order">
			<span id="subtitle-order-label" class="subtitle-order__label">
				{{ t('contacts', 'Show under each name') }}
			</span>
			<span id="subtitle-order-description" class="subtitle-order__description">
				{{ t('contacts', 'The first of these that a contact has is shown') }}
			</span>
			<ol
				class="subtitle-order__list"
				aria-labelledby="subtitle-order-label"
				aria-describedby="subtitle-order-description">
				<li v-for="(field, index) in order" :key="field" class="subtitle-order__field">
					<span class="subtitle-order__field-name">{{ fieldNames[field] }}</span>
					<NcButton
						:ref="(button) => setButton(field, 'up', button)"
						variant="tertiary"
						:disabled="index === 0 || saving"
						:aria-label="t('contacts', 'Move {field} up', { field: fieldNames[field] })"
						@click="move(index, -1)">
						<template #icon>
							<IconArrowUp :size="20" />
						</template>
					</NcButton>
					<NcButton
						:ref="(button) => setButton(field, 'down', button)"
						variant="tertiary"
						:disabled="index === order.length - 1 || saving"
						:aria-label="t('contacts', 'Move {field} down', { field: fieldNames[field] })"
						@click="move(index, 1)">
						<template #icon>
							<IconArrowDown :size="20" />
						</template>
					</NcButton>
				</li>
			</ol>
		</div>
	</NcFormBox>
</template>

<script>
import axios from '@nextcloud/axios'
import { showError } from '@nextcloud/dialogs'
import { generateOcsUrl } from '@nextcloud/router'
import { NcButton } from '@nextcloud/vue'
import NcFormBox from '@nextcloud/vue/components/NcFormBox'
import IconArrowDown from 'vue-material-design-icons/ArrowDown.vue'
import IconArrowUp from 'vue-material-design-icons/ArrowUp.vue'
import logger from '../../../services/logger.js'

export default {
	name: 'SettingsSubtitleOrder',

	components: {
		IconArrowDown,
		IconArrowUp,
		NcButton,
		NcFormBox,
	},

	data() {
		return {
			saving: false,
			buttons: {},
		}
	},

	computed: {
		order() {
			return this.$store.getters.getSubtitleOrder
		},

		fieldNames() {
			return {
				org: t('contacts', 'Organization'),
				email: t('contacts', 'Email'),
				tel: t('contacts', 'Phone number'),
			}
		},
	},

	methods: {
		setButton(field, direction, button) {
			this.buttons[`${field}-${direction}`] = button
		},

		/**
		 * Move a field one place up or down, and save the new order
		 *
		 * @param {number} index the field's place in the order
		 * @param {number} offset -1 to move it up, 1 to move it down
		 */
		async move(index, offset) {
			const oldOrder = this.order
			const newOrder = [...oldOrder]
			const field = newOrder[index]
			newOrder.splice(index, 1)
			newOrder.splice(index + offset, 0, field)

			this.$store.commit('setSubtitleOrder', newOrder)
			this.saving = true
			try {
				await axios.put(generateOcsUrl('/apps/contacts/api/v1/settings/subtitle-order'), { order: newOrder })
			} catch (error) {
				logger.error('Could not save the order of the line under each name', { error })
				showError(t('contacts', 'Failed to save setting'))
				this.$store.commit('setSubtitleOrder', oldOrder)
			} finally {
				this.saving = false
				await this.$nextTick()
				this.keepFocus(field, offset)
			}
		},

		/**
		 * Keep the keyboard focus on the moved field, on a button that can still be pressed
		 *
		 * @param {string} field the moved field
		 * @param {number} offset the direction it was moved in
		 */
		keepFocus(field, offset) {
			const newIndex = this.order.indexOf(field)
			const isMovedUp = offset < 0
			const isAtEnd = isMovedUp ? newIndex === 0 : newIndex === this.order.length - 1
			// The pressed button is disabled at the end of the list, so the focus moves to the other one
			let direction = isMovedUp ? 'up' : 'down'
			if (isAtEnd) {
				direction = isMovedUp ? 'down' : 'up'
			}
			this.buttons[`${field}-${direction}`]?.$el?.focus()
		},
	},
}
</script>

<style lang="scss" scoped>
.subtitle-order {
	display: flex;
	flex-direction: column;
	gap: calc(var(--default-grid-baseline) * 2);

	&__description {
		color: var(--color-text-maxcontrast);
	}

	&__list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	&__field {
		display: flex;
		align-items: center;
		gap: var(--default-grid-baseline);
	}

	&__field-name {
		flex: 1;
	}
}
</style>
