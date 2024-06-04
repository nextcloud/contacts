<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Settings;

use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IInitialStateService;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {
	protected $appName;

	/** @var IConfig */
	private $config;

	/** @var IInitialStateService */
	private $initialStateService;

	/**
	 * Admin constructor.
	 *
	 * @param IConfig $config
	 * @param IL10N $l
	 */
	public function __construct(IConfig $config, IInitialStateService $initialStateService) {
		$this->appName = Application::APP_ID;
		$this->config = $config;
		$this->initialStateService = $initialStateService;
	}

	/**
	 * @return TemplateResponse
	 */
	public function getForm() {
		foreach (Application::AVAIL_SETTINGS as $key => $default) {
			$data = $this->config->getAppValue($this->appName, $key, $default);
			$this->initialStateService->provideInitialState($this->appName, $key, $data);
		}
		return new TemplateResponse($this->appName, 'settings/admin');
	}

	/**
	 * @return string the section ID, e.g. 'sharing'
	 */
	public function getSection() {
		return 'groupware';
	}

	/**
	 * @return int whether the form should be rather on the top or bottom of
	 * the admin section. The forms are arranged in ascending order of the
	 * priority values. It is required to return a value between 0 and 100.
	 */
	public function getPriority() {
		return 75;
	}
}
