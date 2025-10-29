<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
			$urls[] = 'https://api.tumblr.com/v2/blog/' . $profile['value'] . '/avatar/512';
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
