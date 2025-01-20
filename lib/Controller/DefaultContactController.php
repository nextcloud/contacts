<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCP\App\IAppManager;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Files\IAppData;
use OCP\Files\NotFoundException;
use OCP\IConfig;
use OCP\IRequest;

class DefaultContactController extends ApiController {

	public function __construct(
		IRequest $request,
		private IConfig $config,
		private IAppData $appData,
		private IAppManager $appManager,
	) {
		parent::__construct(Application::APP_ID, $request);
	}


	/**
	 * update appconfig (admin setting)
	 *
	 * @param string allow the value to set
	 *
	 * @return JSONResponse an empty JSONResponse with respective http status code
	 */
	public function setAppConfig($allow) {
		$key = 'enableDefaultContact';
		if ($allow === 'yes' && !$this->defaultContactExists()) {
			$this->setInitialDefaultContact();
		}
		$this->config->setAppValue(Application::APP_ID, $key, $allow);
		return new JSONResponse([], Http::STATUS_OK);
	}

	public function setDefaultContact($contactData) {
		if (!$this->config->getAppValue(Application::APP_ID, 'enableDefaultContact', 'yes')) {
			return new JSONResponse([], Http::STATUS_FORBIDDEN);
		}
		try {
			$folder = $this->appData->getFolder('defaultContact');
		} catch (NotFoundException $e) {
			$folder = $this->appData->newFolder('defaultContact');
		}
		$file = (!$folder->fileExists('defaultContact.vcf')) ? $folder->newFile('defaultContact.vcf') : $folder->getFile('defaultContact.vcf');
		$file->putContent($contactData);
		return new JSONResponse([], Http::STATUS_OK);
	}

	private function setInitialDefaultContact() {
		$cardData = 'BEGIN:VCARD' . PHP_EOL .
		'VERSION:3.0' . PHP_EOL .
		'PRODID:-//Nextcloud Contacts v' . $this->appManager->getAppVersion('contacts') . PHP_EOL .
		'UID: janeDoe' . PHP_EOL .
		'FN:Jane Doe' . PHP_EOL .
		'ADR;TYPE=HOME:;;123 Street Street;City;State;;Country' . PHP_EOL .
		'EMAIL;TYPE=WORK:example@example.com' . PHP_EOL .
		'TEL;TYPE=HOME,VOICE:+999999999999' . PHP_EOL .
		'TITLE:Manager' . PHP_EOL .
		'ORG:Company' . PHP_EOL .
		'BDAY;VALUE=DATE:20000101' . PHP_EOL .
		'URL;VALUE=URI:https://example.com/' . PHP_EOL .
		'REV;VALUE=DATE-AND-OR-TIME:20241227T144820Z' . PHP_EOL .
		'END:VCARD';
		$folder = $this->appData->getFolder('defaultContact');
		$file = $folder->newFile('defaultContact.vcf');
		$file->putContent($cardData);
	}

	private function defaultContactExists(): bool {
		try {
			$folder = $this->appData->getFolder('defaultContact');
		} catch (NotFoundException $e) {
			$this->appData->newFolder('defaultContact');
			return false;
		}
		return $folder->fileExists('defaultContact.vcf');
	}

}
