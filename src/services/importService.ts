/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type {
	ImportRequest,
	ImportStreamDataResponse,
	ImportStreamRequest,
	ImportStreamResponse,
} from '../types/import.ts'

/**
 * Contacts import service
 */
import { getRequestToken } from '@nextcloud/auth'
import { generateOcsUrl } from '@nextcloud/router'

const API_URL = generateOcsUrl('/contacts/import')
const OPERATION = 'contacts import'

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

export const importService = {
	async import(request: ImportRequest, onData: (data: ImportStreamDataResponse) => void): Promise<void> {
		return transceiveStream(request, onData)
	},
}

export default importService
