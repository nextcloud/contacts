angular.module('contactsApp')
.controller('addressbookCtrl', function($scope, AddressBookService) {
	var ctrl = this;

	ctrl.t = {
		download: t('contacts', 'Download'),
		copyURL: t('contacts', 'Copy link'),
		clickToCopy: t('contacts', 'Click to copy the link to your clipboard'),
		shareAddressbook: t('contacts', 'Toggle sharing'),
		deleteAddressbook: t('contacts', 'Delete'),
		renameAddressbook: t('contacts', 'Rename'),
		shareInputPlaceHolder: t('contacts', 'Share with users or groups'),
		delete: t('contacts', 'Delete'),
		canEdit: t('contacts', 'can edit'),
		close: t('contacts', 'Close'),
		enabled: t('contacts', 'Enabled'),
		disabled: t('contacts', 'Disabled')
	};

	ctrl.editing = false;
	ctrl.enabled = ctrl.addressBook.enabled;

	ctrl.tooltipIsOpen = false;
	ctrl.tooltipTitle = ctrl.t.clickToCopy;
	ctrl.showInputUrl = false;

	ctrl.clipboardSuccess = function() {
		ctrl.tooltipIsOpen = true;
		ctrl.tooltipTitle = t('core', 'Copied!');
		_.delay(function() {
			ctrl.tooltipIsOpen = false;
			ctrl.tooltipTitle = ctrl.t.clickToCopy;
		}, 3000);
	};

	ctrl.clipboardError = function() {
		ctrl.showInputUrl = true;
		if (/iPhone|iPad/i.test(navigator.userAgent)) {
			ctrl.InputUrlTooltip = t('core', 'Not supported!');
		} else if (/Mac/i.test(navigator.userAgent)) {
			ctrl.InputUrlTooltip = t('core', 'Press ⌘-C to copy.');
		} else {
			ctrl.InputUrlTooltip = t('core', 'Press Ctrl-C to copy.');
		}
		$('#addressBookUrl_'+ctrl.addressBook.ctag).select();
	};

	ctrl.renameAddressBook = function() {
		AddressBookService.rename(ctrl.addressBook, ctrl.addressBook.displayName);
		ctrl.editing = false;
	};

	ctrl.edit = function() {
		ctrl.editing = true;
	};

	ctrl.closeMenus = function() {
		$scope.$parent.ctrl.openedMenu = false;
	};

	ctrl.openMenu = function(index) {
		ctrl.closeMenus();
		$scope.$parent.ctrl.openedMenu = index;
	};

	ctrl.toggleMenu = function(index) {
		if ($scope.$parent.ctrl.openedMenu === index) {
			ctrl.closeMenus();
		} else {
			ctrl.openMenu(index);
		}
	};

	ctrl.toggleSharesEditor = function() {
		ctrl.editingShares = !ctrl.editingShares;
		ctrl.selectedSharee = null;
	};

	/* From Calendar-Rework - js/app/controllers/calendarlistcontroller.js */
	ctrl.findSharee = function (val) {
		return $.get(
			OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees',
			{
				format: 'json',
				search: val.trim(),
				perPage: 200,
				itemType: 'principals'
			}
		).then(function(result) {
			var users   = result.ocs.data.exact.users.concat(result.ocs.data.users);
			var groups  = result.ocs.data.exact.groups.concat(result.ocs.data.groups);

			var userShares = ctrl.addressBook.sharedWith.users;
			var userSharesLength = userShares.length;

			var groupsShares = ctrl.addressBook.sharedWith.groups;
			var groupsSharesLength = groupsShares.length;
			var i, j;

			// Filter out current user
			for (i = 0 ; i < users.length; i++) {
				if (users[i].value.shareWith === OC.currentUser) {
					users.splice(i, 1);
					break;
				}
			}

			// Now filter out all sharees that are already shared with
			for (i = 0; i < userSharesLength; i++) {
				var shareUser = userShares[i];
				for (j = 0; j < users.length; j++) {
					if (users[j].value.shareWith === shareUser.id) {
						users.splice(j, 1);
						break;
					}
				}
			}

			// Now filter out all groups that are already shared with
			for (i = 0; i < groupsSharesLength; i++) {
				var sharedGroup = groupsShares[i];
				for (j = 0; j < groups.length; j++) {
					if (groups[j].value.shareWith === sharedGroup.id) {
						groups.splice(j, 1);
						break;
					}
				}
			}

			// Combine users and groups
			users = users.map(function(item) {
				return {
					display: _.escape(item.value.shareWith),
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item) {
				return {
					display: _.escape(item.value.shareWith) + ' (group)',
					type: OC.Share.SHARE_TYPE_GROUP,
					identifier: item.value.shareWith
				};
			});

			return groups.concat(users);
		});
	};

	ctrl.onSelectSharee = function (item) {
		// Prevent settings to slide down
		$('#app-settings-header > button').data('apps-slide-toggle', false);
		_.delay(function() {
			$('#app-settings-header > button').data('apps-slide-toggle', '#app-settings-content');
		}, 500);

		ctrl.selectedSharee = null;
		AddressBookService.share(ctrl.addressBook, item.type, item.identifier, false, false).then(function() {
			$scope.$apply();
		});

	};

	ctrl.updateExistingUserShare = function(userId, writable) {
		AddressBookService.share(ctrl.addressBook, OC.Share.SHARE_TYPE_USER, userId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.updateExistingGroupShare = function(groupId, writable) {
		AddressBookService.share(ctrl.addressBook, OC.Share.SHARE_TYPE_GROUP, groupId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromUser = function(userId) {
		AddressBookService.unshare(ctrl.addressBook, OC.Share.SHARE_TYPE_USER, userId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromGroup = function(groupId) {
		AddressBookService.unshare(ctrl.addressBook, OC.Share.SHARE_TYPE_GROUP, groupId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.deleteAddressBook = function() {
		AddressBookService.delete(ctrl.addressBook).then(function() {
			$scope.$apply();
		});
	};

	ctrl.toggleState = function() {
		AddressBookService.toggleState(ctrl.addressBook).then(function(addressBook) {
			ctrl.enabled = addressBook.enabled;
			$scope.$apply();
		});
	};

});
