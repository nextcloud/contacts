/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPinia, setActivePinia } from 'pinia'

jest.mock('../../../src/services/importService', () => ({
	__esModule: true,
	importService: { import: jest.fn() },
}))

// eslint-disable-next-line import/first
import useImportStore from '../../../src/store/import.ts'
// eslint-disable-next-line import/first
import { importService } from '../../../src/services/importService'

const mockImport = importService.import

/**
 * Build a minimal file payload for addFile().
 *
 * @param {object} overrides values to override on the payload
 * @return {object}
 */
function filepayload(overrides = {}) {
	return {
		contents: 'BEGIN:VCARD\nVERSION:3.0\nFN:Jane\nEND:VCARD',
		lastModified: 1,
		name: 'contacts.vcf',
		size: 42,
		type: 'text/vcard',
		parser: { getName: () => null },
		...overrides,
	}
}

describe('import store', () => {
	let store

	beforeEach(() => {
		setActivePinia(createPinia())
		store = useImportStore()
		mockImport.mockReset()
	})

	test('addFile queues an entry with a format derived from the MIME type', () => {
		store.addFile(filepayload())
		store.addFile(filepayload({ name: 'c.json', type: 'application/json' }))
		store.addFile(filepayload({ name: 'c.xml', type: 'text/xml' }))

		expect(store.files).toHaveLength(3)
		expect(store.files[0].options.format).toBe('ical')
		expect(store.files[1].options.format).toBe('jcal')
		expect(store.files[2].options.format).toBe('xcal')
		expect(store.files[0].addressbookId).toBeNull()
		expect(store.files[0].options.supersede).toBe(false)
	})

	test('setOptionsForFile and setAddressbookForFile mutate the queued entry', () => {
		store.addFile(filepayload())
		const { id } = store.files[0].file

		store.setOptionsForFile({ fileId: id, options: { supersede: true } })
		store.setAddressbookForFile({ fileId: id, addressbookId: 'ab-1' })

		expect(store.files[0].options.supersede).toBe(true)
		expect(store.files[0].options.format).toBe('ical')
		expect(store.files[0].addressbookId).toBe('ab-1')
	})

	test('reset clears queued sessions and state', () => {
		store.addFile(filepayload())
		store.stage = 'selecting'
		store.removeAllFiles()
		store.reset()

		expect(store.files).toHaveLength(0)
		expect(store.stage).toBe('idle')
		expect(store.running).toBe(false)
	})

	test('startImport resolves targets via the injected resolver and aggregates counters', async () => {
		const resolveTarget = jest.fn().mockResolvedValue({ id: 'ab-1', displayName: 'Work' })
		mockImport.mockImplementation(async (request, onData) => {
			expect(request.target).toBe('ab-1')
			onData({ type: 'count', vcard: 3 })
			onData({ type: 'object', disposition: 'created', identifier: 'a', errors: [] })
			onData({ type: 'object', disposition: 'updated', identifier: 'b', errors: [] })
			onData({ type: 'object', disposition: 'exists', identifier: 'c', errors: [] })
		})

		store.addFile(filepayload())
		store.setAddressbookForFile({ fileId: store.files[0].file.id, addressbookId: 'ab-1' })

		const totals = await store.startImport(resolveTarget)

		expect(resolveTarget).toHaveBeenCalledWith(store.files[0])
		expect(totals).toMatchObject({
			discovered: 3,
			processed: 3,
			created: 1,
			updated: 1,
			exists: 1,
			error: 0,
		})
		expect(store.stage).toBe('completed')
		expect(store.sessions[store.files[0].file.id].targetId).toBe('ab-1')
		expect(store.sessions[store.files[0].file.id].targetDisplayName).toBe('Work')
	})

	test('startImport marks the session and stage as error when the resolver throws', async () => {
		const resolveTarget = jest.fn().mockRejectedValue(new Error('boom'))

		store.addFile(filepayload())

		await expect(store.startImport(resolveTarget)).rejects.toThrow('boom')
		expect(store.stage).toBe('error')
		expect(mockImport).not.toHaveBeenCalled()
	})
})
