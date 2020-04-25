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
	 * Each item stores the avatar-url-formula as recipe and a cleanup parameter to
	 * extract the profile-id from the users entry
	 * 
	 * @const {array} SOCIAL_CONNECTORS dictionary of supported social networks
	 */
	const SOCIAL_CONNECTORS = [
		'facebook' 	=> [
			'recipe' 	=> 'https://graph.facebook.com/{socialId}/picture?width=720',
			'cleanups' 	=> ['basename'],
		],
		'tumblr' 	=> [
			'recipe' 	=> 'https://api.tumblr.com/v2/blog/{socialId}/avatar/512',
			'cleanups' 	=> ['regex' => '/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/i', 'group' => 1], // "subdomain"
		],
		/* untrusted
		'instagram' 	=> [
			'recipe' 	=> 'http://avatars.io/instagram/{socialId}',
			'cleanups' 	=> ['basename'],
		],
		'twitter' 	=> [
			'recipe' 	=> 'http://avatars.io/twitter/{socialId}',
			'cleanups' 	=> ['basename'],
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
	 * @returns {array} an array of supported social networks
	 */
	public function getSupportedNetworks() : array {

		$supported = array();
		$supported['avatar'] = array();

		foreach(array_keys(self::SOCIAL_CONNECTORS) as $network) {
			array_push($supported['avatar'], $network);
		}

		return $supported;
	}

	/**
	 * @NoAdminRequired
	 *
	 * generate download url for a social entry
	 *
	 * @param {array} socialentries all social data from the contact
	 * @param {String} network the choice which network to use or 'any' to use first match
	 *
	 * @returns {String} the url to the requested information or null in case of errors
	 */
	protected function getSocialConnector(array $socialEntries, string $network) : ?string {

		$connector = null;
		$selection = array();

		// selection of considered networks
		if ($network === 'any') {
			$selection = self::SOCIAL_CONNECTORS;
		} else {
			$selection = array($network => self::SOCIAL_CONNECTORS[$network]);
		}

		// check selected networks in order
		foreach($selection as $socialNetSelected => $socialRecipe) {

			// search for this network in user's profile
			foreach ($socialEntries as $socialNetwork => $profileId) {

				if ($socialNetSelected === strtolower($socialNetwork)) {
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
	 * @param {String} network the social network to use or 'any' to use first match
	 *
	 * @returns {JSONResponse} an empty JSONResponse with respective http status code
	 */
	public function fetch(string $addressbookId, string $contactId, string $network) : JSONResponse {

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
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			// search contact in that addressbook
			$contact = $addressBook->search($contactId, ['UID'], [])[0];
			if (is_null($contact)) {
				return new JSONResponse([], Http::STATUS_BAD_REQUEST);
			}

			// get social data
			$socialprofiles = $contact['X-SOCIALPROFILE'];
			if (is_null($socialprofiles)) {
				return new JSONResponse([], Http::STATUS_PRECONDITION_FAILED);
			}

			// retrieve data
			try {
				$url = $this->getSocialConnector($socialprofiles, $network);
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

			if (!$socialdata || $image_type === null) {
				return new JSONResponse([], Http::STATUS_NOT_FOUND);
			}

			// update contact
			if (!empty($contact['PHOTO'])) {
				// overwriting without notice!
			}

			$changes = array();
			$changes['URI'] = $contact['URI'];

			$version = (float) $contact['VERSION'];
			if ($version >= 4.0) {
				$changes['PHOTO'] = "data:" . $image_type . ";base64," . base64_encode($socialdata);
			} elseif ($version >= 3.0) {
				$image_type = str_replace('image/', '', $image_type);
				$changes['PHOTO'] = "ENCODING=b;TYPE=" . strtoupper($image_type) . ":" . base64_encode($socialdata);
			} else {
				return new JSONResponse([], Http::STATUS_CONFLICT);
			}

			if ($changes['PHOTO'] === $contact['PHOTO']) {
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
