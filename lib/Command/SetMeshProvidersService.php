<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

namespace OCA\Contacts\Command;

use OCP\IConfig;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class SetMeshProvidersService extends Command {

	public function __construct(
		protected IConfig $config,
	) {
		parent::__construct();
	}

	protected function configure(): void {
		$this->setName('contacts:set-mesh-providers-service');
		$this->addArgument(
			'mesh-providers-service',
			InputArgument::REQUIRED,
			'The URL to the OCM Discovery Service'
		);
	}

	public function execute(InputInterface $input, OutputInterface $output): int {
		$disco = $input->getArgument('mesh-providers-service');
		$this->config->setAppValue('contacts', 'mesh_providers_service', $disco);
		$output->writeln('OCM Discovery Service successfully configured.');
		return self::SUCCESS;
	}
}
