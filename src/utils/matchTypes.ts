/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Match a list of types against the available types
 *
 * @param {Array<string>} selectedTypes Types to match against options
 * @param {Array<{id: string, name: string}>} options Available type options
 */
export function matchTypes(selectedTypes: Array<string>, options: Array<{id: string, name: string}>) {
	const items = options.map(option => {
		let score = 0
		const types = option.id.split(',') // "WORK,HOME" => ['WORK', 'HOME']

		const intersection = types.filter(value => selectedTypes.includes(value))
		score = score + intersection.length

		if (selectedTypes.length === types.length && selectedTypes.length === intersection.length) {
			score++
		}

		return {
			type: option,
			score,
		}
	})

	return items
		.filter(value => value.score > 0)
		.sort((a, b) => b.score - a.score)
		.shift()
}
