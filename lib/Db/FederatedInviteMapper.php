<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Db;

use OCA\CloudFederationAPI\Db\FederatedInviteMapper as DbFederatedInviteMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use Psr\Log\LoggerInterface;

/**
 * @template-extends QBMapper<FederatedInvite>
 */
class FederatedInviteMapper extends DbFederatedInviteMapper {

	public function __construct(
		IDBConnection $db,
		private LoggerInterface $logger,
	) {
		parent::__construct($db, self::TABLE_NAME);
	}

	/**
	 * Returns all open federated invites for the user with the specified user id
	 *
	 * @return array a list of FederatedInvite objects
	 */
	public function findOpenInvitesByUid(string $userId):array {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from(self::TABLE_NAME)
			->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
			->andWhere($qb->expr()->eq('accepted', $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL)));
		return $this->findEntities($qb);
	}

	/**
	 * Returns all open federated invites for the user with the specified user id and for the specified recipient email
	 *
	 * @return array a list of FederatedInvite objects
	 */
	public function findOpenInvitesByRecipientEmail(string $userId, string $email):array {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from(self::TABLE_NAME)
			->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
			->andWhere($qb->expr()->eq('recipient_email', $qb->createNamedParameter($email)))
			->andWhere($qb->expr()->eq('accepted', $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL)));
		return $this->findEntities($qb);
	}

	/**
	 * Returns the federated invite with the specified token for the user with the specified user id
	 *
	 * @return FederatedInvite a list of FederatedInvite objects
	 */
	public function findInviteByTokenAndUidd(string $token, string $userId):FederatedInvite {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from(self::TABLE_NAME)
			->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
			->andWhere($qb->expr()->eq('token', $qb->createNamedParameter($token, IQueryBuilder::PARAM_STR)));
		return $this->findEntity($qb);
	}

}
