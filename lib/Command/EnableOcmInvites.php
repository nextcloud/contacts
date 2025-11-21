<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

namespace OCA\Contacts\Command;

use OCP\IAppConfig;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class EnableOcmInvites extends Command {
	public function __construct(
		protected IAppConfig $appConfig,
	) {
		parent::__construct();
	}

	protected function configure(): void {
		$this
			->setName('contacts:enable-ocm-invites')
			->setDescription('Enable OCM Invites.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int {
		$isAlreadyEnabled = $this->appConfig->getValueBool('contacts', 'ocm_invites_enabled');

		if ($isAlreadyEnabled) {
			$output->writeln('OCM Invites already enabled.');
			return self::SUCCESS;
		}

		$this->appConfig->setValueBool('contacts', 'ocm_invites_enabled', true);
		$this->appConfig->setValueString('core', 'ocm_invite_accept_dialog', 'contacts.federated_invites.invite_accept_dialog');

		$output->writeln('OCM Invites successfully enabled.');
		return self::SUCCESS;
	}
}
