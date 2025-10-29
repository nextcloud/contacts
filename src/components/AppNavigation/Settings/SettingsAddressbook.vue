<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<div class="settings-addressbook-list">
		<IconContactPlus class="settings-line__icon" />
		<li :class="{ 'addressbook--disabled': !addressbook.enabled }" class="addressbook">
			<div class="addressbook__content">
				<!-- addressbook name -->
				<span class="addressbook__name" :title="addressbook.displayName">
					{{ addressbook.enabled ? addressbook.displayName : t('contacts', '{addressbookname} (Hidden)', { addressbookname: addressbook.displayName }) }}
				</span>

				<div v-if="addressbook.dav.description" class="addressbook__description">
					{{ addressbook.dav.description }}
				</div>
				<!-- counters -->
				<div v-if="addressbook.enabled" class="addressbook__count-wrapper">
					<span class="addressbook__count">{{ n('contacts', '%n contact', '%n contacts', contactsCount) }}</span>
					<span class="addressbook__count">- {{ n('contacts', '%n group', '%n groups', groupsCount) }}</span>
				</div>
			</div>

			<!-- sharing Ncbutton -->
			<NcButton
				v-if="!addressbook.readOnly && !isSharedWithMe"
				v-tooltip.top="sharedWithTooltip"
				:class="{ 'addressbook__share--shared': hasShares }"
				:name="sharedWithTooltip"
				href="#"
				class="addressbook__share"
				@click="toggleShare">
				<template #icon>
					<IconShare :size="20" />
				</template>
			</NcButton>

			<!-- popovermenu -->
			<Actions class="addressbook__menu" menu-align="right">
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
			</Actions>
			<!-- sharing input -->
			<ShareAddressBook v-if="shareOpen && !addressbook.readOnly" :addressbook="addressbook" />
		</li>
	</div>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import {
	NcActionButton as ActionButton,
	NcActionCheckbox as ActionCheckbox,
	NcActionInput as ActionInput,
	NcActionLink as ActionLink,
	NcActions as Actions,
	NcLoadingIcon as IconLoading,
	NcButton,
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
		Actions,
		NcButton,
		IconDelete,
		IconDownload,
		IconRename,
		IconContactPlus,
		IconShare,
		IconLoading,
		ShareAddressBook,
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
.addressbook {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	white-space: nowrap;
	text-overflow: ellipsis;
	padding: var(--default-grid-baseline) 0;

	> .addressbook__content {
		+ a,
		+ div {
			// put actions at the end
			margin-inline-start: auto;
		}
	}

	&__name {
		display: block;
		flex: 0 1 auto;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__content {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		flex: 0 1 auto;
		max-width: calc(100% - 2 * 44px);
	}

	&__description {
		color: var(--color-text-lighter);
	}

	&__count-wrapper {
		display: flex;
	}

	&__count {
		margin-inline-start: calc(var(--default-grid-baseline) * 0.5);
		font-size: smaller;
		color: var(--color-text-lighter);
	}

	&__count:not(:last-child) {
		margin-inline-end: var(--default-grid-baseline);
	}

	&__share,
	&__menu .icon-more {
		opacity: .5;
		&:hover,
		&:focus,
		&:active {
			opacity: .7;
		}
	}
	&__share {
		background-color: transparent;
		border: none;
		box-shadow: none;

		&--shared {
			opacity: .7;
		}
	}
	&--disabled &__name {
		opacity: .5;
	}
}

.settings-addressbook-list {
	display: flex;
	width: 100%;
	.material-design-icon {
		justify-content: flex-start;
	}
}

.addressbook-shares {
	padding-top: calc(var(--default-grid-baseline) * 2);
}
</style>
