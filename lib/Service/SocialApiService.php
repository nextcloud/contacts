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

use OCP\Contacts\IManager;
use OCP\IAddressBook;

use OCP\IConfig;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;


class SocialApiService {

	protected $appName;

	/** @var CompositeSocialProvider */
	private $socialProvider;
	/** @var IManager */
	private  $manager;
	/** @var IConfig */
	private  $config;

	public function __construct(string $AppName,
					CompositeSocialProvider $socialProvider,
					IManager $manager,
					IConfig $config) {

		$this->appName = $AppName;
		$this->socialProvider = $socialProvider;
		$this->manager = $manager;
		$this->config = $config;
	}


	/**
	 * @NoAdminRequired
	 *
	 * returns an array of supported social networks
	 *
	 * @returns {array} array of the supported social networks
	 */
	public function getSupportedNetworks() : array {
		$isAdminEnabled = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes');
		if ($isAdminEnabled !== 'yes') {
			return array();
		}
		return $this->socialProvider->getSupportedNetworks();
	}


	/**
	 * @NoAdminRequired
	 *
	 * Creates the photo start tag for the vCard
	 *
	 * @param {float} version the version of the vCard
	 * @param {array} header the http response headers containing the image type
	 *
	 * @returns {String} the photo start tag or null in case of errors
	 */
	protected function getPhotoTag(float $version, array $header) : ?string {

		$type = null;

		// get image type from headers
		foreach ($header as $value) {
			if (preg_match('/^Content-Type:/i', $value)) {
				if (stripos($value, "image") !== false) {
					$type = substr($value, stripos($value, "image"));
				}
			}
		}
		if (is_null($type)) {
			return null;
		}

		// return respective photo tag
		if ($version >= 4.0) {
			return "data:" . $type . ";base64,";
		}

		if ($version >= 3.0) {
			$type = str_replace('image/', '', $type);
			return "ENCODING=b;TYPE=" . strtoupper($type) . ":";
		}

		return null;
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
		foreach($addressBooks as $ab) {
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

			$opts = [
				"http" => [
					"method" => "GET",
					"header" => "User-Agent: Nextcloud Contacts App"
				]
			];
			$context = stream_context_create($opts);
			$socialdata = file_get_contents($url, false, $context);

			$photoTag = $this->getPhotoTag($contact['VERSION'], $http_response_header);

			if (!$socialdata || $photoTag === null) {
				return new JSONResponse([], Http::STATUS_NOT_FOUND);
			}

			// update contact
			$changes = array();
			$changes['URI'] = $contact['URI'];

			if (!empty($contact['PHOTO'])) {
				// overwriting without notice!
			}
			$changes['PHOTO'] = $photoTag . base64_encode($socialdata);

			if (isset($contact['PHOTO']) && $changes['PHOTO'] === $contact['PHOTO']) {
				return new JSONResponse([], Http::STATUS_NOT_MODIFIED);
			}

			$addressBook->createOrUpdate($changes, $addressbookId);
		}
		catch (Exception $e) {
			return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse([], Http::STATUS_OK);
	}
}
