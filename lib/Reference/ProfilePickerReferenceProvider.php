<?php

declare(strict_types=1);

/**
 * @copyright Copyright (c) 2023 Andrey Borysenko <andrey18106x@gmail.com>
 *
 * @author 2023 Andrey Borysenko <andrey18106x@gmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Contacts\Reference;


use OC\Collaboration\Reference\LinkReferenceProvider;
use OCP\Collaboration\Reference\ADiscoverableReferenceProvider;
use OCP\Collaboration\Reference\Reference;

use OCP\Collaboration\Reference\IReference;
use OCP\IL10N;
use OCP\IURLGenerator;

use OCA\Contacts\AppInfo\Application;
use OCP\Accounts\IAccountManager;
use OCP\IUserManager;

class ProfilePickerReferenceProvider extends ADiscoverableReferenceProvider {
	private const RICH_OBJECT_TYPE = 'users_picker_profile';
	private ?string $userId;
	private IL10N $l10n;
	private IURLGenerator $urlGenerator;
	private LinkReferenceProvider $linkReferenceProvider;
	private IUserManager $userManager;
	private IAccountManager $accountManager;

	public function __construct(
		IL10N $l10n,
		IURLGenerator $urlGenerator,
		LinkReferenceProvider $linkReferenceProvider,
		IUserManager $userManager,
		IAccountManager $accountManager,
		?string $userId
	) {
		$this->userId = $userId;
		$this->l10n = $l10n;
		$this->urlGenerator = $urlGenerator;
		$this->linkReferenceProvider = $linkReferenceProvider;
		$this->userManager = $userManager;
		$this->accountManager = $accountManager;
	}

	/**
	 * @inheritDoc
	 */
	public function getId(): string	{
		return 'profile_picker';
	}

	/**
	 * @inheritDoc
	 */
	public function getTitle(): string {
		return $this->l10n->t('Profile picker');
	}

	/**
	 * @inheritDoc
	 */
	public function getOrder(): int	{
		return 10;
	}

	/**
	 * @inheritDoc
	 */
	public function getIconUrl(): string {
		return $this->urlGenerator->imagePath(Application::APP_ID, 'profile-dark.svg');
	}

	/**
	 * @inheritDoc
	 */
	public function matchReference(string $referenceText): bool {
		return $this->getObjectId($referenceText) !== null;
	}

	/**
	 * @inheritDoc
	 */
	public function resolveReference(string $referenceText): ?IReference {
		if (!$this->matchReference($referenceText)) {
			return null;
		}

		$userId = $this->getObjectId($referenceText);
		$user = $this->userManager->get($userId);
		if ($user !== null) {
			$reference = new Reference($referenceText);

			$userDisplayName = $user->getDisplayName();
			$userEmail = $user->getEMailAddress();
			$userAvatarUrl = $this->urlGenerator->linkToRouteAbsolute('core.avatar.getAvatar', ['userId' => $userId, 'size' => '64']);

			$bio = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_BIOGRAPHY);
			$bio = $bio->getScope() !== IAccountManager::SCOPE_PRIVATE ? $bio->getValue() : null;
			$headline = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_HEADLINE);
			$location = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_ADDRESS);
			$website = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_WEBSITE);
			$organisation = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_ORGANISATION);
			$role = $this->accountManager->getAccount($user)->getProperty(IAccountManager::PROPERTY_ROLE);

			// for clients who can't render the reference widgets
			$reference->setTitle($userDisplayName);
			$reference->setDescription($userEmail ?? $userDisplayName);
			$reference->setImageUrl($userAvatarUrl);

			// for the Vue reference widget
			$reference->setRichObject(
				self::RICH_OBJECT_TYPE,
				[
					'user_id' => $userId,
					'title' => $userDisplayName,
					'subline' => $userEmail ?? $userDisplayName,
					'email' => $userEmail,
					'bio' => isset($bio) && $bio !== '' ? substr_replace($bio, '...', 80, strlen($bio)) : null,
					'headline' => $headline->getScope() !== IAccountManager::SCOPE_PRIVATE ? $headline->getValue() : null,
					'location' => $location->getScope() !== IAccountManager::SCOPE_PRIVATE ? $location->getValue() : null,
					'location_url' => $location->getScope() !== IAccountManager::SCOPE_PRIVATE ? $this->getOpenStreetLocationUrl($location->getValue()) : null,
					'website' => $website->getScope() !== IAccountManager::SCOPE_PRIVATE ? $website->getValue() : null,
					'organisation' => $organisation->getScope() !== IAccountManager::SCOPE_PRIVATE ? $organisation->getValue() : null,
					'role' => $role->getScope() !== IAccountManager::SCOPE_PRIVATE ? $role->getValue() : null,
					'url' => $referenceText,
				]
			);
			return $reference;
		}
		return $this->linkReferenceProvider->resolveReference($referenceText);
	}

	private function getObjectId(string $url): ?string {
		$baseUrl = $this->urlGenerator->getBaseUrl();
		$baseWithIndex = $baseUrl . '/index.php';

		preg_match('/^' . preg_quote($baseUrl, '/') . '\/u\/(\w+)$/', $url, $matches);
		if (count($matches) > 1) {
			return $matches[1];
		}
		preg_match('/^' . preg_quote($baseWithIndex, '/') . '\/u\/(\w+)$/', $url, $matches);
		if (count($matches) > 1) {
			return $matches[1];
		}

		return null;
	}

	private function getOpenStreetLocationUrl($location): string {
		return 'https://www.openstreetmap.org/search?query=' . urlencode($location);
	}

	/**
	 * @inheritDoc
	 */
	public function getCachePrefix(string $referenceId): string {
		return $this->userId ?? '';
	}

	/**
	 * @inheritDoc
	 */
	public function getCacheKey(string $referenceId): ?string {
		$objectId = $this->getObjectId($referenceId);
		if ($objectId !== null) {
			return $objectId;
		}
		return $referenceId;
	}
}
