<template>
	<div :class="{active: selectedContact === contact.key}" tabindex="0" class="app-content-list-item"
		@click.prevent.stop="selectContact" @keypress.enter.prevent.stop="selectContact">
		<!-- keyboard accessibility will focus the input and not the label -->
		<!--
		<input ref="selected" :id="contact.key" type="checkbox"
			class="app-content-list-item-checkbox checkbox" @keypress.enter.space.prevent.stop="toggleSelect">
		<label :for="contact.key" @click.prevent.stop="toggleSelect" @keypress.enter.space.prevent.stop="toggleSelect" />
		-->
		<div :style="{ 'backgroundColor': colorAvatar }" class="app-content-list-item-icon">{{ contact.displayName | firstLetter }}</div>
		<div class="app-content-list-item-line-one">{{ contact.displayName }}</div>
		<div v-if="contact.email" class="app-content-list-item-line-two">{{ contact.email }}</div>
		<div v-if="contact.addressbook.readOnly" class="icon-delete" tabindex="0"
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
		}
	},
	computed: {
		selectedGroup() {
			return this.$route.params.selectedGroup
		},
		selectedContact() {
			return this.$route.params.selectedContact
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
			this.$store.dispatch('deleteContact', this.contact)
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
