<?php

declare(strict_types=1);

/**
 * @copyright Copyright (c) 2022 Thomas Citharel <nextcloud@tcit.fr>
 *
 * @author Thomas Citharel <nextcloud@tcit.fr>
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
