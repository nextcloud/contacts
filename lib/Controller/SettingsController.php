<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use InvalidArgumentException;
use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\Service\SubtitleOrderService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;

class SettingsController extends OCSController {
	public function __construct(
		IRequest $request,
		private readonly ?string $userId,
		private readonly SubtitleOrderService $subtitleOrderService,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	/**
	 * Set the order in which the contacts list tries a contact's fields for the line under its name.
	 *
	 * @param list<string> $order org, email and tel, each exactly once
	 * @return DataResponse The stored order
	 *
	 * 200: Order stored
	 * 400: The order does not list org, email and tel exactly once each
	 * 401: User is not logged in
	 */
	#[NoAdminRequired]
	#[ApiRoute('PUT', '/api/v1/settings/subtitle-order')]
	public function setSubtitleOrder(array $order): DataResponse {
		if ($this->userId === null) {
			return new DataResponse('Not logged in', Http::STATUS_UNAUTHORIZED);
		}

		try {
			$this->subtitleOrderService->setOrder($this->userId, $order);
		} catch (InvalidArgumentException $e) {
			return new DataResponse($e->getMessage(), Http::STATUS_BAD_REQUEST);
		}

		return new DataResponse($order);
	}
}
