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

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
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
			->method('newClient')
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
		$this->client->method("get")->willReturn($this->response);
		$this->body = '{
			"subject": "acct:user1@cloud1",
			"aliases": [
				"https://cloud1/@user1",
				"https://cloud1/users/user1"
			],
			"links": [
				{
					"rel": "self",
					"type": "application/activity+json",
					"href": "https://cloud1/users/user1"
				}
			]
		}';
		$this->response->method("getBody")->willReturn($this->body);
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
			"https://cloud1/.well-known/webfinger?resource=acct:user1@cloud1",
			"https://cloud2/.well-known/webfinger?resource=acct:user2@cloud2",
			"https://cloud3/.well-known/webfinger?resource=acct:user3@cloud3",
			"https://cloud1/users/user1",
			"https://cloud2/users/user2",
			"https://cloud3/users/user3",
		];
		$contactWithSocialApi = [
			'{"subject":"acct:user1@cloud1","aliases":["https://cloud1/@user1","https://cloud1/users/user1"],"links":[{"rel":"self","type":"application/activity+json","href":"https://cloud1/users/user1"}]}',
			'{"subject":"acct:user2@cloud2","aliases":["https://cloud2/@user2","https://cloud2/users/user2"],"links":[{"rel":"self","type":"application/activity+json","href":"https://cloud2/users/user2"}]}',
			'{"subject":"acct:user3@cloud3","aliases":["https://cloud3/@user3","https://cloud3/users/user3"],"links":[{"rel":"self","type":"application/activity+json","href":"https://cloud3/users/user3"}]}',
			'{"id":"1","icon":{"url":"user1.jpg"}}',
			'{"id":"2","icon":{"url":"user2.jpg"}}',
			'{"id":"3","icon":{"url":"user3.jpg"}}',
		];
		$contactWithSocialImgs = [
			"user1.jpg",
			"user2.jpg",
			"user3.jpg"
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "one", "type" => "socialx"],
				["value" => "two", "type" => "socialy"]
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
