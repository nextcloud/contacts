<!--
  - @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
  -
  - @author Team Popcorn <teampopcornberlin@gmail.com>
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
	<div class="contact-header-avatar">
		<div class="contact-header-avatar__wrapper">
			<div class="contact-header-avatar__background" @click="toggleModal" />
			<div v-if="contact.photo" :style="{ 'backgroundImage': `url(${contact.photoUrl})` }"
				class="contact-header-avatar__photo"
				@click="toggleModal" />

			<div v-click-outside="closeMenu" class="contact-header-avatar__options">
				<a v-tooltip.bottom="t('contacts', 'Add a new picture')" href="#" class="contact-avatar-options"
					:class="loading ? 'icon-loading-small' : 'icon-picture-force-white'"
					@click.stop.prevent="toggleMenu" />
				<input id="contact-avatar-upload" ref="uploadInput" type="file"
					class="hidden" accept="image/*" @change="processFile">
			</div>

			<Modal v-if="maximizeAvatar"
				ref="modal" class="contact-header-modal"
				size="large" :title="contact.displayName"
				@close="toggleModal">
				<template #actions>
					<ActionButton v-if="!isReadOnly" icon="icon-upload" @click="selectFileInput">
						{{ t('contacts', 'Upload a new picture') }}
					</ActionButton>
					<ActionButton v-if="!isReadOnly" icon="icon-picture" @click="selectFilePicker">
						{{ t('contacts', 'Choose from files') }}
					</ActionButton>
					<ActionButton v-if="!isReadOnly" icon="icon-delete" @click="removePhoto">
						{{ t('contacts', 'Delete picture') }}
					</ActionButton>
					<ActionLink :href="`${contact.url}?photo`" icon="icon-download" target="_blank">
						{{ t('contacts', 'Download picture') }}
					</ActionLink>
				</template>
				<img ref="img" :src="contact.photoUrl" class="contact-header-modal__photo"
					:style="{ width, height }" @load="updateImgSize">
			</Modal>

			<!-- out of the avatar__options because of the overflow hidden -->
			<Actions :open="opened" class="contact-avatar-options__popovermenu">
				<ActionButton v-if="!isReadOnly" icon="icon-upload" @click="selectFileInput">
					{{ t('contacts', 'Upload a new picture') }}
				</ActionButton>
				<ActionButton v-if="!isReadOnly" icon="icon-picture" @click="selectFilePicker">
					{{ t('contacts', 'Choose from files') }}
				</ActionButton>
			</Actions>
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import { ActionLink, ActionButton } from 'nextcloud-vue'

import { getFilePickerBuilder } from 'nextcloud-dialogs'
import { generateRemoteUrl } from 'nextcloud-router'

const axios = () => import('axios')

export default {
	name: 'ContactDetailsAvatar',

	components: {
		ActionLink,
		ActionButton
	},

	props: {
		contact: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			maximizeAvatar: false,
			opened: false,
			loading: false,
			root: generateRemoteUrl(`dav/files/${OC.getCurrentUser().uid}`),
			width: 0,
			height: 0
		}
	},
	computed: {
		isReadOnly() {
			if (this.contact.addressbook) {
				return this.contact.addressbook.readOnly
			}
			return false
		}
	},
	mounted() {
		// update image size on window resize
		window.addEventListener('resize', debounce(() => {
			this.updateImgSize()
		}, 100))
	},
	methods: {
		/**
		 * Handler to store a new photo on the current contact
		 *
		 * @param {Object} event the event object containing the image
		 */
		processFile(event) {
			if (event.target.files && !this.loading) {
				this.closeMenu()

				let file = event.target.files[0]
				if (file && file.size && file.size <= 1 * 1024 * 1024) {
					let reader = new FileReader()
					let self = this

					reader.onload = function(e) {
						// only getting the raw binary base64
						self.setPhoto(reader.result.split(',').pop(), file.type)
					}

					reader.readAsDataURL(file)
				} else {
					OC.Notification.showTemporary(t('contacts', 'Image is too big (max 1MB).'))
					// reset input
					event.target.value = ''
					this.loading = false
				}
			}
		},

		/**
		 * Update the contact photo
		 *
		 * @param {String} data the photo as base64 binary string
		 * @param {String} type mimetype
		 */
		setPhoto(data, type) {
			// Vcard 3 and 4 have different syntax
			// https://tools.ietf.org/html/rfc2426#page-11
			if (this.contact.version === '3.0') {
				// check if photo property exists to decide whether to add/update it
				this.contact.photo
					? this.contact.photo = data
					: this.contact.vCard.addPropertyWithValue('photo', data)

				const photo = this.contact.vCard.getFirstProperty('photo')
				photo.setParameter('encoding', 'b')
				if (type) {
					photo.setParameter('type', type.split('/').pop())
				}
			} else {
				// https://tools.ietf.org/html/rfc6350#section-6.2.4
				// check if photo property exists to decide whether to add/update it
				this.contact.photo
					? this.contact.photo = `data:${type};base64,${data}`
					: this.contact.vCard.addPropertyWithValue('photo', `data:${type};base64,${data}`)
			}

			this.$store.dispatch('updateContact', this.contact)
			this.loading = false
		},

		/**
		 * Toggle the full image preview
		 */
		toggleModal() {
			// maximise or minimise avatar photo
			this.maximizeAvatar = !this.maximizeAvatar
		},

		/**
		 * Remove the contact's picture
		 */
		removePhoto() {
			this.contact.vCard.removeProperty('photo')
			this.maximizeAvatar = !this.maximizeAvatar
			this.$store.dispatch('updateContact', this.contact)
		},

		/**
		 * Picker handlers
		 */
		selectFileInput() {
			if (!this.loading) {
				this.$refs.uploadInput.click()
			}
		},
		async selectFilePicker() {
			if (!this.loading) {
				const picker = getFilePickerBuilder(t('contacts', 'Pick an avatar'))
					.setMimeTypeFilter([
						'image/png',
						'image/jpeg',
						'image/gif',
						'image/x-xbitmap',
						'image/bmp',
						'image/svg+xml'
					])
					.build()

				const file = await picker.pick()
				if (file) {
					this.loading = true
					try {
						const { get } = await axios()
						const response = await get(`${this.root}${file}`, {
							responseType: 'arraybuffer'
						})
						const type = response.headers['content-type']
						const data = Buffer.from(response.data, 'binary').toString('base64')
						this.setPhoto(data, type)
					} catch (error) {
						OC.Notification.showTemporary(t('contacts', 'Error while processing the picture.'))
						console.error(error)
						this.loading = false
					}
				}
			}
		},

		/**
		 * Menu handling
		 */
		toggleMenu() {
			// only open if not loading
			this.opened = !this.opened ? !this.opened && !this.loading : false
		},
		closeMenu() {
			this.opened = false
		},

		updateImgSize() {
			if (this.contact.photo && this.$refs.img) {
				this.updateHeightWidth(this.$refs.img.naturalHeight, this.$refs.img.naturalWidth)
			}
		},
		/**
		 * Updates the current height and width data
		 * based on the viewer maximum size
		 *
		 * @param {Integer} contentHeight your element height
		 * @param {Integer} contentWidth your element width
		 */
		updateHeightWidth(contentHeight, contentWidth) {
			const modalWrapper = this.$refs.modal.$el.querySelector('.modal-wrapper')
			if (modalWrapper) {
				const modalContainer = modalWrapper.querySelector('.modal-container')
				const wrapperMaxHeight = window.getComputedStyle(modalContainer).maxHeight.replace('%', '')
				const wrapperMaxWidth = window.getComputedStyle(modalContainer).maxWidth.replace('%', '')

				const parentHeight = Math.round(modalWrapper.clientHeight * Number(wrapperMaxHeight) / 100) - 50 // minus header
				const parentWidth = Math.round(modalWrapper.clientWidth * Number(wrapperMaxWidth) / 100)

				const heightRatio = parentHeight / contentHeight
				const widthRatio = parentWidth / contentWidth

				// if the video height is capped by the parent height
				// AND the video is bigger than the parent
				if (heightRatio < widthRatio && heightRatio < 1) {
					this.height = parentHeight + 'px'
					this.width = Math.round(contentWidth / contentHeight * parentHeight) + 'px'

				// if the video width is capped by the parent width
				// AND the video is bigger than the parent
				} else if (heightRatio > widthRatio && widthRatio < 1) {
					this.width = parentWidth + 'px'
					this.height = Math.round(contentHeight / contentWidth * parentWidth) + 'px'

				// RESET
				} else {
					// displaying tiny images makes no sense,
					// let's try to an least dispay them at 100x100
					// AND to keep the ratio
					if (contentHeight < 100) {
						this.height = 100 + 'px'
						this.width = null
					} else if (contentWidth < 100) {
						this.width = 100 + 'px'
						this.height = null
					} else {
						this.height = contentHeight + 'px'
						this.width = contentWidth + 'px'
					}
				}
			}
		}

	}

}
</script>
