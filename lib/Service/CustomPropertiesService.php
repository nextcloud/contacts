<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCA\Contacts\AppInfo\Application;
use OCP\IConfig;
use Psr\Log\LoggerInterface;

/**
 * Admin-defined custom property types for the contact editor.
 *
 * Configured as a JSON array in the app config:
 *
 * occ config:app:set contacts customProperties --value='[
 *   {"name": "x-customernumber", "label": "Customer number"},
 *   {"name": "x-region", "label": "Region", "force": "select",
 *    "options": [{"id": "NORTH", "name": "North"}, {"id": "SOUTH", "name": "South"}]}
 * ]'
 *
 * Supported keys per entry:
 * - name (required): vCard property name, lowercase, must match /^x-[a-z0-9-]+$/
 * - label (required): display name shown in the UI (not translated)
 * - force: editor type, "text" (default) or "select"
 * - options: list of {id, name} — TYPE parameter choices for "text",
 *   value choices for "select" (required there)
 * - multiple: whether the property may be added more than once per contact
 * - primary: show on the first level of the "Add more info" menu
 * - icon: CSS icon class, must match /^icon-[a-z0-9-]+$/
 *
 * Invalid entries are dropped and logged, they never break the app.
 */
class CustomPropertiesService {

	public function __construct(
		private IConfig $config,
		private LoggerInterface $logger,
	) {
	}

	public function getCustomProperties(): array {
		$json = $this->config->getAppValue(Application::APP_ID, 'customProperties', '[]');
		$decoded = json_decode($json, true);
		if (!is_array($decoded)) {
			$this->logger->warning('Ignoring contacts customProperties app config: not a JSON array');
			return [];
		}

		$properties = [];
		foreach ($decoded as $entry) {
			$property = $this->sanitizeEntry($entry);
			if ($property === null) {
				$this->logger->warning('Ignoring invalid contacts customProperties entry', ['entry' => $entry]);
				continue;
			}
			$properties[] = $property;
		}
		return $properties;
	}

	private function sanitizeEntry(mixed $entry): ?array {
		if (!is_array($entry) || !is_string($entry['name'] ?? null) || !is_string($entry['label'] ?? null)) {
			return null;
		}

		$name = strtolower($entry['name']);
		$label = trim($entry['label']);
		if ($label === '' || preg_match('/^x-[a-z0-9-]+$/', $name) !== 1) {
			return null;
		}

		$force = $entry['force'] ?? 'text';
		if (!in_array($force, ['text', 'select'], true)) {
			return null;
		}

		$options = $this->sanitizeOptions($entry['options'] ?? []);
		if ($force === 'select' && $options === []) {
			return null;
		}

		$property = [
			'name' => $name,
			'label' => $label,
			'force' => $force,
			'multiple' => ($entry['multiple'] ?? false) === true,
			'primary' => ($entry['primary'] ?? false) === true,
		];
		if ($options !== []) {
			$property['options'] = $options;
		}
		if (is_string($entry['icon'] ?? null) && preg_match('/^icon-[a-z0-9-]+$/', $entry['icon']) === 1) {
			$property['icon'] = $entry['icon'];
		}
		return $property;
	}

	private function sanitizeOptions(mixed $options): array {
		if (!is_array($options)) {
			return [];
		}

		$sanitized = [];
		foreach ($options as $option) {
			if (!is_array($option) || !is_string($option['id'] ?? null) || !is_string($option['name'] ?? null)
				|| trim($option['id']) === '' || trim($option['name']) === '') {
				continue;
			}
			$sanitized[] = ['id' => $option['id'], 'name' => $option['name']];
		}
		return $sanitized;
	}
}
