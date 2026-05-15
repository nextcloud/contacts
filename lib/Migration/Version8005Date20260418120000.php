<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\Migration\Attributes\AddIndex;
use OCP\Migration\Attributes\IndexType;
use OCP\Migration\Attributes\ModifyColumn;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;
use Psr\Log\LoggerInterface;

/**
 * Schema and config setup for the OCM invites feature.
 *
 *   1. Backfill NULL `accepted` rows to false and tighten the column to
 *      NOT NULL DEFAULT false on `federated_invites`.
 *   2. Add a partial UNIQUE index `(user_id, recipient_email)` for open
 *      invites on Postgres and SQLite. This closes a Time-Of-Check to
 *      Time-Of-Use (TOCTOU) race where two concurrent requests both
 *      pass the application-level "is there already an open invite for
 *      this email?" check in FederatedInviteMapper::claimInviteForEmail()
 *      before either has inserted its row, and end up with two open
 *      invites for the same recipient. The index makes the second
 *      INSERT fail at the database. MySQL/MariaDB lack partial indexes,
 *      so the application guard remains the only defence there.
 *
 * All steps are idempotent.
 */
#[ModifyColumn(table: 'federated_invites', name: 'accepted', description: 'Make the accepted flag NOT NULL after backfilling NULL rows to false')]
#[AddIndex(table: 'federated_invites', type: IndexType::UNIQUE, description: 'Partial unique index on (user_id, recipient_email) for open invites; Postgres and SQLite only')]
class Version8005Date20260418120000 extends SimpleMigrationStep {
	private const INDEX_NAME = 'fed_inv_open_email_uniq';

	public function __construct(
		private IDBConnection $connection,
		private LoggerInterface $logger,
	) {
	}

	public function preSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {
		$qb = $this->connection->getQueryBuilder();
		$qb->update('federated_invites')
			->set('accepted', $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL))
			->where($qb->expr()->isNull('accepted'));
		$qb->executeStatement();
	}

	public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
		/** @var ISchemaWrapper $schema */
		$schema = $schemaClosure();

		if (!$schema->hasTable('federated_invites')) {
			return null;
		}

		$table = $schema->getTable('federated_invites');
		if (!$table->hasColumn('accepted')) {
			return null;
		}

		$column = $table->getColumn('accepted');
		if ($column->getNotnull() === true) {
			return null;
		}

		$column->setNotnull(true);
		$column->setDefault(false);

		return $schema;
	}

	public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {
		$this->createPartialUniqueIndex($output);
	}

	private function createPartialUniqueIndex(IOutput $output): void {
		$provider = $this->connection->getDatabaseProvider();
		if ($provider !== IDBConnection::PLATFORM_POSTGRES && $provider !== IDBConnection::PLATFORM_SQLITE) {
			$output->info(sprintf(
				'Skipping partial unique index %s on %s; application-level guard remains in effect.',
				self::INDEX_NAME,
				$provider,
			));
			$this->logger->info(
				'Skipped partial unique index for federated_invites on database provider {provider}.',
				['app' => 'contacts', 'provider' => $provider],
			);
			return;
		}

		$predicate = $provider === IDBConnection::PLATFORM_POSTGRES
			? 'recipient_email IS NOT NULL AND accepted = false'
			: 'recipient_email IS NOT NULL AND accepted = 0';

		$sql = sprintf(
			'CREATE UNIQUE INDEX IF NOT EXISTS %s ON %sfederated_invites (user_id, recipient_email) WHERE %s',
			self::INDEX_NAME,
			'*PREFIX*',
			$predicate,
		);

		try {
			$this->connection->executeStatement($sql);
		} catch (\Throwable $e) {
			$this->logger->warning(
				'Failed to create partial unique index for federated_invites: {message}',
				['app' => 'contacts', 'message' => $e->getMessage(), 'exception' => $e],
			);
			throw new \RuntimeException('Could not create required open-invite uniqueness index.', 0, $e);
		}
	}

}
