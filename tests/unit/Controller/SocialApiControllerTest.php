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
use OCP\AppFramework\Http\JSONResponse;

use OCP\IAddressBook;
use OCP\L10N\IFactory;
use OCP\IRequest;
use OCP\IConfig;

use OCP\Contacts\IManager;
use OCP\Contacts\ContactsMenu\IEntry;
use OCA\Contacts\Service\SocialApiService;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiControllerTest extends TestCase {

	private $controller;

	/** @var IRequest|MockObject */
	private $request;

	/** @var IFactory|MockObject */
	private $languageFactory;

	/** @var IManager|MockObject */
	private  $manager;

	public function setUp() {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->languageFactory = $this->createMock(IFactory::class);
		$this->config = $this->createMock(IConfig::class);
		$this->manager = $this->createMock(IManager::class);
		$this->socialApiService = $this->createMock(socialApiService::class);
		$this->controller = new SocialApiController(
			'contacts',
			$this->request,
			$this->manager,
			$this->config,
			$this->languageFactory,
			$this->socialApiService
		);
	}


	public function socialProvider() {
		return [
			'no social profiles'	 			=> [ null,							 new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED)],
			'facebook profile with numbered profile id' 	=> ['https://graph.facebook.com/4/picture?width=720',		 new JSONResponse([], Http::STATUS_OK)],
			'invalid facebook profile' 			=> ['https://graph.facebook.com/zuck/picture?width=720',	 new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'facebook public page as alphanumeric id' 	=> ['https://graph.facebook.com/Nextclouders/picture?width=720', new JSONResponse([], Http::STATUS_OK)],
			'instagram profile'				=> ['https://www.instagram.com/zuck/?__a=1',		 	 new JSONResponse([], Http::STATUS_OK)],
			'invalid instagram profile'			=> ['https://www.instagram.com/@zuck/?__a=1',		 	 new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'tumblr profile' 				=> ['https://api.tumblr.com/v2/blog/nextcloudperu/avatar/512',	 new JSONResponse([], Http::STATUS_OK)],
			'invalid tumblr profile'			=> ['https://api.tumblr.com/v2/blog/@invalid-id/avatar/512',	 new JSONResponse([], Http::STATUS_NOT_FOUND)],
		];
	}


	public function testSupportedNetworks() {
		$this->config
			->method('getAppValue')
			->with(
				$this->equalTo('contacts'),
				$this->equalTo('allowSocialSync'),
				$this->anything() )
			->willReturn('yes');

		$result = $this->controller->getSupportedNetworks();

		$this->assertContains('facebook', $result);
		$this->assertContains('instagram', $result);
		$this->assertContains('tumblr', $result);
	}


	public function testDeactivatedSocial() {
		$this->config
			->method('getAppValue')
			->with(
				$this->equalTo('contacts'),
				$this->equalTo('allowSocialSync'),
				$this->anything() )
			->willReturn('no');

		$result = $this->controller->getSupportedNetworks();

		$this->assertEmpty($result);
	}


	/**
	 * @dataProvider socialProvider
	 */
	public function testUpdateContact($socialConnector, $expected) {
		$this->contact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0',
			'PHOTO' => '-',
			'X-SOCIALPROFILE' => [array('type' => 'facebook', 'value' => '4')],
		];
		$this->addressbook = $this->createMock(IAddressBook::class);

		$this->socialApiService
			->method('getAddressBook')
			->willReturn($this->addressbook);

		$this->addressbook
			->method('search')
			->willReturn(array($this->contact));

		$this->socialApiService
			->method('getSocialConnector')
			->willReturn($socialConnector);

		$this->socialApiService
			->method('getPhotoTag')
			->willReturn('data:image/jpeg;base64,');

		$result = $this->controller->updateContact('contacts', '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', 'facebook');

		$this->assertEquals($expected, $result);

		// insert delay to prevent rate limiting exceptions
		sleep(0.7);
	}
}
