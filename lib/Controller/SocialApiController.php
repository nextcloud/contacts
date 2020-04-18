<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <contacts@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <contacts@matthiasheinisch.de>
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

	// /** @var IInitialStateService */
	// private $initialStateService;

	/** @var IFactory */
	private $languageFactory;
	/** @var IManager */
	private  $manager;
	/** @var IConfig */
	private  $config;

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
	 * generate download url for a social entry (based on type of data requested)
	 */
	protected function getSocialConnector(array $socialentry, string $type) : ?string {
		foreach ($socialentry as $network => $candidate) {
			$connector = null;
			$valid = false;
	
			// get profile-id
			switch (strtolower($network)) {
				case "facebook":
					$candidate = basename($candidate);
					if (!ctype_digit($candidate)) {
						// TODO: determine facebook profile id from username
						break;
					}
					$valid = true;
					break;
			}
			if ($valid) {
				// build connector
				switch (strtolower($network)) {
					case "facebook":
						switch ($type) {
							case "avatar":
								$connector = "https://graph.facebook.com/" . ($candidate) . "/picture?width=720";
								break;
							default:
								break;
						}
						break;
				}
				
				// return first valid connector:
				if ($connector) { return ($connector); }
			}
		}
		
		// reached only if no valid connectors found
		return null;
	}

	/**
	 * @NoAdminRequired
	 *
	 * Retrieves social profile data for a contact
	 */
	public function fetch(string $addressbookId, string $contactId, string $type) : JSONResponse {

		$url = null;
		$response = new JSONResponse(array());
		$response->setStatus(404);

		try {
			// get corresponding addressbook
			$addressBooks = $this->manager->getUserAddressBooks();
			$addressBook = null;
			foreach($addressBooks as $ab) {
				// searching the addressbook id 'contactId'
				if ($ab->getUri() === $addressbookId) {
					$addressBook = $ab;
				}
			}
			
			// search contact in that addressbook
			$contact = $addressBook->search($contactId, ['UID'], [])[0];
/* TEST REFRESH 
// FIXME: for testing value refreshes, to be removed
$changes = array();
$changes['URI']=$contact['URI'];
$changes['FN'] = "Mr. Test " . date('i s');
$addressBook->createOrUpdate($changes, $addressbookId);
$response->setStatus(200);
// EOT */
			$socialprofile = $contact['X-SOCIALPROFILE'];

			// retrieve data
			try {
				$url = $this->getSocialConnector($socialprofile, $type);
			}
			catch (Exception $e) {
				$response->setStatus(400);
				return $response;
			}

			if (empty($url)) {
				$response->setStatus(501);
				return $response;
			}

			$host = parse_url($url);
			if (!$host) {
				$response->setStatus(400);
				return $response;
			}
			$opts = [
				"http" => [
					"method" => "GET",
					"header" => "User-Agent: Nextcloud Contacts App"
				]
			];
			$context = stream_context_create($opts);
			$socialdata = file_get_contents($url, false, $context);
			if (!$socialdata) {
				$response->setStatus(404);
				return $response;
			}

			// update contact
			switch ($type) {
				case "avatar":
					if (!empty($contact['PHOTO'])) {
						// overwriting without notice?
					}
					$changes = array();
					$changes['URI']=$contact['URI'];
					$changes['PHOTO'] = "data:image/png;base64," . base64_encode($socialdata);
					$addressBook->createOrUpdate($changes, $addressbookId);
					$response->setStatus(200);
					break;
				default:
					$response->setStatus(501);
					return $response;
			}
			
		} 
		catch (Exception $e) {
			$response->setStatus(500);
			return $response;
		}

		return $response;
	}
}
