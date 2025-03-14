<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-click-outside="closeMenu" class="contact-header-avatar__wrapper">
		<input id="contact-avatar-upload"
			ref="uploadInput"
			type="file"
			class="hidden"
			accept="image/*"
			@change="handleUploadedFile">

		<!-- Avatar display -->
		<Avatar :disable-tooltip="true"
			:display-name="contact.displayName"
			:is-no-user="true"
			:size="75"
			:url="photoUrl"
			class="contact-header-avatar__photo" />

		<NcModal :show.sync="showCropper" size="small" @close="cancel">
			<div class="avatar__container">
				<h2>{{ t('contacts', 'Crop contact photo') }}</h2>
				<VueCropper ref="cropper"
					class="avatar__cropper"
					v-bind="cropperOptions" />
				<div class="avatar__cropper-buttons">
					<NcButton type="tertiary" @click="cancel">
						{{ t('contacts', 'Cancel') }}
					</NcButton>
					<NcButton type="primary"
						@click="saveAvatar">
						{{ t('contacts', 'Save') }}
					</NcButton>
				</div>
			</div>
		</NcModal>

		<Actions v-if="!isReadOnly"
			:force-menu="true"
			:open.sync="opened"
			class="contact-header-avatar__menu">
			<template #icon>
				<IconImage :size="20" fill-color="#fff" />
			</template>
			<ActionButton @click.stop.prevent="selectFileInput">
				<template #icon>
					<IconUpload :size="20" />
				</template>
				{{ t('contacts', 'Upload a new picture') }}
			</ActionButton>
			<ActionButton @click="selectFilePicker">
				<template #icon>
					<IconFolder :size="20" />
				</template>
				{{ t('contacts', 'Choose from Files') }}
			</ActionButton>
			<ActionButton v-for="network in supportedSocial"
				:key="network"
				@click="getSocialAvatar(network)">
				<template #icon>
					<IconCloudDownload :size="20" />
				</template>
				{{ t('contacts', 'Get from ' + network) }}
			</ActionButton>

			<template v-if="contact.photo">
				<!-- FIXME: the link seems to have a bigger font size than the button caption -->
				<ActionLink :href="`${contact.url}?photo`"
					target="_blank">
					<template #icon>
						<IconDownload :size="20" />
					</template>
					{{ t('contacts', 'Download picture') }}
				</ActionLink>
				<ActionButton @click="removePhoto">
					<template #icon>
						<IconDelete :size="20" />
					</template>
					{{ t('contacts', 'Delete picture') }}
				</ActionButton>
			</template>
		</Actions>
	</div>
</template>

<script>
import {
	NcAvatar as Avatar,
	NcActions as Actions,
	NcActionButton as ActionButton,
	NcActionLink as ActionLink,
	NcButton,
	NcModal,
} from '@nextcloud/vue'
import IconDownload from 'vue-material-design-icons/Download.vue'
import IconCloudDownload from 'vue-material-design-icons/CloudDownload.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import IconUpload from 'vue-material-design-icons/Upload.vue'
import IconFolder from 'vue-material-design-icons/Folder.vue'
import IconImage from 'vue-material-design-icons/Image.vue'
import VueCropper from 'vue-cropperjs'
// eslint-disable-next-line n/no-extraneous-import
import 'cropperjs/dist/cropper.css'

import { showError, showInfo, getFilePickerBuilder, showSuccess } from '@nextcloud/dialogs'
import { generateUrl, generateRemoteUrl } from '@nextcloud/router'
import { getCurrentUser } from '@nextcloud/auth'
import { loadState } from '@nextcloud/initial-state'
import sanitizeSVG from '@mattkrick/sanitize-svg'
import axios from '@nextcloud/axios'

import logger from '../../services/logger.js'

const supportedNetworks = loadState('contacts', 'supportedNetworks')

export default {
	name: 'ContactDetailsAvatar',

	components: {
		ActionButton,
		ActionLink,
		Actions,
		Avatar,
		IconCloudDownload,
		IconDownload,
		IconDelete,
		IconUpload,
		IconFolder,
		IconImage,
		NcButton,
		VueCropper,
		NcModal,
	},

	props: {
		contact: {
			type: Object,
			required: true,
		},
		isReadOnly: {
			type: Boolean,
			required: true,
		},
		reloadBus: {
			type: Object,
			required: true,
		},
	},

	data() {
		return {
			opened: false,
			loading: false,
			photoUrl: undefined,
			root: generateRemoteUrl(`dav/files/${getCurrentUser().uid}`),
			showCropper: false,
			cropperOptions: {
				aspectRatio: 1 / 1,
				viewMode: 3,
				guides: false,
				center: false,
				highlight: false,
				autoCropArea: 1,
				dragMode: 'move',
				minContainerWidth: 100,
				minContainerHeight: 100,
			},
		}
	},

	computed: {
		supportedSocial() {
			const emails = this.contact.vCard.getAllProperties('email')
			// get social networks set for the current contact
			const availableSocial = this.contact.vCard.getAllProperties('x-socialprofile')
				.map(a => a.jCal[1].type.toString().toLowerCase())
			const availableMessenger = this.contact.vCard.getAllProperties('impp')
				.map(a => a.jCal[1].type.toString().toLowerCase())
			const available = [].concat(availableSocial, availableMessenger)
			// get list of social networks that allow for avatar download
			const supported = supportedNetworks.map(v => v.toLowerCase())
			if (emails.length) {
				available.push('gravatar')
			}
			// return supported social networks which are set
			return supported.filter(i => available.includes(i))
				.map(j => this.capitalize(j))
		},
	},

	watch: {
		async contact() {
			await this.loadPhotoUrl()
		},
	},

	async mounted() {
		await this.loadPhotoUrl()
	},

	methods: {
		onLoad(...args) {
			console.debug(...args)
		},

		/**
		 * Checks the selected image for mimetype
		 * and open the cropper if valid, else show error
		 *
		 * @param {Buffer} data the image
		 * @return {boolean}
		 */
		async processPicture(data) {

			const type = this.getMimetype(data)

			if (!type.startsWith('image/')) {
				showError(t('contacts', 'Please select a valid format'))
				return false
			}

			if (type === 'image/svg') {
				const imageSvg = atob(data.toString('base64'))
				const cleanSvg = await sanitizeSVG(imageSvg)
				if (!cleanSvg) {
					throw new Error('Unsafe svg image', imageSvg)
				}
			}

			this.openCropper(data, type)
			return true
		},

		/**
		 * Open the cropper-modal with the provided data
		 *
		 * @param {Buffer} data the image
		 * @param {string} type of the image
		 */
		openCropper(data, type) {
			const ccc = `data:${type};base64,${data.toString('base64')}`
			this.$refs.cropper.replace(ccc)
			this.showCropper = true
		},

		/**
		 * Handle the uploaded file
		 *
		 * @param {object} event the event object containing the image
		 */
		handleUploadedFile(event) {
			if (event.target.files && !this.loading) {
				this.closeMenu()

				const file = event.target.files[0]

				const reader = new FileReader()

				reader.onload = (e) => {
					try {
						if (typeof e.target.result === 'object') {

							const data = Buffer.from(e.target.result, 'binary')

							if (this.processPicture(data)) {
								return
							}

							throw new Error('Wrong image mimetype')
						}

					} catch (error) {
						console.error(error)
						showError(t('contacts', 'Invalid image'))
					} finally {
						this.resetPicker()
					}
				}

				reader.readAsArrayBuffer(file)
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
		 * @return {string} the word with the first letter capitalized
		 */
		capitalize(word) {
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		},
		/**
		 * Return the mimetype based on the first 4 byte
		 *
		 * @param {Uint8Array} uint content
		 * @return {string} the mimetype
		 */
		getMimetype(uint) {
			const bytes = []
			uint.slice(0, 12).forEach((byte) => {
				bytes.push(byte.toString(16).padStart(2, '0'))
			})
			const hex = bytes.join('').toUpperCase()

			const nextcloudMajorVersion = parseInt(window.OC.config.version.split('.')[0])
			if (nextcloudMajorVersion >= 31
				&& hex.slice(0, 8) === '52494646'
				&& hex.slice(16, 24) === '57454250'
			) {
				return 'image/webp'
			}

			if (nextcloudMajorVersion >= 32 && hex.slice(8, 24) === '6674797061766966') {
				return 'image/avif'
			}

			switch (hex.slice(0, 8)) {
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
		 * @param {string} data the photo as base64 binary string
		 * @param {string} type mimetype
		 */
		async setPhoto(data, type) {
			// Init with empty data
			if (this.contact.photo) {
				this.contact.vCard.addPropertyWithValue('photo', '')
			}

			// Vcard 3 and 4 have different syntax
			// https://tools.ietf.org/html/rfc2426#page-11
			if (this.contact.version === '3.0') {
				// eslint-disable-next-line vue/no-mutating-props
				this.contact.photo = data

				const photo = this.contact.vCard.getFirstProperty('photo')
				photo.setParameter('encoding', 'b')
				if (type) {
					photo.setParameter('type', type.split('/').pop())
				}
			} else {
				// https://tools.ietf.org/html/rfc6350#section-6.2.4
				// eslint-disable-next-line vue/no-mutating-props
				this.contact.photo = `data:${type};base64,${data}`
			}

			await this.$store.dispatch('updateContact', this.contact)

			await this.loadPhotoUrl()

			await this.reloadBus.emit('reload-avatar', this.contact.key)

			this.loading = false
		},

		async loadPhotoUrl() {
			this.photoUrl = undefined
			if (this.contact.photo) {
				const photoUrl = await this.contact.getPhotoUrl()
				if (!photoUrl) {
					console.warn('contact has an invalid photo')
					return
				}
				this.photoUrl = photoUrl
			} else if (this.contact.url) {
				this.photoUrl = `${this.contact.url}?photo`
			}
		},

		/**
		 * Save the cropped image
		 */
		saveAvatar() {
			this.showCropper = false
			this.loading = true

			this.$refs.cropper.getCroppedCanvas({
				minWidth: 16,
				minHeight: 16,
				maxWidth: 512,
				maxHeight: 512,
			}).toBlob(async (blob) => {
				if (blob === null) {
					showError(t('contacts', 'Error cropping picture'))
					this.cancel()
					return
				}

				const reader = new FileReader()
				reader.readAsDataURL(blob)
				reader.onloadend = () => {
					const base64data = reader.result
					this.setPhoto(base64data.split(',').pop(), blob.type)
				}
			})
		},

		/**
		 * Remove the contact's picture
		 */
		removePhoto() {
			this.contact.vCard.removeAllProperties('photo')
			this.$store.dispatch('updateContact', this.contact)
			// somehow the avatarUrl is not unavailable immediately, so we just set undefined
			this.photoUrl = undefined
			this.reloadBus.emit('delete-avatar', this.contact.key)
		},

		/**
		 * Cancel cropping
		 */
		cancel() {
			this.showCropper = false
			this.loading = false
		},

		/**
		 * Picker handlers Upload
		 */
		selectFileInput() {
			if (!this.loading) {
				this.$refs.uploadInput.click()
			}
		},

		/**
		 * Picker handlers from Files
		 */
		async selectFilePicker() {
			if (!this.loading) {
				this.closeMenu()

				const picker = getFilePickerBuilder(t('contacts', 'Pick an avatar'))
					.setMimeTypeFilter([
						'image/png',
						'image/jpeg',
						'image/gif',
						'image/x-xbitmap',
						'image/bmp',
						'image/svg+xml',
					]).addButton({
						label: t('calendar', 'Pick'),
						type: 'primary',
						callback: (nodes) => logger.debug('Picked avatar', { nodes }),
					})
					.build()

				const file = await picker.pick()

				if (file) {
					this.loading = true
					try {

						const response = await axios.get(`${this.root}${file}`, {
							responseType: 'arraybuffer',
						})

						const data = Buffer.from(response.data, 'binary')

						this.processPicture(data)

					} catch (error) {
						showError(t('contacts', 'Error while processing the picture.'))
						console.error(error)
						this.loading = false
					} finally {
						this.resetPicker()
					}
				}
			}
		},

		/**
		 * Downloads the Avatar from social media
		 *
		 * @param {string} network the social network to use (or 'any' for first match)
		 */
		async getSocialAvatar(network) {

			if (!this.loading) {

				this.loading = true
				try {
					const response = await axios.put(generateUrl('/apps/contacts/api/v1/social/avatar/{network}/{id}/{uid}', {
						network: network.toLowerCase(),
						id: this.contact.addressbook.id,
						uid: this.contact.uid,
					}))
					if (response?.status !== 200) {
						throw new URIError('Download of social profile avatar failed')
					}

					// Fetch newly updated contact
					await this.$store.dispatch('fetchFullContact', { contact: this.contact, forceReFetch: true })

					// Update local clone
					const contact = this.$store.getters.getContact(this.contact.key)
					await this.$emit('update-local-contact', contact)

					await this.loadPhotoUrl()

					await this.reloadBus.emit('reload-avatar', this.contact.key)

					// Notify user
					showSuccess(t('contacts', 'Avatar downloaded from social network'))
				} catch (error) {
					if (error?.response?.status === 304) {
						showInfo(t('contacts', 'Avatar already up to date'))
					} else {
						showError(t('contacts', 'Avatar download failed'))
						console.debug(error)
					}
				}
			}
			this.loading = false
		},

		closeMenu() {
			this.opened = false
		},

	},

}
</script>
<style lang="scss" scoped>
.avatar {
	&__container {
		margin: 0 auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 16px 0;
		width: 300px;

		span {
			color: var(--color-text-lighter);
		}
	}

	&__preview {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 180px;
		height: 180px;
	}

	&__buttons {
		display: flex;
		gap: 0 10px;
	}

	&__cropper {
		overflow: hidden;

		&-buttons {
			width: 100%;
			display: flex;
			justify-content: space-between;
		}

		&:deep(.cropper-view-box) {
			border-radius: 50%;
		}
	}
}

.contact-header-avatar {
	// Wrap and cut
	&__wrapper {
		position: relative;
		width: var(--avatar-size);
		height: var(--avatar-size);
	}
	&__background {
		z-index: 0;
		top: 50px;
		left: 0;
		opacity: .2;
	}

	&__photo,
	&__menu {
		overflow: hidden;
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	&__photo {
		z-index: 10;
		cursor: pointer;
		// White background for avatars with transparency, also in dark theme
		background-color: #fff;
		background-repeat: no-repeat;
		background-position: center;
		background-size: cover;
	}

	&__menu {
		z-index: 11;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, .2);
		// Always show max opacity, let the background-color be the visual cue
		&:deep(.action-item__menutoggle) {
			opacity: 1;
		}
	}

	// Move the menu in the bottom right if there is a picture already
	&__photo + &__menu {
		position: absolute !important;
		// bottom right
		top: 100%;
		left: 100%;
		width: 44px;
		height: 44px;
		margin: -50%;
		&:deep {
			.action-item__menutoggle {
				opacity: .7;
				background-color: rgba(0, 0, 0, .2);
			}
			&.action-item--open .action-item__menutoggle,
			.action-item__menutoggle:hover,
			.action-item__menutoggle:active,
			.action-item__menutoggle:focus {
				opacity: 1;
			}
		}
	}
}

.contact-header-modal {
	// We use this nesting of containers and max/width-height
	// to make automatically contain the image.
	// Because of that, we now fill the modal-container,
	// so we need to watch for click on the photo-wrapper to
	// close on image click outside.
	&:deep(.modal-container) {
		background-color: transparent;
		box-shadow: none;

		&,
		.contact-header-modal__photo-wrapper {
			// center and align nested containers & image
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.contact-header-modal__photo-wrapper {
			// contain image
			width: 100%;
			height: 100%;
			cursor: pointer;
		}

		.contact-header-modal__photo {
			// preserve ratio
			max-width: 100%;
			max-height: 100%;
			// animate zooming/resize
			transition: height 100ms ease,
				width 100ms ease;
			border-radius: var(--border-radius-large);
			// make sure transparent images are visible
			background-color: white;
		}
	}
}

</style>
