<?php

/**
 * SPDX-FileCopyrightText: 2020 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Contacts\Controller;

use OC\DB\Connection;
use OCA\Circles\Db\CircleRequest;
use OCA\Circles\Db\MembershipRequest;
use OCA\Circles\Exceptions\FrontendException;
use OCA\Circles\Exceptions\MembershipNotFoundException;
use OCA\Circles\FederatedItems\CircleJoin;
use OCA\Circles\Model\Federated\FederatedEvent;
use OCA\Circles\Service\ConfigService;
use OCA\Circles\Service\FederatedUserService;
use OCA\Circles\Tools\Traits\TDeserialize;
use OCA\Circles\Tools\Traits\TNCLogger;
use OCA\Contacts\AppInfo\Application;
use OCP\AppFramework\ApiController;
use OCP\AppFramework\Http\Attribute\UserRateLimit;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\OCS\OCSException;
use OCP\AppFramework\Services\IInitialState;
use OCP\IL10N;
use OCP\IRequest;
use OCP\IUserSession;

class InvitationController extends ApiController {
	private const SETTING_KEY_INVITATION_CODE = 'invitationCode';

	use TDeserialize;
	use TNCLogger;

	public function __construct(
		IRequest $request,
		private IUserSession $userSession,
		private ConfigService $configService,
		private FederatedUserService $federatedUserService,
		private Connection $connection,
		private IInitialState $initialState,
		private CircleRequest $circleRequest,
		private MembershipRequest $membershipRequest,
		private CircleJoin $circleJoin,
		private IL10N $l10n,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * @UserRateThrottle(limit=10, period=3600)
	 */
	#[UserRateLimit(limit: 10, period: 3600)]
	public function viewInvitation(string $invitationCode): TemplateResponse {
		$this->setCurrentFederatedUser();

		try {
			$invitation = $this->getInvitation($invitationCode);
		} catch (\OutOfBoundsException $e) {
			return new TemplateResponse(Application::APP_ID,
				'message',
				['message' => $this->l10n->t('Link or team does not exist anymore')],
				TemplateResponse::RENDER_AS_USER,
				404,
			);
		}

		$circle = $this->circleRequest->getCircle($invitation['circle_id']);
		$federatedUser = $this->federatedUserService->getLocalFederatedUser($this->userSession->getUser()->getUID());

		try {
			$this->membershipRequest->getMembership($invitation['circle_id'], $federatedUser->getSingleId());
			$isAlreadyMemberOfCircle = true;
		} catch (MembershipNotFoundException) {
			$isAlreadyMemberOfCircle = false;
		}

		$this->initialState->provideInitialState('circleIdToJoin', $invitation['circle_id']);
		$this->initialState->provideInitialState('circleNameToJoin', $circle->getName());
		$this->initialState->provideInitialState('invitationCode', $invitationCode);
		$this->initialState->provideInitialState('isAlreadyMemberOfCircle', $isAlreadyMemberOfCircle);

		return new TemplateResponse(Application::APP_ID, 'join');
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * @UserRateThrottle(limit=10, period=3600)
	 */
	#[UserRateLimit(limit: 10, period: 3600)]
	public function acceptInvitation(string $invitationCode): DataResponse {
		$joined = false;
		try {
			$invitation = $this->getInvitation($invitationCode);

			$circle = $this->circleRequest->getCircle($invitation['circle_id']);
			$userId = $this->userSession->getUser()->getUID();
			$federatedInvitedUser = $this->federatedUserService->getLocalFederatedUser($userId);
			$federatedInvitedMember = $this->federatedUserService->getFederatedMember($userId);

			try {
				$this->membershipRequest->getMembership($invitation['circle_id'], $federatedInvitedUser->getSingleId());
			} catch (MembershipNotFoundException) {
				$event = new FederatedEvent(CircleJoin::class);
				$event->setCircle($circle);
				$federatedInvitedMember->setInvitedBy($federatedInvitedUser);
				$circle->setInitiator($federatedInvitedMember);

				// fixme: implement
				$this->circleJoin->lightJoin($event);

				$joined = true;
			}

			return new DataResponse(['joined' => $joined]);
		} catch (Exception $e) {
			$this->e($e, ['circleId' => $invitation]);
			throw new OCSException($e->getMessage(), (int)$e->getCode());
		}
	}

	private function setCurrentFederatedUser(): void {
		if (!$this->configService->getAppValueBool(ConfigService::FRONTEND_ENABLED)) {
			throw new FrontendException('frontend disabled');
		}

		$user = $this->userSession->getUser();
		$this->federatedUserService->setLocalCurrentUser($user);
	}

	/**
	 * @param string $invitationCode
	 * @return array{circle_id: string, created_by: string}
	 */
	private function getInvitation(string $invitationCode): array {
		$invitationCode = str_replace('-', '', $invitationCode);

		$qb = $this->connection->getQueryBuilder();
		$row = $qb->select('circle_id', 'created_by')
			->from('contacts_circle_invitations')
			->where($qb->expr()->eq('invitation_code', $qb->createNamedParameter($invitationCode)))
			->executeQuery()
			->fetch();

		if (empty($row)) {
			throw new \OutOfBoundsException('Invitation code not found');
		}

		return $row;
	}
}
