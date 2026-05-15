<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts;

use OCP\Config\Lexicon\Entry;
use OCP\Config\Lexicon\ILexicon;
use OCP\Config\Lexicon\Strictness;
use OCP\Config\ValueType;
use OCP\IAppConfig;

/**
 * Config Lexicon for contacts.
 *
 * Please add and manage your config keys in this file and keep the
 * Lexicon up to date.
 *
 * {@see ILexicon}
 */
class ConfigLexicon implements ILexicon {
	public const OCM_INVITES_ENABLED = 'ocm_invites_enabled';
	public const OCM_INVITES_OPTIONAL_MAIL = 'ocm_invites_optional_mail';
	public const OCM_INVITES_CC_SENDER = 'ocm_invites_cc_sender';
	public const OCM_INVITES_ENCODED_COPY_BUTTON = 'ocm_invites_encoded_copy_button';
	public const OCM_INVITES_DISABLE_SSRF_GUARD = 'ocm_invites_disable_ssrf_guard';
	public const MESH_PROVIDERS_SERVICE = 'mesh_providers_service';
	public const WAYF_ENDPOINT = 'wayf_endpoint';
	public const FEDERATIONS_CACHE = 'federations_cache';

	public function getStrictness(): Strictness {
		return Strictness::NOTICE;
	}

	public function getAppConfigs(): array {
		return [
			new Entry(
				self::OCM_INVITES_ENABLED,
				ValueType::BOOL,
				defaultRaw: false,
				definition: 'Whether OCM invites for contacts are enabled.',
				lazy: true,
			),
			new Entry(
				self::OCM_INVITES_OPTIONAL_MAIL,
				ValueType::BOOL,
				defaultRaw: false,
				definition: 'Whether the recipient email field is optional when creating an OCM invite.',
				lazy: true,
			),
			new Entry(
				self::OCM_INVITES_CC_SENDER,
				ValueType::BOOL,
				defaultRaw: true,
				definition: 'Whether the sender is CC-ed on the OCM invite email.',
				lazy: true,
			),
			new Entry(
				self::OCM_INVITES_ENCODED_COPY_BUTTON,
				ValueType::BOOL,
				defaultRaw: false,
				definition: 'Whether the invite email "Open invite" button uses the encoded WAYF URL instead of the raw token.',
				lazy: true,
			),
			new Entry(
				self::OCM_INVITES_DISABLE_SSRF_GUARD,
				ValueType::BOOL,
				defaultRaw: false,
				definition: 'Unsafe development override that disables private-host and localhost checks for OCM invite discovery.',
				lazy: true,
			),
			new Entry(
				self::MESH_PROVIDERS_SERVICE,
				ValueType::STRING,
				defaultRaw: '',
				definition: 'Space-separated list of mesh provider service URLs used for WAYF discovery.',
				lazy: true,
			),
			new Entry(
				self::WAYF_ENDPOINT,
				ValueType::STRING,
				defaultRaw: '',
				definition: 'Optional override for the base WAYF endpoint used in invite links.',
				note: 'If empty, the app route is used at runtime.',
				lazy: true,
			),
			new Entry(
				self::FEDERATIONS_CACHE,
				ValueType::ARRAY,
				defaultRaw: [],
				definition: 'Internal cron-maintained cache for discovered federations and expiry metadata.',
				flags: IAppConfig::FLAG_SENSITIVE,
				lazy: true,
			),
		];
	}

	public function getUserConfigs(): array {
		return [];
	}
}
