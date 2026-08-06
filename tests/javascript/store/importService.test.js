/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/auth', () => ({
	getRequestToken: () => 'token',
}))

jest.mock('@nextcloud/router', () => ({
	generateOcsUrl: (path) => `/ocs/v2.php/apps/dav/api/v1${path}`,
}))

// eslint-disable-next-line import/first
import { importService } from '../../../src/services/importService.ts'

/**
 * Build a Response-like object whose body streams the given NDJSON lines.
 *
 * @param {string[]} lines NDJSON lines (without trailing newline)
 * @param {object} init response init overrides
 * @return {object}
 */
function streamResponse(lines, init = {}) {
	const encoder = new TextEncoder()
	const chunks = lines.map((line) => encoder.encode(line + '\n'))
	let index = 0

	return {
		ok: true,
		status: 200,
		...init,
		body: {
			getReader() {
				return {
					read() {
						if (index < chunks.length) {
							return Promise.resolve({ done: false, value: chunks[index++] })
						}
						return Promise.resolve({ done: true, value: undefined })
					},
					releaseLock() {},
				}
			},
		},
	}
}

describe('importService', () => {
	afterEach(() => {
		delete global.fetch
	})

	test('forwards count and object events but ignores control messages', async () => {
		global.fetch = jest.fn().mockResolvedValue(streamResponse([
			JSON.stringify({ type: 'control', transaction: 't', disposition: 'start' }),
			JSON.stringify({ type: 'count', transaction: 't', vcard: 2 }),
			JSON.stringify({ type: 'object', transaction: 't', identifier: 'a', disposition: 'created', errors: [] }),
			JSON.stringify({ type: 'control', transaction: 't', disposition: 'end' }),
		]))

		const received = []
		await importService.import({
			target: 'ab-1',
			options: { format: 'ical', validation: 1, errors: 0, supersede: false },
			data: 'BEGIN:VCARD\nEND:VCARD',
		}, (event) => received.push(event))

		expect(received).toHaveLength(2)
		expect(received[0].type).toBe('count')
		expect(received[1].type).toBe('object')

		const [, requestInit] = global.fetch.mock.calls[0]
		const body = JSON.parse(requestInit.body)
		expect(body.transaction).toEqual(expect.any(String))
		expect(body.target).toBe('ab-1')
	})

	test('throws when the response is not ok', async () => {
		global.fetch = jest.fn().mockResolvedValue(streamResponse([], { ok: false, status: 400 }))

		await expect(importService.import({
			target: 'ab-1',
			options: { format: 'ical', validation: 1, errors: 0, supersede: false },
			data: '',
		}, () => {})).rejects.toThrow('status 400')
	})
})
