<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="settings-addressbook-list">
		<NcListItem
			:class="{ 'addressbook--disabled': !addressbook.enabled }"
			:force-display-actions="true"
			:name="addressbook.enabled ? addressbook.displayName : t('contacts', '{addressbookname} (Hidden)', { addressbookname: addressbook.displayName })">
			<template #icon>
				<IconContactPlus class="settings-line__icon" />
			</template>

			<template #subname>
				<span v-if="addressbook.dav.description">{{ addressbook.dav.description }}, </span>
				<span v-if="addressbook.enabled" class="addressbook__count-wrapper">
					<span class="addressbook__count">{{ n('contacts', '%n contact', '%n contacts', contactsCount) }}</span>
					<span class="addressbook__count"> - {{ n('contacts', '%n group', '%n groups', groupsCount) }}</span>
				</span>
			</template>

			<template #extra-actions>
				<!-- sharing Ncbutton -->
				<ActionButton
					v-if="!addressbook.readOnly && !isSharedWithMe"
					:title="sharedWithTooltip"
					:class="{ 'addressbook__share--shared': hasShares }"
					variant="tertiary"
					href="#"
					class="addressbook__share"
					@click="toggleShare">
					<template #icon>
						<IconShare :size="20" />
					</template>
				</ActionButton>
			</template>

			<template #actions>
				<!-- copy addressbook link -->
				<ActionLink
					:href="addressbook.url"
					:icon="copyLinkIcon"
					@click.stop.prevent="copyToClipboard(addressbookUrl)">
					{{ copyNcButtonText }}
				</ActionLink>

				<!-- download addressbook -->
				<ActionLink :href="addressbook.url + '?export'">
					<template #icon>
						<IconDownload :size="20" />
					</template>
					{{ t('contacts', 'Download') }}
				</ActionLink>

				<template v-if="addressbook.writeProps">
					<!-- enable/disable addressbook -->
					<ActionCheckbox
						v-if="!toggleEnabledLoading"
						:model-value="enabled"
						@update:model-value="toggleAddressbookEnabled">
						{{ t('contacts', 'Show') }}
					</ActionCheckbox>
					<ActionButton v-else>
						<template #icon>
							<IconLoading :size="20" />
						</template>
						{{ t('contacts', 'Show') }}
					</ActionButton>
				</template>

				<template v-if="!addressbook.readOnly">
					<!-- rename addressbook -->
					<ActionButton
						v-if="!editingName"
						@click.stop.prevent="renameAddressbook">
						<template #icon>
							<IconRename :size="20" />
						</template>
						{{ t('contacts', 'Rename') }}
					</ActionButton>
					<ActionInput
						v-else
						ref="renameInput"
						:disabled="renameLoading"
						:value="addressbook.displayName"
						@submit="updateAddressbookName">
						<template #icon>
							<IconLoading v-if="renameLoading" :size="20" />
							<IconRename :size="20" />
						</template>
					</ActionInput>
				</template>
				<!-- delete addressbook -->
				<ActionButton
					v-if="hasMultipleAddressbooks && addressbook.owner !== principalUrl && addressbook.owner !== '/remote.php/dav/principals/system/system/'"
					@click="confirmUnshare">
					<template #icon>
						<IconLoading v-if="deleteAddressbookLoading" :size="20" />
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Unshare from me') }}
				</ActionButton>
				<ActionButton
					v-else-if="hasMultipleAddressbooks && addressbook.owner !== '/remote.php/dav/principals/system/system/'"
					@click="confirmDeletion">
					<template #icon>
						<IconLoading v-if="deleteAddressbookLoading" :size="20" />
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete') }}
				</ActionButton>
			</template>
		</NcListItem>
		<ShareAddressBook v-if="shareOpen && !addressbook.readOnly" :addressbook="addressbook" />
	</div>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import {
	NcActionButton as ActionButton,
	NcActionCheckbox as ActionCheckbox,
	NcActionInput as ActionInput,
	NcActionLink as ActionLink,
	NcLoadingIcon as IconLoading,
	NcListItem,
} from '@nextcloud/vue'
import IconContactPlus from 'vue-material-design-icons/AccountMultiplePlusOutline.vue'
import IconRename from 'vue-material-design-icons/PencilOutline.vue'
import IconShare from 'vue-material-design-icons/ShareVariantOutline.vue'
import IconDelete from 'vue-material-design-icons/TrashCanOutline.vue'
import IconDownload from 'vue-material-design-icons/TrayArrowDown.vue'
import ShareAddressBook from './SettingsAddressbookShare.vue'
import CopyToClipboardMixin from '../../../mixins/CopyToClipboardMixin.js'
import usePrincipalsStore from '../../../store/principals.js'

export default {
	name: 'SettingsAddressbook',

	components: {
		ActionButton,
		ActionCheckbox,
		ActionInput,
		ActionLink,
		IconDelete,
		IconDownload,
		IconRename,
		IconContactPlus,
		IconShare,
		IconLoading,
		ShareAddressBook,
		NcListItem,
	},

	mixins: [CopyToClipboardMixin],

	props: {
		addressbook: {
			type: Object,
			default() {
				return {}
			},
		},
	},

	data() {
		return {
			deleteAddressbookLoading: false,
			editingName: false,
			menuOpen: false,
			renameLoading: false,
			shareOpen: false,
			toggleEnabledLoading: false,
		}
	},

	computed: {
		enabled() {
			return this.addressbook.enabled
		},

		hasShares() {
			return this.addressbook.shares.length > 0
		},

		addressbooks() {
			return this.$store.getters.getAddressbooks
		},

		hasMultipleAddressbooks() {
			return this.addressbooks.length > 1
		},

		// info tooltip about number of shares
		sharedWithTooltip() {
			return this.hasShares
				? n(
						'contacts',
						'Shared with {num} entity',
						'Shared with {num} entities',
						this.addressbook.shares.length,
						{
							num: this.addressbook.shares.length,
						},
					)
				: '' // disable the tooltip
		},

		copyNcButtonText() {
			if (this.copied) {
				return this.copySuccess
					? t('contacts', 'Copied')
					: t('contacts', 'Cannot copy')
			}
			return t('contacts', 'Copy link')
		},

		addressbookUrl() {
			return window.location.origin + this.addressbook.url
		},

		contacts() {
			return Object.values(this.addressbook.contacts)
		},

		groups() {
			const allGroups = this.contacts
				.flatMap((contact) => contact.vCard.getAllProperties('categories').map((prop) => prop.getFirstValue()))
			// Deduplicate
			return [...new Set(allGroups)]
		},

		contactsCount() {
			return this.contacts.length
		},

		groupsCount() {
			return this.groups.length
		},

		principalUrl() {
			const principalsStore = usePrincipalsStore()
			return principalsStore.currentUserPrincipal.principalUrl
		},

		isSharedWithMe() {
			return this.addressbook.owner !== this.principalUrl
		},
	},

	watch: {
		menuOpen() {
			if (this.menuOpen === false) {
				this.editingName = false
			}
		},
	},

	mounted() {
		// required if popup needs to stay opened after menu click
		this.popupItem = this.$el
	},

	methods: {
		closeMenu() {
			this.menuOpen = false
		},

		toggleMenu() {
			this.menuOpen = !this.menuOpen
		},

		toggleShare() {
			this.shareOpen = !this.shareOpen
		},

		async toggleAddressbookEnabled() {
			// change to loading status
			this.toggleEnabledLoading = true
			try {
				await this.$store.dispatch('toggleAddressbookEnabled', this.addressbook)
			} catch (err) {
				// error handling
				console.error(err)
				showError(t('contacts', 'Toggling of address book was not successful'))
			} finally {
				// stop loading status regardless of outcome
				this.toggleEnabledLoading = false
			}
		},

		confirmDeletion() {
			window.OC.dialogs.confirm(
				t('contacts', 'This will delete the address book and every contacts within it'),
				t('contacts', 'Delete {addressbook}?', { addressbook: this.addressbook.displayName }),
				this.deleteAddressbook,
				true,
			)
		},

		confirmUnshare() {
			window.OC.dialogs.confirm(
				t('contacts', 'This will unshare the address book and every contacts within it'),
				t('contacts', 'Unshare {addressbook}?', { addressbook: this.addressbook.displayName }),
				this.deleteAddressbook,
				true,
			)
		},

		async deleteAddressbook(confirm) {
			if (confirm) {
				// change to loading status
				this.deleteAddressbookLoading = true
				try {
					await this.$store.dispatch('deleteAddressbook', this.addressbook)
				} catch (err) {
					// error handling
					console.error(err)
					showError(t('contacts', 'Deletion of address book was not successful.'))
				} finally {
					// stop loading status regardless of outcome
					this.deleteAddressbookLoading = false
				}
			}
		},

		renameAddressbook() {
			this.editingName = true
		},

		async updateAddressbookName() {
			const addressbook = this.addressbook
			// New name for addressbook - inputed value from form
			const newName = this.$refs.renameInput.$el.querySelector('input[type="text"]').value
			// change to loading status
			this.renameLoading = true
			try {
				await this.$store.dispatch('renameAddressbook', { addressbook, newName })
			} catch (err) {
				// error handling
				console.error(err)
				showError(t('contacts', 'Renaming of address book was not successful.'))
			} finally {
				this.editingName = false
				// stop loading status regardless of outcome
				this.renameLoading = false
				// close popover menu
				this.menuOpen = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.settings-addressbook-list {
	display: flex;
	flex-direction: column;
}
</style>
