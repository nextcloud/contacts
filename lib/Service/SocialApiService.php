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

use OCP\IAddressBook;

use OCP\Contacts\IManager;
use OCP\IConfig;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;

class SocialApiService {

	protected $appName;

	/** @var IManager */
	private  $manager;
	/** @var IConfig */
	private  $config;

	/**
	 * This constant stores the supported social networks
	 * It is an ordered list, so that first listed items will be checked first
	 * Each item stores the avatar-url-formula as recipe and cleanup parameters
	 *
	 * @const {array} SOCIAL_CONNECTORS dictionary of supported social networks
	 */
	const SOCIAL_CONNECTORS = [
		'instagram' 	=> [
			'recipe' 	=> 'https://www.instagram.com/{socialId}/?__a=1',
			'cleanups' 	=> ['basename', 'json' => 'graphql->user->profile_pic_url_hd'],
		],
		'facebook' 	=> [
			'recipe' 	=> 'https://graph.facebook.com/{socialId}/picture?width=720',
			'cleanups' 	=> ['basename'],
		],
		'tumblr' 	=> [
			'recipe' 	=> 'https://api.tumblr.com/v2/blog/{socialId}/avatar/512',
			'cleanups' 	=> ['regex' => '/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/i', 'group' => 1], // "subdomain"
		],
		/* untrusted
		'twitter' 	=> [
			'recipe' 	=> 'http://avatars.io/twitter/{socialId}',
			'cleanups' 	=> ['basename'],
		],
		*/
	];

	public function __construct(string $AppName,
					IManager $manager,
					IConfig $config) {

		$this->appName = $AppName;
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
		return array_keys(self::SOCIAL_CONNECTORS);
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
	public function getPhotoTag(float $version, array $header) : ?string {
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
	 * extracts desired value from a json
	 *
	 * @param {string} url the target from where to fetch the json
	 * @param {String} the desired key to filter for (nesting possible with '->')
	 *
	 * @returns {String} the extracted value or null if not present
	 */
	protected function getFromJson(string $url, string $desired) : ?string {
		try {
			$opts = [
				"http" => [
					"method" => "GET",
					"header" => "User-Agent: Nextcloud Contacts App"
				]
			];
			$context = stream_context_create($opts);
			$result = file_get_contents($url, false, $context);

			$jsonResult = json_decode($result,true);
			$location = explode ('->' , $desired);
			foreach ($location as $loc) {
				if (!isset($jsonResult[$loc])) {
					return null;
				}
				$jsonResult = $jsonResult[$loc];
			}
			return $jsonResult;
		}
		catch (Exception $e) {
			return null;
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
	public function getAddressBook(string $addressbookId) : ?IAddressBook {
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
	 * generate download url for a social entry
	 *
	 * @param {array} socialEntries all social data from the contact
	 * @param {String} network the choice which network to use (fallback: take first match)
	 *
	 * @returns {String} the url to the requested information or null in case of errors
	 */
	protected function getSocialConnector(array $socialEntries, string $network) : ?string {

		$connector = null;

		$selection = self::SOCIAL_CONNECTORS;
		// check if dedicated network selected
		if (isset(self::SOCIAL_CONNECTORS[$network])) {
			$selection = array($network => self::SOCIAL_CONNECTORS[$network]);
		}

		// check selected networks in order
		foreach($selection as $socialNetSelected => $socialRecipe) {

			// search for this network in user's profile
			foreach ($socialEntries as $socialEntry) {

				$socialNetSelected = strtolower($socialNetSelected);
				if ($socialNetSelected === strtolower($socialEntry['type'])) {
					$profileId = $socialEntry['value'];

					// cleanups: extract social id
					if (in_array('basename', $socialRecipe['cleanups'])) {
						$profileId = basename($profileId);
					}
					if (array_key_exists('regex', $socialRecipe['cleanups'])) {
						if (preg_match($socialRecipe['cleanups']['regex'], $profileId, $matches)) {
							$profileId = $matches[$socialRecipe['cleanups']['group']];
						}
					}
					$connector = str_replace("{socialId}", $profileId, $socialRecipe['recipe']);
					if (array_key_exists('json', $socialRecipe['cleanups'])) {
						$connector = $this->getFromJson($connector, $socialRecipe['cleanups']['json']);
						if (empty($connector)) {
							$connector = 'invalid';
						}
					}
					break;
				}
			}
			if ($connector && $connector !== 'invalid') {
				break;
			}
		}
		return ($connector);
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
			$url = $this->getSocialConnector($socialprofiles, $network);

			if ($url === 'invalid') {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}
			if (empty($url)) {
				return new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED);
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
