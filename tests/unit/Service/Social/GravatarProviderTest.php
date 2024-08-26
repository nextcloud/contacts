<?php
/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
			'PHONE' => [['value' => 'one'], ['value' => 'two']]
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
			'EMAIL' => [['value' => 'one'], ['value' => 'two']]
		];

		$contactWithoutEmail = [
			'PHONE' => [['value' => 'one'], ['value' => 'two']]
		];

		$urls = [];

		foreach ($contactWithEmail['EMAIL'] as $email) {
			$hash = md5(strtolower(trim($email['value'])));
			$recipe = 'https://www.gravatar.com/avatar/{hash}?s=720&d=404';
			$urls[] = str_replace('{hash}', $hash, $recipe);
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
