<?php

/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// OCM: the path to the invite accept dialog
// TODO read from config
$inviteAcceptDialogPath = '/ocm/invite-accept-dialog';

return [
	'routes' => [
		['name' => 'contacts#direct', 'url' => '/direct/contact/{contact}', 'verb' => 'GET'],
		['name' => 'contacts#directcircle', 'url' => '/direct/circle/{singleId}', 'verb' => 'GET'],

		['name' => 'federated_invites#get_invites', 'url' => '/ocm/invitations', 'verb' => 'GET'],
		['name' => 'federated_invites#create_invite', 'url' => '/ocm/invitations', 'verb' => 'POST'],
		['name' => 'federated_invites#invite_accepted', 'url' => '/ocm/invitations/{token}/accept', 'verb' => 'PATCH'],
		['name' => 'federated_invites#invite_accept_dialog', 'url' => $inviteAcceptDialogPath, 'verb' => 'GET'],

		['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
		['name' => 'page#index', 'url' => '/{group}', 'verb' => 'GET', 'postfix' => 'group'],
		['name' => 'page#index', 'url' => '/{group}/{contact}', 'verb' => 'GET', 'postfix' => 'group.contact'],
		['name' => 'social_api#update_contact',  'url' => '/api/v1/social/avatar/{network}/{addressbookId}/{contactId}', 'verb' => 'PUT'],
		['name' => 'social_api#set_app_config',	 'url' => '/api/v1/social/config/global/{key}', 'verb' => 'PUT'],
		['name' => 'social_api#set_user_config', 'url' => '/api/v1/social/config/user/{key}', 'verb' => 'PUT'],
		['name' => 'social_api#get_user_config', 'url' => '/api/v1/social/config/user/{key}', 'verb' => 'GET'],
	]
];
