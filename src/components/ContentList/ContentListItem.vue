<template>
	<div v-if="matchSearch" :class="{active: selectedContact === contact.key}" :id="id"
		tabindex="0"
		class="app-content-list-item" @click.prevent.stop="selectContact" @keypress.enter.prevent.stop="selectContact">
		<!-- keyboard accessibility will focus the input and not the label -->
		<!--
		<input ref="selected" :id="contact.key" type="checkbox"
			class="app-content-list-item-checkbox checkbox" @keypress.enter.space.prevent.stop="toggleSelect">
		<label :for="contact.key" @click.prevent.stop="toggleSelect" @keypress.enter.space.prevent.stop="toggleSelect" />
		-->
		<div :style="{ 'backgroundColor': colorAvatar }" class="app-content-list-item-icon">
			{{ contact.displayName | firstLetter }}
			<!-- try to fetch the avatar only if the contact exists on the server -->
			<div v-if="contact.photo && contact.dav" :style="{ 'backgroundImage': avatarUrl }" class="app-content-list-item-icon__avatar" />
		</div>
		<div class="app-content-list-item-line-one">{{ contact.displayName }}</div>
		<div v-if="contact.email" class="app-content-list-item-line-two">{{ contact.email }}</div>
		<div v-if="!contact.addressbook.readOnly" class="icon-delete" tabindex="0"
			@click.prevent.stop="deleteContact" @keypress.enter.prevent.stop="deleteContact" />
	</div>
</template>

<script>
export default {
	name: 'ContentListItem',
	filters: {
		firstLetter(value) {
			return value.charAt(0)
		}
	},
	props: {
		contact: {
			type: Object,
			required: true
		},
		searchQuery: {
			type: String,
			default: ''
		}
	},
	computed: {
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedContact() {
			return this.$route.params.selectedContact
		},

		// usable and valid html id for scrollTo
		id() {
			return window.btoa(this.contact.key).slice(0, -2)
		},

		/**
		 * Is this matching the current search ?
		 *
		 * @returns {Boolean}
		 */
		matchSearch() {
			if (this.searchQuery !== '') {
				return this.contact.searchData.toString().search(this.searchQuery) !== -1
			}
			return true
		},

		/**
		 * avatar color based on server toRgb method and the displayName
		 * @returns {String} the color in css format
		 */
		colorAvatar() {
			try {
				let color = this.contact.uid.toRgb()
				return `rgb(${color.r}, ${color.g}, ${color.b})`
			} catch (e) {
				return 'grey'
			}
		},
		avatarUrl() {
			return `url(${this.contact.url}?photo)`
		}
	},
	methods: {
		/**
		 * Checkbox management method
		 */
		toggleSelect() {
			// toggle checkbox here because we stop the propagation to not trigger selectContact
			// therefore the selectContact prevent the checkbox label+input propagation
			this.$refs.selected.checked = !this.$refs.selected.checked
		},

		/**
		 * Dispatch contact deletion request
		 */
		deleteContact() {
			this.$store.dispatch('deleteContact', { contact: this.contact })
		},

		/**
		 * Select this contact within the list
		 */
		selectContact() {
			// change url with router
			this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: this.contact.key } })
		}
	}
}
</script>
