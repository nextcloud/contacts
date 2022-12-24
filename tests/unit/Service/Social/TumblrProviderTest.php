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

class TumblrProviderTest extends TestCase {
	private $provider;

	protected function setUp(): void {
		parent::setUp();

		$this->provider = new TumblrProvider(
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'username1', 'type' => 'tumblr'],
				['value' => 'username2', 'type' => 'tumblr']
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];

		return [
			'contact with email' => [$contactWithSocial, true],
			'contact without email' => [$contactWithoutSocial, false]
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
				['value' => 'username1', 'type' => 'tumblr'],
				['value' => 'username2', 'type' => 'tumblr']
			]
		];

		$contactWithoutSocial = [
			'X-SOCIALPROFILE' => [
				['value' => 'one', 'type' => 'social2'],
				['value' => 'two', 'type' => 'social1']
			]
		];

		foreach ($contactWithSocial['X-SOCIALPROFILE'] as $profile) {
			$urls[] = 'https://api.tumblr.com/v2/blog/'.$profile['value'].'/avatar/512';
		}

		return [
			'contact with email' => [$contactWithSocial, $urls],
			'contact without email' => [$contactWithoutSocial, []]
		];
	}

	/**
	 * @dataProvider dataProviderGetImageUrls
	 */
	public function testGetImageUrls($contact, $expected) {
		$result = $this->provider->getImageUrls($contact);
		$this->assertEquals($expected, $result);
	}
}
