<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-if="displayCloudIdExchangeButton(propName)">
		<Actions class="property__actions exchange-cloud-id">
			<ActionButton @click="openExchangeInviteModal">
				<template #icon>
					<IconAccountSwitchOutline :size="20" />
				</template>
				Invite remote user to exchange cloud IDs. This will add the remote user to your contacts list.
			</ActionButton>
		</Actions>

		<Modal v-if="showInviteModal" 
			id="invitation-modal" 
			size="small" 
			:clear-view-delay="-1"
			:close-button-contained="false" 
			@close="closeExchangeInviteModal"
			class="modal-cloud-id-exchange">

			<InvitationDetails :local-contact="localContact">
				<template #name>
					<NcTextField type="text" :placeholder="t('contacts', 'name')" :value="displayName"
						@input="setDisplayName" />
				</template>
				<template #email>
					<NcTextField type="text" :placeholder="t('contacts', 'email')" :value="email" @input="setEmail" />
				</template>
				<template #personal-message>
					<NcTextArea id="personal-message" ref="textarea" :placeholder="t('contacts', 'personal message')"
						:value="message" :inputmode="inputmode" @input="setMessage" />
				</template>
				<template #invitation-actions>
					<NcButton @click="sendInvitation">
						<template #icon>
							<IconLoading v-if="loadingUpdate" :size="20" />
							<IconCheck v-else :size="20" />
						</template>
						{{ t('contacts', 'Send') }}
					</NcButton>
				</template>
			</InvitationDetails>
		</Modal>

	</div>

</template>

<script>
import {
	NcActionButton as ActionButton,
	NcActions as Actions,
	NcButton,
	NcLoadingIcon as IconLoading,
	NcModal as Modal,
	NcTextArea,
	NcTextField,
} from '@nextcloud/vue'
import Contact from '../models/contact.js'
import IconAccountSwitchOutline from 'vue-material-design-icons/AccountSwitchOutline.vue'
import IconCheck from 'vue-material-design-icons/Check.vue'
import InvitationDetails from './CloudIdExchangeInviteDetails.vue'
import PropertyMixin from '../mixins/PropertyMixin.js'

export default {
	name: 'PropertyText',

	components: {
		ActionButton,
		Actions,
		Contact,
		IconAccountSwitchOutline,
		IconCheck,
		IconLoading,
		InvitationDetails,
		Modal,
		NcButton,
		NcTextArea,
		NcTextField,
	},
	mixins: [PropertyMixin],
	props: {
		localContact: {
			type: Contact,
			default: null,
		},
		propName: {
			type: String,
			default: 'text',
			required: true,
		},
		value: {
			type: String,
			default: '',
			required: true,
		},
		contactFormEditMode: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		displayName() {
			return this.localContact.displayName
		},
		email() {
			return this.localContact.email
		}
	},
	emits: [
		'setContactFormEditModeEvent:value'
	],
	methods: {
		displayCloudIdExchangeButton(propName) {
			// TODO add check for:
			// 	1. cloud ID exchange invitation capability present ?
			//	2. is it active ?
			if (propName === 'cloud' && this.localContact && !(typeof this.value === 'string' || this.value instanceof String)) {
				console.log(`displayCloudIdExchangeButton(${propName}): true`)
				this.isNewContact = false
				return true
			}
			return false
		},
		closeExchangeInviteModal() {
			this.showInviteModal = false
		},
		openExchangeInviteModal() {
			this.showInviteModal = true
		},
		sendInvitation() {
			console.log('contactFormEditMode: ' + this.contactFormEditMode)
			this.localContact.properties.find(p => p.name === 'fn').setValue(this.localDisplayName)
			this.localContact.properties.find(p => p.name === 'email').setValue(this.localEmail)
			this.updateContact()
			// TODO on close: 
			//	- display saved contact; like when save button is pressed
			//  - the cloud ID prop should be displayed saying '... awaiting cloud ID exchange invite response'
			this.$emit('setContactFormEditModeEvent:value', false)
			this.showInviteModal = false
		},
		setDisplayName(e) {
			this.localDisplayName = e.target.value
		},
		setEmail(e) {
			this.localEmail = e.target.value
		},
		setMessage(e) {
			this.localMessage = e.target.value
		},
		updateContact() {
			this.fixed = false
			this.loadingUpdate = true
			try {
				this.$store.dispatch('updateContact', this.localContact)
			} finally {
				this.loadingUpdate = false
			}
		},
	},
	data() {
		return {
			showInviteModal: false,
			isNewContact: false,
			localDisplayName: '',
			localEmail: '',
			localMessage: '',
			loadingUpdate: false,
		}
	}
}
</script>

<style lang="scss">
div.property.property-cloud {
	position: relative;
}
#invitation-modal {
	div.modal-container__content {
		margin: 0 1em 1em;
	}
}
</style>

<style lang="scss" scoped>
#invitation-modal {
	background-color: rgba(0, 0, 0, .5);
}

div.property.property-cloud {
	button.exchange-cloud-id {
		position: absolute;
		top: 0;
		right: 4em;
	}
}

</style>
