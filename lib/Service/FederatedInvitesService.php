<?php

/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Service;

use OCA\Contacts\AppInfo\Application;
use OCP\IAppConfig;

class FederatedInvitesService {

    // Is OCM invites capability enabled by default ?
    const OCM_INVITES_ENABLED_BY_DEFAULT = false;

    public function __construct(
        private IAppConfig $appConfig
    ){}

    public function isOcmInvitesEnabled():bool {
		$val = $this->appConfig->getValueString(Application::APP_ID, 'ocm_invites_enabled', FederatedInvitesService::OCM_INVITES_ENABLED_BY_DEFAULT);
        $boolval = (is_string($val) ? filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : (bool) $val);
        return ($boolval === null ? false : $boolval);
    }
}