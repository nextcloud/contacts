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

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
// use OCP\IInitialStateService;
use OCP\IConfig;
use OCP\L10N\IFactory;
use OCP\IRequest;

class ApiController extends Controller {

	protected $appName;

	// /** @var IInitialStateService */
	// private $initialStateService;

	/** @var IFactory */
	private $languageFactory;
	/** @var IConfig */
	private  $config;

	public function __construct(string $AppName,
								IRequest $request,
								IConfig $config,
								// IInitialStateService $initialStateService,
								IFactory $languageFactory) {
		parent::__construct($AppName, $request);

		$this->appName = $AppName;
		// $this->initialStateService = $initialStateService;
		$this->languageFactory = $languageFactory;
		$this->config = $config;
	}


	/**
	 * generate download url for a social entry (based on type of data requested)
	 *
	 * @param {array} socialentry entry of contact
	 * @param type which information to link to (avatar, ...)
	 * @return string
	 */
	protected function getSocialConnector($socialentry, $type) : ?string {
		if (!is_array($socialentry)) {
			throw new Exception("socialentry format missmatch"); // FIXME: the Exceptions seem not to work as expected...
		}

		$candidate = $socialentry[3];
		$network   = $socialentry[1]['type'];
		$connector = null;

		if (is_array($network)) { $network = $network[0]; }

		// get profile-id
		switch ($network) {
			case "facebook":
				$candidate = basename($candidate);
				if (!ctype_digit($candidate)) {
					// TODO: determine facebook profile id from username
					throw new Exception("facebook profile-id expected to be a number, not %s", $candidate);
				}
				break;
			default:
				throw new Exception("%s not implemented", $network);
		}

		// build connector
		switch ($network) {
			case "facebook":
				switch ($type) {
					case "avatar":
						$connector = "https://graph.facebook.com/" . ($candidate) . "/picture?width=720";
						break;
					default:
						throw new Exception("%s for %s not implemented", $type, $network);
				}
				break;
			default:
				throw new Exception("Unexpected error building the connector for %s", $network);
		}

		return ($connector);

	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Retrieves the social profile picture for a contact
	 *
	 * @param group addressbook
	 * @param contact contact information
	 * @param type which information to get: avatar, ...
	 */
	public function social($group, $contact, $type) {

		$url = null;
		$response = 404;

		try {
			// get social parameters from contact

			/* TODO - port from javascript...
			const jCal = this.contact.jCal
			const socialentries = jCal[1].filter(props => props[0] === 'x-socialprofile')
			socialentries.forEach(getSocialConnector)
			*/
			// FIXME static for testing:
			$socialprofile = array("foo",array("type" => "facebook"),"bar","https://facebook.com/4");

			try {
				$url = $this->getSocialConnector($socialprofile, $type);
			}
			catch (Exception $e) {
				$response = 500;
				throw new Exception($e->getMessage());
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
			$image = file_get_contents($url, false, $context);
			if (!$image) {
				$response = 404;
				throw new Exception('Could not parse URL');
			}

			$response = 200;
			header("Content-type:image/png");
			echo $image;
		} 
		catch (Exception $e) {
		}

		http_response_code($response);
		exit;

	}
}
