<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SocialApiService;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUserSession;

class SocialApiController extends ApiController {
	protected $appName;

	public function __construct(
		IRequest $request,
		private IConfig $config,
		private IUserSession $userSession,
		private SocialApiService $socialApiService,
	) {
		parent::__construct(Application::APP_ID, $request);

		$this->appName = Application::APP_ID;
	}


	/**
	 * update appconfig (admin setting)
	 *
	 * @param {String} key the identifier to change
	 * @param {String} allow the value to set
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function setAppConfig($key, $allow) {
		$permittedKeys = ['allowSocialSync'];
		if (!in_array($key, $permittedKeys)) {
			return new JSONResponse([], Http::STATUS_FORBIDDEN);
		}
		$this->config->setAppValue(Application::APP_ID, $key, $allow);
		return new JSONResponse([], Http::STATUS_OK);
	}

	/**
	 * @NoAdminRequired
	 *
	 * update appconfig (user setting)
	 *
	 * @param {String} key the identifier to change
	 * @param {String} allow the value to set
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function setUserConfig($key, $allow) {
		$user = $this->userSession->getUser();
		if (is_null($user)) {
			return new JSONResponse([], Http::STATUS_PRECONDITION_FAILED);
		}
		$userId = $user->getUid();
		$this->config->setUserValue($userId, $this->appName, $key, $allow);
		return new JSONResponse([], Http::STATUS_OK);
	}


	/**
	 * @NoAdminRequired
	 *
	 * retrieve appconfig (user setting)
	 *
	 * @param {String} key the identifier to retrieve
	 *
	 * @returns {string} the desired value or null if not existing
	 */
	public function getUserConfig($key) {
		$user = $this->userSession->getUser();
		if (is_null($user)) {
			return null;
		}
		$userId = $user->getUid();
		return $this->config->getUserValue($userId, $this->appName, $key, 'null');
	}


	/**
	 * @NoAdminRequired
	 *
	 * returns an array of supported social networks
	 *
	 * @returns {array} array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		return $this->socialApiService->getSupportedNetworks();
	}


	/**
	 * @NoAdminRequired
	 *
	 * Retrieves social profile data for a contact and updates the entry
	 *
	 * @param {String} addressbookId the addressbook identifier
	 * @param {String} contactId the contact identifier
	 * @param {String} network the social network to use (if unkown: take first match)
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function updateContact(string $addressbookId, string $contactId, string $network) : JSONResponse {
		return $this->socialApiService->updateContact($addressbookId, $contactId, $network);
	}
}
