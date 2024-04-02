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
use Psr\Log\LoggerInterface;

class InstagramProviderTest extends TestCase {
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
		$this->response = $this->createMock(IResponse::class);
		$this->client = $this->createMock(IClient::class);
		$this->logger = $this->createMock(LoggerInterface::class);

		$this->clientService
			->method('newClient')
			->willReturn($this->client);

		$this->provider = new InstagramProvider(
			$this->clientService, $this->logger
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "username1", "type" => "instagram"],
				["value" => "username2", "type" => "instagram"]
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "one", "type" => "social2"],
				["value" => "two", "type" => "social1"]
			]
		];

		return [
			'contact with instagram fields' => [$contactWithSocial, true],
			'contact without instagram fields' => [$contactWithoutSocial, false]
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
				["value" => "username1", "type" => "instagram"],
				["value" => "username2", "type" => "instagram"]
			]
		];
		$contactWithSocialUrls = [
			"https://www.instagram.com/username1/?__a=1",
			"https://www.instagram.com/username2/?__a=1",
		];
		$contactWithSocialJson = [
			json_encode(
				["graphql" => ["user" => ["profile_pic_url_hd" => "username1.jpg"]]]
			),
			json_encode(
				["graphql" => ["user" => ["profile_pic_url_hd" => "username2.jpg"]]]
			)
		];
		$contactWithSocialImgs = [
			"username1.jpg",
			"username2.jpg"
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				["value" => "one", "type" => "social2"],
				["value" => "two", "type" => "social1"]
			]
		];
		$contactWithoutSocialUrls = [];
		$contactWithoutSocialJson = [];
		$contactWithoutSocialImgs = [];

		return [
			'contact with instagram fields' => [
				$contactWithSocial,
				$contactWithSocialJson,
				$contactWithSocialUrls,
				$contactWithSocialImgs
			],
			'contact without instagram fields' => [
				$contactWithoutSocial,
				$contactWithoutSocialJson,
				$contactWithoutSocialUrls,
				$contactWithoutSocialImgs
			]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $json, $urls, $imgs) {
		if (count($urls)) {
			$this->response->method("getBody")->willReturnOnConsecutiveCalls(...$json);
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
