<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts;

use OCA\Contacts\AppInfo\Application;
use OCP\Capabilities\ICapability;
use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\L10N\IFactory as IL10NFactory;

class Capabilities implements ICapability {
	private readonly IL10N $l10n;

	public function __construct(
		private readonly IURLGenerator $url,
		IL10NFactory $l10nFactory,
	) {
		$this->l10n = $l10nFactory->get(Application::APP_ID);
	}

	public function getCapabilities(): array {
		return [
			'declarativeui' => [
				'contacts' => [
					'context-menu' => [
						[
							'name' => $this->l10n->t('Import contacts'),
							'url' => $this->url->getWebroot() . '/ocs/v2.php/apps/contacts/api/v1/import/{fileId}',
							'method' => 'POST',
							'mimetype_filters' => 'text/vcard',
						],
					],
				],
			],
		];
	}
}
