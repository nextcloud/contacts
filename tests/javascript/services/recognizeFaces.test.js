/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { getCapabilities } from '@nextcloud/capabilities'
import {
	fetchContactFaces,
	getFacePreviewUrl,
	isRecognizeFaceLinkingAvailable,
	linkFaceToContact,
} from '../../../src/services/recognizeFaces.js'

jest.mock('@nextcloud/capabilities', () => ({
	getCapabilities: jest.fn(),
}))
jest.mock('@nextcloud/router', () => ({
	generateOcsUrl: (path, params = {}) => '/ocs/v2.php' + path.replace(/\{(\w+)\}/g, (match, key) => encodeURIComponent(params[key])),
}))

describe('recognizeFaces service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('is available only when Recognize announces the capability', () => {
		getCapabilities.mockReturnValue({ recognize: { faces: { contactLinking: true } } })
		expect(isRecognizeFaceLinkingAvailable()).toBe(true)

		getCapabilities.mockReturnValue({ recognize: { faces: {} } })
		expect(isRecognizeFaceLinkingAvailable()).toBe(false)

		getCapabilities.mockReturnValue({})
		expect(isRecognizeFaceLinkingAvailable()).toBe(false)
	})

	test('builds the preview URL of a face', () => {
		expect(getFacePreviewUrl(42, 512)).toBe('/ocs/v2.php/apps/recognize/api/v1/faces/detections/42/preview?size=512')
	})

	test('fetches the people linked to a contact', async () => {
		const data = { contact: { uid: 'uid-1' }, faces: [{ id: 7 }] }
		axios.get.mockResolvedValue({ data: { ocs: { data } } })

		await expect(fetchContactFaces('contacts_shared_by_bob', 'uid-1')).resolves.toEqual(data)
		expect(axios.get).toHaveBeenCalledWith('/ocs/v2.php/apps/recognize/api/v1/contacts/contacts_shared_by_bob/uid-1')
	})

	test('links a person to a contact', async () => {
		axios.put.mockResolvedValue({ data: { ocs: { data: { id: 7, contact: { uid: 'uid-1' } } } } })

		await expect(linkFaceToContact(7, 'contacts', 'uid-1')).resolves.toEqual({ id: 7, contact: { uid: 'uid-1' } })
		expect(axios.put).toHaveBeenCalledWith('/ocs/v2.php/apps/recognize/api/v1/faces/7/contact', { addressBook: 'contacts', uid: 'uid-1' })
	})
})
