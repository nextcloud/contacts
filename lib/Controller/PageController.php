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

use OCP\App\IAppManager;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\IRequest;
use OCP\L10N\IFactory;
use OCP\Util;

class PageController extends Controller {

	protected $appName;

	/** @var IConfig */
	private  $config;

	/** @var IInitialStateService */
	private $initialStateService;

	/** @var IFactory */
	private $languageFactory;

	public function __construct(string $appName,
								IRequest $request,
								IConfig $config,
								IInitialStateService $initialStateService,
								IFactory $languageFactory,
								IAppManager $appManager) {
		parent::__construct($appName, $request);

		$this->appName = $appName;
		$this->config = $config;
		$this->initialStateService = $initialStateService;
		$this->languageFactory = $languageFactory;
		$this->appManager = $appManager;
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

		$this->initialStateService->provideInitialState($this->appName, 'locales', $locales);
		$this->initialStateService->provideInitialState($this->appName, 'defaultProfile', $defaultProfile);
		$this->initialStateService->provideInitialState($this->appName, 'contactsinteraction', $this->appManager->isEnabledForUser('contactsinteraction') === true);
		
		Util::addScript($this->appName, 'contacts-main');
		Util::addStyle($this->appName, 'contacts');

		return new TemplateResponse($this->appName, 'main');
	}
}
