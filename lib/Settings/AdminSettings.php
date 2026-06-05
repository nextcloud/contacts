<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Settings;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\IConfig;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {
	protected $appName;

	public function __construct(
		private IConfig $config,
		private IInitialState $initialState,
		private FederatedInvitesService $federatedInvitesService,
	) {
		$this->appName = Application::APP_ID;
	}

	#[\Override]
	public function getForm(): TemplateResponse {
		foreach (Application::AVAIL_SETTINGS as $key => $default) {
			$data = $this->config->getAppValue($this->appName, $key, $default);
			$this->initialState->provideInitialState($key, $data);
		}
		$this->initialState->provideInitialState(
			'ocmInvitesConfig',
			$this->federatedInvitesService->getOcmInvitesConfig(),
		);
		return new TemplateResponse($this->appName, 'settings/admin');
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
