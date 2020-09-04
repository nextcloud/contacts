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
use OCA\DAV\CardDAV\CardDavBackend;
use OCP\IURLGenerator;
use OCP\IL10N;
use OCP\Util;

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
	/** @var IL10N|MockObject  */
	private $l10n;
	/** @var IURLGenerator|MockObject  */
	private $urlGen;
	/** @var CardDavBackend|MockObject */
	private $davBackend;

	public function socialProfileProvider() {
		return [
			'no social profiles set' 	=> [null, 'someConnector', 'someResult', Http::STATUS_PRECONDITION_FAILED],
			'valid social profile'		=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', 'someResult', Http::STATUS_OK],
			'bad formatted profile id' 	=> [[['type' => 'someNetwork', 'value' => 'someId']], null, 'someResult', Http::STATUS_BAD_REQUEST],
			'not existing profile id' 	=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', '', Http::STATUS_NOT_FOUND],
			'unchanged data'		 	=> [[['type' => 'someNetwork', 'value' => 'someId']], 'someConnector', 'thePhoto', Http::STATUS_NOT_MODIFIED],
		];
	}

	public function updateAddressbookProvider() {
		return [
			'not user enabled' 			=> ['yes',	'no',	Http::STATUS_FORBIDDEN],
			'not admin allowed' 		=> ['no',	'yes',	Http::STATUS_FORBIDDEN],
			'not allowed, not enabled' 	=> ['no',	'no',	Http::STATUS_FORBIDDEN],
			'allowed and enabled'	 	=> ['yes',	'yes',	Http::STATUS_OK],
		];
	}

	protected function setUp(): void {
		parent::setUp();

		$this->manager = $this->createMock(IManager::class);
		$this->config = $this->createMock(IConfig::class);
		$this->socialProvider = $this->createMock(CompositeSocialProvider::class);
		$this->clientService = $this->createMock(IClientService::class);
		$this->l10n = $this->createMock(IL10N::class);
		$this->urlGen = $this->createMock(IURLGenerator::class);
		$this->davBackend = $this->createMock(CardDavBackend::class);
		$this->service = new SocialApiService(
			$this->socialProvider,
			$this->manager,
			$this->config,
			$this->clientService,
			$this->l10n,
			$this->urlGen,
			$this->davBackend
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

	protected function setupAddressbooks() {
		$validContact1 = [
			'UID' => '11111111-1111-1111-1111-111111111111',
			'FN' => 'Valid Contact One',
			'VERSION' => '4.0',
			'X-SOCIALPROFILE' => [['type' => 'someNetwork', 'value' => 'someId1']],
		];
		$validContact2 = [
			'UID' => '22222222-2222-2222-2222-222222222222',
			'FN' => 'Valid Contact Two',
			'VERSION' => '4.0',
			'PHOTO' => "data:someHeader;base64," . base64_encode('someBody'),
			'X-SOCIALPROFILE' => [['type' => 'someNetwork', 'value' => 'someId2']],
		];
		$emptyContact = [
			'UID' => '00000000-0000-0000-0000-000000000000',
			'FN' => 'Empty Contact',
			'VERSION' => '4.0',
		];
		$invalidContact = [
			'UID' => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			'FN' => 'Invalid Contact',
			'VERSION' => '4.0',
			'X-SOCIALPROFILE' => [['type' => 'someNetwork', 'value' => 'invalidId']],
		];

		$addressbook1 = $this->createMock(IAddressBook::class);
		$addressbook1->method('getUri')->willReturn('contacts1');
		$addressbook2 = $this->createMock(IAddressBook::class);
		$addressbook2->method('getUri')->willReturn('contacts2');
		if (Util::getVersion()[0] >= 20) {
			// TODO: check can be removed as soon as min-dependency of contacts is NCv20
			$addressbook1->method('isShared')->willReturn(false);
			$addressbook1->method('isSystemAddressBook')->willReturn(false);
			$addressbook2->method('isShared')->willReturn(false);
			$addressbook2->method('isSystemAddressBook')->willReturn(false);
		}

		$searchMap1 = [
			['', ['UID'], ['types' => true], [$validContact1, $invalidContact]],
			['', ['X-SOCIALPROFILE'], ['types' => true], [$validContact1, $invalidContact]],
			[$validContact1['UID'], ['UID'], ['types' => true], [$validContact1]],
			[$invalidContact['UID'], ['UID'], ['types' => true], [$invalidContact]],
		];
		$searchMap2 = [
			['', ['UID'], ['types' => true], [$validContact2, $emptyContact]],
			['', ['X-SOCIALPROFILE'], ['types' => true], [$validContact2]],
			[$validContact2['UID'], ['UID'], ['types' => true], [$validContact2]],
			[$emptyContact['UID'], ['UID'], ['types' => true], [$emptyContact]],
		];
		$addressbook1
			->method('search')
			->will($this->returnValueMap($searchMap1));
		$addressbook2
			->method('search')
			->will($this->returnValueMap($searchMap2));
		$this->manager
			->method('getUserAddressBooks')
			->willReturn([$addressbook1, $addressbook2]);

		$socialConnectorMap = [
			[$validContact1['X-SOCIALPROFILE'], 'any', 'validConnector'],
			[$validContact2['X-SOCIALPROFILE'], 'any', 'validConnector'],
			[$invalidContact['X-SOCIALPROFILE'], 'any', 'invalidConnector'],
			[$emptyContact['X-SOCIALPROFILE'], 'any', 'emptyConnector'],
		];
		$this->socialProvider
			->method('getSocialConnector')
			->will($this->returnValueMap($socialConnectorMap));

		$validResponse = $this->createMock(IResponse::class);
		$validResponse
			->method('getBody')
			->willReturn('someBody');
		$validResponse
			->method('getHeader')
			->willReturn('someHeader');
		$invalidResponse = $this->createMock(IResponse::class);
		$invalidResponse
			->method('getBody')
			->willReturn('');
		$invalidResponse
			->method('getHeader')
			->willReturn('');

		$clientResponseMap = [
			['validConnector', [], $validResponse],
			['invalidConnector', [], $invalidResponse],
			['emptyConnector', [], $invalidResponse],
		];
		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->will($this->returnValueMap($clientResponseMap));
		$this->clientService
			->method('NewClient')
			->willReturn($client);
	}


	/**
	 * @dataProvider updateAddressbookProvider
	 */
	public function testUpdateAddressbooks($syncAllowedByAdmin, $bgSyncEnabledByUser, $expected) {
		$this->config
			->method('getAppValue')
			->willReturn($syncAllowedByAdmin);
		$this->config
			->method('getUserValue')
			->willReturn($bgSyncEnabledByUser);

		$this->setupAddressbooks();

		$result = $this->service->updateAddressbooks('any', 'mrstest');

		$this->assertEquals($expected, $result->getStatus());

		if (($syncAllowedByAdmin === 'yes') && ($bgSyncEnabledByUser === 'yes')) {
			$report = $result->getData();
			$this->assertArrayHasKey('0', $report);
			$this->assertArrayHasKey('updated', $report[0]);
			$this->assertContains('Valid Contact One', $report[0]['updated']);
			$this->assertArrayHasKey('checked', $report[0]);
			$this->assertContains('Valid Contact Two', $report[0]['checked']);
			$this->assertArrayHasKey('failed', $report[0]);
			$this->assertArrayHasKey('404', $report[0]['failed']);
			$this->assertContains('Invalid Contact', $report[0]['failed']['404']);
			$this->assertNotContains('Empty Contact', $report[0]['failed']['404']);
		}
	}
}
