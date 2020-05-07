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

use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Contacts\IManager;
use OCP\Contacts\ContactsMenu\IEntry;
use OCP\IAddressBook;
use OCP\L10N\IFactory;
use OCP\IRequest;

use OCA\Contacts\Controller\SocialApiController;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;


class SocialApiServiceTest extends TestCase {

	private $service;

	/** @var IManager|MockObject */
	private  $manager;

	public function setUp() {
		parent::setUp();

		$this->manager = $this->createMock(IManager::class);
		$this->service = new SocialApiService(
			'socialContact',
			$this->manager
		);
	}

	CONST EXP_CONNECT = [
		'facebook-4'	=> 'https://graph.facebook.com/4/picture?width=720',
		'facebook-zuck'	=> 'https://graph.facebook.com/zuck/picture?width=720',
		'tumblr-nc'	=> 'https://api.tumblr.com/v2/blog/nextcloudperu/avatar/512',
	];

	public function anySocialProvider() {
		return [
			'no social profiles'	 			=> ['any', array(), null],
			'facebook profile with numbered profile id' 	=> ['any', [array('type' => 'facebook', 'value' => '4')], self::EXP_CONNECT['facebook-4']],
			'facebook profile as url' 			=> ['any', [array('type' => 'facebook', 'value' => 'https://www.facebook.com/4')], self::EXP_CONNECT['facebook-4']],
			'facebook profile as terminated url' 		=> ['any', [array('type' => 'facebook', 'value' => 'https://www.facebook.com/4/')], self::EXP_CONNECT['facebook-4']],
			'facebook profile as alphanumeric profile id' 	=> ['any', [array('type' => 'facebook', 'value' => 'zuck')], self::EXP_CONNECT['facebook-zuck']],
			'tumblr profile' 				=> ['any', [array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['tumblr-nc']],
			'tumblr profile as url'				=> ['any', [array('type' => 'tumblr', 'value' => 'https://nextcloudperu.tumblr.com')], self::EXP_CONNECT['tumblr-nc']],
			'tumblr profile as short url'			=> ['any', [array('type' => 'tumblr', 'value' => 'nextcloudperu.tumblr.com')], self::EXP_CONNECT['tumblr-nc']],
			'tumblr profile as terminated url'		=> ['any', [array('type' => 'tumblr', 'value' => 'https://nextcloudperu.tumblr.com/')], self::EXP_CONNECT['tumblr-nc']],
			'tumblr and facebook profiles'			=> ['any', [array('type' => 'tumblr', 'value' => 'nextcloudperu'), array('type' => 'facebook', 'value' => '4')], self::EXP_CONNECT['facebook-4']],
			'facebook and tumblr profiles'			=> ['any', [array('type' => 'facebook', 'value' => '4'), array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['facebook-4']],
			'unknown social network'			=> ['any', [array('type' => 'unsupported', 'value' => 'https://nextcloud.com')], null],
		];
	}

	public function dedicatedSocialProvider() {
		return [
			'no social profile (dedicated)'	 		=> ['facebook', array(), null],
			'dedicated valid facebook profile' 		=> ['facebook', [array('type' => 'facebook', 'value' => '4')], self::EXP_CONNECT['facebook-4']],
			'dedicated valid facebook profile capital' 	=> ['facebook', [array('type' => 'FACEBOOK', 'value' => '4')], self::EXP_CONNECT['facebook-4']],
			'dedicated non-present profile' 		=> ['tumblr', [array('type' => 'facebook', 'value' => '4')], null],
			'dedicated present profile, 1st place'		=> ['tumblr', [array('type' => 'tumblr', 'value' => 'nextcloudperu'), array('type' => 'facebook', 'value' => '4')], self::EXP_CONNECT['tumblr-nc']],
			'dedicated present profile, 2nd place'		=> ['tumblr', [array('type' => 'facebook', 'value' => '4'), array('type' => 'tumblr', 'value' => 'nextcloudperu')], self::EXP_CONNECT['tumblr-nc']],
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
	 * @dataProvider anySocialProvider
	 * @dataProvider dedicatedSocialProvider
	 */
	public function testGetSocialConnector($networkchoice, $social, $expected) {
		$result = $this->service->getSocialConnector(SocialApiController::SOCIAL_CONNECTORS, $social, $networkchoice);
		$this->assertEquals($expected, $result);
	}

	public function testGetSocialConnectorFromJson() {
		$networkchoice = 'instagram';
		$social = [array('type' => 'instagram', 'value' => 'nextclouders')];

		$result = $this->service->getSocialConnector(SocialApiController::SOCIAL_CONNECTORS, $social, $networkchoice);
		$this->assertContains('https://', $result);
		$this->assertContains('.jpg', $result);
	}

}

