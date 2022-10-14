<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
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
	<AppContentList class="content-list">
		<div class="contacts-list__header">
			<div>
				<!-- new-contact-button -->
				<Button
					type="primary"
					button-id="new-contact-button"
					:disabled="!defaultAddressbook"
					@click="newContact">
					<template #icon>
						<IconAdd :size="20" />
					</template>
					{{ t('contacts','New contact') }}
				</Button>
			</div>
			<div class="search-contacts-field">
				<input v-model="query" type="text" :placeholder="t('contacts', 'Search contacts …')">
			</div>
		</div>
		<VirtualList ref="scroller"
			class="contacts-list"
			data-key="key"
			:data-sources="filteredList"
			:data-component="ContactsListItem"
			:estimate-size="68" />
	</AppContentList>
</template>

<script>
import AppContentList from '@nextcloud/vue/dist/Components/NcAppContentList'
import Button from '@nextcloud/vue/dist/Components/NcButton'
import IconAdd from 'vue-material-design-icons/Plus'
import ContactsListItem from './ContactsList/ContactsListItem'
import VirtualList from 'vue-virtual-scroll-list'
import { VCardTime } from 'ical.js'
import Contact from '../models/contact'
import rfcProps from '../models/rfcProps'
import { GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS } from '../models/constants'
import { showError } from '@nextcloud/dialogs'

export default {
	name: 'ContactsList',

	components: {
		AppContentList,
		Button,
		IconAdd,
		VirtualList,
	},

	props: {
		list: {
			type: Array,
			required: true,
		},
		contacts: {
			type: Object,
			required: true,
		},
		searchQuery: {
			type: String,
			default: '',
		},
	},

	data() {
		return {
			ContactsListItem,
			query: '',
			loadingContacts: true,
		}
	},

	computed: {
		addressbooks() {
			return this.$store.getters.getAddressbooks
		},
		selectedContact() {
			return this.$route.params.selectedContact
		},
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		filteredList() {
			return this.list
				.filter(item => this.matchSearch(this.contacts[item.key]))
				.map(item => this.contacts[item.key])
		},
		// first enabled addressbook of the list
		defaultAddressbook() {
			return this.addressbooks.find(addressbook => !addressbook.readOnly && addressbook.enabled)
		},
	},

	watch: {
		selectedContact(key) {
			this.$nextTick(() => {
				this.scrollToContact(key)
			})
		},
		list(val, old) {
			// we just loaded the list and the url already have a selected contact
			// if not, the selectedContact watcher will take over
			// to select the first entry
			if (val.length !== 0 && old.length === 0 && this.selectedContact) {
				this.$nextTick(() => {
					this.scrollToContact(this.selectedContact)
				})
			}
		},
	},

	mounted() {
		this.query = this.searchQuery
	},

	methods: {
		// Select closest contact on deletion
		selectContact(oldIndex) {
			if (this.list.length > 0 && oldIndex < this.list.length) {
				// priority to the one above then the one after
				const newContact = oldIndex === 0 ? this.list[oldIndex + 1] : this.list[oldIndex - 1]
				if (newContact) {
					this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: newContact.key } })
				}
			}
		},

		/**
		 * Scroll to the desired contact if in the list and not visible
		 *
		 * @param {string} key the contact unique key
		 */
		scrollToContact(key) {
			const item = this.$el.querySelector('#' + btoa(key).slice(0, -2))

			// if the item is not visible in the list or barely visible
			if (!(item && item.getBoundingClientRect().y > 50)) { // header height
				const index = this.list.findIndex(contact => contact.key === key)
				if (index > -1) {
					this.$refs.scroller.scrollToIndex(index)
				}
			}

			// if item is a bit out (bottom) of the list, let's just scroll a bit to the top
			if (item) {
				const pos = item.getBoundingClientRect().y + this.itemHeight - (this.$el.offsetHeight + 50)
				if (pos > 0) {
					const scroller = this.$refs.scroller.$el
					scroller.scrollToOffset(scroller.scrollTop + pos)
				}
			}
		},

		/**
		 * Is this matching the current search ?
		 *
		 * @param {Contact} contact the contact to search
		 * @return {boolean}
		 */
		matchSearch(contact) {
			if (this.query.trim() !== '') {
				return contact.searchData.toString().toLowerCase().search(this.query.trim().toLowerCase()) !== -1
			}
			return true
		},
		async newContact() {
			const rev = new VCardTime()
			const contact = new Contact(`
				BEGIN:VCARD
				VERSION:4.0
				PRODID:-//Nextcloud Contacts v${appVersion}
				END:VCARD
			`.trim().replace(/\t/gm, ''),
			this.defaultAddressbook)

			contact.fullName = t('contacts', 'New contact')
			rev.fromUnixTime(Date.now() / 1000)
			contact.rev = rev

			// itterate over all properties (filter is not usable on objects and we need the key of the property)
			const properties = rfcProps.properties
			for (const name in properties) {
				if (properties[name].default) {
					const defaultData = properties[name].defaultValue
					let defaultValue = defaultData.value
					if (Array.isArray(defaultValue)) {
						defaultValue = [...defaultValue]
					}
					// add default field
					const property = contact.vCard.addPropertyWithValue(name, defaultValue)
					// add default type
					if (defaultData.type) {
						property.setParameter('type', defaultData.type)

					}
				}
			}

			// set group if it's selected already
			// BUT NOT if it's the _fake_ groups like all contacts and not grouped
			if ([GROUP_ALL_CONTACTS, GROUP_NO_GROUP_CONTACTS].indexOf(this.selectedGroup) === -1) {
				contact.groups = [this.selectedGroup]
			}
			try {
				// this will trigger the proper commits to groups, contacts and addressbook
				await this.$store.dispatch('addContact', contact)
				await this.$router.push({
					name: 'contact',
					params: {
						selectedGroup: this.selectedGroup,
						selectedContact: contact.key,
					},
				})
			} catch (error) {
				showError(t('contacts', 'Unable to create the contact.'))
				console.error(error)
			}
		},
	},
}
</script>

<style lang="scss" scoped>
// Make virtual scroller scrollable
.contacts-list {
	max-height: calc(100vh - var(--header-height) - 48px);
	overflow: auto;
}

// Add empty header to contacts-list that solves overlapping of contacts with app-navigation-toogle
.contacts-list__header {
	display: flex;
	flex-wrap: wrap;
	flex: 1;
	align-items: center;
	padding: 8px 8px 8px 48px;
	gap: 4px;
	height: 100px;
}

// Search field
.search-contacts-field {
	padding: 5px 10px 5px 0;

	> input {
		width: 100%;
	}
}

.content-list {
	overflow-y: auto;
	padding: 0 4px;
}
@media only screen and (max-width: 1023px) {
	.contacts-list__header {
		height: 61px;
	}
}
@media only screen and (max-width: 490px) {
	.contacts-list__header {
		height: 100px;
	}
}
</style>
