<?php

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

namespace OCA\Contacts\Command;

use OC\Core\AppInfo\ConfigLexicon;
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
		$isEnabled = $this->appConfig->getValueBool('contacts', 'ocm_invites_enabled');
		if (!$isEnabled) {
			$output->writeln('OCM Invites already disabled.');
			return self::SUCCESS;
		}

		$this->appConfig->setValueBool('contacts', 'ocm_invites_enabled', false);
		$this->appConfig->deleteKey('core', ConfigLexicon::OCM_INVITE_ACCEPT_DIALOG);
		$output->writeln('OCM Invites successfully disabled.');
		return self::SUCCESS;
	}
}
