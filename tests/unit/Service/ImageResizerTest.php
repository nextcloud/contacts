<?php

/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */


namespace OCA\Contacts\Service;

use ChristophWurst\Nextcloud\Testing\TestCase;

class ImageResizerTest extends TestCase {
	/** @var ImageResizer */
	private $imageResizer;

	protected function setUp(): void {
		$this->imageResizer = new ImageResizer();
	}

	public function testReturnsNullForInvalidImage() {
		$this->assertNull($this->imageResizer->resizeImage('badImage'));
	}
}
