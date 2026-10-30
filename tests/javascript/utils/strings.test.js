/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { sortStrings } from '../../../src/utils/strings'

describe('utils/strings test suite', () => {
	it('sorting flat strings', () => {
		const test = sortStrings('ABC', 'BCA')
		expect(test < 0).toEqual(true)
	})

	it('sorting strings with diacritics', () => {
		const test = sortStrings('Třeboni', 'České')
		expect(test > 0).toEqual(true)
	})

	it('natural sorting', () => {
		const test = sortStrings('Group 9', 'Group 10')
		expect(test < 0).toEqual(true)
	})
})
