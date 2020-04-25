<?php
/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
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

use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
// use OCP\IInitialStateService;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\IAddressBook;
use OCP\L10N\IFactory;
use OCP\IRequest;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiControllerTest extends TestCase {

	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	//** @var IInitialStateService|MockObject */
	// private $initialStateService;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IConfig|MockObject */
	private  $config;

	/** @var IManager|MockObject */
	private  $manager;

	public function setUp() {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		// $this->initialStateService = $this->createMock(IInitialStateService::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->config = $this->createMock(IConfig::class);
		$this->manager = $this->createMock(IManager::class);

		$this->controller = new SocialApiController(
			'socialContact',
			$this->request,
			$this->manager,
			$this->config,
			// $this->initialStateService,
			$this->languageFactory
		);
	}

	public function anySocialProvider() {
		return [
			'no social profiles'	 			=> ['any', null, new JSONResponse([], Http::STATUS_PRECONDITION_FAILED)],
			'facebook profile with numbered profile id' 	=> ['any', array('facebook' => '4'), new JSONResponse([], Http::STATUS_OK)],
			'facebook profile as url' 			=> ['any', array('facebook' => 'https://www.facebook.com/4'), new JSONResponse([], Http::STATUS_OK)],
			'facebook profile as terminated url' 		=> ['any', array('facebook' => 'https://www.facebook.com/4/'), new JSONResponse([], Http::STATUS_OK)],
			'invalid facebook profile' 			=> ['any', array('facebook' => 'zuck'), new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'facebook public page as alphanumeric id' 	=> ['any', array('facebook' => 'Nextclouders'), new JSONResponse([], Http::STATUS_OK)],
			'tumblr profile' 				=> ['any', array('tumblr' => 'nextcloudperu'), new JSONResponse([], Http::STATUS_OK)],
			'tumblr profile as url'				=> ['any', array('tumblr' => 'https://nextcloudperu.tumblr.com'), new JSONResponse([], Http::STATUS_OK)],
			'tumblr profile as short url'			=> ['any', array('tumblr' => 'nextcloudperu.tumblr.com'), new JSONResponse([], Http::STATUS_OK)],
			'tumblr profile as terminated url'		=> ['any', array('tumblr' => 'https://nextcloudperu.tumblr.com/'), new JSONResponse([], Http::STATUS_OK)],
			'facebook and tumblr profiles'			=> ['any', array('tumblr' => 'nextcloudperu', 'facebook' => '4'), new JSONResponse([], Http::STATUS_OK)],
			'invalid facebook and valid tumblr profiles'	=> ['any', array('tumblr' => 'nextcloudperu', 'facebook' => 'zuck'), new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'unknown social network'			=> ['any', array('unsupported' => 'https://nextcloud.com'), new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED)],
		];
	}

	public function dedicatedSocialProvider() {
		return [
			'no social profile (dedicated)'	 		=> ['facebook', null, new JSONResponse([], Http::STATUS_PRECONDITION_FAILED)],
			'dedicated valid facebook profile' 		=> ['facebook', array('facebook' => '4'), new JSONResponse([], Http::STATUS_OK)],
			'dedicated non-present profile' 		=> ['tumblr', array('facebook' => '4'), new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED)],
			'dedicated present profile, 1st place'		=> ['tumblr', array('tumblr' => 'nextcloudperu', 'facebook' => '4'), new JSONResponse([], Http::STATUS_OK)],
			'dedicated present profile, 2nd place'		=> ['tumblr', array('facebook' => '4', 'tumblr' => 'nextcloudperu'), new JSONResponse([], Http::STATUS_OK)],
		];
	}

	/**
	 * @dataProvider anySocialProvider
	 * @dataProvider dedicatedSocialProvider
	 */
	public function testFetchAvatar($networkchoice, $social, $expected) {

		// stub contact
		$this->contact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0',
			'PHOTO' => '',
		];

		// fill social profile
		if (!is_null($social)) {
			$this->contact['X-SOCIALPROFILE'] = $social;
		}

		// stub addressbook
		$this->addressbook = $this->createMock(IAddressBook::class);
		$this->addressbook
			->method('getUri')
			->willReturn('contacts');

		$this->addressbook
			->method('search')
		        ->with(
				$this->equalTo('3225c0d5-1bd2-43e5-a08c-4e65eaa406b0'), 
				$this->equalTo(['UID']),
				$this->equalTo([]) )
			->willReturn(array($this->contact));

		$this->manager
			->method('getUserAddressBooks')
			->willReturn(array($this->addressbook));

		$result = $this->controller->fetch('contacts', '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', $networkchoice);

		$this->assertEquals($expected, $result);

		// insert delay to prevent rate limiting exceptions
		usleep(0.7 * 1000000);
	}
}
