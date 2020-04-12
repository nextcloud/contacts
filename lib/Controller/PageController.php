<?php
/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

class PageController extends Controller {

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
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Default routing
	 */
	public function index(): TemplateResponse {
		$locales = $this->languageFactory->findAvailableLocales();
		$defaultProfile = $this->config->getAppValue($this->appName, 'defaultProfile', 'HOME');
		// TODO: use initialStateService once min-version is 16!
		// $this->initialStateService->provideInitialState($this->appName, 'locales', $locales);
		// $this->initialStateService->provideInitialState($this->appName, 'defaultProfile', $defaultProfile);
		return new TemplateResponse(
			'contacts',
			'main',
			['locales' => json_encode($locales), 'defaultProfile'=> json_encode($defaultProfile)]); // templates/main.php
	}


	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * param id facebook profile id
	 */
	public function avatar($id)
	{
		$url = "https://graph.facebook.com/" . ($id) . "/picture?width=720";
		$response = 404;

		try {
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
				throw new Exception('Could not parse URL');
				$response = 404;
			}
			else {
				$response = 200;
				header("Content-type:image/png");
				echo $image;
			}
		} 
		catch (Exception $e) {
		}

		http_response_code($response);
		exit;
	}

}
