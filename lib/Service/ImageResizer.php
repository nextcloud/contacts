<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCP\Image;

class ImageResizer {
	public const RESIZE_MAX_X = 256;
	public const RESIZE_MAX_Y = 256;
	public const MAX_INPUT_BYTES = 5 * 1024 * 1024;
	public const MAX_INPUT_PIXELS = 4096 * 4096;

	/**
	 * @param string $socialData
	 * @return null|string
	 */
	public function resizeImage(string $socialData) {
		if ($socialData === '' || strlen($socialData) > self::MAX_INPUT_BYTES) {
			return null;
		}

		$size = @getimagesizefromstring($socialData);
		if ($size === false || !isset($size[0], $size[1])) {
			return null;
		}

		if ($size[0] <= 0 || $size[1] <= 0 || ($size[0] * $size[1]) > self::MAX_INPUT_PIXELS) {
			return null;
		}

		$image = new Image();
		$image->loadFromData($socialData);

		if ($image->valid()) {
			$image->scaleDownToFit(self::RESIZE_MAX_X, self::RESIZE_MAX_Y);
			return $image->data();
		}
		return null;
	}
}
