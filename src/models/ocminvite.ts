/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export default class OcmInvite {

	_data: any = {};

	/**
	 * Creates an instance of Invitation
	 *
	 * @param data
	 */
	constructor(data: any) {
		if (typeof data !== 'object') {
			throw new Error('Invalid invitation')
		}

		this._data = data
	}

	get key(): string {
		return this._data.recipientEmail
	}

	get token(): string {
		return this._data.token
	}

	get accepted(): boolean {
		return this._data.accepted
	}

	get recipientEmail(): string {
		return this._data.recipientEmail
	}

	get createdAt(): number {
		return this._data.createdAt
	}

	get expiredAt(): number {
		return this._data.expiredAt
	}

	/**
	 * Return the property for the search
	 *
	 * @readonly
	 * @memberof OcmInvite
	 * @return string
	 */
	get searchData() {
		return this.recipientEmail
	}
}
