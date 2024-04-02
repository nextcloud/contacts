<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
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

	/** @var IConfig */
	private $config;

	/** @var IUserSession */
	private $userSession;

	/** @var SocialApiService */
	private $socialApiService;

	public function __construct(IRequest $request,
		IConfig $config,
		IUserSession $userSession,
		SocialApiService $socialApiService) {
		parent::__construct(Application::APP_ID, $request);

		$this->config = $config;
		$this->appName = Application::APP_ID;
		$this->userSession = $userSession;
		$this->socialApiService = $socialApiService;
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
