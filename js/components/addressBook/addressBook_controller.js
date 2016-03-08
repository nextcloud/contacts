app.controller('addressbookCtrl', ['$scope', 'AddressBookService', function($scope, AddressBookService) {
	var ctrl = this;

	ctrl.urlBase = window.location.protocol + '//' + window.location.host;
	ctrl.showUrl = false;

	ctrl.toggleShowUrl = function() {
		ctrl.showUrl = !ctrl.showUrl;
	};

	ctrl.toggleSharesEditor = function(addressBook) {
		addressBook.editingShares = !addressBook.editingShares;
		addressBook.selectedSharee = null;
	};

	/* From Calendar-Rework - js/app/controllers/calendarlistcontroller.js */
	ctrl.findSharee = function (val, addressBook) {
		return $.get(
				OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees',
				{
					format: 'json',
					search: val.trim(),
					perPage: 200,
					itemType: 'principals'
				}
		).then(function(result) {
			// Todo - filter out current user, existing sharees
			var users   = result.ocs.data.exact.users.concat(result.ocs.data.users);
			var groups  = result.ocs.data.exact.groups.concat(result.ocs.data.groups);

			var userShares = addressBook.sharedWith.users;
			var groupShares = addressBook.sharedWith.groups;
			var userSharesLength = userShares.length;
			var groupSharesLength = groupShares.length;
			var i, j;

			// Filter out current user
			var usersLength = users.length;
			for (i = 0 ; i < usersLength; i++) {
				if (users[i].value.shareWith === OC.currentUser) {
					users.splice(i, 1);
					break;
				}
			}

			// Now filter out all sharees that are already shared with
			for (i = 0; i < userSharesLength; i++) {
				var share = userShares[i];
				usersLength = users.length;
				for (j = 0; j < usersLength; j++) {
					if (users[j].value.shareWith === share.id) {
						users.splice(j, 1);
						break;
					}
				}
			}

			// Combine users and groups
			users = users.map(function(item){
				return {
					display: item.value.shareWith,
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item){
				return {
					display: item.value.shareWith + ' (group)',
					type: OC.Share.SHARE_TYPE_GROUP,
					identifier: item.value.shareWith
				};
			});

			return groups.concat(users);
		});
	};

	ctrl.onSelectSharee = function (item, model, label, addressBook) {
		ctrl.addressBook.selectedSharee = null;
		AddressBookService.share(addressBook, item.type, item.identifier, false, false).then(function() {
			$scope.$apply();
		});

	};

	ctrl.updateExistingUserShare = function(addressBook, userId, writable) {
		AddressBookService.share(addressBook, OC.Share.SHARE_TYPE_USER, userId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.updateExistingGroupShare = function(addressBook, groupId, writable) {
		AddressBookService.share(addressBook, OC.Share.SHARE_TYPE_GROUP, groupId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromUser = function(addressBook, userId) {
		AddressBookService.unshare(addressBook, OC.Share.SHARE_TYPE_USER, userId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromGroup = function(addressBook, groupId) {
		AddressBookService.unshare(addressBook, OC.Share.SHARE_TYPE_GROUP, groupId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.deleteAddressBook = function(addressBook) {
		AddressBookService.delete(addressBook).then(function() {
			$scope.$apply();
		});
	};

}]);
