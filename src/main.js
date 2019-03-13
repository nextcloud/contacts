/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
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
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import { sync } from 'vuex-router-sync'
import { generateFilePath } from 'nextcloud-server/dist/router'

/** GLOBAL COMPONENTS AND DIRECTIVE */
import { Action, DatetimePicker, Multiselect, PopoverMenu } from 'nextcloud-vue'
import ClickOutside from 'vue-click-outside'
import { VTooltip } from 'v-tooltip'
import VueClipboard from 'vue-clipboard2'

// CSP config for webpack dynamic chunk loading
// eslint-disable-next-line
__webpack_nonce__ = btoa(OC.requestToken)

// Correct the root of the app for chunk loading
// OC.linkTo matches the apps folders
// OC.generateUrl ensure the index.php (or not)
// We do not want the index.php since we're loading files
// eslint-disable-next-line
__webpack_public_path__ = generateFilePath('contacts', '', 'js/')

Vue.component('Action', Action)
Vue.component('DatetimePicker', DatetimePicker)
Vue.component('Multiselect', Multiselect)
Vue.component('PopoverMenu', PopoverMenu)
Vue.directive('ClickOutside', ClickOutside)
Vue.directive('Tooltip', VTooltip)
Vue.use(VueClipboard)

sync(store, router)

Vue.prototype.t = t
Vue.prototype.n = n
// eslint-disable-next-line
Vue.prototype.oca_contacts = oca_contacts
// eslint-disable-next-line
Vue.prototype.oc_onfig = oc_config
Vue.prototype.OC = OC
Vue.prototype.OCA = OCA

if (window.location.pathname.split('/')[1] === 'index.php'
	&& oc_config.modRewriteWorking) {
	router.push({
		name: 'group',
		params: { selectedGroup: t('contacts', 'All contacts') }
	})
}

export default new Vue({
	el: '#content',
	router,
	store,
	render: h => h(App)
})
