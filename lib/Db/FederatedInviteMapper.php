<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * @template-extends QBMapper<FederatedInvite>
 */
class FederatedInviteMapper extends QBMapper {
	public const TABLE_NAME = 'federated_invites';

	public function __construct(IDBConnection $db) {
		parent::__construct($db, self::TABLE_NAME);
	}

	/**
	 * Returns the federated invite with the specified token
	 *
	 * @return FederatedInvite
	 */
	public function findByToken(string $token): FederatedInvite {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from('federated_invites')
			->where($qb->expr()->eq('token', $qb->createNamedParameter($token)));
		return $this->findEntity($qb);
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
