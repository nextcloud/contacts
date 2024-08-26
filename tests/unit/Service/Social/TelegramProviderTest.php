<?php
/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


namespace OCA\Contacts\Service\Social;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
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
