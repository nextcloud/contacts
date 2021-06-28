/**
 * @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { emit } from '@nextcloud/event-bus'
import { showError } from '@nextcloud/dialogs'

import { joinCircle } from '../services/circles.ts'
import Circle from '../models/circle.ts'
import CopyToClipboardMixin from './CopyToClipboardMixin'

export default {

	props: {
		circle: {
			type: Circle,
			required: true,
		},
	},

	mixins: [CopyToClipboardMixin],

	data() {
		return {
			loadingAction: false,
			loadingJoin: false,
		}
	},

	computed: {
		copyButtonText() {
			if (this.copied) {
				return this.copySuccess
					? t('contacts', 'Copied')
					: t('contacts', 'Could not copy')
			}
			return t('contacts', 'Copy link')
		},

		circleUrl() {
			const route = this.$router.resolve(this.circle.router)
			return window.location.origin + route.href
		},

		joinButtonTitle() {
			if (this.circle.requireJoinAccept) {
				return t('contacts', 'Request to join')
			}
			return t('contacts', 'Join circle')
		},
	},

	methods: {
		confirmLeaveCircle() {
			OC.dialogs.confirmDestructive(
				t('contacts', 'You are about to leave {circle}.\nAre you sure?', {
					circle: this.circle.displayName,
				}),
				t('contacts', 'Please confirm circle leave'),
				OC.dialogs.YES_NO_BUTTONS,
				this.leaveCircle,
				true
			)
		},
		async leaveCircle(confirm) {
			if (!confirm) {
				this.logger.debug('Circle leave cancelled')
				return
			}

			this.loadingAction = true
			const member = this.circle.initiator

			try {
				await this.$store.dispatch('deleteMemberFromCircle', {
					member,
					leave: true,
				})
			} catch (error) {
				console.error('Could not leave the circle', member, error)
				showError(t('contacts', 'Could not leave the circle {displayName}', this.circle))
			} finally {
				this.loadingAction = false
			}

		},

		async joinCircle() {
			this.loadingJoin = true
			try {
				await joinCircle(this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to join the circle'))
			} finally {
				this.loadingJoin = false
			}

		},

		confirmDeleteCircle() {
			OC.dialogs.confirmDestructive(
				t('contacts', 'You are about to delete {circle}.\nAre you sure?', {
					circle: this.circle.displayName,
				}),
				t('contacts', 'Please confirm circle deletion'),
				OC.dialogs.YES_NO_BUTTONS,
				this.deleteCircle,
				true
			)
		},
		async deleteCircle(confirm) {
			if (!confirm) {
				this.logger.debug('Circle deletion cancelled')
				return
			}

			this.loadingAction = true

			try {
				this.$store.dispatch('deleteCircle', this.circle.id)
			} catch (error) {
				showError(t('contacts', 'Unable to delete the circle'))
			} finally {
				this.loadingAction = false
			}
		},

		/**
		 * Trigger the entity picker view
		 */
		async addMemberToCircle() {
			try {
				// Avoid VueRouter NavigationDuplicated
				await this.$router.push(this.circle.router)
			} catch (error) {}
			emit('contacts:circles:append', this.circle.id)
		},
	},
}
