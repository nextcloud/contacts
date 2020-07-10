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


namespace OCA\Contacts\Service;

use OCA\Contacts\Service\Social\CompositeSocialProvider;

use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\IAddressBook;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiServiceTest extends TestCase {

	private $service;

	/** @var CompositeSocialProvider */
	private $socialProvider;
	/** @var IManager|MockObject */
	private  $manager;
	/** @var IConfig|MockObject */
	private  $config;

	const EXP_CONNECT = [
		'facebook-4'		=> 'https://graph.facebook.com/4/picture?width=720',
		'facebook-zuck'	=> 'https://graph.facebook.com/zuck/picture?width=720',
		'facebook-nc'		=> 'https://graph.facebook.com/Nextclouders/picture?width=720',
		'tumblr-nc'		=> 'https://api.tumblr.com/v2/blog/nextcloudperu/avatar/512',
		'tumblr-invalid'	=> 'https://api.tumblr.com/v2/blog/@nextcloudperu/avatar/512',
	];

	public function setUp() {
		parent::setUp();

		$this->manager = $this->createMock(IManager::class);
		$this->config = $this->createMock(IConfig::class);
		$this->socialProvider = $this->createMock(CompositeSocialProvider::class);
		$this->service = new SocialApiService(
			$this->socialProvider,
			$this->manager,
			$this->config
		);
	}

	public function socialProfileProvider() {
		return [
			'no social profiles'	 	=> ['any', array(), null, new JSONResponse([], Http::STATUS_BAD_REQUEST)],
			'facebook profile' 		=> ['facebook', [array('type' => 'facebook', 'value' => '4')], self::EXP_CONNECT['facebook-4'], new JSONResponse([], Http::STATUS_OK)],
			'facebook invalid profile' 	=> ['facebook', [array('type' => 'facebook', 'value' => 'zuck')], self::EXP_CONNECT['facebook-zuck'], new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'facebook public page' 	=> ['facebook', [array('type' => 'facebook', 'value' => 'Nextclouders')], self::EXP_CONNECT['facebook-nc'], new JSONResponse([], Http::STATUS_OK)],
			'tumblr profile' 		=> ['tumblr', [array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['tumblr-nc'], new JSONResponse([], Http::STATUS_OK)],
			'tumblr invalid profile'	=> ['tumblr', [array('type' => 'tumblr', 'value' => '@nextcloudperu')], self::EXP_CONNECT['tumblr-invalid'], new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'invalid insta, valid tumblr'	=> ['any', [array('type' => 'instagram', 'value' => '@zuck'), array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['tumblr-nc'], new JSONResponse([], Http::STATUS_OK)],
			'invalid fb, valid tumblr'	=> ['any', [array('type' => 'facebook', 'value' => 'zuck'), array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['facebook-zuck'], new JSONResponse([], Http::STATUS_NOT_FOUND)],
		];
	}

/*
	public function testSupportedNetworks() {
		$this->config
			->method('getAppValue')
			->willReturn('yes');
		$result = $this->service->getSupportedNetworks();
		$this->assertContains('facebook', $result);
		$this->assertContains('instagram', $result);
		$this->assertContains('tumblr', $result);
	}
*/
	public function testDeactivatedSocial() {
		$this->config
			->method('getAppValue')
			->willReturn('no');

		$result = $this->service->getSupportedNetworks();

		$this->assertEmpty($result);
	}


	/**
	 * @dataProvider socialProfileProvider
	 */
	public function testUpdateContact($network, $social, $connector, $expected) {

		$contact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0',
			'PHOTO' => '-',
			'X-SOCIALPROFILE' => $social,
		];
		$addressbook = $this->createMock(IAddressBook::class);
		$addressbook
			->method('getUri')
			->willReturn('contacts');
		$addressbook
			->method('search')
			->willReturn(array($contact));

		$this->manager
			->method('getUserAddressBooks')
			->willReturn(array($addressbook));

		$this->socialProvider
			->method('getSocialConnector')
			->willReturn($connector);

		$result = $this->service->updateContact('contacts', '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', $network);

		$this->assertEquals($expected, $result);

		// insert delay to prevent rate limiting exceptions
		sleep(0.7);
	}
}
