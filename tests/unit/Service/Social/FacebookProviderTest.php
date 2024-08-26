<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


namespace OCA\Contacts\Service\Social;

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
use PHPUnit\Framework\MockObject\MockObject;

class FacebookProviderTest extends TestCase {
	private $provider;

	/** @var IClientService|MockObject */
	private $clientService;

	/** @var IClient|MockObject */
	private $client;

	/** @var IResponse|MockObject */
	private $response;

	protected function setUp(): void {
		parent::setUp();
		$this->clientService = $this->createMock(IClientService::class);
		$this->response = $this->createMock(IResponse::class);
		$this->client = $this->createMock(IClient::class);

		$this->clientService
			->method('newClient')
			->willReturn($this->client);

		$this->provider = new FacebookProvider(
			$this->clientService
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				['value' => '123124123', 'type' => 'facebook'],
				['value' => '23426523423', 'type' => 'facebook']
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];

		return [
			'contact with facebook fields' => [$contactWithSocial, true],
			'contact without facebook fields' => [$contactWithoutSocial, false]
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
			'X-SOCIALPROFILE' => [
				['value' => '123456', 'type' => 'facebook'],
				['value' => '7891011', 'type' => 'facebook']
			]
		];
		$contactWithSocialUrls = [
			'https://graph.facebook.com/123456/picture?width=720',
			'https://graph.facebook.com/7891011/picture?width=720',
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];
		$contactWithoutSocialUrls = [];

		return [
			'contact with facebook fields' => [
				$contactWithSocial,
				$contactWithSocialUrls
			],
			'contact without facebook fields' => [
				$contactWithoutSocial,
				$contactWithoutSocialUrls
			]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $urls) {
		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals($urls, $result);
	}

	public function testGetImageUrlLookup() {
		$contact = [
			'X-SOCIALPROFILE' => [
				['value' => 'username1', 'type' => 'facebook'],
			]
		];
		$url1 = 'https://facebook.com/username1';
		$url2 = 'https://graph.facebook.com/1234567/picture?width=720';
		$html1 = '"entity_id":"1234567"';

		$this->response
			->method('getBody')
			->willReturn($html1);

		$this->response
			->method('getStatusCode')
			->willReturn(200);

		$this->client
			->expects($this->once())
			->method('get')
			->with($url1)
			->willReturn($this->response);

		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals([$url2], $result);
	}
}
