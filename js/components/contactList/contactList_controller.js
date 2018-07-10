angular.module('contactsApp')
.controller('contactlistCtrl', function($scope, $filter, $route, $routeParams, $timeout, AddressBookService, ContactService, SortByService, vCardPropertiesService, SearchService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;

	ctrl.filteredContacts = []; // the displayed contacts list
	ctrl.searchTerm = '';
	ctrl.show = true;
	ctrl.invalid = false;
	ctrl.limitTo = 25;

	ctrl.sortBy = SortByService.getSortBy();

	ctrl.t = {
		emptySearch : t('contacts', 'No search result for {query}', {query: ctrl.searchTerm})
	};

	ctrl.resetLimitTo = function () {
		ctrl.limitTo = 25;
		clearInterval(ctrl.intervalId);
		ctrl.intervalId = setInterval(
			function () {
				if (!ctrl.loading && ctrl.contactList && ctrl.contactList.length > ctrl.limitTo) {
					ctrl.limitTo += 25;
					$scope.$apply();
				}
			}, 300);
	};

	$scope.query = function(contact) {
		return contact.matches(SearchService.getSearchTerm());
	};

	SortByService.subscribe(function(newValue) {
		ctrl.sortBy = newValue;
	});

	SearchService.registerObserverCallback(function(ev) {
		if (ev.event === 'submitSearch') {
			var uid = !_.isEmpty(ctrl.filteredContacts) ? ctrl.filteredContacts[0].uid() : undefined;
			ctrl.setSelectedId(uid);
			$scope.$apply();
		}
		if (ev.event === 'changeSearch') {
			ctrl.resetLimitTo();
			ctrl.searchTerm = ev.searchTerm;
			ctrl.t.emptySearch = t('contacts',
								   'No search result for {query}',
								   {query: ctrl.searchTerm}
								  );
			$scope.$apply();
		}
	});

	ctrl.loading = true;

	ContactService.registerObserverCallback(function(ev) {
		/* after import at first refresh the contactList */
		if (ev.event === 'importend') {
			$scope.$apply(function() {
				ctrl.contactList = ev.contacts;
			});
		}
		/* update route parameters */
		$timeout(function() {
			$scope.$apply(function() {
				switch(ev.event) {
				case 'delete':
					ctrl.selectNearestContact(ev.uid);
					break;
				case 'create':
					$route.updateParams({
						gid: $routeParams.gid,
						uid: ev.uid
					});
					break;
				case 'importend':
					/* after import select 'All contacts' group and first contact */
					$route.updateParams({
						gid: t('contacts', 'All contacts'),
						uid: ctrl.filteredContacts.length !== 0 ? ctrl.filteredContacts[0].uid() : undefined
					});
					return;
				case 'getFullContacts' || 'update':
					break;
				default:
					// unknown event -> leave callback without action
					return;
				}
				ctrl.contactList = ev.contacts;
			});
		});
	});

	AddressBookService.registerObserverCallback(function(ev) {
		$timeout(function() {
			$scope.$apply(function() {
				switch (ev.event) {
				case 'delete':
				case 'disable':
					ctrl.loading = true;
					ContactService.removeContactsFromAddressbook(ev.addressBook, function() {
						ContactService.getAll().then(function(contacts) {
							ctrl.contactList = contacts;
							ctrl.loading = false;
							// Only change contact if the selectd one is not in the list anymore
							if(ctrl.contactList.findIndex(function(contact) {
								return contact.uid() === ctrl.getSelectedId();
							}) === -1) {
								ctrl.selectNearestContact(ctrl.getSelectedId());
							}
						});
					});
					break;
				case 'enable':
					ctrl.loading = true;
					ContactService.appendContactsFromAddressbook(ev.addressBook, function() {
						ContactService.getAll().then(function(contacts) {
							ctrl.contactList = contacts;
							ctrl.loading = false;
						});
					});
					break;
				default:
						// unknown event -> leave callback without action
					return;

				}
			});
		});
	});

	// Get contacts
	ContactService.getAll().then(function(contacts) {
		if(contacts.length>0) {
			$scope.$apply(function() {
				ctrl.contactList = contacts;
			});
		} else {
			ctrl.loading = false;
		}
	});

	var getVisibleContacts = function() {
		var scrolled = $('.app-content-list').scrollTop();
		var elHeight = $('.contacts-list').children().outerHeight(true);
		var listHeight = $('.app-content-list').height();

		var topContact = Math.round(scrolled/elHeight);
		var contactsCount = Math.round(listHeight/elHeight);

		return ctrl.filteredContacts.slice(topContact-1, topContact+contactsCount+1);
	};

	var timeoutId = null;
	document.querySelector('.app-content-list').addEventListener('scroll', function () {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(function () {
			var contacts = getVisibleContacts();
			ContactService.getFullContacts(contacts);
		}, 250);
	});

	// Wait for ctrl.filteredContacts to be updated, load the contact requested in the URL if any, and
	// load full details for the probably initially visible contacts.
	// Then kill the watch.
	var unbindListWatch = $scope.$watch('ctrl.filteredContacts', function() {
		if(ctrl.filteredContacts && ctrl.filteredContacts.length > 0) {
			// Check if a specific uid is requested
			if($routeParams.uid && $routeParams.gid) {
				ctrl.filteredContacts.forEach(function(contact) {
					if(contact.uid() === $routeParams.uid) {
						ctrl.setSelectedId($routeParams.uid);
						ctrl.loading = false;
					}
				});
			}
			// No contact previously loaded, let's load the first of the list if not in mobile mode
			if(ctrl.loading && $(window).width() > 768) {
				ctrl.setSelectedId(ctrl.filteredContacts[0].uid());
			}
			// Get full data for the first 20 contacts of the list
			ContactService.getFullContacts(ctrl.filteredContacts.slice(0, 20));
			ctrl.loading = false;
			unbindListWatch();
		}
	});

	$scope.$watch('ctrl.routeParams.uid', function(newValue, oldValue) {
		// Used for mobile view to clear the url
		if(typeof oldValue != 'undefined' && typeof newValue == 'undefined' && $(window).width() <= 768) {
			// no contact selected
			ctrl.show = true;
			return;
		}
		if(newValue === undefined) {
			// we might have to wait until ng-repeat filled the contactList
			if(ctrl.filteredContacts && ctrl.filteredContacts.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.filteredContacts[0].uid()
				});
			} else {
				// watch for next contactList update
				var unbindWatch = $scope.$watch('ctrl.filteredContacts', function() {
					if(ctrl.filteredContacts && ctrl.filteredContacts.length > 0) {
						$route.updateParams({
							gid: $routeParams.gid,
							uid: ctrl.filteredContacts[0].uid()
						});
					}
					unbindWatch(); // unbind as we only want one update
				});
			}
		} else {
			// displaying contact details
			ctrl.show = false;
		}
	});

	$scope.$watch('ctrl.routeParams.gid', function() {
		// we might have to wait until ng-repeat filled the contactList
		ctrl.filteredContacts = [];
		ctrl.resetLimitTo();
		// not in mobile mode
		if($(window).width() > 768) {
			// watch for next contactList update
			var unbindWatch = $scope.$watch('ctrl.filteredContacts', function() {
				if(ctrl.filteredContacts && ctrl.filteredContacts.length > 0) {
					$route.updateParams({
						gid: $routeParams.gid,
						uid: $routeParams.uid || ctrl.filteredContacts[0].uid()
					});
				}
				unbindWatch(); // unbind as we only want one update
			});
		}
	});

	// Watch if we have an invalid contact
	$scope.$watch('ctrl.filteredContacts[0].displayName()', function(displayName) {
		ctrl.invalid = (displayName === '');
	});

	ctrl.hasContacts = function () {
		if (!ctrl.contactList) {
			return false;
		}
		return ctrl.contactList.length > 0;
	};

	ctrl.setSelectedId = function (contactId) {
		$route.updateParams({
			uid: contactId
		});
	};

	ctrl.getSelectedId = function() {
		return $routeParams.uid;
	};

	ctrl.selectNearestContact = function(contactId) {
		if (ctrl.filteredContacts.length === 1) {
			$route.updateParams({
				gid: t('contacts', 'All contacts'),
				uid: ctrl.filteredContacts.length !== 0 ? ctrl.filteredContacts[0].uid() : undefined
			});
		} else {
			for (var i = 0, length = ctrl.filteredContacts.length; i < length; i++) {
				// Get nearest contact
				if (ctrl.filteredContacts[i].uid() === contactId) {
					$route.updateParams({
						gid: $routeParams.gid,
						uid: (ctrl.filteredContacts[i+1]) ? ctrl.filteredContacts[i+1].uid() : ctrl.filteredContacts[i-1].uid()
					});
					break;
				}
			}
		}
	};

});
