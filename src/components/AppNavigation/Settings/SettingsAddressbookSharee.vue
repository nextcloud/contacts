<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<li class="addressbook-sharee">
		<IconLoading v-if="loading" :size="20" />
		<IconGroup v-else-if="sharee.isGroup && !loading" />
		<IconUser v-else-if="!sharee.isGroup && !loading" />
		<span class="addressbook-sharee__identifier"
			:title="sharee.displayName">
			{{ sharee.displayName }}
		</span>
		<span class="addressbook-sharee__utils">
			<input :id="uid"
				:checked="writeable"
				:disabled="loading"
				class="checkbox"
				name="editable"
				type="checkbox"
				@change="editSharee">
			<label :for="uid"
				:title="t('contacts', 'can edit')">
				{{ t('contacts', 'can edit') }}
			</label>
			<Button :class="{'addressbook-sharee__utils--disabled': loading}"
				href="#"
				title="Delete"
				@click="deleteSharee">
				<template #icon>
					<IconDelete :size="20" />
				</template>
			</Button>
		</span>
	</li>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import IconGroup from 'vue-material-design-icons/AccountMultiple.vue'
import IconUser from 'vue-material-design-icons/Account.vue'
import {
	NcButton as Button,
	NcLoadingIcon as IconLoading,
} from '@nextcloud/vue'

export default {
	name: 'SettingsAddressbookSharee',
	components: {
		Button,
		IconDelete,
		IconGroup,
		IconLoading,
		IconUser,
	},

	props: {
		addressbook: {
			type: Object,
			required: true,
		},
		sharee: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			loading: false,
		}
	},

	computed: {
		writeable() {
			return this.sharee.writeable
		},
		// generated id for this sharee
		uid() {
			return this.sharee.id + this.addressbook.id + Math.floor(Math.random() * 1000)
		},
	},

	methods: {
		async deleteSharee() {
			if (this.loading) {
				return false
			}

			this.loading = true
			try {
				await this.$store.dispatch('removeSharee', {
					addressbook: this.addressbook,
					uri: this.sharee.uri,
				})
			} catch (error) {
				console.error(error)
				showError(t('contacts', 'Unable to delete the share'))
			} finally {
				this.loading = false
			}
		},
		async editSharee() {
			if (this.loading) {
				return false
			}

			this.loading = true
			try {
				await this.$store.dispatch('toggleShareeWritable', {
					addressbook: this.addressbook,
					uri: this.sharee.uri,
					writeable: !this.sharee.writeable,
				})
			} catch (error) {
				console.error(error)
				showError(t('contacts', 'Unable to change permissions'))
			} finally {
				this.loading = false
			}
		},
	},
}
</script>
<style lang="scss" scoped>
.addressbook-sharee__utils {
	text-overflow: ellipsis;
}

.addressbook-sharee__utils label {
	overflow: hidden;
	text-overflow: ellipsis;
	width: 107px;
}

:deep(.button-vue--vue-secondary) {
	background-color: transparent;
	border: none;
	box-shadow: none;
}
</style>
