/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isAtLeastVersion } from '../../../src/utils/nextcloudVersion.ts'

describe('isAtLeastVersion', () => {
	afterEach(() => {
		delete global.OC.config.version
	})

	test.each([
		['33.0.9.1', false],
		['34.0.4.1', false],
		['34.0.5.0', true],
		['34.0.6.2', true],
		['34.1.0.0', true],
		['35.0.0.0', true],
		['34.0.5', true],
		['34', false],
	])('compares %s against 34.0.5', (version, expected) => {
		global.OC.config.version = version
		expect(isAtLeastVersion(34, 0, 5)).toBe(expected)
	})

	test('defaults minor and patch to zero', () => {
		global.OC.config.version = '35.0.0.1'
		expect(isAtLeastVersion(35)).toBe(true)
		expect(isAtLeastVersion(36)).toBe(false)
	})
})
