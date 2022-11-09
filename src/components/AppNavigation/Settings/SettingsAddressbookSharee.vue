<!--
	- @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
	-
	- @author Team Popcorn <teampopcornberlin@gmail.com>
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
import Button from '@nextcloud/vue/dist/Components/NcButton.js'
import IconLoading from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'

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
::v-deep .button-vue--vue-secondary {
	background-color: transparent;
	border: none;
	box-shadow: none;
}
</style>
