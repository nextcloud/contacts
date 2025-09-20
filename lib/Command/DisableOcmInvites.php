<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

namespace OCA\Contacts\Command;

use OCP\IConfig;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class DisableOcmInvites extends Command {
	public function __construct(
		protected IConfig $config,
	) {
		parent::__construct();
	}

	protected function configure(): void {
		$this
			->setName('contacts:disable-ocm-invites')
			->setDescription('Disable OCM Invites.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int {
		$isAlreadyDisabled = $this->config->getAppValue('contacts', 'ocm_invites_enabled') === '0';

		if ($isAlreadyDisabled) {
			$output->writeln('OCM Invites already disabled.');
			return self::SUCCESS;
		}

		$this->config->setAppValue('contacts', 'ocm_invites_enabled', '0');
		$output->writeln('OCM Invites successfully disabled.');
		return self::SUCCESS;
	}
}
