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
			<div v-if="contact.photo" :style="{ 'backgroundImage': `url(${photo})` }"
				class="contact-header-avatar__photo"
				@click="toggleModal" />

			<div v-click-outside="closeMenu" class="contact-header-avatar__options">
				<a v-tooltip.bottom="t('contacts', 'Add a new picture')" href="#" class="contact-avatar-options"
					:class="loading ? 'icon-loading-small' : 'icon-picture-force-white'"
					@click.prevent="toggleMenu" />
				<input id="contact-avatar-upload" ref="uploadInput" type="file"
					class="hidden" accept="image/*" @change="processFile">
			</div>

			<modal v-if="maximizeAvatar" ref="modal" class="contact-header-modal"
				:actions="modalActions" size="large" :title="contact.displayName"
				@close="toggleModal">
				<img ref="img" :src="photo" class="contact-header-modal__photo"
					:style="{ width, height }" @load="updateImgSize">
			</modal>

			<!-- out of the avatar__options because of the overflow hidden -->
			<div :class="{ 'open': opened }" class="contact-avatar-options__popovermenu popovermenu">
				<popover-menu :menu="actions" />
			</div>
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'

import { pickFileOrDirectory } from 'nextcloud-server/dist/files'
import { generateRemoteUrl } from 'nextcloud-server/dist/router'

const axios = () => import('axios')

export default {
	name: 'ContactAvatar',

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
		photo() {
			const type = this.contact.vCard.getFirstProperty('photo').type
			if (!this.contact.photo.startsWith('data') && type === 'binary') {
				// split on coma in case of any leftover base64 data and retrieve last part
				// usually we come to this part when the base64 image type is unknown
				return `data:image;base64,${this.contact.photo.split(',').pop()}`
			}
			return this.contact.photo
		},
		actions() {
			return [
				{
					icon: 'icon-upload',
					text: t('contacts', 'Upload a new picture'),
					action: this.selectFileInput
				},
				{
					icon: 'icon-picture',
					text: t('contacts', 'Choose from files'),
					action: this.selectFilePicker
				}
			]
		},
		modalActions() {
			return [...this.actions, ...[
				{
					icon: 'icon-delete',
					text: t('contacts', 'Delete picture'),
					action: this.removePhoto
				},
				{
					icon: 'icon-download',
					text: t('contacts', 'Download picture'),
					href: this.contact.url + '?photo',
					target: '_blank'
				}
			]]
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
						self.setPhoto(reader.result)
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
		 * @param {String} value the photo as base64
		 */
		setPhoto(value) {
			// check if photo property exists to decide whether to add/update it
			this.contact.photo
				? this.contact.photo = value
				: this.contact.vCard.addPropertyWithValue('photo', value)

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
				const file = await pickFileOrDirectory(
					t('contacts', 'Pick an avatar'),
					false,
					[
						'image/png',
						'image/jpeg',
						'image/gif',
						'image/x-xbitmap',
						'image/bmp',
						'image/svg+xml'
					]
				)
				if (file) {
					this.loading = true
					try {
						const { get } = await axios()
						const response = await get(`${this.root}${file}`, {
							responseType: 'arraybuffer'
						})
						const data = `data:${response.headers['content-type']};base64,${Buffer.from(response.data, 'binary').toString('base64')}`
						this.setPhoto(data)
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
			if (this.contact.photo) {
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
