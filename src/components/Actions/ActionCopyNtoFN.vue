<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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
	<ActionButton icon="icon-up" @click="copyNToFN">
		{{ t('contacts', 'Copy to full name') }}
	</ActionButton>
</template>
<script>
import ActionButton from '@nextcloud/vue/dist/Components/ActionButton'
import ActionsMixin from '../../mixins/ActionsMixin'

export default {
	name: 'ActionCopyNtoFN',
	components: {
		ActionButton,
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
