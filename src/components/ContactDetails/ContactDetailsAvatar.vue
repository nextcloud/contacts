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
	<div v-click-outside="closeMenu" class="contact-header-avatar__wrapper">
		<input id="contact-avatar-upload"
			ref="uploadInput"
			type="file"
			class="hidden"
			accept="image/*"
			@change="processFile">

		<!-- Avatar display -->
		<Avatar
			:disable-tooltip="true"
			:display-name="contact.displayName"
			:is-no-user="true"
			:size="75"
			:url="photoUrl"
			class="contact-header-avatar__photo" />

		<Actions
			v-if="!isReadOnly || contact.photo"
			:force-menu="true"
			:open.sync="opened"
			class="contact-header-avatar__menu">
			<template #icon>
				<IconImage :size="20" fill-color="#fff" />
			</template>
			<template v-if="!isReadOnly">
				<ActionButton
					@click.stop.prevent="selectFileInput">
					<template #icon>
						<IconUpload :size="20" />
					</template>
					{{ t('contacts', 'Upload a new picture') }}
				</ActionButton>
				<ActionButton
					@click="selectFilePicker">
					<template #icon>
						<IconFolder :size="20" />
					</template>
					{{ t('contacts', 'Choose from Files') }}
				</ActionButton>
				<ActionButton
					v-for="network in supportedSocial"
					:key="network"
					@click="getSocialAvatar(network)">
					<template #icon>
						<IconCloudDownload :size="20" />
					</template>
					{{ t('contacts', 'Get from ' + network) }}
				</ActionButton>
			</template>

			<template v-if="contact.photo">
				<!-- FIXME: the link seems to have a bigger font size than the button caption -->
				<ActionLink
					:href="`${contact.url}?photo`"
					target="_blank">
					<template #icon>
						<IconDownload :size="20" />
					</template>
					{{ t('contacts', 'Download picture') }}
				</ActionLink>
				<ActionButton
					v-if="!isReadOnly"
					@click="removePhoto">
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
import Avatar from '@nextcloud/vue/dist/Components/NcAvatar'
import Actions from '@nextcloud/vue/dist/Components/NcActions'
import ActionButton from '@nextcloud/vue/dist/Components/NcActionButton'
import ActionLink from '@nextcloud/vue/dist/Components/NcActionLink'
import IconDownload from 'vue-material-design-icons/Download'
import IconCloudDownload from 'vue-material-design-icons/CloudDownload'
import IconDelete from 'vue-material-design-icons/Delete'
import IconUpload from 'vue-material-design-icons/Upload'
import IconFolder from 'vue-material-design-icons/Folder'
import IconImage from 'vue-material-design-icons/Image'

import { showError, showInfo, getFilePickerBuilder, showSuccess } from '@nextcloud/dialogs'
import { generateUrl, generateRemoteUrl } from '@nextcloud/router'
import { getCurrentUser } from '@nextcloud/auth'
import { loadState } from '@nextcloud/initial-state'
import sanitizeSVG from '@mattkrick/sanitize-svg'

import axios from '@nextcloud/axios'

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
	},

	props: {
		contact: {
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
			const emails = this.contact.vCard.getAllProperties('email')
			// get social networks set for the current contact
			const available = this.contact.vCard.getAllProperties('x-socialprofile')
				.map(a => a.jCal[1].type.toString().toLowerCase())
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
		onLoad() {
			console.debug(...arguments)
		},
		/**
		 * Handler to store a new photo on the current contact
		 *
		 * @param {object} event the event object containing the image
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
									throw new Error('Unsafe svg image', imageSvg)
								}
							}

							// All is well! Set the photo
							self.setPhoto(imageBase64, type)
						} catch (error) {
							console.error(error)
							showError(t('contacts', 'Invalid image'))
						} finally {
							self.resetPicker()
						}
					}

					// start by reading the magic bytes to detect proper photo mimetype
					const blob = file.slice(0, 4)
					reader.readAsArrayBuffer(blob)
				} else {
					showError(t('contacts', 'Image is too big (max 1MB).'))
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
		 * @return {string} the word with the first letter capitalized
		 */
		capitalize(word) {
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		},
		/**
		 * Return the mimetype based on the first magix byte
		 *
		 * @param {string} signature the first 4 bytes
		 * @return {string} the mimetype
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
		 * @param {string} data the photo as base64 binary string
		 * @param {string} type mimetype
		 */
		setPhoto(data, type) {
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

			this.$store.dispatch('updateContact', this.contact)
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
		 * Remove the contact's picture
		 */
		removePhoto() {
			this.contact.vCard.removeAllProperties('photo')
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
						showError(t('contacts', 'Error while processing the picture.'))
						console.error(error)
						this.loading = false
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
		&::v-deep .action-item__menutoggle {
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
		&::v-deep {
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
	&::v-deep .modal-container {
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
