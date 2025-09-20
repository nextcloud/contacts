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

class EnableOcmInvites extends Command {
	public function __construct(
		protected IConfig $config,
	) {
		parent::__construct();
	}

	protected function configure(): void {
		$this
			->setName('contacts:enable-ocm-invites')
			->setDescription('Enable OCM Invites.');
	}

	protected function execute(InputInterface $input, OutputInterface $output): int {
		$isAlreadyEnabled = $this->config->getAppValue('contacts', 'ocm_invites_enabled') === '1';

		if ($isAlreadyEnabled) {
			$output->writeln('OCM Invites already enabled.');
			return self::SUCCESS;
		}

		$this->config->setAppValue('contacts', 'ocm_invites_enabled', '1');
		$output->writeln('OCM Invites successfully enabled.');
		return self::SUCCESS;
	}
}
