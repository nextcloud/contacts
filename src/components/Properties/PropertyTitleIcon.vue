<!--
  - @copyright Copyright (c) 2022 Greta Doci <gretadoci@gmail.com>
  -
  - @author Greta Doci
  - @author Richard Steinmetz <richard@steinmetz.cloud>
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
	<IconPlus v-if="icon === 'icon-add'" :size="20" />
	<IconAddressBook v-else-if="icon === 'icon-address-book'" :size="20" />
	<IconEmail v-else-if="icon === 'icon-mail'" :size="20" />
	<IconPhone v-else-if="icon === 'icon-phone'" :size="20" />
	<IconDelete v-else-if="icon === 'icon-delete'" :size="20" />
	<IconPencil v-else-if="icon === 'icon-rename'" :size="20" />
	<IconMapMaker v-else-if="icon === 'icon-address'" :size="20" />
	<IconMultiple v-else-if="icon === 'icon-contacts-dark'" :size="20" />
	<IconWeb v-else-if="icon === 'icon-public' || icon === 'icon-timezone'" :size="20" />
	<IconCakeVariant v-else-if="icon === 'icon-calendar-dark'" :size="20" />
	<IconMessageReplyText v-else-if="icon === 'icon-comment'" :size="20" />
	<IconHeart v-else-if="icon === 'icon-social'" :size="20" />
	<IconAccountSupervisor v-else-if="icon === 'icon-group' || icon === 'icon-manager'" :size="20" />
	<IconAccount v-else-if="icon === 'icon-gender' || icon === 'icon-user'" :size="20" />
	<IconCalendarHeartOutline v-else-if="icon === 'icon-anniversary'" :size="20" />
	<IconCoffin v-else-if="icon === 'icon-death-day'" :size="20" />
	<IconBadgeAccountHorizontal v-else-if="icon === 'icon-detailed-name'" :size="20" />
	<IconCloud v-else-if="icon === 'icon-federated-cloud-id'" :size="20" />
	<IconMessageProcessing v-else-if="icon === 'icon-instant-message'" :size="20" />
	<IconMap v-else-if="icon === 'icon-location'" :size="20" />
	<IconText v-else-if="icon === 'icon-note'" :size="20" />
	<IconTranslateVariant v-else-if="icon === 'icon-spoken-lang'" :size="20" />
	<IconAccountBoxMultiple v-else-if="icon === 'icon-related-contact'" :size="20" />
	<IconAccountSwitch v-else-if="icon === 'icon-relation-to-you'" :size="20" />
</template>

<script>
import IconPlus from 'vue-material-design-icons/Plus.vue'
import IconAddressBook from '../Icons/IconAddressBook.vue'
import IconEmail from 'vue-material-design-icons/Email.vue'
import IconPhone from 'vue-material-design-icons/Phone.vue'
import IconDelete from 'vue-material-design-icons/Delete.vue'
import IconAccount from 'vue-material-design-icons/Account.vue'
import IconPencil from 'vue-material-design-icons/Pencil.vue'
import IconMapMaker from 'vue-material-design-icons/MapMarker.vue'
import IconMultiple from 'vue-material-design-icons/AccountMultiple.vue'
import IconWeb from 'vue-material-design-icons/Web.vue'
import IconCakeVariant from 'vue-material-design-icons/CakeVariant.vue'
import IconMessageReplyText from 'vue-material-design-icons/MessageReplyText.vue'
import IconHeart from 'vue-material-design-icons/Heart.vue'
import IconAccountSupervisor from 'vue-material-design-icons/AccountSupervisor.vue'
import IconCalendarHeartOutline from 'vue-material-design-icons/CalendarHeartOutline.vue'
import IconCoffin from 'vue-material-design-icons/Coffin.vue'
import IconBadgeAccountHorizontal from 'vue-material-design-icons/BadgeAccountHorizontal.vue'
import IconCloud from 'vue-material-design-icons/Cloud.vue'
import IconMessageProcessing from 'vue-material-design-icons/MessageProcessing.vue'
import IconMap from 'vue-material-design-icons/Map.vue'
import IconText from 'vue-material-design-icons/Text.vue'
import IconTranslateVariant from 'vue-material-design-icons/TranslateVariant.vue'
import IconAccountBoxMultiple from 'vue-material-design-icons/AccountBoxMultiple.vue'
import IconAccountSwitch from 'vue-material-design-icons/AccountSwitch.vue'
export default {
	name: 'PropertyTitleIcon',
	components: {
		IconPlus,
		IconAddressBook,
		IconEmail,
		IconPhone,
		IconDelete,
		IconPencil,
		IconMapMaker,
		IconMultiple,
		IconWeb,
		IconCakeVariant,
		IconMessageReplyText,
		IconHeart,
		IconAccountSupervisor,
		IconAccount,
		IconCalendarHeartOutline,
		IconCoffin,
		IconBadgeAccountHorizontal,
		IconCloud,
		IconMessageProcessing,
		IconMap,
		IconText,
		IconTranslateVariant,
		IconAccountBoxMultiple,
		IconAccountSwitch,
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
<style lang="scss" scoped>
.material-design-icon {
	opacity: 0.8;
}
</style>
