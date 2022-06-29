<!--
  - @copyright Copyright (c) 2022 Greta Doci <gretadoci@gmail.com>
  -
  - @author Greta Doci
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
	<IconAdd v-if="icon === 'icon-add'" :size="20" />
	<IconAddressBook v-else-if="icon === 'icon-address-book'" :size="20" />
	<IconEmail v-else-if="icon === 'icon-mail'" :size="20" />
	<IconPhone v-else-if="icon === 'icon-phone'" :size="20" />
	<IconDelete v-else-if="icon === 'icon-delete'" :size="20" />
	<IconUser v-else-if="icon === 'icon-user'" :size="20" />
	<IconNotes v-else-if="icon === 'icon-rename'" :size="20" />
	<IconGeo v-else-if="icon === 'icon-address'" :size="20" />
	<IconGroup v-else-if="icon === 'icon-contacts-dark'" :size="20" />
	<IconUrl v-else-if="icon === 'icon-public'" :size="20" />
	<IconBday v-else-if="icon === 'icon-calendar-dark'" :size="20" />
	<IconImpp v-else-if="icon === 'icon-comment'" :size="20" />
	<IconSocialMedia v-else-if="icon === 'icon-social'" :size="20" />
	<IconRelationship v-else-if="icon === 'icon-group'" :size="20" />
	<IconTz v-else-if="icon === 'icon-timezone'" :size="20" />
	<IconLang v-else-if="icon === 'icon-language'" :size="20" />
</template>

<script>
import IconAdd from 'vue-material-design-icons/Plus'
import IconAddressBook from '../Icons/IconAddressBook'
import IconEmail from 'vue-material-design-icons/Email'
import IconPhone from 'vue-material-design-icons/Cellphone'
import IconDelete from 'vue-material-design-icons/Delete'
import IconUser from 'vue-material-design-icons/Account'
import IconNotes from 'vue-material-design-icons/Pencil'
import IconGeo from 'vue-material-design-icons/MapMarker'
import IconGroup from 'vue-material-design-icons/AccountMultiple'
import IconUrl from 'vue-material-design-icons/Link'
import IconBday from 'vue-material-design-icons/CalendarBlankOutline'
import IconImpp from 'vue-material-design-icons/MessageReplyText'
import IconSocialMedia from 'vue-material-design-icons/Heart'
import IconRelationship from 'vue-material-design-icons/AccountSupervisor'
import IconTz from 'vue-material-design-icons/Web'
import IconLang from 'vue-material-design-icons/AccountVoice'
export default {
	name: 'PropertyTitleIcon',
	components: {
		IconAdd,
		IconAddressBook,
		IconEmail,
		IconPhone,
		IconDelete,
		IconUser,
		IconNotes,
		IconGeo,
		IconGroup,
		IconUrl,
		IconBday,
		IconImpp,
		IconSocialMedia,
		IconRelationship,
		IconTz,
		IconLang,
	},
	props: {
		icon: {
			type: String,
			default: '',
			required: false,
		},
	},
}
</script>
<style lang="scss" scope>
.material-design-icon {
	opacity: .7;
}
</style>
