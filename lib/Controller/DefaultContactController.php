<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\Files\NotFoundException;
use OCP\Files\IAppData;
use OCP\IConfig;
use OCP\IRequest;

class DefaultContactController extends ApiController {

	public function __construct(
		IRequest $request,
		private IConfig $config,
        private IAppData $appData,
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
        $key ='enableDefaultContact';
		$this->config->setAppValue(Application::APP_ID, $key, $allow);
		return new JSONResponse([], Http::STATUS_OK);
	}

    public function setDefaultContact($contactData){ 
        if(!$this->config->getAppValue(Application::APP_ID, 'enableDefaultContact', 'yes')){
            return new JSONResponse([], Http::STATUS_FORBIDDEN);
        }
        try{
            $folder = $this->appData->getFolder('defaultContact');
        }
        catch(NotFoundException $e){
            $folder = $this->appData->newFolder('defaultContact');
        }
        if(!$folder->fileExists('defaultContact.vcf')){
            $file = $folder->newFile('defaultContact.vcf');
        }
        else {
            $file = $folder->getFile('defaultContact.vcf');
        }
        $file->putContent($contactData);
        return new JSONResponse([], Http::STATUS_OK);
    }

}