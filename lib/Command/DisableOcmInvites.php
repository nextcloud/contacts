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

class DisableOcmInvites extends Command {
	public function __construct(
		protected IAppConfig $appConfig,
	) {
		parent::__construct();
	}

	protected function configure(): void {
		$this
			->setName('contacts:disable-ocm-invites')
			->setDescription('Disable OCM Invites.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int {
		$isAlreadyDisabled = $this->appConfig->getValueBool('contacts', 'ocm_invites_enabled') === false;

		if ($isAlreadyDisabled) {
			$output->writeln('OCM Invites already disabled.');
			return self::SUCCESS;
		}

		$this->appConfig->setValueBool('contacts', 'ocm_invites_enabled', false);
		$this->appConfig->deleteKey('core', 'ocm_invite_accept_dialog');
		$output->writeln('OCM Invites successfully disabled.');
		return self::SUCCESS;
	}
}
