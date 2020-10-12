<template>
	<div :id="id"
		:class="{active: selectedContact === contact.key}"
		tabindex="0"
		class="app-content-list-item"
		@click.prevent.stop="selectContact"
		@keypress.enter.prevent.stop="selectContact">
		<!-- keyboard accessibility will focus the input and not the label -->
		<!--
		<input ref="selected" :id="contact.key" type="checkbox"
			class="app-content-list-item-checkbox checkbox" @keypress.enter.space.prevent.stop="toggleSelect">
		<label :for="contact.key" @click.prevent.stop="toggleSelect" @keypress.enter.space.prevent.stop="toggleSelect" />
		-->
		<Avatar
			:disable-menu="true"
			:disable-tooltip="true"
			:display-name="contact.displayName"
			:is-no-user="true"
			:size="40"
			:url="avatarUrl"
			class="app-content-list-item-icon" />

		<!-- contact data -->
		<div class="app-content-list-item-line-one">
			{{ contact.displayName }}
		</div>
		<div v-if="contact.email" class="app-content-list-item-line-two">
			{{ contact.email }}
		</div>
	</div>
</template>

<script>
import Avatar from '@nextcloud/vue/dist/Components/Avatar'

export default {
	name: 'ContactsListItem',

	components: {
		Avatar,
	},

	props: {
		index: {
			type: Number,
			required: true,
		},
		contact: {
			type: Object,
			required: true,
		},
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

		avatarUrl() {
			if (this.contact.photo) {
				return `${this.contact.photoUrl}`
			}
			if (this.contact.url) {
				return `${this.contact.url}?photo`
			}
			return undefined
		},
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
		 * Select this contact within the list
		 */
		selectContact() {
			// change url with router
			this.$router.push({ name: 'contact', params: { selectedGroup: this.selectedGroup, selectedContact: this.contact.key } })
		},
	},
}
</script>
