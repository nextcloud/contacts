/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

jest.mock('@nextcloud/auth', () => ({
	getRequestToken: () => 'token',
	getCurrentUser: () => null,
}))

jest.mock('@nextcloud/router', () => ({
	generateOcsUrl: (path) => `/ocs/v2.php/apps/dav/api/v1${path}`,
	generateRemoteUrl: (path) => `/remote.php/${path}`,
}))

// eslint-disable-next-line import/first
import { importService, isStreamImportSupported } from '../../../src/services/importService.ts'

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

	describe('importLegacy', () => {
		const vcf = [
			'BEGIN:VCARD\r\nVERSION:3.0\r\nUID:a\r\nFN:Jane\r\nEND:VCARD',
			'BEGIN:VCARD\r\nVERSION:3.0\r\nUID:b\r\nFN:John\r\nEND:VCARD',
		].join('\r\n')

		test('creates each vCard via CardDAV and reports progress', async () => {
			const createVCard = jest.fn().mockResolvedValue({})
			const received = []

			await importService.importLegacy(
				{ id: 'ab-1', displayName: 'Work', addressbook: { dav: { createVCard } } },
				vcf,
				(event) => received.push(event),
			)

			expect(global.fetch).toBeUndefined()
			expect(createVCard).toHaveBeenCalledTimes(2)
			expect(createVCard.mock.calls[0][0]).toContain('FN:Jane')
			expect(received[0]).toMatchObject({ type: 'count', vcard: 2 })
			expect(received.slice(1)).toEqual([
				expect.objectContaining({ type: 'object', identifier: 'a', disposition: 'created' }),
				expect.objectContaining({ type: 'object', identifier: 'b', disposition: 'created' }),
			])
		})

		test('reports an error for a vCard that fails to upload and continues', async () => {
			const createVCard = jest.fn()
				.mockRejectedValueOnce(new Error('nope'))
				.mockResolvedValueOnce({})
			const received = []
			jest.spyOn(console, 'error').mockImplementation(() => {})

			await importService.importLegacy(
				{ id: 'ab-1', displayName: 'Work', addressbook: { dav: { createVCard } } },
				vcf,
				(event) => received.push(event),
			)

			expect(createVCard).toHaveBeenCalledTimes(2)
			expect(received.filter((event) => event.disposition === 'error')).toHaveLength(1)
			expect(received.filter((event) => event.disposition === 'created')).toHaveLength(1)
		})

		test('reports a zero count when the file contains no vCards', async () => {
			const createVCard = jest.fn()
			const received = []

			await importService.importLegacy(
				{ id: 'ab-1', displayName: 'Work', addressbook: { dav: { createVCard } } },
				'not a vcard',
				(event) => received.push(event),
			)

			expect(createVCard).not.toHaveBeenCalled()
			expect(received).toEqual([expect.objectContaining({ type: 'count', vcard: 0 })])
		})
	})

	describe('isStreamImportSupported', () => {
		afterEach(() => {
			delete global.OC.config.version
		})

		test.each([
			['34.0.4.0', false],
			['34.0.5.0', true],
			['35.0.0.0', true],
		])('is %s supported: %s', (version, expected) => {
			global.OC.config.version = version
			expect(isStreamImportSupported()).toBe(expected)
		})
	})
})
