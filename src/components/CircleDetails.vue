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
				<Avatar :disable-tooltip="true"
					:display-name="circle.displayName"
					:is-no-user="true"
					:size="avatarSize" />
			</template>

			<!-- display name -->
			<template #title>
				<input v-model="circle.displayName"
					:readonly="!circle.isOwner"
					:placeholder="t('contacts', 'Circle name')"
					type="text"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
					name="displayname"
					@input="onNameChangeDebounce">
				<div v-if="loadingName" class="circle-name__loader icon-loading-small" />
			</template>

			<!-- org, title -->
			<template v-if="!circle.isOwner" #subtitle>
				{{ t('contacts', 'Circle owned by {owner}', { owner: circle.owner.displayName}) }}
			</template>
		</DetailsHeader>

		<section class="circle-details-section circle-details-section__actions">
			<!-- copy circle link -->
			<a class="circle-details__action-copy-link button"
				:href="circleUrl"
				:class="copyLinkIcon"
				@click.stop.prevent="copyToClipboard(circleUrl)">
				{{ copyButtonText }}
			</a>

			<!-- Only show the join button if the circle is accepting requests -->
			<Button v-if="!circle.isPendingMember && !circle.isMember && circle.canJoin"
				:disabled="loadingJoin"
				class="primary"
				@click="joinCircle">
				<Login slot="icon"
					:size="16"
					decorative />
				{{ t('contacts', 'Request to join') }}
			</Button>
		</section>

		<section v-if="showDescription" class="circle-details-section">
			<ContentHeading :loading="loadingDescription">
				{{ t('contacts', 'Description') }}
			</ContentHeading>

			<RichContenteditable :value.sync="circle.description"
				:auto-complete="onAutocomplete"
				:maxlength="1024"
				:multiline="true"
				:contenteditable="circle.isOwner"
				:placeholder="descriptionPlaceholder"
				class="circle-details-section__description"
				@update:value="onDescriptionChangeDebounce" />
		</section>

		<section v-if="(circle.isOwner || circle.isAdmin) && !circle.isPersonal" class="circle-details-section">
			<CircleConfigs class="circle-details-section__configs" :circle="circle" />
			<CirclePasswordSettings class="circle-details-section__configs" :circle="circle" />
		</section>

		<section v-else>
			<slot />
		</section>

		<section class="circle-details-section">
			<!-- leave circle -->
			<Button v-if="circle.canLeave"
				class="circle-details__action-copy-link"
				@click="confirmLeaveCircle">
				<Logout slot="icon"
					:size="16"
					decorative />
				{{ t('contacts', 'Leave circle') }}
			</Button>

			<!-- delete circle -->
			<Button v-if="circle.canDelete"
				class="circle-details__action-delete"
				href="#"
				@click.prevent.stop="confirmDeleteCircle">
				<template #icon>
					<IconDelete :size="20" />
				</template>
				{{ t('contacts', 'Delete circle') }}
			</Button>
		</section>
	</AppContentDetails>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import debounce from 'debounce'

import {
	NcAppContentDetails as AppContentDetails,
	NcAvatar as Avatar,
	NcButton as Button,
	NcRichContenteditable as RichContenteditable,
} from '@nextcloud/vue'

import Login from 'vue-material-design-icons/Login.vue'
import Logout from 'vue-material-design-icons/Logout.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'

import { CircleEdit, editCircle } from '../services/circles.ts'
import CircleActionsMixin from '../mixins/CircleActionsMixin.js'
import DetailsHeader from './DetailsHeader.vue'
import CircleConfigs from './CircleDetails/CircleConfigs.vue'
import ContentHeading from './CircleDetails/ContentHeading.vue'
import CirclePasswordSettings from './CircleDetails/CirclePasswordSettings.vue'

export default {
	name: 'CircleDetails',

	components: {
		AppContentDetails,
		Avatar,
		Button,
		CircleConfigs,
		CirclePasswordSettings,
		ContentHeading,
		DetailsHeader,
		Login,
		Logout,
		IconDelete,
		RichContenteditable,
	},

	mixins: [CircleActionsMixin],

	data() {
		return {
			loadingDescription: false,
			loadingName: false,
		}
	},

	computed: {
		descriptionPlaceholder() {
			if (this.circle.description.trim() === '') {
				return t('contacts', 'There is no description for this circle')
			}
			return t('contacts', 'Enter a description for the circle')
		},

		isEmptyDescription() {
			return this.circle.description.trim() === ''
		},

		showDescription() {
			if (this.circle.isOwner) {
				return true
			}
			return !this.isEmptyDescription
		},
	},

	methods: {
		/**
		 * Autocomplete @mentions on the description
		 *
		 * @param {string} search the search term
		 * @param {Function} callback callback to be called with results array
		 */
		onAutocomplete(search, callback) {
			// TODO: implement autocompletion. Disabled for now
			// eslint-disable-next-line n/no-callback-literal
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

		onNameChangeDebounce: debounce(function(event) {
			this.onNameChange(event.target.value)
		}, 500),
		async onNameChange(name) {
			this.loadingName = true
			try {
				await editCircle(this.circle.id, CircleEdit.Name, name)
			} catch (error) {
				console.error('Unable to edit circle name', name, error)
				showError(t('contacts', 'An error happened during name sync'))
			} finally {
				this.loadingName = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.circle-name__loader {
	margin-left: 8px;
}

.circle-details-section {
	&:not(:first-of-type) {
		margin-top: 24px;
	}

	&__actions {
		display: flex;
		a, button {
			margin-right: 8px;
		}
	}

	&__description {
		max-width: 800px;
	}
}

// TODO: replace by button component when available
button,
.circle-details__action-copy-link {
	height: 44px;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	text-align: left;
	span {
		margin-right: 10px;
	}

	&[class*='icon-'] {
		padding-left: 44px;
		background-position: 16px center;

	}
}

.circle-details__action-delete {
	background-color: var(--color-error);
	color: white;
	border-width: 2px;
	border-color: var(--color-error) !important;

	&:hover,
	&:focus {
		background-color: var(--color-main-background);
		color: var(--color-error);
	}
}
</style>
