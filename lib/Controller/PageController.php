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

use OC\App\CompareVersion;
use OCP\App\IAppManager;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SocialApiService;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\IRequest;
use OCP\IUserSession;
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

	/** @var IAppManager */
	private $appManager;

	/** @var CompareVersion */
	private $compareVersion;

	public function __construct(IRequest $request,
								IConfig $config,
								IInitialStateService $initialStateService,
								IFactory $languageFactory,
								IUserSession $userSession,
								SocialApiService $socialApiService,
								IAppManager $appManager,
								CompareVersion $compareVersion) {
		parent::__construct(Application::APP_ID, $request);

		$this->config = $config;
		$this->initialStateService = $initialStateService;
		$this->languageFactory = $languageFactory;
		$this->userSession = $userSession;
		$this->socialApiService = $socialApiService;
		$this->appManager = $appManager;
		$this->compareVersion = $compareVersion;
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
		$defaultProfile = $this->config->getAppValue(Application::APP_ID, 'defaultProfile', 'HOME');

		$supportedNetworks = $this->socialApiService->getSupportedNetworks();
		// allow users to retrieve avatars from social networks (default: yes)
		$syncAllowedByAdmin = $this->config->getAppValue(Application::APP_ID, 'allowSocialSync', 'yes');
		// automated background syncs for social avatars (default: no)
		$bgSyncEnabledByUser = $this->config->getUserValue($userId, Application::APP_ID, 'enableSocialSync', 'no');

		$circleVersion = $this->appManager->getAppVersion('circles');
		$isContactsInteractionEnabled = $this->appManager->isEnabledForUser('contactsinteraction') === true;
		$isCirclesEnabled = $this->appManager->isEnabledForUser('circles') === true;
		// if circles is not installed, we use 0.0.0
		$isCircleVersionCompatible = $this->compareVersion->isCompatible($circleVersion ? $circleVersion : '0.0.0', 22);
		// Check whether group sharing is enabled or not 
		$isGroupSharingEnabled = $this->config->getAppValue('core', 'shareapi_allow_group_sharing', 'yes') === 'yes';

		$this->initialStateService->provideInitialState(Application::APP_ID, 'locales', $locales);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'defaultProfile', $defaultProfile);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'supportedNetworks', $supportedNetworks);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'allowSocialSync', $syncAllowedByAdmin);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'enableSocialSync', $bgSyncEnabledByUser);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'isContactsInteractionEnabled', $isContactsInteractionEnabled);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'isCirclesEnabled', $isCirclesEnabled && $isCircleVersionCompatible);

		Util::addScript(Application::APP_ID, 'contacts-main');
		Util::addStyle(Application::APP_ID, 'contacts');

		return new TemplateResponse(Application::APP_ID, 'main');
	}
}
