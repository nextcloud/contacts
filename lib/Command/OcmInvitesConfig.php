<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Command;

use OCA\Contacts\AppInfo\Application;
use OCA\Contacts\ConfigLexicon;
use OCA\Contacts\Service\FederatedInvitesService;
use OCP\IAppConfig;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Manage OCM invite configuration.
 *
 * Usage:
 *   occ contacts:ocm-invites-config
 *   occ contacts:ocm-invites-config <key>
 *   occ contacts:ocm-invites-config <key> <value>
 *
 * Boolean values accept on/off, true/false, 1/0, and yes/no.
 */
class OcmInvitesConfig extends Command {
	public function __construct(
		private IAppConfig $appConfig,
	) {
		parent::__construct();
	}

	#[\Override]
	protected function configure(): void {
		$supportedOptions = implode(', ', $this->getSupportedOptions());
		$help = <<<HELP
The <info>%command.name%</info> command reads and writes Contacts OCM invite settings.

Supported keys:
  {$supportedOptions}

Key info:
  <info>ocm_invites_enabled</info>              - If set to true then the capability to send and accept invitations to exchange contact info is enabled in the app - bool, default false
  <info>ocm_invites_optional_mail</info>        - If set to true then sending an invitation by email is optional - bool, default false
  <info>ocm_invites_cc_sender</info>            - If set to true then the option to send a copy of the invitation to the sender is displayed - bool, default true
  <info>ocm_invites_encoded_copy_button</info>  - If set to true then the button to copy the encoded invitation is displayed - bool, default false
  <info>ocm_invites_disable_ssrf_guard</info>   - If set to true SSRF guard will be turned off. Warning: This is for development/testing purposes only!
                                     In production environments the value of this key should always be false - bool, default false
  <info>mesh_providers_service</info>           - The url that returns the list of mesh providers that will be displayed on the WAYF page - string, default empty

Boolean values accept: on/off, true/false, 1/0, yes/no.

Examples:
  <info>occ %command.name%</info>
  <info>occ %command.name% ocm_invites_enabled on</info>
  <info>occ %command.name% mesh_providers_service "https://mesh.example"</info>

HELP;

		$this
			->setName('contacts:ocm-invites-config')
			->setDescription('Manage OCM invite configuration.')
			->addArgument(
				'option',
				InputArgument::OPTIONAL,
				'Config key to read or write. Omit to list supported keys.',
			)
			->addArgument(
				'value',
				InputArgument::OPTIONAL,
				'Value to write. Omit to read the current value.',
			)
			->setHelp($help);
	}

	#[\Override]
	protected function execute(InputInterface $input, OutputInterface $output): int {
		$option = $input->getArgument('option');
		$value = $input->getArgument('value');

		if ($option === null) {
			return $this->listAll($output);
		}

		if (!in_array($option, $this->getSupportedOptions(), true)) {
			$output->writeln(sprintf(
				'<error>Unknown OCM invite config key "%s". Allowed: %s.</error>',
				$option,
				implode(', ', $this->getSupportedOptions()),
			));
			return self::FAILURE;
		}

		if ($value === null) {
			$output->writeln($this->getCurrentValue($option));
			return self::SUCCESS;
		}

		if ($option === ConfigLexicon::MESH_PROVIDERS_SERVICE) {
			$normalised = trim($value);
			$current = $this->appConfig->getValueString(Application::APP_ID, $option);
			if ($current === $normalised) {
				$output->writeln(sprintf('%s is already "%s".', $option, $normalised));
				return self::SUCCESS;
			}

			$this->appConfig->setValueString(Application::APP_ID, $option, $normalised);
			$output->writeln(sprintf('%s: "%s"', $option, $normalised));
			return self::SUCCESS;
		}

		$parsed = $this->parseBool($value);
		if ($parsed === null) {
			$output->writeln(sprintf(
				'<error>Cannot parse "%s" as boolean. Use on/off, true/false, 1/0, or yes/no.</error>',
				$value,
			));
			return self::INVALID;
		}

		$current = $this->appConfig->getValueBool(Application::APP_ID, $option);
		if ($current === $parsed) {
			$output->writeln(sprintf('%s is already %s.', $option, $this->formatBool($parsed)));
			return self::SUCCESS;
		}

		$this->appConfig->setValueBool(Application::APP_ID, $option, $parsed);
		$output->writeln(sprintf('%s: %s', $option, $this->formatBool($parsed)));
		return self::SUCCESS;
	}

	private function listAll(OutputInterface $output): int {
		$table = new Table($output);
		$table->setHeaders(['option', 'type', 'value']);
		foreach ($this->getSupportedOptions() as $key) {
			$table->addRow([
				$key,
				$this->isBooleanOption($key) ? 'bool' : 'string',
				$this->getCurrentValue($key),
			]);
		}
		$table->render();
		return self::SUCCESS;
	}

	private function getSupportedOptions(): array {
		return [
			ConfigLexicon::OCM_INVITES_ENABLED,
			...FederatedInvitesService::OCM_INVITES_BOOL_KEYS,
			ConfigLexicon::MESH_PROVIDERS_SERVICE,
		];
	}

	private function isBooleanOption(string $option): bool {
		return in_array($option, [
			ConfigLexicon::OCM_INVITES_ENABLED,
			...FederatedInvitesService::OCM_INVITES_BOOL_KEYS,
		], true);
	}

	private function getCurrentValue(string $option): string {
		if ($this->isBooleanOption($option)) {
			return $this->formatBool($this->appConfig->getValueBool(Application::APP_ID, $option));
		}

		return $this->appConfig->getValueString(Application::APP_ID, $option);
	}

	private function formatBool(bool $value): string {
		return $value ? 'on' : 'off';
	}

	private function parseBool(string $raw): ?bool {
		$normalised = strtolower(trim($raw));
		if (in_array($normalised, ['true', '1', 'on', 'yes'], true)) {
			return true;
		}
		if (in_array($normalised, ['false', '0', 'off', 'no'], true)) {
			return false;
		}
		return null;
	}
}
