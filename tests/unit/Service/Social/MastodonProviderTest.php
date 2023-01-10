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


namespace OCA\Contacts\Service\Social;

use OCP\Http\Client\IClient;
use OCP\Http\Client\IResponse;
use OCP\Http\Client\IClientService;
use ChristophWurst\Nextcloud\Testing\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class MastodonProviderTest extends TestCase {
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
			->method('NewClient')
			->willReturn($this->client);

		$this->provider = new MastodonProvider(
	  $this->clientService
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "user1@cloud1", "type" => "mastodon"],
				["value" => "user2@cloud2", "type" => "mastodon"]
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "one", "type" => "social2"],
				["value" => "two", "type" => "social1"]
			]
		];

		return [
			'contact with mastodon fields' => [$contactWithSocial, true],
			'contact without mastodon fields' => [$contactWithoutSocial, false]
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
				["value" => "user1@cloud1", "type" => "mastodon"],
				["value" => "@user2@cloud2", "type" => "mastodon"],
				["value" => "https://cloud3/@user3", "type" => "mastodon"],
				["value" => "https://cloud/wrongSyntax", "type" => "mastodon"],
				["value" => "@wrongSyntax", "type" => "mastodon"],
				["value" => "wrongSyntax", "type" => "mastodon"]
			]
		];
		$contactWithSocialUrls = [
			"https://cloud1/api/v2/search?q=user1",
			"https://cloud2/api/v2/search?q=user2",
			"https://cloud3//api/v2/search?q=user3",
			"https://cloud1/api/v1/accounts/1",
			"https://cloud2/api/v1/accounts/2",
			"https://cloud3//api/v1/accounts/3"
		];
		$contactWithSocialApi = [
			'{"accounts":[{"id":"1","username":"user1"}]}',
			'{"accounts":[{"id":"2","username":"user2"}]}',
			'{"accounts":[{"id":"3","username":"user3"}]}',
			'{"id":"1","avatar":"user1.jpg"}',
			'{"id":"2","avatar":"user2.jpg"}',
			'{"id":"3","avatar":"user3.jpg"}'
		];
		$contactWithSocialImgs = [
			"user1.jpg",
			"user2.jpg",
			"user3.jpg"
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "one", "type" => "social2"],
				["value" => "two", "type" => "social1"]
			]
		];
		$contactWithoutSocialUrls = [];
		$contactWithoutSocialApi = [];
		$contactWithoutSocialImgs = [];

		return [
			'contact with mastodon fields' => [
				$contactWithSocial,
				$contactWithSocialApi,
				$contactWithSocialUrls,
				$contactWithSocialImgs
			],
			'contact without mastodon fields' => [
				$contactWithoutSocial,
				$contactWithoutSocialApi,
				$contactWithoutSocialUrls,
				$contactWithoutSocialImgs
			]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $api, $urls, $imgs) {
		if (count($urls)) {
			$this->response->method("getBody")->willReturnOnConsecutiveCalls(...$api);
			$this->client
		   ->expects($this->exactly(count($urls)))
		   ->method("get")
		   ->withConsecutive(...array_map(function ($a) {
		   	return [$a];
		   }, $urls))
		   ->willReturn($this->response);
		}
		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals($imgs, $result);
	}
}
