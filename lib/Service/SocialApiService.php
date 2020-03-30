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

namespace OCA\Contacts\Service;

use OCA\Contacts\Service\Social\CompositeSocialProvider;
use OCA\Contacts\AppInfo\Application;

use OCP\Contacts\IManager;
use OCP\IAddressBook;

use OCP\IConfig;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Http\Client\IClientService;

class SocialApiService {

	/** @var CompositeSocialProvider */
	private $socialProvider;
	/** @var IManager */
	private $manager;
	/** @var IConfig */
	private $config;
	/** @var IClientService */
	private $clientService;

	public function __construct(
					CompositeSocialProvider $socialProvider,
					IManager $manager,
					IConfig $config,
					IClientService $clientService) {
		$this->socialProvider = $socialProvider;
		$this->manager = $manager;
		$this->config = $config;
		$this->clientService = $clientService;
	}


	/**
	 * @NoAdminRequired
	 *
	 * returns an array of supported social networks
	 *
	 * @returns {array} array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		$isAdminEnabled = $this->config->getAppValue(Application::APP_ID, 'allowSocialSync', 'yes');
		if ($isAdminEnabled !== 'yes') {
			return [];
		}
		return $this->socialProvider->getSupportedNetworks();
	}


	/**
	 * @NoAdminRequired
	 *
	 * Adds/updates photo for contact
	 *
	 * @param {pointer} contact reference to the contact to update
	 * @param {string} imageType the image type of the photo
	 * @param {string} photo the photo as base64 string
	 */
	protected function addPhoto(array &$contact, string $imageType, string $photo) {
		$version = $contact['VERSION'];

		if (!empty($contact['PHOTO'])) {
			// overwriting without notice!
		}

		if ($version >= 4.0) {
			// overwrite photo
			$contact['PHOTO'] = "data:" . $imageType . ";base64," . $photo;
		} elseif ($version >= 3.0) {
			// add new photo
			$imageType = str_replace('image/', '', $imageType);
			$contact['PHOTO;ENCODING=b;TYPE=' . $imageType . ';VALUE=BINARY'] = $photo;

			// remove previous photo (necessary as new attribute is not equal to 'PHOTO')
			$contact['PHOTO'] = '';
		}
	}


	/**
	 * @NoAdminRequired
	 *
	 * Gets the addressbook of an addressbookId
	 *
	 * @param {String} addressbookId the identifier of the addressbook
	 *
	 * @returns {IAddressBook} the corresponding addressbook or null
	 */
	protected function getAddressBook(string $addressbookId) : ?IAddressBook {
		$addressBook = null;
		$addressBooks = $this->manager->getUserAddressBooks();
		foreach ($addressBooks as $ab) {
			if ($ab->getUri() === $addressbookId) {
				$addressBook = $ab;
			}
		}
		return $addressBook;
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
		$url = null;

		try {
			// get corresponding addressbook
			$addressBook = $this->getAddressBook($addressbookId);
			if (is_null($addressBook)) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			// search contact in that addressbook, get social data
			$contact = $addressBook->search($contactId, ['UID'], ['types' => true])[0];
			if (!isset($contact['X-SOCIALPROFILE'])) {
				return new JSONResponse([], Http::STATUS_PRECONDITION_FAILED);
			}
			$socialprofiles = $contact['X-SOCIALPROFILE'];
			// retrieve data
			$url = $this->socialProvider->getSocialConnector($socialprofiles, $network);

			if (empty($url)) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			$httpResult = $this->clientService->NewClient()->get($url);
			$socialdata = $httpResult->getBody();
			$imageType = $httpResult->getHeader('content-type');

			if (!$socialdata || $imageType === null) {
				return new JSONResponse([], Http::STATUS_NOT_FOUND);
			}

			// update contact
			$changes = [];
			$changes['URI'] = $contact['URI'];
			$changes['VERSION'] = $contact['VERSION'];
			$this->addPhoto($changes, $imageType, base64_encode($socialdata));

			if (isset($contact['PHOTO']) && $changes['PHOTO'] === $contact['PHOTO']) {
				return new JSONResponse([], Http::STATUS_NOT_MODIFIED);
			}

			$addressBook->createOrUpdate($changes, $addressbookId);
		} catch (Exception $e) {
			return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse([], Http::STATUS_OK);
	}
}
