<?php
/**
 * @copyright Copyright (c) 2020 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Controller;

use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;

class ContactsController extends Controller {
	/** @var IL10N */
	private $l10n;

	/** @var IURLGenerator */
	private $urlGenerator;

	public function __construct(IRequest $request,
		IL10N $l10n,
		IURLGenerator $urlGenerator) {
		parent::__construct(Application::APP_ID, $request);

		$this->l10n = $l10n;
		$this->urlGenerator = $urlGenerator;
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
