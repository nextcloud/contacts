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
		<div :style="avatarStyle" class="app-content-list-item-icon">
			<!-- try to fetch the avatar only if the contact exists on the server -->
			<div v-if="hasPhoto" :style="{ 'backgroundImage': avatarUrl }" class="app-content-list-item-icon__avatar" />
			<template v-else>
				{{ contact.displayName | firstLetter }}
			</template>
		</div>

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
export default {
	name: 'ContactsListItem',
	filters: {
		firstLetter(value) {
			return value.charAt(0)
		},
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

		hasPhoto() {
			return this.contact.dav && (this.contact.dav.hasphoto || this.contact.photo)
		},

		avatarStyle() {
			if (this.hasPhoto) {
				return {
					backgroundColor: '#fff',
					// The contact photo gets cropped in a circular shape, which might look odd with transparent photos.
					// This box shadow ensures that there's always a very faint edge hinting at the circle.
					boxShadow: '0 0 5px rgba(0, 0, 0, 0.05) inset',
				}
			}

			try {
				const color = this.contact.uid.toRgb()
				return {
					backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
				}
			} catch (e) {
				return {
					backgroundColor: 'grey',
				}
			}
		},

		avatarUrl() {
			if (this.contact.photo) {
				return `url(${this.contact.photoUrl})`
			}
			return `url(${this.contact.url}?photo)`
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
