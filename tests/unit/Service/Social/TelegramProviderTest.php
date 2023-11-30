<?php
/**
 * @copyright Copyright (c) 2023 Matthias Heinisch <nextcloud@matthiasheinisch.de>
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


namespace OCA\Contacts\Service\Social;

use OCP\Http\Client\IClient;
use OCP\Http\Client\IResponse;
use OCP\Http\Client\IClientService;
use ChristophWurst\Nextcloud\Testing\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class TelegramProviderTest extends TestCase {
	private $provider;

	/** @var IClientService|MockObject */
	private $clientService;

	/** @var LoggerInterface|MockObject */
	private $logger;

	/** @var IClient|MockObject */
	private $client;

	/** @var IResponse|MockObject */
	private $response;

	protected function setUp(): void {
		parent::setUp();
		$this->clientService = $this->createMock(IClientService::class);
		$this->logger = $this->createMock(LoggerInterface::class);
		$this->response = $this->createMock(IResponse::class);
		$this->client = $this->createMock(IClient::class);

		$this->clientService
			->method('newClient')
			->willReturn($this->client);

		$this->provider = new TelegramProvider(
			$this->clientService,
			$this->logger
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'IMPP' => [
				['value' => 'username1', 'type' => 'telegram'],
				['value' => '@username2', 'type' => 'telegram']
			]
		];

		$contactWithoutSocial = [
			'IMPP' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];

		return [
			'contact with telegram fields' => [$contactWithSocial, true],
			'contact without telegram fields' => [$contactWithoutSocial, false]
		];
	}

	/**
	 * @dataProvider dataProviderSupportsContact
	 */
	public function testSupportsContact($contact, $expected) {
		$result = $this->provider->supportsContact($contact);
		$this->assertEquals($expected, $result);
	}

	public function dataProviderGetImageUrls() {
		$contactWithSocial = [
			'IMPP' => [
				['value' => 'username1', 'type' => 'telegram'],
				['value' => '@username2', 'type' => 'telegram'],
				['value' => 'https://t.me/username3', 'type' => 'telegram'],
				['value' => 'https://t.me/@username4', 'type' => 'telegram'],
				['value' => 'https://username5.t.me/', 'type' => 'telegram'],
				['value' => 'https://telegram.dog/username6', 'type' => 'telegram']
			]
		];
		$contactWithSocialUrls = [
			'https://t.me/username1',
			'https://t.me/username2',
			'https://t.me/username3',
			'https://t.me/username4',
			'https://t.me/username5',
			'https://t.me/username6',
		];
		$contactWithSocialHtml = [
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username1.jpg"></html>',
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username2.jpg"></html>',
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username3.jpg"></html>',
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username4.jpg"></html>',
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username5.jpg"></html>',
			'<html><img class="tgme_page_photo_image" src="https://cdn4.telegram-cdn.org/file/username6.jpg"></html>'
		];
		$contactWithSocialImgs = [
			'https://cdn4.telegram-cdn.org/file/username1.jpg',
			'https://cdn4.telegram-cdn.org/file/username2.jpg',
			'https://cdn4.telegram-cdn.org/file/username3.jpg',
			'https://cdn4.telegram-cdn.org/file/username4.jpg',
			'https://cdn4.telegram-cdn.org/file/username5.jpg',
			'https://cdn4.telegram-cdn.org/file/username6.jpg'
		];

		$contactWithoutSocial = [
			'IMPP' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];
		$contactWithoutSocialUrls = [];
		$contactWithoutSocialHtml = [];
		$contactWithoutSocialImgs = [];

		return [
			'contact with social fields' => [
				$contactWithSocial,
				$contactWithSocialHtml,
				$contactWithSocialUrls,
				$contactWithSocialImgs
			],
			'contact without social fields' => [
				$contactWithoutSocial,
				$contactWithoutSocialHtml,
				$contactWithoutSocialUrls,
				$contactWithoutSocialImgs
			]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $htmls, $urls, $imgs) {
		if (count($urls)) {
			$this->response->method('getBody')->willReturnOnConsecutiveCalls(...$htmls);
			$this->client
		   ->expects($this->exactly(count($urls)))
		   ->method('get')
		   ->withConsecutive(...array_map(function ($a) {
		   	return [$a];
		   }, $urls))
		   ->willReturn($this->response);
		}


		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals($imgs, $result);
	}
}
