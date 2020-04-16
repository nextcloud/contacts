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
	 * @NoCSRFRequired
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
	public function fetch(string $addressbookId, string $contactId, string $type) {

		$url = null;
		$response = 404;

		try {
			// get social parameters from contact
			$contact = $this->manager->search($contactId, array('UID'))[0];
			$socialprofile = $contact['X-SOCIALPROFILE'];

			// retrieve data
			try {
				$url = $this->getSocialConnector($socialprofile, $type);
			}
			catch (Exception $e) {
				$response = 500;
				throw new Exception($e->getMessage()); // TODO: implement better error handling
			}

			if (empty($url)) {
				$response = 500;
				throw new Exception('not implemented');
			}

			$host = parse_url($url);
			if (!$host) {
				$response = 404;
				throw new Exception('Could not parse URL');
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
				$response = 404;
				throw new Exception('Could not parse URL');
			}

			$response = 200;
			switch ($type) {
				case "avatar":
					header("Content-type:image/png");
					break;
				default:
					header("Content-type:application/json");
			}
			
			echo $socialdata;
		} 
		catch (Exception $e) {
		}

		http_response_code($response);
		exit;

		// TODO: instead of returning the image, modify the contact directly

	}
}
