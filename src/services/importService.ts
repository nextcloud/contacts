/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type {
	ImportRequest,
	ImportStreamDataResponse,
	ImportStreamRequest,
	ImportStreamResponse,
	ImportTarget,
} from '../types/import.ts'

/**
 * Contacts import service
 */
import { getRequestToken } from '@nextcloud/auth'
import { generateOcsUrl } from '@nextcloud/router'
import pLimit from 'p-limit'
import Contact from '../models/contact.js'
import { isAtLeastVersion } from '../utils/nextcloudVersion.ts'
import logger from './logger.js'

const API_URL = generateOcsUrl('/contacts/import')
const OPERATION = 'contacts import'

/**
 * Whether the server provides the OCS contacts import endpoint (34.0.5 and newer)
 */
export function isStreamImportSupported(): boolean {
	return isAtLeastVersion(34, 0, 5)
}

/**
 * Generate a client-side transaction identifier for an import request.
 */
export function generateTransactionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Send an import request and stream the NDJSON response back through a callback.
 *
 * @param request Import request payload
 * @param onData Callback invoked for each streamed data event
 */
async function transceiveStream(
	request: ImportRequest,
	onData: (data: ImportStreamDataResponse) => void,
): Promise<void> {
	const streamRequest: ImportStreamRequest = {
		transaction: generateTransactionId(),
		...request,
	}

	const response = await fetch(API_URL, {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			Accept: 'application/x-ndjson',
			'Content-Type': 'application/json',
			'OCS-APIRequest': 'true',
			requesttoken: getRequestToken() ?? '',
		},
		body: JSON.stringify(streamRequest),
	})

	if (!response.ok) {
		throw new Error(`[${OPERATION}] Request failed with status ${response.status}`)
	}

	const stream = response.body
	if (!stream || typeof stream.getReader !== 'function') {
		throw new Error(`[${OPERATION}] Response body is not readable`)
	}

	const reader = stream.getReader()
	const decoder = new TextDecoder()
	let buffer = ''

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				break
			}

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() ?? ''

			for (const line of lines) {
				if (!line.trim()) {
					continue
				}

				processStream(JSON.parse(line) as ImportStreamResponse, onData)
			}
		}

		buffer += decoder.decode()
		if (buffer.trim()) {
			processStream(JSON.parse(buffer) as ImportStreamResponse, onData)
		}
	} finally {
		reader.releaseLock()
	}
}

/**
 * Forward data events to the consumer, ignoring control messages.
 *
 * @param message Parsed stream message
 * @param onData Callback invoked for each streamed data event
 */
function processStream(message: ImportStreamResponse, onData: (data: ImportStreamDataResponse) => void): void {
	if (message.type === 'control') {
		return
	}

	onData(message)
}

/**
 * Import vCards one by one via CardDAV, for servers without the OCS import endpoint.
 * Progress is reported through the same events as the streamed import.
 *
 * @param target Destination address book
 * @param data vCard file contents
 * @param onData Callback invoked for each progress event
 */
async function transceiveLegacy(
	target: ImportTarget,
	data: string,
	onData: (data: ImportStreamDataResponse) => void,
): Promise<void> {
	const vCards = data.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) ?? []
	onData({ type: 'count', transaction: '', vcard: vCards.length })

	const limit = pLimit(3)
	await Promise.all(vCards.map((vCard) => limit(async () => {
		try {
			const contact = new Contact(vCard, target.addressbook)
			await target.addressbook.dav.createVCard(contact.toStringStripQuotes())
			onData({ type: 'object', transaction: '', identifier: contact.uid, disposition: 'created', errors: [] })
		} catch (error) {
			logger.error('Could not import contact', { error })
			onData({ type: 'object', transaction: '', identifier: null, disposition: 'error', errors: [String(error)] })
		}
	})))
}

export const importService = {
	async import(request: ImportRequest, onData: (data: ImportStreamDataResponse) => void): Promise<void> {
		return transceiveStream(request, onData)
	},

	async importLegacy(target: ImportTarget, data: string, onData: (data: ImportStreamDataResponse) => void): Promise<void> {
		return transceiveLegacy(target, data, onData)
	},
}

export default importService
