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

use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\IAddressBook;

use OCA\Contacts\Service\SocialApiService;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiServiceTest extends TestCase {

	private $service;

	/** @var IManager|MockObject */
	private  $manager;
	/** @var IConfig|MockObject */
	private  $config;

	public function setUp() {
		parent::setUp();

		$this->manager = $this->createMock(IManager::class);
		$this->config = $this->createMock(IConfig::class);
		$this->service = new SocialApiService(
			'contacts',
			$this->manager,
			$this->config
		);
	}

	const EXP_CONNECT = [
		'facebook-4'		=> 'https://graph.facebook.com/4/picture?width=720',
		'facebook-zuck'	=> 'https://graph.facebook.com/zuck/picture?width=720',
		'tumblr-nc'		=> 'https://api.tumblr.com/v2/blog/nextcloudperu/avatar/512',
	];


	public function socialProfileProvider() {
		return [
			'no social profiles'	 	=> ['any',	 array(),							new JSONResponse([], Http::STATUS_NOT_IMPLEMENTED)],
			'facebook profile' 		=> ['facebook', [array('type' => 'facebook', 'value' => '4')],		new JSONResponse([], Http::STATUS_OK)],
			'facebook invalid profile' 	=> ['facebook', [array('type' => 'facebook', 'value' => 'zuck')],		new JSONResponse([], Http::STATUS_NOT_FOUND)],
			'facebook public page' 	=> ['facebook', [array('type' => 'facebook', 'value' => 'Nextclouders')],	new JSONResponse([], Http::STATUS_OK)],
			'instagram profile'		=> ['instagram', [array('type' => 'instagram', 'value' => 'zuck')],		new JSONResponse([], Http::STATUS_OK)],
			'instagram invalid profile'	=> ['instagram', [array('type' => 'instagram', 'value' => '@zuck')],		new JSONResponse([], Http::STATUS_BAD_REQUEST)],
			'tumblr profile' 		=> ['tumblr',	[array('type' => 'tumblr', 'value' => 'nextcloudperu')],	new JSONResponse([], Http::STATUS_OK)],
			'tumblr invalid profile'	=> ['tumblr',	[array('type' => 'tumblr', 'value' => '@nextcloudperu')],	new JSONResponse([], Http::STATUS_NOT_FOUND)],
		];
	}

	public function vCardVersionsProvider() {
		return [
			'older than supported'	=> [1.0,  null],
			'v3.0 jpeg' 		=> [3.0, 'ENCODING=b;TYPE=JPEG:'],
			'v3.1 jpeg' 		=> [3.1, 'ENCODING=b;TYPE=JPEG:'],
			'v4.0 jpeg'		=> [4.0, 'data:image/jpeg;base64,'],
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

		$result = $this->service->getSupportedNetworks();

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

		$result = $this->service->getSupportedNetworks();

		$this->assertEmpty($result);
	}

	/**
	 * @dataProvider vCardVersionsProvider
	 */
	public function testGetPhotoTag($version, $expected) {
		$header = [
			'HTTP/1.1 200 OK',
			'Date: Sat, 12 Apr 2008 17:30:38 GMT',
			'Server: Apache/2.2.3 (CentOS)',
			'Last-Modified: Tue, 4 Nov 2020 13:37:00 GMT',
			'Accept-Ranges: bytes',
			'Content-Length: 438',
			'Content-Type: image/jpeg',
		];

		$result = $this->service->getPhotoTag($version, $header);
		$this->assertEquals($expected, $result);
	}


	public function testGetAddressBook() {
		$addressbook = $this->createMock(IAddressBook::class);
		$addressbook
			->method('getUri')
			->willReturn('contacts');

		$this->manager
			->method('getUserAddressBooks')
			->willReturn(array($addressbook));

		$result = $this->service->getAddressBook('contacts');
		$this->assertEquals($addressbook, $result);
	}


	/**
	 * @dataProvider socialProfileProvider
	 */
	public function testUpdateContact($network, $social, $expected) {

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

		$result = $this->service->updateContact('contacts', '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', $network);

		$this->assertEquals($expected, $result);

		// insert delay to prevent rate limiting exceptions
		sleep(0.7);
	}

}

