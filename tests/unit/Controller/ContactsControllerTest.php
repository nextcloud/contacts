<?php
/**
 * @copyright Copyright (c) 2019 John Molakvoæ <skjnldsv@protonmail.com>
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

use ChristophWurst\Nextcloud\Testing\TestCase;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IURLGenerator;
use PHPUnit\Framework\MockObject\MockObject;

class ContactsControllerTest extends TestCase {
	private $controller;

	/** @var IL10N|MockObject */
	private $l10n;

	/** @var IURLGenerator|MockObject*/
	private $urlGenerator;


	protected function setUp(): void {
		parent::setUp();

		$this->request = $this->createMock(IRequest::class);
		$this->l10n = $this->createMock(IL10N::class);
		$this->urlGenerator = $this->createMock(IURLGenerator::class);

		$this->controller = new ContactsController(
			$this->request,
			$this->l10n,
			$this->urlGenerator
		);
	}


	public function testRedirect() {
		$contact = 'uuid~addressbook';

		$this->l10n->method('t')
			->with('All contacts')
			->willReturn('All contacts');

		$this->urlGenerator->expects($this->once())
			->method('linkToRoute')
			->with('contacts.page.index')
			->willReturn('/index.php/apps/contacts/');

		$this->urlGenerator->expects($this->once())
			->method('getAbsoluteURL')
			->with('/index.php/apps/contacts/All contacts/' . $contact)
			->willReturn('/index.php/apps/contacts/All contacts/' . $contact);

		$result = $this->controller->direct('uuid~addressbook');
		$this->assertTrue($result instanceof RedirectResponse);
		$this->assertEquals('/index.php/apps/contacts/All contacts/' . $contact, $result->getRedirectURL());
	}
}
