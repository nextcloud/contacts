<?php

/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OC\App\CompareVersion;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\GroupSharingService;
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

	public function __construct(
		IRequest $request,
		private IConfig $config,
		private IInitialStateService $initialStateService,
		private IFactory $languageFactory,
		private IUserSession $userSession,
		private SocialApiService $socialApiService,
		private IAppManager $appManager,
		private CompareVersion $compareVersion,
		private GroupSharingService $groupSharingService,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Default routing
	 */
	public function index(): TemplateResponse {
		$user = $this->userSession->getUser();
		$userId = $user->getUid();

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
		$isGroupSharingEnabled = $this->groupSharingService->isGroupSharingAllowed($user);
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

		Util::addStyle(Application::APP_ID, 'contacts-main');
		Util::addScript(Application::APP_ID, 'contacts-main');

		return new TemplateResponse(Application::APP_ID, 'main');
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function joinInvitation(string $invitationCode): TemplateResponse {
		$this->initialStateService->provideInitialState(Application::APP_ID, 'invitationCode', $invitationCode);

		Util::addStyle(Application::APP_ID, 'contacts-join-invitation');
		Util::addScript(Application::APP_ID, 'contacts-join-invitation');

		return new TemplateResponse(Application::APP_ID, 'join-invitation');
	}
}
