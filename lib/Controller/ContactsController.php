<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;

class ContactsController extends Controller {

	public function __construct(
		IRequest $request,
		private IL10N $l10n,
		private IURLGenerator $urlGenerator,
	) {
		parent::__construct(Application::APP_ID, $request);
	}


	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Open and find direct contact
	 * @param string $uuid
	 */
	public function direct(string $contact): RedirectResponse {
		$url = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . $this->l10n->t('All contacts') . '/' . $contact
		);
		return new RedirectResponse($url);
	}


	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * Open and find direct circle
	 * @param string $uuid
	 */
	public function directCircle(string $singleId): RedirectResponse {
		$url = $this->urlGenerator->getAbsoluteURL(
			$this->urlGenerator->linkToRoute('contacts.page.index') . 'circle/' . $singleId
		);
		return new RedirectResponse($url);
	}
}
