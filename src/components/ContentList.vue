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
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div id="contacts-list" :class="{'icon-loading': loading}" class="app-content-list">
		<!-- same uid can coexists between different addressbooks
			so we need to use the addressbook id as key as well -->
		<content-list-item v-for="contact in list" :key="contact.key" :contact="contacts[contact.key]"
			:search-query="searchQuery" />
	</div>
</template>

<script>
import contentListItem from './ContentList/ContentListItem'

export default {
	name: 'ContentList',
	components: {
		'content-list-item': contentListItem
	},
	props: {
		list: {
			type: Array,
			required: true
		},
		contacts: {
			type: Object,
			required: true
		},
		loading: {
			type: Boolean,
			default: true
		},
		searchQuery: {
			type: String,
			default: ''
		}
	}
}
</script>
