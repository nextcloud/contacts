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
     * Returns all open federated invites of the specified user
     * 
     * @return array a list of FederatedInvite objects
     */
	public function findOpenInvitesByUiddd(string $userId):array {
		$qb = $this->db->getQueryBuilder();
		$qb->select('*')
			->from(self::TABLE_NAME)
			->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
            ->andWhere($qb->expr()->eq('accepted', $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL)));
		$entities = $this->findEntities($qb);
        foreach($entities as $entity) {
            $this->logger->debug(get_class($entity));
        }
        return $entities;
	}

}
