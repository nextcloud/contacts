<?php
/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OC\App\CompareVersion;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SocialApiService;
use OCP\App\IAppManager;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
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
		$talkVersion = $this->appManager->getAppVersion('spreed');
		$isTalkEnabled = $this->appManager->isEnabledForUser('spreed') === true;

		$isTalkVersionCompatible = $this->compareVersion->isCompatible($talkVersion ? $talkVersion : '0.0.0', 2);

		$this->initialStateService->provideInitialState(Application::APP_ID, 'isGroupSharingEnabled', $isGroupSharingEnabled);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'locales', $locales);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'defaultProfile', $defaultProfile);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'supportedNetworks', $supportedNetworks);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'allowSocialSync', $syncAllowedByAdmin);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'enableSocialSync', $bgSyncEnabledByUser);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'isContactsInteractionEnabled', $isContactsInteractionEnabled);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'isCirclesEnabled', $isCirclesEnabled && $isCircleVersionCompatible);
		$this->initialStateService->provideInitialState(Application::APP_ID, 'isTalkEnabled', $isTalkEnabled && $isTalkVersionCompatible);

		Util::addScript(Application::APP_ID, 'contacts-main');

		return new TemplateResponse(Application::APP_ID, 'main');
	}
}
