<!--
	- @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
	-
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
	<AppContentDetails>
		<!-- contact header -->
		<DetailsHeader>
			<!-- avatar and upload photo -->
			<template #avatar="{avatarSize}">
				<Avatar
					:disable-tooltip="true"
					:display-name="circle.displayName"
					:is-no-user="true"
					:size="avatarSize" />
			</template>

			<!-- display name -->
			<input
				slot="title"
				v-model="circle.displayName"
				:readonly="!circle.isOwner"
				:placeholder="t('contacts', 'Circle name')"
				type="text"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false"
				name="displayname"
				@input="onDisplayNameChangeDebounce">

			<!-- org, title -->
			<template v-if="!circle.isOwner" #subtitle>
				{{ t('contacts', 'Circle owned by {owner}', { owner: circle.owner.displayName}) }}
			</template>

			<!-- actions -->
			<template #actions>
				<Actions>
					<!-- copy circle link -->
					<ActionLink
						:href="circleUrl"
						:icon="copyLinkIcon"
						@click.stop.prevent="copyToClipboard(circleUrl)">
						{{ copyButtonText }}
					</ActionLink>
				</Actions>

				<Actions>
					<!-- leave circle -->
					<ActionButton
						v-if="circle.canLeave"
						@click="confirmLeaveCircle">
						{{ t('contacts', 'Leave circle') }}
						<ExitToApp slot="icon"
							:size="16"
							decorative />
					</ActionButton>

					<!-- join circle -->
					<ActionButton
						v-else-if="!circle.isMember && circle.canJoin"
						@click="joinCircle">
						{{ joinButtonTitle }}
						<LocationEnter slot="icon"
							:size="16"
							decorative />
					</ActionButton>
				</Actions>
			</template>

			<!-- menu actions -->
			<template #actions-menu>
				<!-- delete circle -->
				<ActionButton
					v-if="circle.canDelete"
					icon="icon-delete"
					@click="confirmDeleteCircle">
					{{ t('contacts', 'Delete') }}
				</ActionButton>
			</template>
		</DetailsHeader>

		<section class="circle-details-section">
			<ContentHeading :loading="loadingDescription">
				{{ t('contacts', 'Description') }}
			</ContentHeading>

			<RichContenteditable
				:value.sync="circle.description"
				:auto-complete="onAutocomplete"
				:maxlength="1024"
				:multiline="true"
				:contenteditable="circle.isOwner"
				:placeholder="descriptionPlaceholder"
				class="circle-details-section__description"
				@update:value="onDescriptionChangeDebounce" />
		</section>

		<section v-if="circle.isOwner" class="circle-details-section">
			<CircleConfigs class="circle-details-section__configs" :circle="circle" />
		</section>

		<section v-else>
			<slot />
		</section>
	</AppContentDetails>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import debounce from 'debounce'

import Actions from '@nextcloud/vue/dist/Components/Actions'
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionLink from '@nextcloud/vue/dist/Components/ActionLink'
import AppContentDetails from '@nextcloud/vue/dist/Components/AppContentDetails'
import Avatar from '@nextcloud/vue/dist/Components/Avatar'
import RichContenteditable from '@nextcloud/vue/dist/Components/RichContenteditable'

import ExitToApp from 'vue-material-design-icons/ExitToApp'
import LocationEnter from 'vue-material-design-icons/LocationEnter'

import { CircleEdit, editCircle } from '../services/circles.ts'
import CircleActionsMixin from '../mixins/CircleActionsMixin'
import DetailsHeader from './DetailsHeader'
import CircleConfigs from './CircleDetails/CircleConfigs'
import ContentHeading from './CircleDetails/ContentHeading'

export default {
	name: 'CircleDetails',

	components: {
		ActionButton,
		ActionLink,
		Actions,
		AppContentDetails,
		Avatar,
		CircleConfigs,
		ContentHeading,
		DetailsHeader,
		ExitToApp,
		LocationEnter,
		RichContenteditable,
	},

	mixins: [CircleActionsMixin],

	data() {
		return {
			loadingDescription: false,
		}
	},

	computed: {
		descriptionPlaceholder() {
			if (this.circle.description.trim() === '') {
				return t('contacts', 'There is no description for this circle')
			}
			return t('contacts', 'Enter a description for the circle')
		},
	},

	methods: {
		/**
		 * Autocomplete @mentions on the description
		 * @param {string} search the search term
		 * @param {Function} callback callback to be called with results array
		 */
		onAutocomplete(search, callback) {
			// TODO: implement autocompletion. Disabled for now
			// eslint-disable-next-line node/no-callback-literal
			callback([])
		},

		onDescriptionChangeDebounce: debounce(function() {
			this.onDescriptionChange(...arguments)
		}, 500),
		async onDescriptionChange(description) {
			this.loadingDescription = true
			try {
				await editCircle(this.circle.id, CircleEdit.Description, description)
			} catch (error) {
				console.error('Unable to edit circle description', description, error)
				showError(t('contacts', 'An error happened during description sync'))
			} finally {
				this.loadingDescription = false
			}
		},

		onDisplayNameChangeDebounce: debounce(function(event) {
			this.onDisplayNameChange(event.target.value)
		}, 500),
		async onDisplayNameChange(description) {
			this.loadingDescription = true
			try {
				await editCircle(this.circle.id, CircleEdit.Description, description)
			} catch (error) {
				console.error('Unable to edit circle description', description, error)
				showError(t('contacts', 'An error happened during description sync'))
			} finally {
				this.loadingDescription = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.app-content-details {
	flex: 1 1 100%;
	min-width: 0;
	padding: 0 80px;
}

.circle-details-section {
	&:not(:first-of-type) {
		margin-top: 24px;
	}

	&__description {
		max-width: 800px;
	}
}
</style>
