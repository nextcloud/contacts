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

	/**
	 * @param string $socialData
	 * @return null|string
	 */
	public function resizeImage(string $socialData) {
		$image = new Image();

		$image->loadFromData($socialData);

		if ($image->valid()) {
			$image->scaleDownToFit(self::RESIZE_MAX_X, self::RESIZE_MAX_Y);
			return $image->data();
		}
		return null;
	}
}
