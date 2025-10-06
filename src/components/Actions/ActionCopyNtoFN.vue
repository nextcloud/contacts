<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ActionButton @click="copyNToFN">
		<template #icon>
			<IconCopy :size="20" />
		</template>
		{{ t('contacts', 'Copy to full name') }}
	</ActionButton>
</template>

<script>
import { NcActionButton as ActionButton } from '@nextcloud/vue'
import IconCopy from 'vue-material-design-icons/ContentCopy.vue'
import ActionsMixin from '../../mixins/ActionsMixin.js'

export default {
	name: 'ActionCopyNtoFN',
	components: {
		ActionButton,
		IconCopy,
	},

	mixins: [ActionsMixin],
	methods: {
		copyNToFN() {
			if (this.component.localContact.vCard.hasProperty('n')) {
				// Stevenson;John;Philip,Paul;Dr.;Jr.,M.D.,A.C.P.
				// -> John Stevenson
				const n = this.component.localContact.vCard.getFirstPropertyValue('n')
				this.component.localContact.fullName = n.slice(0, 2).reverse().join(' ')
				this.component.$emit('update')
			}
		},
	},
}
</script>
