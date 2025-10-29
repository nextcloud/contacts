/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getRequestToken } from '@nextcloud/auth'
import DavClient from '@nextcloud/cdav-library'
import { generateRemoteUrl } from '@nextcloud/router'

/**
 *
 */
function xhrProvider() {
	const headers = {
		'X-Requested-With': 'XMLHttpRequest',
		requesttoken: getRequestToken(),
	}
	const xhr = new XMLHttpRequest()
	const oldOpen = xhr.open

	// override open() method to add headers
	xhr.open = function() {
		const result = oldOpen.apply(this, arguments)
		for (const name in headers) {
			xhr.setRequestHeader(name, headers[name])
		}
		return result
	}
	window.OC.registerXHRForErrorProcessing(xhr)
	return xhr
}

export default new DavClient({
	rootUrl: generateRemoteUrl('dav'),
}, xhrProvider)
