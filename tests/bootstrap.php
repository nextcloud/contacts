<?php

/**
 * SPDX-FileCopyrightText: 2016 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
require_once __DIR__.'/../../../lib/base.php';
require_once __DIR__.'/../vendor/autoload.php';

\OC::$loader->addValidRoot(OC::$SERVERROOT . '/tests');
\OC_App::loadApp('contacts');
