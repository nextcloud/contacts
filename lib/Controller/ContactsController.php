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
use OCP\Contacts\IManager;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IUserManager;

class ContactsController extends Controller {
	/** @var IL10N */
	private $l10n;

	/** @var IURLGenerator */
	private $urlGenerator;

	/** @var IManager */
	private $contactsManager;

	/** @var IManager */
	private $userManager;

	public function __construct(IRequest $request,
								IL10N $l10n,
								IURLGenerator $urlGenerator,
								IManager $contacts,
								IUserManager $userManager) {
		parent::__construct(Application::APP_ID, $request);

		$this->l10n = $l10n;
		$this->urlGenerator = $urlGenerator;
		$this->contactsManager = $contacts;
		$this->userManager = $userManager;
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


	/**
	 * Search for a contact based on a contact's name or email-address
	 *
	 * @param string $search Name or email to search for
	 * @return JSONResponse
	 *
	 * @NoAdminRequired
	 */
	public function searchUsers(string $search):JSONResponse {
		if (!$this->contactsManager->isEnabled()) {
			return new JSONResponse();
		}
		$result = $this->contactsManager->search($search, ['FN', 'EMAIL']);

		$contacts = [];
		foreach ($result as $r) {
			// Information about system users is fetched via DAV nowadays
			if (isset($r['isLocalSystemBook']) && $r['isLocalSystemBook']) {
				continue;
			}

			if (!isset($r['EMAIL'])) {
				continue;
			}

			$name = $this->getNameFromContact($r);
			if (\is_string($r['EMAIL'])) {
				$r['EMAIL'] = [$r['EMAIL']];
			}

			$photo = isset($r['PHOTO'])
				? $this->getPhotoUri($r['PHOTO'])
				: null;

			$lang = null;
			if (isset($r['LANG'])) {
				if (\is_array($r['LANG'])) {
					$lang = $r['LANG'][0];
				} else {
					$lang = $r['LANG'];
				}
			}

			$timezoneId = null;
			if (isset($r['TZ'])) {
				if (\is_array($r['TZ'])) {
					$timezoneId = $r['TZ'][0];
				} else {
					$timezoneId = $r['TZ'];
				}
			}
			$emailaddresses = $r['EMAIL'];
			foreach ($emailaddresses as $emailaddress) {
				$userdata = $this->userManager->getByEmail($emailaddress);
				if (count($userdata) > 0) {
					$username = $userdata[0]->getUID();
					$principalurl = 'principal:principals/users/'.$username;
					$contacts[] = [
						'uid' => $username,
						'name' => $name,
						'email' => $emailaddress,
						'lang' => $lang,
						'uri' => $principalurl
					];
				}
			}
		}

		return new JSONResponse($contacts);
	}

	/**
	 * Extract name from an array containing a contact's information
	 *
	 * @param array $r
	 * @return string
	 */
	private function getNameFromContact(array $r):string {
		return $r['FN'] ?? '';
	}
}
