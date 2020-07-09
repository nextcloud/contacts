<!--
  - @copyright Copyright (c) 2018 Team Popcorn <teampopcornberlin@gmail.com>
  -
  - @author Team Popcorn <teampopcornberlin@gmail.com>
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  - @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
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

			<div v-if="contact.photo"
				:style="{ 'backgroundImage': `url(${contact.photoUrl})` }"
				class="contact-header-avatar__photo"
				@click="toggleModal" />

			<div v-click-outside="closeMenu" class="contact-header-avatar__options">
				<a v-tooltip.bottom="t('contacts', 'Add a new picture')"
					href="#"
					class="contact-avatar-options"
					:class="loading ? 'icon-loading-small' : 'icon-picture-force-white'"
					@click.stop.prevent="toggleMenu" />
				<input id="contact-avatar-upload"
					ref="uploadInput"
					type="file"
					class="hidden"
					accept="image/*"
					@change="processFile">
			</div>

			<Modal v-if="maximizeAvatar"
				ref="modal"
				:clear-view-delay="-1"
				class="contact-header-modal"
				size="large"
				:title="contact.displayName"
				@close="toggleModal">
				<template #actions>
					<ActionButton v-if="!isReadOnly" icon="icon-upload" @click="selectFileInput">
						{{ t('contacts', 'Upload new picture') }}
					</ActionButton>
					<ActionButton v-if="!isReadOnly" icon="icon-folder" @click="selectFilePicker">
						{{ t('contacts', 'Choose from files') }}
					</ActionButton>
					<ActionLink :href="`${contact.url}?photo`" icon="icon-download" target="_blank">
						{{ t('contacts', 'Download picture') }}
					</ActionLink>
					<ActionButton v-if="!isReadOnly" icon="icon-delete" @click="removePhoto">
						{{ t('contacts', 'Delete picture') }}
					</ActionButton>
				</template>
				<img ref="img"
					:src="contact.photoUrl"
					class="contact-header-modal__photo"
					:style="{ width, height }"
					@load="updateImgSize">
			</Modal>

			<!-- out of the avatar__options because of the overflow hidden -->
			<Actions v-if="!isReadOnly" :open="opened" class="contact-avatar-options__popovermenu">
				<ActionButton icon="icon-upload" @click="selectFileInput">
					{{ t('contacts', 'Upload a new picture') }}
				</ActionButton>
				<ActionButton icon="icon-picture" @click="selectFilePicker">
					{{ t('contacts', 'Choose from files') }}
				</ActionButton>
				<ActionButton
					v-for="network in supportedSocial"
					:key="network"
					:icon="'icon-' + network.toLowerCase()"
					@click="getSocialAvatar(network)">
					{{ t('contacts', 'Get from ' + network) }}
				</ActionButton>
			</Actions>
		</div>
	</div>
</template>

<script>
import debounce from 'debounce'
import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionLink from '@nextcloud/vue/dist/Components/ActionLink'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import Modal from '@nextcloud/vue/dist/Components/Modal'

import { getFilePickerBuilder } from '@nextcloud/dialogs'
import { generateUrl, generateRemoteUrl } from '@nextcloud/router'
import { getCurrentUser } from '@nextcloud/auth'
import { loadState } from '@nextcloud/initial-state'
import sanitizeSVG from '@mattkrick/sanitize-svg'

import axios from '@nextcloud/axios'

const supportedNetworks = loadState('contacts', 'supportedNetworks')

export default {
	name: 'ContactDetailsAvatar',

	components: {
		Actions,
		ActionLink,
		ActionButton,
		Modal,
	},

	props: {
		contact: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			maximizeAvatar: false,
			opened: false,
			loading: false,
			root: generateRemoteUrl(`dav/files/${getCurrentUser().uid}`),
			width: 0,
			height: 0,
		}
	},
	computed: {
		isReadOnly() {
			if (this.contact.addressbook) {
				return this.contact.addressbook.readOnly
			}
			return false
		},
		supportedSocial() {
			// get social networks set for the current contact
			const available = this.contact.vCard.getAllProperties('x-socialprofile')
				.map(a => a.jCal[1].type.toString().toLowerCase())
			// get list of social networks that allow for avatar download
			const supported = supportedNetworks.map(v => v.toLowerCase())
			// return supported social networks which are set
			return supported.filter(i => available.includes(i))
				.map(j => this.capitalize(j))
		},
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

				const file = event.target.files[0]
				if (file && file.size && file.size <= 1 * 1024 * 1024) {
					const reader = new FileReader()
					const self = this
					let type = ''

					reader.onloadend = async function(e) {
						try {
							// We got an ArrayBuffer, checking the true mime type...
							if (typeof e.target.result === 'object') {
								const uint = new Uint8Array(e.target.result)
								const bytes = []
								uint.forEach((byte) => {
									bytes.push(byte.toString(16))
								})
								const hex = bytes.join('').toUpperCase()

								if (self.getMimetype(hex).startsWith('image/')) {
									type = self.getMimetype(hex)
									// we got a valid image, read it again as base64
									reader.readAsDataURL(file)
									return
								}
								throw new Error('Wrong image mimetype')
							}

							// else we got the base64 and we're good to go!
							const imageBase64 = e.target.result.split(',').pop()

							if (e.target.result.indexOf('image/svg') > -1) {
								const imageSvg = atob(imageBase64)
								const cleanSvg = await sanitizeSVG(imageSvg)
								if (!cleanSvg) {
									throw new Error('Unsafe svg image')
								}
							}

							// All is well! Set the photo
							self.setPhoto(imageBase64, type)
						} catch (error) {
							console.error(error)
							OC.Notification.showTemporary(t('contacts', 'Invalid image'))
						} finally {
							self.resetPicker()
						}
					}

					// start by reading the magic bytes to detect proper photo mimetype
					const blob = file.slice(0, 4)
					reader.readAsArrayBuffer(blob)
				} else {
					OC.Notification.showTemporary(t('contacts', 'Image is too big (max 1MB).'))
					this.resetPicker()
				}
			}
		},

		/**
		 * Reset image pciker input
		 */
		resetPicker() {
			// reset input
			this.$refs.uploadInput.value = ''
			this.loading = false
		},
		/**
		 * Return the word with (only) the first letter capitalized
		 *
		 * @param {string} word the word to handle
		 * @returns {string} the word with the first letter capitalized
		 */
		capitalize(word) {
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		},
		/**
		 * Return the mimetype based on the first magix byte
		 *
		 * @param {string} signature the first 4 bytes
		 * @returns {string} the mimetype
		 */
		getMimetype(signature) {
			switch (signature) {
			case '89504E47':
				return 'image/png'
			case '47494638':
				return 'image/gif'
			case '3C3F786D':
			case '3C737667':
				return 'image/svg+xml'
			case 'FFD8FFDB':
			case 'FFD8FFE0':
			case 'FFD8FFE1':
				return 'image/jpeg'
			default:
				return 'application/octet-stream'
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
						'image/svg+xml',
					])
					.build()

				const file = await picker.pick()
				if (file) {
					this.loading = true
					try {
						const response = await axios.get(`${this.root}${file}`, {
							responseType: 'arraybuffer',
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
		 * Downloads the Avatar from social media
		 *
		 * @param {String} network the social network to use (or 'any' for first match)
		 */
		async getSocialAvatar(network) {

			if (!this.loading) {

				this.loading = true
				try {
					const response = await axios.get(generateUrl('/apps/contacts/api/v1/social/avatar/{network}/{id}/{uid}', {
						network: network.toLowerCase(),
						id: this.contact.addressbook.id,
						uid: this.contact.uid,
					}))
					if (response.status !== 200) {
						throw new URIError('Download of social profile avatar failed')
					}

					// Fetch newly updated contact
					await this.$store.dispatch('fetchFullContact', { contact: this.contact, forceReFetch: true })

					// Update local clone
					const contact = this.$store.getters.getContact(this.contact.key)
					await this.$emit('updateLocalContact', contact)

					// Notify user
					OC.Notification.showTemporary(t('contacts', 'Avatar downloaded from social network'))
				} catch (error) {
					if (error.response.status === 304) {
						OC.Notification.showTemporary(t('contacts', 'Avatar already up to date'))
					} else {
						OC.Notification.showTemporary(t('contacts', 'Avatar download failed'))
						console.debug(error)
					}
				}
			}
			this.loading = false
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
		},

	},

}
</script>
