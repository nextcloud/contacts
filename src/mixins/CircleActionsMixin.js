import { showError } from '@nextcloud/dialogs'
/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { emit } from '@nextcloud/event-bus'
import Circle from '../models/circle.ts'
import Member from '../models/member.ts'
import { joinCircle } from '../services/circles.ts'
import CopyToClipboardMixin from './CopyToClipboardMixin.js'

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
			return t('contacts', 'Join team')
		},
	},

	methods: {
		confirmLeaveCircle() {
			window.OC.dialogs.confirmDestructive(
				t('contacts', 'You are about to leave {circle}.\nAre you sure?', {
					circle: this.circle.displayName,
				}),
				t('contacts', 'Please confirm team leave'),
				window.OC.dialogs.YES_NO_BUTTONS,
				this.leaveCircle,
				true,
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

				// Reset initiator
				this.circle.initiator = null
			} catch (error) {
				console.error('Could not leave the circle', member, error)
				showError(t('contacts', 'Could not leave the team {displayName}', this.circle))
			} finally {
				this.loadingAction = false
			}
		},

		async joinCircle() {
			this.loadingJoin = true
			try {
				const initiator = await joinCircle(this.circle.id)
				const member = new Member(initiator, this.circle)

				// Update initiator with newest membership values
				this.circle.initiator = member

				// Append new member
				member.circle.addMember(member)
			} catch (error) {
				showError(t('contacts', 'Unable to join the team'))
				console.error('Unable to join the circle', error)
			} finally {
				this.loadingJoin = false
			}
		},

		confirmDeleteCircle() {
			window.OC.dialogs.confirmDestructive(
				t('contacts', 'You are about to delete {circle}.\nAre you sure?', {
					circle: this.circle.displayName,
				}),
				t('contacts', 'Please confirm team deletion'),
				window.OC.dialogs.YES_NO_BUTTONS,
				this.deleteCircle,
				true,
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
				showError(t('contacts', 'Unable to delete the team'))
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
			} catch (error) {
				console.error('Could not open circle member picker', error)
			}
			emit('contacts:circles:append', this.circle.id)
		},
	},
}
