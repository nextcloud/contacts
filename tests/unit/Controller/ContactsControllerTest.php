<?php
/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
