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
use OCP\Http\Client\IClient;
use OCP\Http\Client\IResponse;
use OCP\Http\Client\IClientService;
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
	private $manager;
	/** @var IConfig|MockObject */
	private $config;
	/** @var IClientService|MockObject */
	private $clientService;

	public function socialProfileProvider() {
		return [
			'no social profiles set' 	=> [null, 'someConnector', 'someResult', Http::STATUS_PRECONDITION_FAILED],
			'valid social profile'		=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', 'someResult', Http::STATUS_OK],
			'bad formatted profile id' 	=> [[['type' => 'someNetwork', 'value' => 'someId']], null, 'someResult', Http::STATUS_BAD_REQUEST],
			'not existing profile id' 	=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', '', Http::STATUS_NOT_FOUND],
			'unchanged data'		 	=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', 'thePhoto', Http::STATUS_NOT_MODIFIED],
		];
	}

	public function setUp() {
		parent::setUp();

		$this->manager = $this->createMock(IManager::class);
		$this->config = $this->createMock(IConfig::class);
		$this->socialProvider = $this->createMock(CompositeSocialProvider::class);
		$this->clientService = $this->createMock(IClientService::class);
		$this->service = new SocialApiService(
			$this->socialProvider,
			$this->manager,
			$this->config,
			$this->clientService
		);
	}

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
	public function testUpdateContact($social, $connector, $httpResult, $expected) {
		$contact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0',
			'PHOTO' => "data:" . $httpResult . ";base64," . base64_encode('thePhoto'),
			'X-SOCIALPROFILE' => $social,
		];
		$addressbook = $this->createMock(IAddressBook::class);
		$addressbook
			->method('getUri')
			->willReturn('contacts');
		$addressbook
			->method('search')
			->willReturn([$contact]);

		$this->manager
			->method('getUserAddressBooks')
			->willReturn([$addressbook]);

		$this->socialProvider
			->method('getSocialConnector')
			->willReturn($connector);

		$response = $this->createMock(IResponse::class);
		$response
			->method('getBody')
			->willReturn($httpResult);
		$response
			->method('getHeader')
			->willReturn($httpResult);
		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->willReturn($response);
		$this->clientService
			->method('NewClient')
			->willReturn($client);

		$result = $this->service->updateContact('contacts', '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0', 'theSocialNetwork');

		$this->assertEquals($expected, $result->getStatus());
	}
}
