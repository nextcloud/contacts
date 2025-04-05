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
use OCA\Contacts\Service\Social\ISocialProvider;

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
use OCP\AppFramework\Utility\ITimeFactory;

use PHPUnit\Framework\MockObject\MockObject;
use ChristophWurst\Nextcloud\Testing\TestCase;

class SocialApiServiceTest extends TestCase {
	private SocialApiService $service;

	/** @var CompositeSocialProvider|MockObject */
	private $socialProvider;
	/** @var IManager|MockObject */
	private $manager;
	/** @var IConfig|MockObject */
	private $config;
	/** @var IClientService|MockObject */
	private $clientService;
	/** @var IL10N|MockObject	*/
	private $l10n;
	/** @var IURLGenerator|MockObject	*/
	private $urlGen;
	/** @var CardDavBackend|MockObject */
	private $davBackend;
	/** @var ITimeFactory|MockObject */
	private $timeFactory;
	/** @var ImageResizer|MockObject */
	private $imageResizer;

	public function allSocialProfileProviders(): array {
		$body = "the body";
		$imageType = "jpg";
		$contact = [
			'URI' => '3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			'VERSION' => '4.0'
		];
		$connector = $this->createMock(ISocialProvider::class);
		$connector->method('supportsContact')->willReturn(true);
		$connector->method('getImageUrls')->willReturn(["https://https://url1.com/an-url/an-url"]);

		$connectorNoSupport = $this->createMock(ISocialProvider::class);
		$connectorNoSupport->method('supportsContact')->willReturn(false);

		$connectorNoUrl = $this->createMock(ISocialProvider::class);
		$connectorNoUrl->method('supportsContact')->willReturn(true);
		$connectorNoUrl->method('getImageUrls')->willReturn([]);

		$addressbookEmpty = $this->createMock(IAddressBook::class);
		$addressbookEmpty
			->method('getUri')
			->willReturn('contacts');
		$addressbookEmpty
			->method('search')
			->willReturn(null);

		$addressbook = $this->createMock(IAddressBook::class);
		$addressbook
			->method('getUri')
			->willReturn('contacts');
		$addressbook
			->method('search')
			->willReturn([$contact]);

		return [
			'no address book found' => [null, [], "", "", Http::STATUS_BAD_REQUEST],
			'no contact found' => [[$addressbookEmpty], [], "", "", Http::STATUS_PRECONDITION_FAILED],
			'no supporting contacts found' => [[$addressbook], [$connectorNoSupport], "", "", Http::STATUS_PRECONDITION_FAILED],
			'no url found' => [[$addressbook], [$connectorNoUrl], "", "", Http::STATUS_BAD_REQUEST],
			'no image found' => [[$addressbook], [$connector], "", "", Http::STATUS_NOT_FOUND],
			'image found' => [[$addressbook], [$connector], $body, $imageType, Http::STATUS_OK]
		];
	}

	public function updateAddressbookProvider(): array {
		return [
			'not user enabled' => ['yes',	'no',	Http::STATUS_FORBIDDEN],
			'not admin allowed' => ['no',	'yes',	Http::STATUS_FORBIDDEN],
			'not allowed, not enabled' => ['no',	'no',	Http::STATUS_FORBIDDEN],
			'allowed and enabled' => ['yes',	'yes',	Http::STATUS_OK],
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
		$this->timeFactory = $this->createMock(ITimeFactory::class);
		$this->imageResizer = $this->createMock(ImageResizer::class);
		$this->service = new SocialApiService(
			$this->socialProvider,
			$this->container,
			$this->manager,
			$this->config,
			$this->clientService,
			$this->l10n,
			$this->urlGen,
			$this->timeFactory,
			$this->imageResizer
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
	 * @dataProvider allSocialProfileProviders
	 */
	public function testUpdateContactWithoutNetwork($addressbooks, $providers, $body, $imageType, $status) {
		$this->manager
			->method('getUserAddressBooks')
			->willReturn($addressbooks);

		$this->socialProvider
			->method('getSocialConnectors')
			->willReturn($providers);

		$response = $this->createMock(IResponse::class);
		$response
			->method('getBody')
			->willReturn($body);
		$response
			->method('getHeader')
			->willReturn($imageType);
		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->willReturn($response);
		$this->clientService
			->method('newClient')
			->willReturn($client);
		$this->imageResizer
			->expects($body ? $this->once() : $this->never())
			->method('resizeImage')
			->willReturn($body);

		$result = $this->service
			 ->updateContact(
			 	'contacts',
			 	'3225c0d5-1bd2-43e5-a08c-4e65eaa406b0',
			 	null);
		$this->assertEquals($status, $result->getStatus());
	}

	public function testUpdateContactWithNetworkVersion3() {
		$network = "mastodon";
		$body = "the body";
		$imageType = "jpg";
		$addressBookId = "contacts";
		$contactId = "3225c0d5-1bd2-43e5-a08c-4e65eaa406b0";
		$contact = [
			'URI' => $contactId,
			'VERSION' => '3.0'
		];
		$provider = $this->createMock(ISocialProvider::class);
		$provider->method('supportsContact')->willReturn(true);
		$provider->method('getImageUrls')->willReturn(["https://url1.com/an-url"]);

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
			->method('getSocialConnectors')
			->willReturn([$provider]);

		$this->socialProvider
			->method('getSocialConnector')
			->willReturn($provider);

		$response = $this->createMock(IResponse::class);
		$response
			->method('getBody')
			->willReturn($body);
		$response
			->method('getHeader')
			->willReturn($imageType);
		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->willReturn($response);
		$this->clientService
			->method('newClient')
			->willReturn($client);
		$this->imageResizer
			->expects($this->once())
			->method('resizeImage')
			->willReturn($body);

		$changes = [
			'URI' => $contact['URI'],
			'VERSION' => $contact['VERSION'],
			'PHOTO;ENCODING=b;TYPE=' . $imageType . ';VALUE=BINARY' => base64_encode($body)
		];

		$this->socialProvider
			->expects($this->once())->method("getSocialConnector")->with($network);
		$provider->expects($this->once())->method("supportsContact")->with($contact);
		$addressbook->expects($this->once())->method("createOrUpdate")->with($changes, $addressBookId);

		$result = $this->service
									 ->updateContact(
									 	$addressBookId,
									 	$contactId,
									 	$network);

		$this->assertEquals(Http::STATUS_OK, $result->getStatus());
	}

	public function testUpdateContactWithNetworkVersion4() {
		$network = "mastodon";
		$body = "the body";
		$imageType = "jpg";
		$addressBookId = "contacts";
		$contactId = "3225c0d5-1bd2-43e5-a08c-4e65eaa406b0";
		$contact = [
			'URI' => $contactId,
			'VERSION' => '4.0'
		];
		$provider = $this->createMock(ISocialProvider::class);
		$provider->method('supportsContact')->willReturn(true);
		$provider->method('getImageUrls')->willReturn(["https://url1.com/an-url"]);

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
			->method('getSocialConnectors')
			->willReturn([$provider]);

		$this->socialProvider
			->method('getSocialConnector')
			->willReturn($provider);

		$response = $this->createMock(IResponse::class);
		$response
			->method('getBody')
			->willReturn($body);
		$response
			->method('getHeader')
			->willReturn($imageType);
		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->willReturn($response);
		$this->clientService
			->method('newClient')
			->willReturn($client);
		$this->imageResizer
			->expects($this->once())
			->method('resizeImage')
			->willReturn($body);

		$changes = [
			'URI' => $contact['URI'],
			'VERSION' => $contact['VERSION'],
			'PHOTO' => "data:".$imageType.";base64," . base64_encode($body)
		];

		$this->socialProvider
			 ->expects($this->once())->method("getSocialConnector")->with($network);
		$provider->expects($this->once())->method("supportsContact")->with($contact);
		$addressbook->expects($this->once())->method("createOrUpdate")->with($changes, $addressBookId);

		$result = $this->service
									 ->updateContact(
									 	$addressBookId,
									 	$contactId,
									 	$network);

		$this->assertEquals(Http::STATUS_OK, $result->getStatus());
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

		$providerSupportsMap = [
			[$validContact1, true],
			[$emptyContact, false],
			[$invalidContact, false],
			[$validContact2, true]
		];

		$providerUrlMap = [
			[$validContact1, ["https://url1.com/an-url"]],
			[$emptyContact, []],
			[$invalidContact, []],
			[$validContact2, ["https://url1.com/an-url"]]
		];

		$provider = $this->createMock(ISocialProvider::class);
		$provider->method('getImageUrls')
					 ->will($this->returnValueMap($providerUrlMap));
		$provider->method('supportsContact')
					 ->will($this->returnValueMap($providerSupportsMap));

		$this->socialProvider
			->method('getSocialConnectors')
			->willReturn([$provider]);

		$this->socialProvider
			->method('getSocialConnector')
			->willReturn($provider);

		$validResponse = $this->createMock(IResponse::class);
		$validResponse
			->method('getBody')
			->willReturn('someBody');
		$validResponse
			->method('getHeader')
			->willReturn('someHeader');

		$client = $this->createMock(IClient::class);
		$client
			->method('get')
			->willReturn($validResponse);
		$this->clientService
			->method('newClient')
			->willReturn($client);
		$this->imageResizer
			->method('resizeImage')
			->willReturn('someBody');
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
		$this->timeFactory
			->method('getTime')
			->willReturn(10);

		$this->setupAddressbooks();

		if ($syncAllowedByAdmin === 'yes' && $bgSyncEnabledByUser === 'yes') {
			$this->socialProvider
				->expects($this->atLeastOnce())
				->method('getSocialConnectors');
		}

		$this->socialProvider
			->expects($this->never())
			->method('getSocialConnector');

		$result = $this->service->updateAddressbooks('mrstest');

		$this->assertEquals($expected, $result->getStatus());

		if (($syncAllowedByAdmin === 'yes') && ($bgSyncEnabledByUser === 'yes')) {
			$report = $result->getData();
			$this->assertArrayHasKey('0', $report);
			$this->assertArrayHasKey('updated', $report[0]);
			$this->assertContains('Valid Contact One', $report[0]['updated']);
			$this->assertArrayHasKey('checked', $report[0]);
			$this->assertContains('Valid Contact Two', $report[0]['checked']);
			$this->assertArrayHasKey('failed', $report[0]);
			$this->assertArrayHasKey('412', $report[0]['failed']);
			$this->assertContains('Invalid Contact', $report[0]['failed']['412']);
		}
	}


	public function testUpdateAddressbooksTimeout() {
		$this->config
			->method('getAppValue')
			->willReturn('yes');
		$this->config
			->method('getUserValue')
			->willReturn('yes');
		$this->timeFactory
			->method('getTime')
			->willReturnOnConsecutiveCalls(10, 11, 999);

		$this->setupAddressbooks();

		$result = $this->service->updateAddressbooks('msstest');

		$this->assertEquals(Http::STATUS_PARTIAL_CONTENT, $result->getStatus());

		$report = $result->getData();

		$this->assertArrayHasKey('0', $report);
		$this->assertArrayHasKey('stoppedAt', $report[0]);
		$this->assertArrayHasKey('addressBook', $report[0]['stoppedAt']);
		$this->assertArrayHasKey('contact', $report[0]['stoppedAt']);
	}

	/**
	 * @dataProvider updateAddressbookProvider
	 */
	public function testUpdateAddressbooksContinued($syncAllowedByAdmin, $bgSyncEnabledByUser, $expected) {
		$this->config
			->method('getAppValue')
			->willReturn($syncAllowedByAdmin);
		$this->config
			->method('getUserValue')
			->willReturn($bgSyncEnabledByUser);
		$this->timeFactory
			->method('getTime')
			->willReturn(10);

		$this->setupAddressbooks();

		$result = $this->service->updateAddressbooks('mrstest', 'contacts2', '22222222-2222-2222-2222-222222222222');

		$this->assertEquals($expected, $result->getStatus());

		if (($syncAllowedByAdmin === 'yes') && ($bgSyncEnabledByUser === 'yes')) {
			$report = $result->getData();
			$this->assertArrayHasKey('0', $report);
			$this->assertArrayHasKey('updated', $report[0]);
			$this->assertNotContains('Valid Contact One', $report[0]['updated']);
			$this->assertArrayHasKey('checked', $report[0]);
			$this->assertContains('Valid Contact Two', $report[0]['checked']);
		}
	}

	public function testExistsContact() {
		$this->setupAddressbooks();

		// all good:
		$result = $this->service->existsContact('11111111-1111-1111-1111-111111111111', 'contacts1', 'admin');
		$this->assertEquals(true, $result);

		// wrong address book:
		$result = $this->service->existsContact('22222222-2222-2222-2222-222222222222', 'contacts1', 'admin');
		$this->assertEquals(false, $result);

		// invalid contactId:
		$result = $this->service->existsContact('not-existing', 'contacts1', 'admin');
		$this->assertEquals(false, $result);

		// invalid addressbookId:
		$result = $this->service->existsContact('11111111-1111-1111-1111-111111111111', 'not-existing', 'admin');
		$this->assertEquals(false, $result);
	}
}
