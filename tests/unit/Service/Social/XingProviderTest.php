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

class XingProviderTest extends TestCase {
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

		$this->provider = new XingProvider(
			$this->clientService
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'username1', 'type' => 'xing'],
				['value' => 'username2', 'type' => 'xing']
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];

		return [
			'contact with xing fields' => [$contactWithSocial, true],
			'contact without xing fields' => [$contactWithoutSocial, false]
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
		$contactImages = [
			'username1' => 'https://profile-images-abcusername1.jpg',
			'username2' => 'https://profile-images-abcusername2.jpg',
			'username3' => 'https://' . urlencode('profile-images-abc.ÄÖÜ/äöü_ß.jpg')
		];
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'username1', 'type' => 'xing'],
				['value' => 'username2', 'type' => 'xing'],
				['value' => 'username3', 'type' => 'xing']
			]
		];
		$contactWithSocialUrls = [
			'https://www.xing.com/profile/username1',
			'https://www.xing.com/profile/username2',
			'https://www.xing.com/profile/username3'
		];
		$contactWithSocialHtml = array_map(function ($profile) use ($contactImages) {
			return '<img src="' . $contactImages[$profile['value']] . '" />';
		}, $contactWithSocial['X-SOCIALPROFILE']);
		$contactWithSocialImg = array_map(function ($profile) use ($contactImages) {
			return $contactImages[$profile['value']];
		}, $contactWithSocial['X-SOCIALPROFILE']);

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];
		$contactWithoutSocialUrls = [];
		$contactWithoutSocialHtml = [];
		$contactWithoutSocialImg = [];

		return [
			'contact with xing fields' => [
				$contactWithSocial,
				$contactWithSocialUrls,
				$contactWithSocialHtml,
				$contactWithSocialImg
			],
			'contact without xing fields' => [
				$contactWithoutSocial,
				$contactWithoutSocialUrls,
				$contactWithoutSocialHtml,
				$contactWithoutSocialImg
			]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $urls, $htmls, $imgs) {
		if (count($urls)) {
			$this->response
				->method('getBody')
				->willReturnOnConsecutiveCalls(...$htmls);

			$urlArgs = array_map(function ($url) {
				return [$url];
			}, $urls);

			$this->client
				->expects($this->exactly(count($urls)))
				->method('get')
				->withConsecutive(...$urlArgs)
				->willReturn($this->response);
		}

		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals($imgs, $result);
	}
}
