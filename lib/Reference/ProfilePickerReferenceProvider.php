<?php
/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Contacts\Reference;

use OCA\Contacts\AppInfo\Application;
use OCP\Accounts\IAccountManager;

use OCP\Collaboration\Reference\ADiscoverableReferenceProvider;
use OCP\Collaboration\Reference\IReference;
use OCP\Collaboration\Reference\Reference;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\IUserManager;

class ProfilePickerReferenceProvider extends ADiscoverableReferenceProvider {
	public const RICH_OBJECT_TYPE = 'users_picker_profile';

	public function __construct(
		private IL10N $l10n,
		private IURLGenerator $urlGenerator,
		private IUserManager $userManager,
		private IAccountManager $accountManager,
		private ?string $userId,
	) {
	}

	/**
	 * @inheritDoc
	 */
	public function getId(): string {
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
	public function getOrder(): int {
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
		if ($user === null) {
			return null;
		}
		$account = $this->accountManager->getAccount($user);
		$profileEnabled = $account->getProperty(IAccountManager::PROPERTY_PROFILE_ENABLED)->getValue() === '1';
		if (!$profileEnabled) {
			return null;
		}

		$reference = new Reference($referenceText);

		$userDisplayName = $user->getDisplayName();
		$userEmail = $user->getEMailAddress();
		$userAvatarUrl = $this->urlGenerator->linkToRouteAbsolute('core.avatar.getAvatar', ['userId' => $userId, 'size' => '64']);

		$bio = $account->getProperty(IAccountManager::PROPERTY_BIOGRAPHY);
		$bio = $bio->getScope() !== IAccountManager::SCOPE_PRIVATE ? $bio->getValue() : null;
		$headline = $account->getProperty(IAccountManager::PROPERTY_HEADLINE);
		$location = $account->getProperty(IAccountManager::PROPERTY_ADDRESS);
		$website = $account->getProperty(IAccountManager::PROPERTY_WEBSITE);
		$organisation = $account->getProperty(IAccountManager::PROPERTY_ORGANISATION);
		$role = $account->getProperty(IAccountManager::PROPERTY_ROLE);

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
				'bio' => isset($bio) && $bio !== ''
					? (mb_strlen($bio) > 80
						? (mb_substr($bio, 0, 80) . '...')
						: $bio)
					: null,
				'full_bio' => $bio,
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

	public function getObjectId(string $url): ?string {
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

	public function getOpenStreetLocationUrl($location): string {
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
