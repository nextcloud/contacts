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

use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
// use OCP\IInitialStateService;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\L10N\IFactory;
use OCP\IRequest;


class SocialApiController extends ApiController {

	protected $appName;

	//** @var IInitialStateService */
	// private  $initialStateService;

	/** @var IFactory */
	private  $languageFactory;
	/** @var IManager */
	private  $manager;
	/** @var IConfig */
	private  $config;

	/**
	 * This constant stores the supported social networks
	 * It is an ordered list, so that first listed items will be checked first
	 * Each item stores the avatar-url-formula as recipe, a cleanup parameter to
	 * extract the profile-id from the users entry, and possible filters to check
	 * validity
	 * 
	 * @const {array} SOCIAL_CONNECTORS dictionary of supported social networks
	 */
	const SOCIAL_CONNECTORS = [
		'facebook' 	=> [
			'recipe' 	=> 'https://graph.facebook.com/{socialId}/picture?width=720',
			'cleanups' 	=> ['basename'],
			'checks'	=> [],
		],
		'tumblr' 	=> [
			'recipe' 	=> 'https://api.tumblr.com/v2/blog/{socialId}/avatar/512',
			'cleanups' 	=> ['basename'],
			'checks'	=> [],
		],
		/* do we trust avatars.io?
		'instagram' 	=> [
			'recipe' 	=> 'http://avatars.io/instagram/{socialId}',
			'cleanups' 	=> ['basename'],
			'checks'	=> []
		],
		'twitter' 	=> [
			'recipe' 	=> 'http://avatars.io/twitter/{socialId}',
			'cleanups' 	=> ['basename'],
			'checks'	=> []
		],
		*/
	];

	public function __construct(string $AppName,
								IRequest $request,
								IManager $manager,
								IConfig $config,
								// IInitialStateService $initialStateService,
								IFactory $languageFactory) {
		parent::__construct($AppName, $request);

		$this->appName = $AppName;
		// $this->initialStateService = $initialStateService;
		$this->languageFactory = $languageFactory;
		$this->manager = $manager;
		$this->config = $config;

	}


	/**
	 * @NoAdminRequired
	 *
	 * returns an array of supported social networks
	 *
	 * @param {String} type the kind of information interested in -- provision
	 * @returns {array} an array of supported social networks
	 */
	public function getSupportedNetworks(string $type) : ?array {

		$supported = array();
		$supported['avatar'] = array();

		foreach(self::SOCIAL_CONNECTORS as $network => $social) {
			array_push($supported['avatar'], $network);
		}

		if (strcmp($type, 'all') === 0) {
			// return array of arrays
			return $supported;
		}
		if (array_key_exists($type, $supported)) {
			return $supported[$type];
		}
		// unknown type
		return array();
	}

	/**
	 * @NoAdminRequired
	 *
	 * generate download url for a social entry (based on type of data requested)
	 *
	 * @param {array} socialentry the network and id from the social profile
	 * @returns {String} the url to the requested information or null in case of errors
	 */
	protected function getSocialConnector(array $socialentry) : ?string {

		$connector = null;

		// check supported networks in order
		foreach(self::SOCIAL_CONNECTORS as $network => $social) {

			// search for this network in user's profile
			foreach ($socialentry as $networkentry => $profileId) {
				if ($network === strtolower($networkentry)) {
					// cleanups
					if (in_array('basename', $social['cleanups'])) {
						$profileId = basename($profileId);
					}
					// checks
					if (in_array('number', $social['checks'])) {
						if (!ctype_digit($profileId)) {
							break;
						}
					}
					$connector = str_replace("{socialId}", $profileId, $social['recipe']);
					break;
				}
			}
			if ($connector) {
				break;
			}
		}
		return ($connector);
	}


	/**
	 * @NoAdminRequired
	 *
	 * Retrieves social profile data for a contact
	 *
	 * @param {String} addressbookId the addressbook identifier
	 * @param {String} contactId the contact identifier
	 * @param {String} type the kind of information to retrieve -- provision
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function fetch(string $addressbookId, string $contactId, string $type) : JSONResponse {

		$url = null;

		try {
			// get corresponding addressbook
			$addressBooks = $this->manager->getUserAddressBooks();
			$addressBook = null;
			foreach($addressBooks as $ab) {
				if ($ab->getUri() === $addressbookId) {
					$addressBook = $ab;
				}
			}
			if (is_null($addressBook)) {
				return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
			}
			
			// search contact in that addressbook
			$contact = $addressBook->search($contactId, ['UID'], [])[0];
			if (is_null($contact)) {
				return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR); 
			}

			// get social data
			$socialprofile = $contact['X-SOCIALPROFILE'];
			if (is_null($socialprofile)) {
				return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
			}

			// retrieve data
			try {
				$url = $this->getSocialConnector($socialprofile);
			}
			catch (Exception $e) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			if (empty($url)) {
				return new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED);
			}

			$host = parse_url($url);
			if (!$host) {
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

			$image_type = null;
			foreach ($http_response_header as $value) {
				if (preg_match('/^Content-Type:/i', $value)) {
					if (stripos($value, "image") !== false) {
						$image_type = substr($value, stripos($value, "image"));
					}
				}
			}

			if ((!$socialdata) || ($image_type === null)) {
				return new JSONResponse([], Http::STATUS_NOT_FOUND);
			}

			// update contact
			switch ($type) {
				case 'avatar':
					if (!empty($contact['PHOTO'])) {
						// overwriting without notice!
					}
					
					$changes = array();
					$changes['URI']=$contact['URI'];

					$version = (float) $contact['VERSION'];
					if ($version >= 4.0) {
						$changes['PHOTO'] = "data:" . $image_type . ";base64," . base64_encode($socialdata);
					}
					elseif ($version >= 3.0) {
						$image_type = str_replace('image/', '', $image_type);
						$changes['PHOTO'] = "ENCODING=b;TYPE=" . strtoupper($image_type) . ":" . base64_encode($socialdata);
					}
					else {
						return new JSONResponse([], Http::STATUS_CONFLICT);
					}

					if ($changes['PHOTO'] === $contact['PHOTO']) {
						return new JSONResponse([], Http::STATUS_NOT_MODIFIED);
					}

					$addressBook->createOrUpdate($changes, $addressbookId);
					break;
				default:
					return new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED);
			}
			
		} 
		catch (Exception $e) {
			return new JSONResponse([], Http::STATUS_INTERNAL_SERVER_ERROR);
		}

		return new JSONResponse([], Http::STATUS_OK);
	}
}
