/**
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { validateEmail } from '../../../src/utils/validate'

describe('validation test suite', () => {
	it('should return false for invalid email-addresses', () => {
		const testData = [
			'me @example.com',
			' me@example.de',
			'me@nextcloudcom',
			'em @example.com',
			'meexample.com',
			"ncncncncncncncncncncn@cncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncncnc.nc",
			'me@example.com\n',
		]

		for (const email of testData) {
			const isValid = validateEmail(email)
			expect(isValid).toBeFalsy();
		}
	})

	it('should return true for valid email-addresses', () => {
		const testData = [
			'me@example.com',
			'me@example.de',
			'm.e@nextcloud.com',
			'test-mock@example.com',
			'me_you@example.com',
		]

		for (const email of testData) {
			const isValid = validateEmail(email)
			expect(isValid).toBeTruthy();
		}
	})
})
