<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Settings;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SocialApiService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {
	public function __construct(
		private IInitialState $initialState,
		private SocialApiService $socialApiService,
	) {
	}

	/**
	 * @return TemplateResponse
	 */
	#[\Override]
	public function getForm() {
		$this->initialState->provideInitialState('allowSocialSync', $this->socialApiService->syncAllowedByAdmin());
		return new TemplateResponse(Application::APP_ID, 'settings/admin');
	}

	/**
	 * @return string the section ID, e.g. 'sharing'
	 */
	#[\Override]
	public function getSection() {
		return 'groupware';
	}

	/**
	 * @return int whether the form should be rather on the top or bottom of
	 *             the admin section. The forms are arranged in ascending order of the
	 *             priority values. It is required to return a value between 0 and 100.
	 */
	#[\Override]
	public function getPriority() {
		return 75;
	}
}
