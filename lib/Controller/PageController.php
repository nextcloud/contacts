<?php
/**
 * @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

use OCA\Contacts\Service\SocialApiService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;

use OCA\Contacts\AppInfo\Application;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\IUserSession;
use OCP\IRequest;
use OCP\L10N\IFactory;
use OCP\Util;

class PageController extends Controller {
	/** @var IConfig */
	private $config;

	/** @var IInitialStateService */
	private $initialStateService;

	/** @var IFactory */
	private $languageFactory;

	/** @var IUserSession */
	private $userSession;

	/** @var SocialApiService */
	private $socialApiService;

	public function __construct(IRequest $request,
								IConfig $config,
								IInitialStateService $initialStateService,
								IFactory $languageFactory,
								IUserSession $userSession,
								SocialApiService $socialApiService) {
		parent::__construct(Application::APP_ID, $request);

		$this->appName = Application::APP_ID;
		$this->config = $config;
		$this->initialStateService = $initialStateService;
		$this->languageFactory = $languageFactory;
		$this->userSession = $userSession;
		$this->socialApiService = $socialApiService;
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Default routing
	 */
	public function index(): TemplateResponse {
		$user = $this->userSession->getUser();
		$userId = '';
		if (!is_null($user)) {
			$userId = $user->getUid();
		}

		$locales = $this->languageFactory->findAvailableLocales();
		$defaultProfile = $this->config->getAppValue($this->appName, 'defaultProfile', 'HOME');
		$supportedNetworks = $this->socialApiService->getSupportedNetworks();
		$syncAllowedByAdmin = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes'); // allow users to retrieve avatars from social networks (default: yes)
		$bgSyncEnabledByUser = $this->config->getUserValue($userId, $this->appName, 'enableSocialSync', 'no'); // automated background syncs for social avatars (default: no)

		$this->initialStateService->provideInitialState($this->appName, 'locales', $locales);
		$this->initialStateService->provideInitialState($this->appName, 'defaultProfile', $defaultProfile);
		$this->initialStateService->provideInitialState($this->appName, 'supportedNetworks', $supportedNetworks);
		$this->initialStateService->provideInitialState($this->appName, 'locales', $locales);
		$this->initialStateService->provideInitialState($this->appName, 'defaultProfile', $defaultProfile);
		$this->initialStateService->provideInitialState($this->appName, 'supportedNetworks', $supportedNetworks);
		$this->initialStateService->provideInitialState($this->appName, 'allowSocialSync', $syncAllowedByAdmin);
		$this->initialStateService->provideInitialState($this->appName, 'enableSocialSync', $bgSyncEnabledByUser);

		Util::addScript($this->appName, 'contacts');
		Util::addStyle($this->appName, 'contacts');

		return new TemplateResponse($this->appName, 'main');
	}
}
