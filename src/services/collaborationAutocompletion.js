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

import axios from '@nextcloud/axios'
import { generateOcsUrl } from '@nextcloud/router'

import { SHARES_TYPES_MEMBER_MAP } from '../models/constants.ts'

// generate allowed shareType from SHARES_TYPES_MEMBER_MAP
const shareType = Object.keys(SHARES_TYPES_MEMBER_MAP)
const maxAutocompleteResults = parseInt(OC.config['sharing.maxAutocompleteResults'], 10) || 25

/**
 * Get suggestions
 *
 * @param {string} search the search query
 */
export const getSuggestions = async function(search) {
	const request = await axios.get(generateOcsUrl('apps/files_sharing/api/v1/sharees'), {
		params: {
			format: 'json',
			itemType: 'file',
			search,
			perPage: maxAutocompleteResults,
			shareType,
			lookup: false,
		},
	})

	const data = request.data.ocs.data
	const exact = request.data.ocs.data.exact
	data.exact = [] // removing exact from general results

	// flatten array of arrays
	const rawExactSuggestions = Object.values(exact).reduce((arr, elem) => arr.concat(elem), [])
	const rawSuggestions = Object.values(data).reduce((arr, elem) => arr.concat(elem), [])

	// remove invalid data and format to user-select layout
	const exactSuggestions = rawExactSuggestions
		.filter(result => typeof result === 'object')
		.map(share => formatResults(share))
		// sort by type so we can get user&groups first...
		.sort((a, b) => a.shareType - b.shareType)
	const suggestions = rawSuggestions
		.filter(result => typeof result === 'object')
		.map(share => formatResults(share))
		// sort by type so we can get user&groups first...
		.sort((a, b) => a.shareType - b.shareType)

	const allSuggestions = exactSuggestions.concat(suggestions)

	// Count occurances of display names in order to provide a distinguishable description if needed
	const nameCounts = allSuggestions.reduce((nameCounts, result) => {
		if (!result.displayName) {
			return nameCounts
		}
		if (!nameCounts[result.displayName]) {
			nameCounts[result.displayName] = 0
		}
		nameCounts[result.displayName]++
		return nameCounts
	}, {})

	const finalResults = allSuggestions.map(item => {
		// Make sure that items with duplicate displayName get the shareWith applied as a description
		if (nameCounts[item.displayName] > 1 && !item.desc) {
			return { ...item, desc: item.shareWithDisplayNameUnique }
		}
		return item
	})

	console.info('suggestions', finalResults)

	return finalResults
}

/**
 * Get the sharing recommendations
 */
export const getRecommendations = async function() {
	const request = await axios.get(generateOcsUrl('apps/files_sharing/api/v1/sharees_recommended'), {
		params: {
			format: 'json',
			itemType: 'file',
			shareType,
		},
	})

	// flatten array of arrays
	const exact = request.data.ocs.data.exact
	const recommendations = Object.values(exact).reduce((arr, elem) => arr.concat(elem), [])

	// remove invalid data and format to user-select layout
	const finalResults = recommendations
		.map(share => formatResults(share))

	console.info('recommendations', finalResults)

	return finalResults
}

const formatResults = function(result) {
	const type = `picker-${result.value.shareType}`
	return {
		label: result.label,
		id: `${type}-${result.value.shareWith}`,
		// If this is a user, set as user for avatar display by UserBubble
		user: [OC.Share.SHARE_TYPE_USER, OC.Share.SHARE_TYPE_REMOTE].indexOf(result.value.shareType) > -1
			? result.value.shareWith
			: null,
		type,
		...result.value,
	}
}
