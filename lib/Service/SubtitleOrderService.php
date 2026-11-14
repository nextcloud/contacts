<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use InvalidArgumentException;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\ConfigLexicon;
use OCP\Config\IUserConfig;

/**
 * The order in which the contacts list tries a contact's fields
 * for the line under its name: the first field the contact has is shown.
 */
class SubtitleOrderService {
	/** Organization, then email, then phone: the order used before it was configurable */
	public const DEFAULT_ORDER = ['org', 'email', 'tel'];

	public function __construct(
		private readonly IUserConfig $userConfig,
	) {
	}

	/**
	 * @return list<string> the user's order, or the default order if none or an invalid one is stored
	 */
	public function getOrder(string $userId): array {
		$order = $this->userConfig->getValueArray($userId, Application::APP_ID, ConfigLexicon::SUBTITLE_ORDER, self::DEFAULT_ORDER);
		return $this->isValidOrder($order) ? $order : self::DEFAULT_ORDER;
	}

	/**
	 * @param array $order every field of the default order, each exactly once
	 * @throws InvalidArgumentException if the order is not such a list
	 */
	public function setOrder(string $userId, array $order): void {
		if (!$this->isValidOrder($order)) {
			throw new InvalidArgumentException('The order must list org, email and tel, each exactly once');
		}
		$this->userConfig->setValueArray($userId, Application::APP_ID, ConfigLexicon::SUBTITLE_ORDER, $order);
	}

	private function isValidOrder(array $order): bool {
		if (!array_is_list($order) || count($order) !== count(self::DEFAULT_ORDER)) {
			return false;
		}
		foreach (self::DEFAULT_ORDER as $field) {
			if (!in_array($field, $order, true)) {
				return false;
			}
		}
		return true;
	}
}
