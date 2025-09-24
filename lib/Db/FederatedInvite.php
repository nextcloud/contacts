<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Db;

use OCA\CloudFederationAPI\Db\FederatedInvite as DbFederatedInvite;

class FederatedInvite extends DbFederatedInvite {

	public function __construct() {
	}

	public function jsonSerialize(): array {
		return [
			'accepted' => $this->accepted,
			'acceptedAt' => $this->acceptedAt,
			'createdAt' => $this->createdAt,
			'expiredAt' => $this->expiredAt,
			'recipientEmail' => $this->recipientEmail,
			'recipientName' => $this->recipientName,
			'recipientProvider' => $this->recipientProvider,
			'recipientUserId' => $this->recipientUserId,
			'token' => $this->token,
			'userId' => $this->userId,
		];
	}

}
