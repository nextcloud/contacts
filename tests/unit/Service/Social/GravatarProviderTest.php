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

class GravatarProviderTest extends TestCase {
	private $provider;

	protected function setUp(): void {
		parent::setUp();

		$this->provider = new GravatarProvider(
		);
	}

	public function dataProviderSupportsContact() {
		$contactWithEmail = [
			'EMAIL' => [['value' => 'one'], ['value' => 'two']]
		];

		$contactWithoutEmail = [
			'PHONE' => [['value' => 'one'], ["value" => "two"]]
		];

		return [
			'contact with email' => [$contactWithEmail, true],
			'contact without email' => [$contactWithoutEmail, false]
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
		$contactWithEmail = [
			'EMAIL' => [["value" => "one"], ["value" => "two"]]
		];

		$contactWithoutEmail = [
			'PHONE' => [["value" => "one"], ["value" => "two"]]
		];

		$urls = [];

		foreach ($contactWithEmail['EMAIL'] as $email) {
			$hash = md5(strtolower(trim($email['value'])));
			$recipe = 'https://www.gravatar.com/avatar/{hash}?s=720&d=404';
			$urls[] = str_replace("{hash}", $hash, $recipe);
		}

		return [
			'contact with email' => [$contactWithEmail, $urls],
			'contact without email' => [$contactWithoutEmail, []]
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
