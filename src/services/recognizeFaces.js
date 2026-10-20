/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { getCapabilities } from '@nextcloud/capabilities'
import { generateOcsUrl } from '@nextcloud/router'

const API_BASE = '/apps/recognize/api/v1'

/**
 * Whether the installed Recognize app can link recognized people to contacts.
 *
 * @return {boolean}
 */
export function isRecognizeFaceLinkingAvailable() {
	return getCapabilities()?.recognize?.faces?.contactLinking === true
}

/**
 * Fetch a contact as Recognize sees it, along with the people linked to it.
 *
 * @param {string} addressBookId the address book URI
 * @param {string} uid the UID of the contact
 * @return {Promise<{contact: object, faces: Array<object>}>}
 */
export async function fetchContactFaces(addressBookId, uid) {
	const response = await axios.get(generateOcsUrl(`${API_BASE}/contacts/{addressBook}/{uid}`, { addressBook: addressBookId, uid }))
	return response.data.ocs.data
}

/**
 * Fetch all people Recognize found in the photos of the current user.
 *
 * @return {Promise<Array<object>>}
 */
export async function fetchFaces() {
	const response = await axios.get(generateOcsUrl(`${API_BASE}/faces`))
	return response.data.ocs.data
}

/**
 * Fetch the faces that make up a person, the largest first.
 *
 * @param {number} faceId the id of the person
 * @param {number} limit the maximum number of faces
 * @return {Promise<Array<{id: number, fileId: number}>>}
 */
export async function fetchFaceDetections(faceId, limit = 100) {
	const response = await axios.get(generateOcsUrl(`${API_BASE}/faces/{faceId}/detections`, { faceId }), { params: { limit } })
	return response.data.ocs.data
}

/**
 * The URL of a face cut out of its photo.
 *
 * @param {number} detectionId the id of the face
 * @param {number} size width and height of the image in pixels
 * @return {string}
 */
export function getFacePreviewUrl(detectionId, size = 256) {
	return generateOcsUrl(`${API_BASE}/faces/detections/{detectionId}/preview`, { detectionId }) + `?size=${size}`
}

/**
 * Link a person to a contact.
 *
 * @param {number} faceId the id of the person
 * @param {string} addressBookId the address book URI of the contact
 * @param {string} uid the UID of the contact
 * @return {Promise<object>} the updated person
 */
export async function linkFaceToContact(faceId, addressBookId, uid) {
	const response = await axios.put(generateOcsUrl(`${API_BASE}/faces/{faceId}/contact`, { faceId }), { addressBook: addressBookId, uid })
	return response.data.ocs.data
}
