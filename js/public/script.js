/**
 * ownCloud - contacts
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hendrik Leppelsack <hendrik@leppelsack.de>
 * @copyright Hendrik Leppelsack 2015
 */

var app = angular.module('contactsApp', ['uuid4', 'angular-cache', 'ngRoute', 'ui.bootstrap', 'ui.select', 'ngSanitize']);

app.config(['$routeProvider', function($routeProvider) {

	$routeProvider.when('/:gid', {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.when('/:gid/:uid', {
		template: '<contactdetails></contactdetails>'
	});

	$routeProvider.otherwise('/' + t('contacts', 'All contacts'));

}]);

app.directive('datepicker', function() {
	return {
		restrict: 'A',
		require : 'ngModel',
		link : function (scope, element, attrs, ngModelCtrl) {
			$(function() {
				element.datepicker({
					dateFormat:'yy-mm-dd',
					minDate: null,
					maxDate: null,
					onSelect:function (date) {
						ngModelCtrl.$setViewValue(date);
						scope.$apply();
					}
				});
			});
		}
	};
});

app.directive('focusExpression', ['$timeout', function ($timeout) {
	return {
		restrict: 'A',
		link: {
			post: function postLink(scope, element, attrs) {
				scope.$watch(attrs.focusExpression, function (value) {

					if (attrs.focusExpression) {
						if (scope.$eval(attrs.focusExpression)) {
							$timeout(function () {
								if (element.is('input')) {
									element.focus();
								} else {
									element.find('input').focus();
								}
							}, 100); //need some delay to work with ng-disabled
						}
					}
				});
			}
		}
	};
}]);

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
			users = users.map(function(item) {
				return {
					display: item.value.shareWith,
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item) {
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

app.directive('addressbook', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbookCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressBook: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/addressBook.html')
	};
});

app.controller('addressbooklistCtrl', ['$scope', 'AddressBookService', 'SettingsService', function($scope, AddressBookService, SettingsService) {
	var ctrl = this;

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
	});

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName).then(function() {
				AddressBookService.getAddressBook(ctrl.newAddressBookName).then(function(addressBook) {
					ctrl.addressBooks.push(addressBook);
					$scope.$apply();
				});
			});
		}
	};
}]);

app.directive('addressbooklist', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'addressbooklistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/addressBookList.html')
	};
});

app.controller('contactCtrl', ['$route', '$routeParams', function($route, $routeParams) {
	var ctrl = this;

	ctrl.openContact = function() {
		$route.updateParams({
			gid: $routeParams.gid,
			uid: ctrl.contact.uid()});
	};
}]);

app.directive('contact', function() {
	return {
		scope: {},
		controller: 'contactCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			contact: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/contact.html')
	};
});

app.controller('contactdetailsCtrl', ['ContactService', 'AddressBookService', 'vCardPropertiesService', '$routeParams', '$scope', function(ContactService, AddressBookService, vCardPropertiesService, $routeParams, $scope) {
	var ctrl = this;

	ctrl.uid = $routeParams.uid;
	ctrl.t = {
		noContacts : t('contacts', 'No contacts in here'),
		placeholderName : t('contacts', 'Name'),
		placeholderOrg : t('contacts', 'Organization'),
		placeholderTitle : t('contacts', 'Title'),
		selectField : t('contacts', 'Add field ...')
	};

	ctrl.fieldDefinitions = vCardPropertiesService.fieldDefinitions;
	ctrl.focus = undefined;
	ctrl.field = undefined;
	$scope.addressBooks = [];
	ctrl.addressBooks = [];

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
		$scope.addressBooks = addressBooks.map(function (element) {
			return {
				id: element.displayName,
				name: element.displayName
			};
		});
		if (!_.isUndefined(ctrl.contact)) {
			$scope.addressBook = _.find($scope.addressBooks, function(book) {
				return book.id === ctrl.contact.addressBookId;
			});
		}
	});

	$scope.$watch('ctrl.uid', function(newValue, oldValue) {
		ctrl.changeContact(newValue);
	});

	ctrl.changeContact = function(uid) {
		if (typeof uid === 'undefined') {
			return;
		}
		ContactService.getById(uid).then(function(contact) {
			ctrl.contact = contact;
			ctrl.photo = ctrl.contact.photo();
			$scope.addressBook = _.find($scope.addressBooks, function(book) {
				return book.id === ctrl.contact.addressBookId;
			});
		});
	};

	ctrl.updateContact = function() {
		ContactService.update(ctrl.contact);
	};

	ctrl.deleteContact = function() {
		ContactService.delete(ctrl.contact);
	};

	ctrl.addField = function(field) {
		var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
		ctrl.contact.addProperty(field, defaultValue);
		ctrl.focus = field;
		ctrl.field = '';
	};

	ctrl.deleteField = function (field, prop) {
		ctrl.contact.removeProperty(field, prop);
		ctrl.focus = undefined;
	};

	ctrl.changeAddressBook = function (addressBook) {
		addressBook = _.find(ctrl.addressBooks, function(book) {
			return book.displayName === addressBook.id;
		});
		ContactService.moveContact(ctrl.contact, addressBook);
	};
}]);

app.directive('contactdetails', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactdetailsCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/contactDetails.html')
	};
});

app.controller('contactlistCtrl', ['$scope', '$filter', '$route', '$routeParams', 'ContactService', 'vCardPropertiesService', 'SearchService', function($scope, $filter, $route, $routeParams, ContactService, vCardPropertiesService, SearchService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;
	ctrl.t = {
		addContact : t('contacts', 'Add contact'),
		emptySearch : t('contacts', 'No search result for {ctrl.query}')
	};

	ctrl.contactList = [];
	ctrl.query = '';
	ctrl.selectedContactId = undefined;

	$scope.query = function(contact) {
		return contact.matches(SearchService.getSearchTerm());
	};

	SearchService.registerObserverCallback(function(ev) {
		if (ev.event === 'submitSearch') {
			var uid = !_.isEmpty(ctrl.contactList) ? ctrl.contactList[0].uid() : undefined;
			$route.updateParams({
				uid: uid
			});
			ctrl.selectedContactId = uid;
			$scope.$apply();
		}
		if (ev.event === 'changeSearch') {
			ctrl.query = ev.searchTerm;
			$scope.$apply();
		}
	});

	ContactService.registerObserverCallback(function(ev) {
		$scope.$apply(function() {
			if (ev.event === 'delete') {
				if (ctrl.contactList.length === 1) {
					$route.updateParams({
						gid: $routeParams.gid,
						uid: undefined
					});
				} else {
					for (var i = 0, length = ctrl.contactList.length; i < length; i++) {
						if (ctrl.contactList[i].uid() === ev.uid) {
							$route.updateParams({
								gid: $routeParams.gid,
								uid: (ctrl.contactList[i+1]) ? ctrl.contactList[i+1].uid() : ctrl.contactList[i-1].uid()
							});
							break;
						}
					}
				}
			}
			else if (ev.event === 'create') {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ev.uid
				});
			}
			ctrl.contacts = ev.contacts;
		});
	});

	ContactService.getAll().then(function(contacts) {
		$scope.$apply(function() {
			ctrl.contacts = contacts;
		});
	});

	$scope.$watch('ctrl.routeParams.uid', function(newValue) {
		if(newValue === undefined) {
			// we might have to wait until ng-repeat filled the contactList
			if(ctrl.contactList && ctrl.contactList.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.contactList[0].uid()
				});
			} else {
				// watch for next contactList update
				var unbindWatch = $scope.$watch('ctrl.contactList', function() {
					if(ctrl.contactList && ctrl.contactList.length > 0) {
						$route.updateParams({
							gid: $routeParams.gid,
							uid: ctrl.contactList[0].uid()
						});
					}
					unbindWatch(); // unbind as we only want one update
				});
			}
		}
	});

	$scope.$watch('ctrl.routeParams.gid', function() {
		// we might have to wait until ng-repeat filled the contactList
		ctrl.contactList = [];
		// watch for next contactList update
		var unbindWatch = $scope.$watch('ctrl.contactList', function() {
			if(ctrl.contactList && ctrl.contactList.length > 0) {
				$route.updateParams({
					gid: $routeParams.gid,
					uid: ctrl.contactList[0].uid()
				});
			}
			unbindWatch(); // unbind as we only want one update
		});
	});

	ctrl.createContact = function() {
		ContactService.create().then(function(contact) {
			['tel', 'adr', 'email'].forEach(function(field) {
				var defaultValue = vCardPropertiesService.getMeta(field).defaultValue || {value: ''};
				contact.addProperty(field, defaultValue);
			} );
			if ($routeParams.gid !== t('contacts', 'All contacts')) {
				contact.categories($routeParams.gid);
			} else {
				contact.categories('');
			}
			$('#details-fullName').focus();
		});
	};

	ctrl.hasContacts = function () {
		if (!ctrl.contacts) {
			return false;
		}
		return ctrl.contacts.length > 0;
	};

	$scope.selectedContactId = $routeParams.uid;
	$scope.setSelected = function (selectedContactId) {
		$scope.selectedContactId = selectedContactId;
	};

}]);

app.directive('contactlist', function() {
	return {
		priority: 1,
		scope: {},
		controller: 'contactlistCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			addressbook: '=adrbook'
		},
		templateUrl: OC.linkTo('contacts', 'templates/contactList.html')
	};
});

app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', 'ContactService', function($templateRequest, vCardPropertiesService, ContactService) {
	var ctrl = this;

	ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
	ctrl.type = undefined;
	ctrl.t = {
		poBox : t('contacts', 'Post Office Box'),
		postalCode : t('contacts', 'Postal Code'),
		city : t('contacts', 'City'),
		state : t('contacts', 'State or province'),
		country : t('contacts', 'Country'),
		address: t('contacts', 'Address'),
		newGroup: t('contacts', '(new group)')
	};

	ctrl.availableOptions = ctrl.meta.options || [];
	if (!_.isUndefined(ctrl.data) && !_.isUndefined(ctrl.data.meta) && !_.isUndefined(ctrl.data.meta.type)) {
		ctrl.type = ctrl.data.meta.type[0];
		if (!ctrl.availableOptions.some(function(e) { return e.id === ctrl.data.meta.type[0]; } )) {
			ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.data.meta.type[0], name: ctrl.data.meta.type[0]}]);
		}
	}
	ctrl.availableGroups = [];

	ContactService.getGroups().then(function(groups) {
		ctrl.availableGroups = _.unique(groups);
	});

	ctrl.changeType = function (val) {
		ctrl.data.meta = ctrl.data.meta || {};
		ctrl.data.meta.type = ctrl.data.meta.type || [];
		ctrl.data.meta.type[0] = val;
		ctrl.model.updateContact();
	};

	ctrl.getTemplate = function() {
		var templateUrl = OC.linkTo('contacts', 'templates/detailItems/' + ctrl.meta.template + '.html');
		return $templateRequest(templateUrl);
	};

	ctrl.deleteField = function () {
		ctrl.model.deleteField(ctrl.name, ctrl.data);
		ctrl.model.updateContact();
	};
}]);

app.directive('detailsitem', ['$compile', function($compile) {
	return {
		scope: {},
		controller: 'detailsItemCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			name: '=',
			data: '=',
			model: '='
		},
		link: function(scope, element, attrs, ctrl) {
			ctrl.getTemplate().then(function(html) {
				var template = angular.element(html);
				element.append(template);
				$compile(template)(scope);
			});
		}
	};
}]);

app.controller('groupCtrl', function() {
	var ctrl = this;
});

app.directive('group', function() {
	return {
		restrict: 'A', // has to be an attribute to work with core css
		scope: {},
		controller: 'groupCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			group: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/group.html')
	};
});

app.controller('grouplistCtrl', ['$scope', 'ContactService', 'SearchService', '$routeParams', function($scope, ContactService, SearchService, $routeParams) {

	$scope.groups = [t('contacts', 'All contacts'), t('contacts', 'Not grouped')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = _.unique([t('contacts', 'All contacts'), t('contacts', 'Not grouped')].concat(groups));
	});

	$scope.selectedGroup = $routeParams.gid;
	$scope.setSelected = function (selectedGroup) {
		SearchService.cleanSearch();
		$scope.selectedGroup = selectedGroup;
	};
}]);

app.directive('grouplist', function() {
	return {
		restrict: 'EA', // has to be an attribute to work with core css
		scope: {},
		controller: 'grouplistCtrl',
		controllerAs: 'ctrl',
		bindToController: {},
		templateUrl: OC.linkTo('contacts', 'templates/groupList.html')
	};
});

app.directive('groupModel', ['$filter', function($filter) {
	return{
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attr, ngModel) {
			ngModel.$formatters.push(function(value) {
				if (value.trim().length === 0) {
					return [];
				}
				return value.split(',');
			});
			ngModel.$parsers.push(function(value) {
				return value.join(',');
			});
		}
	};
}]);

app.directive('telModel', function() {
	return{
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attr, ngModel) {
			ngModel.$formatters.push(function(value) {
				return value;
			});
			ngModel.$parsers.push(function(value) {
				return value;
			});
		}
	};
});

app.factory('AddressBook', function()
{
	return function AddressBook(data) {
		angular.extend(this, {

			displayName: '',
			contacts: [],
			groups: data.data.props.groups,

			getContact: function(uid) {
				for(var i in this.contacts) {
					if(this.contacts[i].uid() === uid) {
						return this.contacts[i];
					}
				}
				return undefined;
			},

			sharedWith: {
				users: [],
				groups: []
			}

		});
		angular.extend(this, data);
		angular.extend(this, {
			owner: data.url.split('/').slice(-3, -2)[0]
		});

		var shares = this.data.props.invite;
		if (typeof shares !== 'undefined') {
			for (var j = 0; j < shares.length; j++) {
				var href = shares[j].href;
				if (href.length === 0) {
					continue;
				}
				var access = shares[j].access;
				if (access.length === 0) {
					continue;
				}

				var readWrite = (typeof access.readWrite !== 'undefined');

				if (href.startsWith('principal:principals/users/')) {
					this.sharedWith.users.push({
						id: href.substr(27),
						displayname: href.substr(27),
						writable: readWrite
					});
				} else if (href.startsWith('principal:principals/groups/')) {
					this.sharedWith.groups.push({
						id: href.substr(28),
						displayname: href.substr(28),
						writable: readWrite
					});
				}
			}
		}

		//var owner = this.data.props.owner;
		//if (typeof owner !== 'undefined' && owner.length !== 0) {
		//	owner = owner.trim();
		//	if (owner.startsWith('/remote.php/dav/principals/users/')) {
		//		this._properties.owner = owner.substr(33);
		//	}
		//}

	};
});

app.factory('Contact', ['$filter', function($filter) {
	return function Contact(addressBook, vCard) {
		angular.extend(this, {

			data: {},
			props: {},

			addressBookId: addressBook.displayName,

			uid: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('uid', { value: value });
				} else {
					// getter
					return this.getProperty('uid').value;
				}
			},

			fullName: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('fn', { value: value });
				} else {
					// getter
					var property = this.getProperty('fn');
					if(property) {
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			title: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('title', { value: value });
				} else {
					// getter
					var property = this.getProperty('title');
					if(property) {
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			org: function(value) {
				var property = this.getProperty('org');
				if (angular.isDefined(value)) {
					var val = value;
					// setter
					if(property && Array.isArray(property.value)) {
						val = property.value;
						val[0] = value;
					}
					return this.setProperty('org', { value: val });
				} else {
					// getter
					if(property) {
						if (Array.isArray(property.value)) {
							return property.value[0];
						}
						return property.value;
					} else {
						return undefined;
					}
				}
			},

			email: function() {
				// getter
				var property = this.getProperty('email');
				if(property) {
					return property.value;
				} else {
					return undefined;
				}
			},

			photo: function() {
				var property = this.getProperty('photo');
				if(property) {
					return property.value;
				} else {
					return undefined;
				}
			},

			categories: function(value) {
				if (angular.isDefined(value)) {
					// setter
					return this.setProperty('categories', { value: value });
				} else {
					// getter
					var property = this.getProperty('categories');
					if(property && property.value.length > 0) {
						return property.value.split(',');
					} else {
						return [];
					}
				}
			},

			getProperty: function(name) {
				if (this.props[name]) {
					return this.props[name][0];
				} else {
					return undefined;
				}
			},
			addProperty: function(name, data) {
				data = angular.copy(data);
				if(!this.props[name]) {
					this.props[name] = [];
				}
				var idx = this.props[name].length;
				this.props[name][idx] = data;

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
				return idx;
			},
			setProperty: function(name, data) {
				if(!this.props[name]) {
					this.props[name] = [];
				}
				this.props[name][0] = data;

				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},
			removeProperty: function (name, prop) {
				angular.copy(_.without(this.props[name], prop), this.props[name]);
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},
			setETag: function(etag) {
				this.data.etag = etag;
			},
			setUrl: function(addressBook, uid) {
				this.data.url = addressBook.url + uid + '.vcf';
			},

			syncVCard: function() {
				// keep vCard in sync
				this.data.addressData = $filter('JSON2vCard')(this.props);
			},

			matches: function(pattern) {
				if (_.isUndefined(pattern) || pattern.length === 0) {
					return true;
				}
				return this.data.addressData.toLowerCase().indexOf(pattern.toLowerCase()) !== -1;
			}

		});

		if(angular.isDefined(vCard)) {
			angular.extend(this.data, vCard);
			angular.extend(this.props, $filter('vCard2JSON')(this.data.addressData));
		} else {
			angular.extend(this.props, {
				version: [{value: '3.0'}],
				fn: [{value: ''}]
			});
			this.data.addressData = $filter('JSON2vCard')(this.props);
		}

		var property = this.getProperty('categories');
		if(!property) {
			this.categories('');
		}
	};
}]);

app.factory('AddressBookService', ['DavClient', 'DavService', 'SettingsService', 'AddressBook', 'Contact', function(DavClient, DavService, SettingsService, AddressBook, Contact) {

	var addressBooks = [];

	var loadAll = function() {
		return DavService.then(function(account) {
			addressBooks = account.addressBooks.map(function(addressBook) {
				return new AddressBook(addressBook);
			});
		});
	};

	return {
		getAll: function() {
			return loadAll().then(function() {
				return addressBooks;
			});
		},

		getGroups: function () {
			return this.getAll().then(function(addressBooks) {
				return addressBooks.map(function (element) {
					return element.groups;
				}).reduce(function(a, b) {
					return a.concat(b);
				});
			});
		},

		getEnabled: function() {
			return DavService.then(function(account) {
				return account.addressBooks.map(function(addressBook) {
					return new AddressBook(addressBook);
				});
			});
		},

		getDefaultAddressBook: function() {
			return addressBooks[0];
		},

		getAddressBook: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.getAddressBook({displayName:displayName, url:account.homeUrl}).then(function(addressBook) {
					addressBook = new AddressBook({
						url: addressBook[0].href,
						data: addressBook[0]
					});
					addressBook.displayName = displayName;
					return addressBook;
				});
			});
		},

		create: function(displayName) {
			return DavService.then(function(account) {
				return DavClient.createAddressBook({displayName:displayName, url:account.homeUrl});
			});
		},

		delete: function(addressBook) {
			return DavService.then(function(account) {
				return DavClient.deleteAddressBook(addressBook).then(function() {
					angular.copy(_.without(addressBooks, addressBook), addressBooks);
				});
			});
		},

		rename: function(addressBook, displayName) {
			return DavService.then(function(account) {
				return DavClient.renameAddressBook(addressBook, {displayName:displayName, url:account.homeUrl});
			});
		},

		get: function(displayName) {
			return this.getAll().then(function(addressBooks) {
				return addressBooks.filter(function (element) {
					return element.displayName === displayName;
				})[0];
			});
		},

		sync: function(addressBook) {
			return DavClient.syncAddressBook(addressBook);
		},

		share: function(addressBook, shareType, shareWith, writable, existingShare) {
			var xmlDoc = document.implementation.createDocument('', '', null);
			var oShare = xmlDoc.createElement('o:share');
			oShare.setAttribute('xmlns:d', 'DAV:');
			oShare.setAttribute('xmlns:o', 'http://owncloud.org/ns');
			xmlDoc.appendChild(oShare);

			var oSet = xmlDoc.createElement('o:set');
			oShare.appendChild(oSet);

			var dHref = xmlDoc.createElement('d:href');
			if (shareType === OC.Share.SHARE_TYPE_USER) {
				dHref.textContent = 'principal:principals/users/';
			} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				dHref.textContent = 'principal:principals/groups/';
			}
			dHref.textContent += shareWith;
			oSet.appendChild(dHref);

			var oSummary = xmlDoc.createElement('o:summary');
			oSummary.textContent = t('contacts', '{addressbook} shared by {owner}', {
				addressbook: addressBook.displayName,
				owner: addressBook.owner
			});
			oSet.appendChild(oSummary);

			if (writable) {
				var oRW = xmlDoc.createElement('o:read-write');
				oSet.appendChild(oRW);
			}

			var body = oShare.outerHTML;

			return DavClient.xhr.send(
				dav.request.basic({method: 'POST', data: body}),
				addressBook.url
			).then(function(response) {
				if (response.status === 200) {
					if (!existingShare) {
						if (shareType === OC.Share.SHARE_TYPE_USER) {
							addressBook.sharedWith.users.push({
								id: shareWith,
								displayname: shareWith,
								writable: writable
							});
						} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
							addressBook.sharedWith.groups.push({
								id: shareWith,
								displayname: shareWith,
								writable: writable
							});
						}
					}
				}
			});

		},

		unshare: function(addressBook, shareType, shareWith) {
			var xmlDoc = document.implementation.createDocument('', '', null);
			var oShare = xmlDoc.createElement('o:share');
			oShare.setAttribute('xmlns:d', 'DAV:');
			oShare.setAttribute('xmlns:o', 'http://owncloud.org/ns');
			xmlDoc.appendChild(oShare);

			var oRemove = xmlDoc.createElement('o:remove');
			oShare.appendChild(oRemove);

			var dHref = xmlDoc.createElement('d:href');
			if (shareType === OC.Share.SHARE_TYPE_USER) {
				dHref.textContent = 'principal:principals/users/';
			} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				dHref.textContent = 'principal:principals/groups/';
			}
			dHref.textContent += shareWith;
			oRemove.appendChild(dHref);
			var body = oShare.outerHTML;


			return DavClient.xhr.send(
				dav.request.basic({method: 'POST', data: body}),
				addressBook.url
			).then(function(response) {
				if (response.status === 200) {
					if (shareType === OC.Share.SHARE_TYPE_USER) {
						addressBook.sharedWith.users = addressBook.sharedWith.users.filter(function(user) {
							return user.id !== shareWith;
						});
					} else if (shareType === OC.Share.SHARE_TYPE_GROUP) {
						addressBook.sharedWith.groups = addressBook.sharedWith.groups.filter(function(groups) {
							return groups.id !== shareWith;
						});
					}
					//todo - remove entry from addressbook object
					return true;
				} else {
					return false;
				}
			});

		}


	};

}]);

var contacts;
app.service('ContactService', ['DavClient', 'AddressBookService', 'Contact', '$q', 'CacheFactory', 'uuid4', function(DavClient, AddressBookService, Contact, $q, CacheFactory, uuid4) {

	var cacheFilled = false;

	contacts = CacheFactory('contacts');

	var observerCallbacks = [];

	this.registerObserverCallback = function(callback) {
		observerCallbacks.push(callback);
	};

	var notifyObservers = function(eventName, uid) {
		var ev = {
			event: eventName,
			uid: uid,
			contacts: contacts.values()
		};
		angular.forEach(observerCallbacks, function(callback) {
			callback(ev);
		});
	};

	this.fillCache = function() {
		return AddressBookService.getEnabled().then(function(enabledAddressBooks) {
			var promises = [];
			enabledAddressBooks.forEach(function(addressBook) {
				promises.push(
					AddressBookService.sync(addressBook).then(function(addressBook) {
						for(var i in addressBook.objects) {
							contact = new Contact(addressBook, addressBook.objects[i]);
							contacts.put(contact.uid(), contact);
						}
					})
				);
			});
			return $q.all(promises).then(function() {
				cacheFilled = true;
			});
		});
	};

	this.getAll = function() {
		if(cacheFilled === false) {
			return this.fillCache().then(function() {
				return contacts.values();
			});
		} else {
			return $q.when(contacts.values());
		}
	};

	this.getGroups = function () {
		return this.getAll().then(function(contacts) {
			return _.uniq(contacts.map(function (element) {
				return element.categories();
			}).reduce(function(a, b) {
				return a.concat(b);
			}, []).sort(), true);
		});
	};

	this.getById = function(uid) {
		if(cacheFilled === false) {
			return this.fillCache().then(function() {
				return contacts.get(uid);
			});
		} else {
			return $q.when(contacts.get(uid));
		}
	};

	this.create = function(newContact, addressBook) {
		addressBook = addressBook || AddressBookService.getDefaultAddressBook();
		newContact = newContact || new Contact(addressBook);
		var newUid = uuid4.generate();
		newContact.uid(newUid);
		newContact.setUrl(addressBook, newUid);
		newContact.addressBookId = addressBook.displayName;

		return DavClient.createCard(
			addressBook,
			{
				data: newContact.data.addressData,
				filename: newUid + '.vcf'
			}
		).then(function(xhr) {
			newContact.setETag(xhr.getResponseHeader('ETag'));
			contacts.put(newUid, newContact);
			notifyObservers('create', newUid);
			return newContact;
		}).catch(function(e) {
			console.log("Couldn't create", e);
		});
	};

	this.moveContact = function (contact, addressbook) {
		if (contact.addressBookId === addressbook.displayName) {
			return;
		}
		contact.syncVCard();
		var clone = angular.copy(contact);

		// create the contact in the new target addressbook
		this.create(clone, addressbook);

		// delete the old one
		this.delete(contact);
	};

	this.update = function(contact) {
		contact.syncVCard();

		// update contact on server
		return DavClient.updateCard(contact.data, {json: true}).then(function(xhr) {
			var newEtag = xhr.getResponseHeader('ETag');
			contact.setETag(newEtag);
		});
	};

	this.delete = function(contact) {
		// delete contact from server
		return DavClient.deleteCard(contact.data).then(function(xhr) {
			contacts.remove(contact.uid());
			notifyObservers('delete', contact.uid());
		});
	};
}]);

app.service('DavClient', function() {
	var xhr = new dav.transport.Basic(
		new dav.Credentials()
	);
	return new dav.Client(xhr);
});
app.service('DavService', ['DavClient', function(DavClient) {
	return DavClient.createAccount({
		server: OC.linkToRemoteBase('dav/addressbooks'),
		accountType: 'carddav',
		useProvidedPath: true
	});
}]);

app.service('SearchService', function() {
	var searchTerm = '';

	var observerCallbacks = [];

	this.registerObserverCallback = function(callback) {
		observerCallbacks.push(callback);
	};

	var notifyObservers = function(eventName) {
		var ev = {
			event:eventName,
			searchTerm:this.searchTerm
		};
		angular.forEach(observerCallbacks, function(callback) {
			callback(ev);
		});
	};

	var SearchProxy = {
		attach: function(search) {
			search.setFilter('contacts', this.filterProxy);
		},
		filterProxy: function(query) {
			searchTerm = query;
			notifyObservers('changeSearch');
		}
	};

	this.getSearchTerm = function() {
		return searchTerm;
	};

	this.cleanSearch = function() {
		if (!_.isUndefined($('.searchbox'))) {
			$('.searchbox')[0].reset();
		}
		searchTerm = '';
	};

	if (!_.isUndefined(OC.Plugins)) {
		OC.Plugins.register('OCA.Search', SearchProxy);
	}

	if (!_.isUndefined($('.searchbox'))) {
		$('.searchbox')[0].addEventListener('keypress', function(e) {
			if(e.keyCode === 13) {
				notifyObservers('submitSearch');
			}
		});
	}
});

app.service('SettingsService', function() {
	var settings = {
		addressBooks: [
			'testAddr'
		]
	};

	this.set = function(key, value) {
		settings[key] = value;
	};

	this.get = function(key) {
		return settings[key];
	};

	this.getAll = function() {
		return settings;
	};
});

app.service('vCardPropertiesService', function() {
	/**
	 * map vCard attributes to internal attributes
	 *
	 * propName: {
	 * 		multiple: [Boolean], // is this prop allowed more than once? (default = false)
	 * 		readableName: [String], // internationalized readable name of prop
	 * 		template: [String], // template name found in /templates/detailItems
	 * 		[...] // optional additional information which might get used by the template
	 * }
	 */
	this.vCardMeta = {
		nickname: {
			readableName: t('contacts', 'Nickname'),
			template: 'text'
		},
		note: {
			readableName: t('contacts', 'Notes'),
			template: 'textarea'
		},
		url: {
			multiple: true,
			readableName: t('contacts', 'Website'),
			template: 'url'
		},
		cloud: {
			multiple: true,
			readableName: t('contacts', 'Federated Cloud ID'),
			template: 'text',
			defaultValue: {
				value:[''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]		},
		adr: {
			multiple: true,
			readableName: t('contacts', 'Address'),
			template: 'adr',
			defaultValue: {
				value:['', '', '', '', '', '', ''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		categories: {
			readableName: t('contacts', 'Groups'),
			template: 'groups'
		},
		bday: {
			readableName: t('contacts', 'Birthday'),
			template: 'date'
		},
		email: {
			multiple: true,
			readableName: t('contacts', 'Email'),
			template: 'text',
			defaultValue: {
				value:'',
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		impp: {
			multiple: true,
			readableName: t('contacts', 'Instant messaging'),
			template: 'text',
			defaultValue: {
				value:[''],
				meta:{type:['HOME']}
			},
			options: [
				{id: 'HOME', name: t('contacts', 'Home')},
				{id: 'WORK', name: t('contacts', 'Work')},
				{id: 'OTHER', name: t('contacts', 'Other')}
			]
		},
		tel: {
			multiple: true,
			readableName: t('contacts', 'Phone'),
			template: 'tel',
			defaultValue: {
				value:[''],
				meta:{type:['HOME,VOICE']}
			},
			options: [
				{id: 'HOME,VOICE', name: t('contacts', 'Home')},
				{id: 'WORK,VOICE', name: t('contacts', 'Work')},
				{id: 'CELL', name: t('contacts', 'Mobile')},
				{id: 'FAX', name: t('contacts', 'Fax')},
				{id: 'HOME,FAX', name: t('contacts', 'Fax home')},
				{id: 'WORK,FAX', name: t('contacts', 'Fax work')},
				{id: 'PAGER', name: t('contacts', 'Pager')},
				{id: 'VOICE', name: t('contacts', 'Voice')}
			]
		}
	};

	this.fieldOrder = [
		'org',
		'title',
		'tel',
		'email',
		'adr',
		'impp',
		'nick',
		'bday',
		'url',
		'note',
		'categories',
		'role'
	];

	this.fieldDefinitions = [];
	for (var prop in this.vCardMeta) {
		this.fieldDefinitions.push({id: prop, name: this.vCardMeta[prop].readableName, multiple: !!this.vCardMeta[prop].multiple});
	}

	this.fallbackMeta = function(property) {
		function capitalize(string) { return string.charAt(0).toUpperCase() + string.slice(1); }
		return {
			name: 'unknown-' + property,
			readableName: capitalize(property),
			template: 'hidden',
			necessity: 'optional'
		};
	};

	this.getMeta = function(property) {
		return this.vCardMeta[property] || this.fallbackMeta(property);
	};

});

app.filter('JSON2vCard', function() {
	return function(input) {
		return vCard.generate(input);
	};
});
app.filter('contactColor', function() {
	return function(input) {
		var colors = [
				'#001f3f',
				'#0074D9',
				'#39CCCC',
				'#3D9970',
				'#2ECC40',
				'#FF851B',
				'#FF4136',
				'#85144b',
				'#F012BE',
				'#B10DC9'
			], asciiSum = 0;
		for(var i in input) {
			asciiSum += input.charCodeAt(i);
		}
		return colors[asciiSum % colors.length];
	};
});

app.filter('contactGroupFilter', function() {
	'use strict';
	return function (contacts, group) {
		if (typeof contacts === 'undefined') {
			return contacts;
		}
		if (typeof group === 'undefined' || group.toLowerCase() === t('contacts', 'All contacts').toLowerCase()) {
			return contacts;
		}
		var filter = [];
		if (contacts.length > 0) {
			for (var i = 0; i < contacts.length; i++) {
				if (group.toLowerCase() === t('contacts', 'Not grouped').toLowerCase()) {
					if (contacts[i].categories().length === 0) {
						filter.push(contacts[i]);
					}
				} else {
					if (contacts[i].categories().indexOf(group) >= 0) {
						filter.push(contacts[i]);
					}
				}
			}
		}
		return filter;
	};
});

app.filter('fieldFilter', function() {
	'use strict';
	return function (fields, contact) {
		if (typeof fields === 'undefined') {
			return fields;
		}
		if (typeof contact === 'undefined') {
			return fields;
		}
		var filter = [];
		if (fields.length > 0) {
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].multiple ) {
					filter.push(fields[i]);
					continue;
				}
				if (_.isUndefined(contact.getProperty(fields[i].id))) {
					filter.push(fields[i]);
				}
			}
		}
		return filter;
	};
});

app.filter('firstCharacter', function() {
	return function(input) {
		return input.charAt(0);
	};
});

app.filter('orderDetailItems', ['vCardPropertiesService', function(vCardPropertiesService) {
	'use strict';
	return function(items, field, reverse) {

		var filtered = [];
		angular.forEach(items, function(item) {
			filtered.push(item);
		});

		var fieldOrder = angular.copy(vCardPropertiesService.fieldOrder);
		// reverse to move custom items to the end (indexOf == -1)
		fieldOrder.reverse();

		filtered.sort(function (a, b) {
			if(fieldOrder.indexOf(a[field]) < fieldOrder.indexOf(b[field])) {
				return 1;
			}
			if(fieldOrder.indexOf(a[field]) > fieldOrder.indexOf(b[field])) {
				return -1;
			}
			return 0;
		});

		if(reverse) filtered.reverse();
		return filtered;
	};
}]);

app.filter('toArray', function() {
	return function(obj) {
		if (!(obj instanceof Object)) return obj;
		return _.map(obj, function(val, key) {
			return Object.defineProperty(val, '$key', {value: key});
		});
	};
});

app.filter('vCard2JSON', function() {
	return function(input) {
		return vCard.parse(input);
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkYXRlcGlja2VyX2RpcmVjdGl2ZS5qcyIsImZvY3VzX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rL2FkZHJlc3NCb29rX2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9vay9hZGRyZXNzQm9va19kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3QvY29udGFjdF9jb250cm9sbGVyLmpzIiwiY29udGFjdC9jb250YWN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3REZXRhaWxzL2NvbnRhY3REZXRhaWxzX2NvbnRyb2xsZXIuanMiLCJjb250YWN0RGV0YWlscy9jb250YWN0RGV0YWlsc19kaXJlY3RpdmUuanMiLCJjb250YWN0TGlzdC9jb250YWN0TGlzdF9jb250cm9sbGVyLmpzIiwiY29udGFjdExpc3QvY29udGFjdExpc3RfZGlyZWN0aXZlLmpzIiwiZGV0YWlsc0l0ZW0vZGV0YWlsc0l0ZW1fY29udHJvbGxlci5qcyIsImRldGFpbHNJdGVtL2RldGFpbHNJdGVtX2RpcmVjdGl2ZS5qcyIsImdyb3VwL2dyb3VwX2NvbnRyb2xsZXIuanMiLCJncm91cC9ncm91cF9kaXJlY3RpdmUuanMiLCJncm91cExpc3QvZ3JvdXBMaXN0X2NvbnRyb2xsZXIuanMiLCJncm91cExpc3QvZ3JvdXBMaXN0X2RpcmVjdGl2ZS5qcyIsInBhcnNlcnMvZ3JvdXBNb2RlbF9kaXJlY3RpdmUuanMiLCJwYXJzZXJzL3RlbE1vZGVsX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rX21vZGVsLmpzIiwiY29udGFjdF9tb2RlbC5qcyIsImFkZHJlc3NCb29rX3NlcnZpY2UuanMiLCJjb250YWN0X3NlcnZpY2UuanMiLCJkYXZDbGllbnRfc2VydmljZS5qcyIsImRhdl9zZXJ2aWNlLmpzIiwic2VhcmNoX3NlcnZpY2UuanMiLCJzZXR0aW5nc19zZXJ2aWNlLmpzIiwidkNhcmRQcm9wZXJ0aWVzLmpzIiwiSlNPTjJ2Q2FyZF9maWx0ZXIuanMiLCJjb250YWN0Q29sb3JfZmlsdGVyLmpzIiwiY29udGFjdEdyb3VwX2ZpbHRlci5qcyIsImZpZWxkX2ZpbHRlci5qcyIsImZpcnN0Q2hhcmFjdGVyX2ZpbHRlci5qcyIsIm9yZGVyRGV0YWlsSXRlbXNfZmlsdGVyLmpzIiwidG9BcnJheV9maWx0ZXIuanMiLCJ2Q2FyZDJKU09OX2ZpbHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztBQVVBLElBQUksTUFBTSxRQUFRLE9BQU8sZUFBZSxDQUFDLFNBQVMsaUJBQWlCLFdBQVcsZ0JBQWdCLGFBQWE7O0FBRTNHLElBQUksMEJBQU8sU0FBUyxnQkFBZ0I7O0NBRW5DLGVBQWUsS0FBSyxTQUFTO0VBQzVCLFVBQVU7OztDQUdYLGVBQWUsS0FBSyxjQUFjO0VBQ2pDLFVBQVU7OztDQUdYLGVBQWUsVUFBVSxNQUFNLEVBQUUsWUFBWTs7O0FBRzlDO0FDekJBLElBQUksVUFBVSxjQUFjLFdBQVc7Q0FDdEMsT0FBTztFQUNOLFVBQVU7RUFDVixVQUFVO0VBQ1YsT0FBTyxVQUFVLE9BQU8sU0FBUyxPQUFPLGFBQWE7R0FDcEQsRUFBRSxXQUFXO0lBQ1osUUFBUSxXQUFXO0tBQ2xCLFdBQVc7S0FDWCxTQUFTO0tBQ1QsU0FBUztLQUNULFNBQVMsVUFBVSxNQUFNO01BQ3hCLFlBQVksY0FBYztNQUMxQixNQUFNOzs7Ozs7O0FBT1o7QUNuQkEsSUFBSSxVQUFVLGdDQUFtQixVQUFVLFVBQVU7Q0FDcEQsT0FBTztFQUNOLFVBQVU7RUFDVixNQUFNO0dBQ0wsTUFBTSxTQUFTLFNBQVMsT0FBTyxTQUFTLE9BQU87SUFDOUMsTUFBTSxPQUFPLE1BQU0saUJBQWlCLFVBQVUsT0FBTzs7S0FFcEQsSUFBSSxNQUFNLGlCQUFpQjtNQUMxQixJQUFJLE1BQU0sTUFBTSxNQUFNLGtCQUFrQjtPQUN2QyxTQUFTLFlBQVk7UUFDcEIsSUFBSSxRQUFRLEdBQUcsVUFBVTtTQUN4QixRQUFRO2VBQ0Y7U0FDTixRQUFRLEtBQUssU0FBUzs7VUFFckI7Ozs7Ozs7O0FBUVY7QUN2QkEsSUFBSSxXQUFXLG9EQUFtQixTQUFTLFFBQVEsb0JBQW9CO0NBQ3RFLElBQUksT0FBTzs7Q0FFWCxLQUFLLFVBQVUsT0FBTyxTQUFTLFdBQVcsT0FBTyxPQUFPLFNBQVM7Q0FDakUsS0FBSyxVQUFVOztDQUVmLEtBQUssZ0JBQWdCLFdBQVc7RUFDL0IsS0FBSyxVQUFVLENBQUMsS0FBSzs7O0NBR3RCLEtBQUsscUJBQXFCLFNBQVMsYUFBYTtFQUMvQyxZQUFZLGdCQUFnQixDQUFDLFlBQVk7RUFDekMsWUFBWSxpQkFBaUI7Ozs7Q0FJOUIsS0FBSyxhQUFhLFVBQVUsS0FBSyxhQUFhO0VBQzdDLE9BQU8sRUFBRTtHQUNSLEdBQUcsVUFBVSwrQkFBK0I7R0FDNUM7SUFDQyxRQUFRO0lBQ1IsUUFBUSxJQUFJO0lBQ1osU0FBUztJQUNULFVBQVU7O0lBRVYsS0FBSyxTQUFTLFFBQVE7O0dBRXZCLElBQUksVUFBVSxPQUFPLElBQUksS0FBSyxNQUFNLE1BQU0sT0FBTyxPQUFPLElBQUksS0FBSztHQUNqRSxJQUFJLFVBQVUsT0FBTyxJQUFJLEtBQUssTUFBTSxPQUFPLE9BQU8sT0FBTyxJQUFJLEtBQUs7O0dBRWxFLElBQUksYUFBYSxZQUFZLFdBQVc7R0FDeEMsSUFBSSxjQUFjLFlBQVksV0FBVztHQUN6QyxJQUFJLG1CQUFtQixXQUFXO0dBQ2xDLElBQUksb0JBQW9CLFlBQVk7R0FDcEMsSUFBSSxHQUFHOzs7R0FHUCxJQUFJLGNBQWMsTUFBTTtHQUN4QixLQUFLLElBQUksSUFBSSxJQUFJLGFBQWEsS0FBSztJQUNsQyxJQUFJLE1BQU0sR0FBRyxNQUFNLGNBQWMsR0FBRyxhQUFhO0tBQ2hELE1BQU0sT0FBTyxHQUFHO0tBQ2hCOzs7OztHQUtGLEtBQUssSUFBSSxHQUFHLElBQUksa0JBQWtCLEtBQUs7SUFDdEMsSUFBSSxRQUFRLFdBQVc7SUFDdkIsY0FBYyxNQUFNO0lBQ3BCLEtBQUssSUFBSSxHQUFHLElBQUksYUFBYSxLQUFLO0tBQ2pDLElBQUksTUFBTSxHQUFHLE1BQU0sY0FBYyxNQUFNLElBQUk7TUFDMUMsTUFBTSxPQUFPLEdBQUc7TUFDaEI7Ozs7OztHQU1ILFFBQVEsTUFBTSxJQUFJLFNBQVMsTUFBTTtJQUNoQyxPQUFPO0tBQ04sU0FBUyxLQUFLLE1BQU07S0FDcEIsTUFBTSxHQUFHLE1BQU07S0FDZixZQUFZLEtBQUssTUFBTTs7OztHQUl6QixTQUFTLE9BQU8sSUFBSSxTQUFTLE1BQU07SUFDbEMsT0FBTztLQUNOLFNBQVMsS0FBSyxNQUFNLFlBQVk7S0FDaEMsTUFBTSxHQUFHLE1BQU07S0FDZixZQUFZLEtBQUssTUFBTTs7OztHQUl6QixPQUFPLE9BQU8sT0FBTzs7OztDQUl2QixLQUFLLGlCQUFpQixVQUFVLE1BQU0sT0FBTyxPQUFPLGFBQWE7RUFDaEUsS0FBSyxZQUFZLGlCQUFpQjtFQUNsQyxtQkFBbUIsTUFBTSxhQUFhLEtBQUssTUFBTSxLQUFLLFlBQVksT0FBTyxPQUFPLEtBQUssV0FBVztHQUMvRixPQUFPOzs7OztDQUtULEtBQUssMEJBQTBCLFNBQVMsYUFBYSxRQUFRLFVBQVU7RUFDdEUsbUJBQW1CLE1BQU0sYUFBYSxHQUFHLE1BQU0saUJBQWlCLFFBQVEsVUFBVSxNQUFNLEtBQUssV0FBVztHQUN2RyxPQUFPOzs7O0NBSVQsS0FBSywyQkFBMkIsU0FBUyxhQUFhLFNBQVMsVUFBVTtFQUN4RSxtQkFBbUIsTUFBTSxhQUFhLEdBQUcsTUFBTSxrQkFBa0IsU0FBUyxVQUFVLE1BQU0sS0FBSyxXQUFXO0dBQ3pHLE9BQU87Ozs7Q0FJVCxLQUFLLGtCQUFrQixTQUFTLGFBQWEsUUFBUTtFQUNwRCxtQkFBbUIsUUFBUSxhQUFhLEdBQUcsTUFBTSxpQkFBaUIsUUFBUSxLQUFLLFdBQVc7R0FDekYsT0FBTzs7OztDQUlULEtBQUssbUJBQW1CLFNBQVMsYUFBYSxTQUFTO0VBQ3RELG1CQUFtQixRQUFRLGFBQWEsR0FBRyxNQUFNLGtCQUFrQixTQUFTLEtBQUssV0FBVztHQUMzRixPQUFPOzs7O0NBSVQsS0FBSyxvQkFBb0IsU0FBUyxhQUFhO0VBQzlDLG1CQUFtQixPQUFPLGFBQWEsS0FBSyxXQUFXO0dBQ3RELE9BQU87Ozs7O0FBS1Y7QUNySEEsSUFBSSxVQUFVLGVBQWUsV0FBVztDQUN2QyxPQUFPO0VBQ04sVUFBVTtFQUNWLE9BQU87RUFDUCxZQUFZO0VBQ1osY0FBYztFQUNkLGtCQUFrQjtHQUNqQixhQUFhOztFQUVkLGFBQWEsR0FBRyxPQUFPLFlBQVk7OztBQUdyQztBQ1pBLElBQUksV0FBVywyRUFBdUIsU0FBUyxRQUFRLG9CQUFvQixpQkFBaUI7Q0FDM0YsSUFBSSxPQUFPOztDQUVYLG1CQUFtQixTQUFTLEtBQUssU0FBUyxjQUFjO0VBQ3ZELEtBQUssZUFBZTs7O0NBR3JCLEtBQUssb0JBQW9CLFdBQVc7RUFDbkMsR0FBRyxLQUFLLG9CQUFvQjtHQUMzQixtQkFBbUIsT0FBTyxLQUFLLG9CQUFvQixLQUFLLFdBQVc7SUFDbEUsbUJBQW1CLGVBQWUsS0FBSyxvQkFBb0IsS0FBSyxTQUFTLGFBQWE7S0FDckYsS0FBSyxhQUFhLEtBQUs7S0FDdkIsT0FBTzs7Ozs7O0FBTVo7QUNsQkEsSUFBSSxVQUFVLG1CQUFtQixXQUFXO0NBQzNDLE9BQU87RUFDTixVQUFVO0VBQ1YsT0FBTztFQUNQLFlBQVk7RUFDWixjQUFjO0VBQ2Qsa0JBQWtCO0VBQ2xCLGFBQWEsR0FBRyxPQUFPLFlBQVk7OztBQUdyQztBQ1ZBLElBQUksV0FBVywwQ0FBZSxTQUFTLFFBQVEsY0FBYztDQUM1RCxJQUFJLE9BQU87O0NBRVgsS0FBSyxjQUFjLFdBQVc7RUFDN0IsT0FBTyxhQUFhO0dBQ25CLEtBQUssYUFBYTtHQUNsQixLQUFLLEtBQUssUUFBUTs7O0FBR3JCO0FDVEEsSUFBSSxVQUFVLFdBQVcsV0FBVztDQUNuQyxPQUFPO0VBQ04sT0FBTztFQUNQLFlBQVk7RUFDWixjQUFjO0VBQ2Qsa0JBQWtCO0dBQ2pCLFNBQVM7O0VBRVYsYUFBYSxHQUFHLE9BQU8sWUFBWTs7O0FBR3JDO0FDWEEsSUFBSSxXQUFXLG1IQUFzQixTQUFTLGdCQUFnQixvQkFBb0Isd0JBQXdCLGNBQWMsUUFBUTtDQUMvSCxJQUFJLE9BQU87O0NBRVgsS0FBSyxNQUFNLGFBQWE7Q0FDeEIsS0FBSyxJQUFJO0VBQ1IsYUFBYSxFQUFFLFlBQVk7RUFDM0Isa0JBQWtCLEVBQUUsWUFBWTtFQUNoQyxpQkFBaUIsRUFBRSxZQUFZO0VBQy9CLG1CQUFtQixFQUFFLFlBQVk7RUFDakMsY0FBYyxFQUFFLFlBQVk7OztDQUc3QixLQUFLLG1CQUFtQix1QkFBdUI7Q0FDL0MsS0FBSyxRQUFRO0NBQ2IsS0FBSyxRQUFRO0NBQ2IsT0FBTyxlQUFlO0NBQ3RCLEtBQUssZUFBZTs7Q0FFcEIsbUJBQW1CLFNBQVMsS0FBSyxTQUFTLGNBQWM7RUFDdkQsS0FBSyxlQUFlO0VBQ3BCLE9BQU8sZUFBZSxhQUFhLElBQUksVUFBVSxTQUFTO0dBQ3pELE9BQU87SUFDTixJQUFJLFFBQVE7SUFDWixNQUFNLFFBQVE7OztFQUdoQixJQUFJLENBQUMsRUFBRSxZQUFZLEtBQUssVUFBVTtHQUNqQyxPQUFPLGNBQWMsRUFBRSxLQUFLLE9BQU8sY0FBYyxTQUFTLE1BQU07SUFDL0QsT0FBTyxLQUFLLE9BQU8sS0FBSyxRQUFROzs7OztDQUtuQyxPQUFPLE9BQU8sWUFBWSxTQUFTLFVBQVUsVUFBVTtFQUN0RCxLQUFLLGNBQWM7OztDQUdwQixLQUFLLGdCQUFnQixTQUFTLEtBQUs7RUFDbEMsSUFBSSxPQUFPLFFBQVEsYUFBYTtHQUMvQjs7RUFFRCxlQUFlLFFBQVEsS0FBSyxLQUFLLFNBQVMsU0FBUztHQUNsRCxLQUFLLFVBQVU7R0FDZixLQUFLLFFBQVEsS0FBSyxRQUFRO0dBQzFCLE9BQU8sY0FBYyxFQUFFLEtBQUssT0FBTyxjQUFjLFNBQVMsTUFBTTtJQUMvRCxPQUFPLEtBQUssT0FBTyxLQUFLLFFBQVE7Ozs7O0NBS25DLEtBQUssZ0JBQWdCLFdBQVc7RUFDL0IsZUFBZSxPQUFPLEtBQUs7OztDQUc1QixLQUFLLGdCQUFnQixXQUFXO0VBQy9CLGVBQWUsT0FBTyxLQUFLOzs7Q0FHNUIsS0FBSyxXQUFXLFNBQVMsT0FBTztFQUMvQixJQUFJLGVBQWUsdUJBQXVCLFFBQVEsT0FBTyxnQkFBZ0IsQ0FBQyxPQUFPO0VBQ2pGLEtBQUssUUFBUSxZQUFZLE9BQU87RUFDaEMsS0FBSyxRQUFRO0VBQ2IsS0FBSyxRQUFROzs7Q0FHZCxLQUFLLGNBQWMsVUFBVSxPQUFPLE1BQU07RUFDekMsS0FBSyxRQUFRLGVBQWUsT0FBTztFQUNuQyxLQUFLLFFBQVE7OztDQUdkLEtBQUssb0JBQW9CLFVBQVUsYUFBYTtFQUMvQyxjQUFjLEVBQUUsS0FBSyxLQUFLLGNBQWMsU0FBUyxNQUFNO0dBQ3RELE9BQU8sS0FBSyxnQkFBZ0IsWUFBWTs7RUFFekMsZUFBZSxZQUFZLEtBQUssU0FBUzs7O0FBRzNDO0FDN0VBLElBQUksVUFBVSxrQkFBa0IsV0FBVztDQUMxQyxPQUFPO0VBQ04sVUFBVTtFQUNWLE9BQU87RUFDUCxZQUFZO0VBQ1osY0FBYztFQUNkLGtCQUFrQjtFQUNsQixhQUFhLEdBQUcsT0FBTyxZQUFZOzs7QUFHckM7QUNWQSxJQUFJLFdBQVcsZ0lBQW1CLFNBQVMsUUFBUSxTQUFTLFFBQVEsY0FBYyxnQkFBZ0Isd0JBQXdCLGVBQWU7Q0FDeEksSUFBSSxPQUFPOztDQUVYLEtBQUssY0FBYztDQUNuQixLQUFLLElBQUk7RUFDUixhQUFhLEVBQUUsWUFBWTtFQUMzQixjQUFjLEVBQUUsWUFBWTs7O0NBRzdCLEtBQUssY0FBYztDQUNuQixLQUFLLFFBQVE7Q0FDYixLQUFLLG9CQUFvQjs7Q0FFekIsT0FBTyxRQUFRLFNBQVMsU0FBUztFQUNoQyxPQUFPLFFBQVEsUUFBUSxjQUFjOzs7Q0FHdEMsY0FBYyx5QkFBeUIsU0FBUyxJQUFJO0VBQ25ELElBQUksR0FBRyxVQUFVLGdCQUFnQjtHQUNoQyxJQUFJLE1BQU0sQ0FBQyxFQUFFLFFBQVEsS0FBSyxlQUFlLEtBQUssWUFBWSxHQUFHLFFBQVE7R0FDckUsT0FBTyxhQUFhO0lBQ25CLEtBQUs7O0dBRU4sS0FBSyxvQkFBb0I7R0FDekIsT0FBTzs7RUFFUixJQUFJLEdBQUcsVUFBVSxnQkFBZ0I7R0FDaEMsS0FBSyxRQUFRLEdBQUc7R0FDaEIsT0FBTzs7OztDQUlULGVBQWUseUJBQXlCLFNBQVMsSUFBSTtFQUNwRCxPQUFPLE9BQU8sV0FBVztHQUN4QixJQUFJLEdBQUcsVUFBVSxVQUFVO0lBQzFCLElBQUksS0FBSyxZQUFZLFdBQVcsR0FBRztLQUNsQyxPQUFPLGFBQWE7TUFDbkIsS0FBSyxhQUFhO01BQ2xCLEtBQUs7O1dBRUE7S0FDTixLQUFLLElBQUksSUFBSSxHQUFHLFNBQVMsS0FBSyxZQUFZLFFBQVEsSUFBSSxRQUFRLEtBQUs7TUFDbEUsSUFBSSxLQUFLLFlBQVksR0FBRyxVQUFVLEdBQUcsS0FBSztPQUN6QyxPQUFPLGFBQWE7UUFDbkIsS0FBSyxhQUFhO1FBQ2xCLEtBQUssQ0FBQyxLQUFLLFlBQVksRUFBRSxNQUFNLEtBQUssWUFBWSxFQUFFLEdBQUcsUUFBUSxLQUFLLFlBQVksRUFBRSxHQUFHOztPQUVwRjs7Ozs7UUFLQyxJQUFJLEdBQUcsVUFBVSxVQUFVO0lBQy9CLE9BQU8sYUFBYTtLQUNuQixLQUFLLGFBQWE7S0FDbEIsS0FBSyxHQUFHOzs7R0FHVixLQUFLLFdBQVcsR0FBRzs7OztDQUlyQixlQUFlLFNBQVMsS0FBSyxTQUFTLFVBQVU7RUFDL0MsT0FBTyxPQUFPLFdBQVc7R0FDeEIsS0FBSyxXQUFXOzs7O0NBSWxCLE9BQU8sT0FBTyx3QkFBd0IsU0FBUyxVQUFVO0VBQ3hELEdBQUcsYUFBYSxXQUFXOztHQUUxQixHQUFHLEtBQUssZUFBZSxLQUFLLFlBQVksU0FBUyxHQUFHO0lBQ25ELE9BQU8sYUFBYTtLQUNuQixLQUFLLGFBQWE7S0FDbEIsS0FBSyxLQUFLLFlBQVksR0FBRzs7VUFFcEI7O0lBRU4sSUFBSSxjQUFjLE9BQU8sT0FBTyxvQkFBb0IsV0FBVztLQUM5RCxHQUFHLEtBQUssZUFBZSxLQUFLLFlBQVksU0FBUyxHQUFHO01BQ25ELE9BQU8sYUFBYTtPQUNuQixLQUFLLGFBQWE7T0FDbEIsS0FBSyxLQUFLLFlBQVksR0FBRzs7O0tBRzNCOzs7Ozs7Q0FNSixPQUFPLE9BQU8sd0JBQXdCLFdBQVc7O0VBRWhELEtBQUssY0FBYzs7RUFFbkIsSUFBSSxjQUFjLE9BQU8sT0FBTyxvQkFBb0IsV0FBVztHQUM5RCxHQUFHLEtBQUssZUFBZSxLQUFLLFlBQVksU0FBUyxHQUFHO0lBQ25ELE9BQU8sYUFBYTtLQUNuQixLQUFLLGFBQWE7S0FDbEIsS0FBSyxLQUFLLFlBQVksR0FBRzs7O0dBRzNCOzs7O0NBSUYsS0FBSyxnQkFBZ0IsV0FBVztFQUMvQixlQUFlLFNBQVMsS0FBSyxTQUFTLFNBQVM7R0FDOUMsQ0FBQyxPQUFPLE9BQU8sU0FBUyxRQUFRLFNBQVMsT0FBTztJQUMvQyxJQUFJLGVBQWUsdUJBQXVCLFFBQVEsT0FBTyxnQkFBZ0IsQ0FBQyxPQUFPO0lBQ2pGLFFBQVEsWUFBWSxPQUFPOztHQUU1QixJQUFJLGFBQWEsUUFBUSxFQUFFLFlBQVksaUJBQWlCO0lBQ3ZELFFBQVEsV0FBVyxhQUFhO1VBQzFCO0lBQ04sUUFBUSxXQUFXOztHQUVwQixFQUFFLHFCQUFxQjs7OztDQUl6QixLQUFLLGNBQWMsWUFBWTtFQUM5QixJQUFJLENBQUMsS0FBSyxVQUFVO0dBQ25CLE9BQU87O0VBRVIsT0FBTyxLQUFLLFNBQVMsU0FBUzs7O0NBRy9CLE9BQU8sb0JBQW9CLGFBQWE7Q0FDeEMsT0FBTyxjQUFjLFVBQVUsbUJBQW1CO0VBQ2pELE9BQU8sb0JBQW9COzs7O0FBSTdCO0FDdElBLElBQUksVUFBVSxlQUFlLFdBQVc7Q0FDdkMsT0FBTztFQUNOLFVBQVU7RUFDVixPQUFPO0VBQ1AsWUFBWTtFQUNaLGNBQWM7RUFDZCxrQkFBa0I7R0FDakIsYUFBYTs7RUFFZCxhQUFhLEdBQUcsT0FBTyxZQUFZOzs7QUFHckM7QUNaQSxJQUFJLFdBQVcsb0ZBQW1CLFNBQVMsa0JBQWtCLHdCQUF3QixnQkFBZ0I7Q0FDcEcsSUFBSSxPQUFPOztDQUVYLEtBQUssT0FBTyx1QkFBdUIsUUFBUSxLQUFLO0NBQ2hELEtBQUssT0FBTztDQUNaLEtBQUssSUFBSTtFQUNSLFFBQVEsRUFBRSxZQUFZO0VBQ3RCLGFBQWEsRUFBRSxZQUFZO0VBQzNCLE9BQU8sRUFBRSxZQUFZO0VBQ3JCLFFBQVEsRUFBRSxZQUFZO0VBQ3RCLFVBQVUsRUFBRSxZQUFZO0VBQ3hCLFNBQVMsRUFBRSxZQUFZO0VBQ3ZCLFVBQVUsRUFBRSxZQUFZOzs7Q0FHekIsS0FBSyxtQkFBbUIsS0FBSyxLQUFLLFdBQVc7Q0FDN0MsSUFBSSxDQUFDLEVBQUUsWUFBWSxLQUFLLFNBQVMsQ0FBQyxFQUFFLFlBQVksS0FBSyxLQUFLLFNBQVMsQ0FBQyxFQUFFLFlBQVksS0FBSyxLQUFLLEtBQUssT0FBTztFQUN2RyxLQUFLLE9BQU8sS0FBSyxLQUFLLEtBQUssS0FBSztFQUNoQyxJQUFJLENBQUMsS0FBSyxpQkFBaUIsS0FBSyxTQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxLQUFLLEtBQUssS0FBSyxLQUFLLFNBQVM7R0FDMUYsS0FBSyxtQkFBbUIsS0FBSyxpQkFBaUIsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEtBQUssS0FBSyxLQUFLOzs7Q0FHL0csS0FBSyxrQkFBa0I7O0NBRXZCLGVBQWUsWUFBWSxLQUFLLFNBQVMsUUFBUTtFQUNoRCxLQUFLLGtCQUFrQixFQUFFLE9BQU87OztDQUdqQyxLQUFLLGFBQWEsVUFBVSxLQUFLO0VBQ2hDLEtBQUssS0FBSyxPQUFPLEtBQUssS0FBSyxRQUFRO0VBQ25DLEtBQUssS0FBSyxLQUFLLE9BQU8sS0FBSyxLQUFLLEtBQUssUUFBUTtFQUM3QyxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUs7RUFDekIsS0FBSyxNQUFNOzs7Q0FHWixLQUFLLGNBQWMsV0FBVztFQUM3QixJQUFJLGNBQWMsR0FBRyxPQUFPLFlBQVksMkJBQTJCLEtBQUssS0FBSyxXQUFXO0VBQ3hGLE9BQU8saUJBQWlCOzs7Q0FHekIsS0FBSyxjQUFjLFlBQVk7RUFDOUIsS0FBSyxNQUFNLFlBQVksS0FBSyxNQUFNLEtBQUs7RUFDdkMsS0FBSyxNQUFNOzs7QUFHYjtBQzdDQSxJQUFJLFVBQVUsZUFBZSxDQUFDLFlBQVksU0FBUyxVQUFVO0NBQzVELE9BQU87RUFDTixPQUFPO0VBQ1AsWUFBWTtFQUNaLGNBQWM7RUFDZCxrQkFBa0I7R0FDakIsTUFBTTtHQUNOLE1BQU07R0FDTixPQUFPOztFQUVSLE1BQU0sU0FBUyxPQUFPLFNBQVMsT0FBTyxNQUFNO0dBQzNDLEtBQUssY0FBYyxLQUFLLFNBQVMsTUFBTTtJQUN0QyxJQUFJLFdBQVcsUUFBUSxRQUFRO0lBQy9CLFFBQVEsT0FBTztJQUNmLFNBQVMsVUFBVTs7Ozs7QUFLdkI7QUNuQkEsSUFBSSxXQUFXLGFBQWEsV0FBVztDQUN0QyxJQUFJLE9BQU87O0FBRVo7QUNIQSxJQUFJLFVBQVUsU0FBUyxXQUFXO0NBQ2pDLE9BQU87RUFDTixVQUFVO0VBQ1YsT0FBTztFQUNQLFlBQVk7RUFDWixjQUFjO0VBQ2Qsa0JBQWtCO0dBQ2pCLE9BQU87O0VBRVIsYUFBYSxHQUFHLE9BQU8sWUFBWTs7O0FBR3JDO0FDWkEsSUFBSSxXQUFXLCtFQUFpQixTQUFTLFFBQVEsZ0JBQWdCLGVBQWUsY0FBYzs7Q0FFN0YsT0FBTyxTQUFTLENBQUMsRUFBRSxZQUFZLGlCQUFpQixFQUFFLFlBQVk7O0NBRTlELGVBQWUsWUFBWSxLQUFLLFNBQVMsUUFBUTtFQUNoRCxPQUFPLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxZQUFZLGlCQUFpQixFQUFFLFlBQVksZ0JBQWdCLE9BQU87OztDQUcvRixPQUFPLGdCQUFnQixhQUFhO0NBQ3BDLE9BQU8sY0FBYyxVQUFVLGVBQWU7RUFDN0MsY0FBYztFQUNkLE9BQU8sZ0JBQWdCOzs7QUFHekI7QUNkQSxJQUFJLFVBQVUsYUFBYSxXQUFXO0NBQ3JDLE9BQU87RUFDTixVQUFVO0VBQ1YsT0FBTztFQUNQLFlBQVk7RUFDWixjQUFjO0VBQ2Qsa0JBQWtCO0VBQ2xCLGFBQWEsR0FBRyxPQUFPLFlBQVk7OztBQUdyQztBQ1ZBLElBQUksVUFBVSwwQkFBYyxTQUFTLFNBQVM7Q0FDN0MsTUFBTTtFQUNMLFVBQVU7RUFDVixTQUFTO0VBQ1QsTUFBTSxTQUFTLE9BQU8sU0FBUyxNQUFNLFNBQVM7R0FDN0MsUUFBUSxZQUFZLEtBQUssU0FBUyxPQUFPO0lBQ3hDLElBQUksTUFBTSxPQUFPLFdBQVcsR0FBRztLQUM5QixPQUFPOztJQUVSLE9BQU8sTUFBTSxNQUFNOztHQUVwQixRQUFRLFNBQVMsS0FBSyxTQUFTLE9BQU87SUFDckMsT0FBTyxNQUFNLEtBQUs7Ozs7O0FBS3RCO0FDakJBLElBQUksVUFBVSxZQUFZLFdBQVc7Q0FDcEMsTUFBTTtFQUNMLFVBQVU7RUFDVixTQUFTO0VBQ1QsTUFBTSxTQUFTLE9BQU8sU0FBUyxNQUFNLFNBQVM7R0FDN0MsUUFBUSxZQUFZLEtBQUssU0FBUyxPQUFPO0lBQ3hDLE9BQU87O0dBRVIsUUFBUSxTQUFTLEtBQUssU0FBUyxPQUFPO0lBQ3JDLE9BQU87Ozs7O0FBS1g7QUNkQSxJQUFJLFFBQVEsZUFBZTtBQUMzQjtDQUNDLE9BQU8sU0FBUyxZQUFZLE1BQU07RUFDakMsUUFBUSxPQUFPLE1BQU07O0dBRXBCLGFBQWE7R0FDYixVQUFVO0dBQ1YsUUFBUSxLQUFLLEtBQUssTUFBTTs7R0FFeEIsWUFBWSxTQUFTLEtBQUs7SUFDekIsSUFBSSxJQUFJLEtBQUssS0FBSyxVQUFVO0tBQzNCLEdBQUcsS0FBSyxTQUFTLEdBQUcsVUFBVSxLQUFLO01BQ2xDLE9BQU8sS0FBSyxTQUFTOzs7SUFHdkIsT0FBTzs7O0dBR1IsWUFBWTtJQUNYLE9BQU87SUFDUCxRQUFROzs7O0VBSVYsUUFBUSxPQUFPLE1BQU07RUFDckIsUUFBUSxPQUFPLE1BQU07R0FDcEIsT0FBTyxLQUFLLElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRzs7O0VBRzFDLElBQUksU0FBUyxLQUFLLEtBQUssTUFBTTtFQUM3QixJQUFJLE9BQU8sV0FBVyxhQUFhO0dBQ2xDLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxPQUFPLFFBQVEsS0FBSztJQUN2QyxJQUFJLE9BQU8sT0FBTyxHQUFHO0lBQ3JCLElBQUksS0FBSyxXQUFXLEdBQUc7S0FDdEI7O0lBRUQsSUFBSSxTQUFTLE9BQU8sR0FBRztJQUN2QixJQUFJLE9BQU8sV0FBVyxHQUFHO0tBQ3hCOzs7SUFHRCxJQUFJLGFBQWEsT0FBTyxPQUFPLGNBQWM7O0lBRTdDLElBQUksS0FBSyxXQUFXLGdDQUFnQztLQUNuRCxLQUFLLFdBQVcsTUFBTSxLQUFLO01BQzFCLElBQUksS0FBSyxPQUFPO01BQ2hCLGFBQWEsS0FBSyxPQUFPO01BQ3pCLFVBQVU7O1dBRUwsSUFBSSxLQUFLLFdBQVcsaUNBQWlDO0tBQzNELEtBQUssV0FBVyxPQUFPLEtBQUs7TUFDM0IsSUFBSSxLQUFLLE9BQU87TUFDaEIsYUFBYSxLQUFLLE9BQU87TUFDekIsVUFBVTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCaEI7QUNyRUEsSUFBSSxRQUFRLHVCQUFXLFNBQVMsU0FBUztDQUN4QyxPQUFPLFNBQVMsUUFBUSxhQUFhLE9BQU87RUFDM0MsUUFBUSxPQUFPLE1BQU07O0dBRXBCLE1BQU07R0FDTixPQUFPOztHQUVQLGVBQWUsWUFBWTs7R0FFM0IsS0FBSyxTQUFTLE9BQU87SUFDcEIsSUFBSSxRQUFRLFVBQVUsUUFBUTs7S0FFN0IsT0FBTyxLQUFLLFlBQVksT0FBTyxFQUFFLE9BQU87V0FDbEM7O0tBRU4sT0FBTyxLQUFLLFlBQVksT0FBTzs7OztHQUlqQyxVQUFVLFNBQVMsT0FBTztJQUN6QixJQUFJLFFBQVEsVUFBVSxRQUFROztLQUU3QixPQUFPLEtBQUssWUFBWSxNQUFNLEVBQUUsT0FBTztXQUNqQzs7S0FFTixJQUFJLFdBQVcsS0FBSyxZQUFZO0tBQ2hDLEdBQUcsVUFBVTtNQUNaLE9BQU8sU0FBUztZQUNWO01BQ04sT0FBTzs7Ozs7R0FLVixPQUFPLFNBQVMsT0FBTztJQUN0QixJQUFJLFFBQVEsVUFBVSxRQUFROztLQUU3QixPQUFPLEtBQUssWUFBWSxTQUFTLEVBQUUsT0FBTztXQUNwQzs7S0FFTixJQUFJLFdBQVcsS0FBSyxZQUFZO0tBQ2hDLEdBQUcsVUFBVTtNQUNaLE9BQU8sU0FBUztZQUNWO01BQ04sT0FBTzs7Ozs7R0FLVixLQUFLLFNBQVMsT0FBTztJQUNwQixJQUFJLFdBQVcsS0FBSyxZQUFZO0lBQ2hDLElBQUksUUFBUSxVQUFVLFFBQVE7S0FDN0IsSUFBSSxNQUFNOztLQUVWLEdBQUcsWUFBWSxNQUFNLFFBQVEsU0FBUyxRQUFRO01BQzdDLE1BQU0sU0FBUztNQUNmLElBQUksS0FBSzs7S0FFVixPQUFPLEtBQUssWUFBWSxPQUFPLEVBQUUsT0FBTztXQUNsQzs7S0FFTixHQUFHLFVBQVU7TUFDWixJQUFJLE1BQU0sUUFBUSxTQUFTLFFBQVE7T0FDbEMsT0FBTyxTQUFTLE1BQU07O01BRXZCLE9BQU8sU0FBUztZQUNWO01BQ04sT0FBTzs7Ozs7R0FLVixPQUFPLFdBQVc7O0lBRWpCLElBQUksV0FBVyxLQUFLLFlBQVk7SUFDaEMsR0FBRyxVQUFVO0tBQ1osT0FBTyxTQUFTO1dBQ1Y7S0FDTixPQUFPOzs7O0dBSVQsT0FBTyxXQUFXO0lBQ2pCLElBQUksV0FBVyxLQUFLLFlBQVk7SUFDaEMsR0FBRyxVQUFVO0tBQ1osT0FBTyxTQUFTO1dBQ1Y7S0FDTixPQUFPOzs7O0dBSVQsWUFBWSxTQUFTLE9BQU87SUFDM0IsSUFBSSxRQUFRLFVBQVUsUUFBUTs7S0FFN0IsT0FBTyxLQUFLLFlBQVksY0FBYyxFQUFFLE9BQU87V0FDekM7O0tBRU4sSUFBSSxXQUFXLEtBQUssWUFBWTtLQUNoQyxHQUFHLFlBQVksU0FBUyxNQUFNLFNBQVMsR0FBRztNQUN6QyxPQUFPLFNBQVMsTUFBTSxNQUFNO1lBQ3RCO01BQ04sT0FBTzs7Ozs7R0FLVixhQUFhLFNBQVMsTUFBTTtJQUMzQixJQUFJLEtBQUssTUFBTSxPQUFPO0tBQ3JCLE9BQU8sS0FBSyxNQUFNLE1BQU07V0FDbEI7S0FDTixPQUFPOzs7R0FHVCxhQUFhLFNBQVMsTUFBTSxNQUFNO0lBQ2pDLE9BQU8sUUFBUSxLQUFLO0lBQ3BCLEdBQUcsQ0FBQyxLQUFLLE1BQU0sT0FBTztLQUNyQixLQUFLLE1BQU0sUUFBUTs7SUFFcEIsSUFBSSxNQUFNLEtBQUssTUFBTSxNQUFNO0lBQzNCLEtBQUssTUFBTSxNQUFNLE9BQU87OztJQUd4QixLQUFLLEtBQUssY0FBYyxRQUFRLGNBQWMsS0FBSztJQUNuRCxPQUFPOztHQUVSLGFBQWEsU0FBUyxNQUFNLE1BQU07SUFDakMsR0FBRyxDQUFDLEtBQUssTUFBTSxPQUFPO0tBQ3JCLEtBQUssTUFBTSxRQUFROztJQUVwQixLQUFLLE1BQU0sTUFBTSxLQUFLOzs7SUFHdEIsS0FBSyxLQUFLLGNBQWMsUUFBUSxjQUFjLEtBQUs7O0dBRXBELGdCQUFnQixVQUFVLE1BQU0sTUFBTTtJQUNyQyxRQUFRLEtBQUssRUFBRSxRQUFRLEtBQUssTUFBTSxPQUFPLE9BQU8sS0FBSyxNQUFNO0lBQzNELEtBQUssS0FBSyxjQUFjLFFBQVEsY0FBYyxLQUFLOztHQUVwRCxTQUFTLFNBQVMsTUFBTTtJQUN2QixLQUFLLEtBQUssT0FBTzs7R0FFbEIsUUFBUSxTQUFTLGFBQWEsS0FBSztJQUNsQyxLQUFLLEtBQUssTUFBTSxZQUFZLE1BQU0sTUFBTTs7O0dBR3pDLFdBQVcsV0FBVzs7SUFFckIsS0FBSyxLQUFLLGNBQWMsUUFBUSxjQUFjLEtBQUs7OztHQUdwRCxTQUFTLFNBQVMsU0FBUztJQUMxQixJQUFJLEVBQUUsWUFBWSxZQUFZLFFBQVEsV0FBVyxHQUFHO0tBQ25ELE9BQU87O0lBRVIsT0FBTyxLQUFLLEtBQUssWUFBWSxjQUFjLFFBQVEsUUFBUSxtQkFBbUIsQ0FBQzs7Ozs7RUFLakYsR0FBRyxRQUFRLFVBQVUsUUFBUTtHQUM1QixRQUFRLE9BQU8sS0FBSyxNQUFNO0dBQzFCLFFBQVEsT0FBTyxLQUFLLE9BQU8sUUFBUSxjQUFjLEtBQUssS0FBSztTQUNyRDtHQUNOLFFBQVEsT0FBTyxLQUFLLE9BQU87SUFDMUIsU0FBUyxDQUFDLENBQUMsT0FBTztJQUNsQixJQUFJLENBQUMsQ0FBQyxPQUFPOztHQUVkLEtBQUssS0FBSyxjQUFjLFFBQVEsY0FBYyxLQUFLOzs7RUFHcEQsSUFBSSxXQUFXLEtBQUssWUFBWTtFQUNoQyxHQUFHLENBQUMsVUFBVTtHQUNiLEtBQUssV0FBVzs7OztBQUluQjtBQ2hMQSxJQUFJLFFBQVEsK0ZBQXNCLFNBQVMsV0FBVyxZQUFZLGlCQUFpQixhQUFhLFNBQVM7O0NBRXhHLElBQUksZUFBZTs7Q0FFbkIsSUFBSSxVQUFVLFdBQVc7RUFDeEIsT0FBTyxXQUFXLEtBQUssU0FBUyxTQUFTO0dBQ3hDLGVBQWUsUUFBUSxhQUFhLElBQUksU0FBUyxhQUFhO0lBQzdELE9BQU8sSUFBSSxZQUFZOzs7OztDQUsxQixPQUFPO0VBQ04sUUFBUSxXQUFXO0dBQ2xCLE9BQU8sVUFBVSxLQUFLLFdBQVc7SUFDaEMsT0FBTzs7OztFQUlULFdBQVcsWUFBWTtHQUN0QixPQUFPLEtBQUssU0FBUyxLQUFLLFNBQVMsY0FBYztJQUNoRCxPQUFPLGFBQWEsSUFBSSxVQUFVLFNBQVM7S0FDMUMsT0FBTyxRQUFRO09BQ2IsT0FBTyxTQUFTLEdBQUcsR0FBRztLQUN4QixPQUFPLEVBQUUsT0FBTzs7Ozs7RUFLbkIsWUFBWSxXQUFXO0dBQ3RCLE9BQU8sV0FBVyxLQUFLLFNBQVMsU0FBUztJQUN4QyxPQUFPLFFBQVEsYUFBYSxJQUFJLFNBQVMsYUFBYTtLQUNyRCxPQUFPLElBQUksWUFBWTs7Ozs7RUFLMUIsdUJBQXVCLFdBQVc7R0FDakMsT0FBTyxhQUFhOzs7RUFHckIsZ0JBQWdCLFNBQVMsYUFBYTtHQUNyQyxPQUFPLFdBQVcsS0FBSyxTQUFTLFNBQVM7SUFDeEMsT0FBTyxVQUFVLGVBQWUsQ0FBQyxZQUFZLGFBQWEsSUFBSSxRQUFRLFVBQVUsS0FBSyxTQUFTLGFBQWE7S0FDMUcsY0FBYyxJQUFJLFlBQVk7TUFDN0IsS0FBSyxZQUFZLEdBQUc7TUFDcEIsTUFBTSxZQUFZOztLQUVuQixZQUFZLGNBQWM7S0FDMUIsT0FBTzs7Ozs7RUFLVixRQUFRLFNBQVMsYUFBYTtHQUM3QixPQUFPLFdBQVcsS0FBSyxTQUFTLFNBQVM7SUFDeEMsT0FBTyxVQUFVLGtCQUFrQixDQUFDLFlBQVksYUFBYSxJQUFJLFFBQVE7Ozs7RUFJM0UsUUFBUSxTQUFTLGFBQWE7R0FDN0IsT0FBTyxXQUFXLEtBQUssU0FBUyxTQUFTO0lBQ3hDLE9BQU8sVUFBVSxrQkFBa0IsYUFBYSxLQUFLLFdBQVc7S0FDL0QsUUFBUSxLQUFLLEVBQUUsUUFBUSxjQUFjLGNBQWM7Ozs7O0VBS3RELFFBQVEsU0FBUyxhQUFhLGFBQWE7R0FDMUMsT0FBTyxXQUFXLEtBQUssU0FBUyxTQUFTO0lBQ3hDLE9BQU8sVUFBVSxrQkFBa0IsYUFBYSxDQUFDLFlBQVksYUFBYSxJQUFJLFFBQVE7Ozs7RUFJeEYsS0FBSyxTQUFTLGFBQWE7R0FDMUIsT0FBTyxLQUFLLFNBQVMsS0FBSyxTQUFTLGNBQWM7SUFDaEQsT0FBTyxhQUFhLE9BQU8sVUFBVSxTQUFTO0tBQzdDLE9BQU8sUUFBUSxnQkFBZ0I7T0FDN0I7Ozs7RUFJTCxNQUFNLFNBQVMsYUFBYTtHQUMzQixPQUFPLFVBQVUsZ0JBQWdCOzs7RUFHbEMsT0FBTyxTQUFTLGFBQWEsV0FBVyxXQUFXLFVBQVUsZUFBZTtHQUMzRSxJQUFJLFNBQVMsU0FBUyxlQUFlLGVBQWUsSUFBSSxJQUFJO0dBQzVELElBQUksU0FBUyxPQUFPLGNBQWM7R0FDbEMsT0FBTyxhQUFhLFdBQVc7R0FDL0IsT0FBTyxhQUFhLFdBQVc7R0FDL0IsT0FBTyxZQUFZOztHQUVuQixJQUFJLE9BQU8sT0FBTyxjQUFjO0dBQ2hDLE9BQU8sWUFBWTs7R0FFbkIsSUFBSSxRQUFRLE9BQU8sY0FBYztHQUNqQyxJQUFJLGNBQWMsR0FBRyxNQUFNLGlCQUFpQjtJQUMzQyxNQUFNLGNBQWM7VUFDZCxJQUFJLGNBQWMsR0FBRyxNQUFNLGtCQUFrQjtJQUNuRCxNQUFNLGNBQWM7O0dBRXJCLE1BQU0sZUFBZTtHQUNyQixLQUFLLFlBQVk7O0dBRWpCLElBQUksV0FBVyxPQUFPLGNBQWM7R0FDcEMsU0FBUyxjQUFjLEVBQUUsWUFBWSxtQ0FBbUM7SUFDdkUsYUFBYSxZQUFZO0lBQ3pCLE9BQU8sWUFBWTs7R0FFcEIsS0FBSyxZQUFZOztHQUVqQixJQUFJLFVBQVU7SUFDYixJQUFJLE1BQU0sT0FBTyxjQUFjO0lBQy9CLEtBQUssWUFBWTs7O0dBR2xCLElBQUksT0FBTyxPQUFPOztHQUVsQixPQUFPLFVBQVUsSUFBSTtJQUNwQixJQUFJLFFBQVEsTUFBTSxDQUFDLFFBQVEsUUFBUSxNQUFNO0lBQ3pDLFlBQVk7S0FDWCxLQUFLLFNBQVMsVUFBVTtJQUN6QixJQUFJLFNBQVMsV0FBVyxLQUFLO0tBQzVCLElBQUksQ0FBQyxlQUFlO01BQ25CLElBQUksY0FBYyxHQUFHLE1BQU0saUJBQWlCO09BQzNDLFlBQVksV0FBVyxNQUFNLEtBQUs7UUFDakMsSUFBSTtRQUNKLGFBQWE7UUFDYixVQUFVOzthQUVMLElBQUksY0FBYyxHQUFHLE1BQU0sa0JBQWtCO09BQ25ELFlBQVksV0FBVyxPQUFPLEtBQUs7UUFDbEMsSUFBSTtRQUNKLGFBQWE7UUFDYixVQUFVOzs7Ozs7Ozs7RUFTaEIsU0FBUyxTQUFTLGFBQWEsV0FBVyxXQUFXO0dBQ3BELElBQUksU0FBUyxTQUFTLGVBQWUsZUFBZSxJQUFJLElBQUk7R0FDNUQsSUFBSSxTQUFTLE9BQU8sY0FBYztHQUNsQyxPQUFPLGFBQWEsV0FBVztHQUMvQixPQUFPLGFBQWEsV0FBVztHQUMvQixPQUFPLFlBQVk7O0dBRW5CLElBQUksVUFBVSxPQUFPLGNBQWM7R0FDbkMsT0FBTyxZQUFZOztHQUVuQixJQUFJLFFBQVEsT0FBTyxjQUFjO0dBQ2pDLElBQUksY0FBYyxHQUFHLE1BQU0saUJBQWlCO0lBQzNDLE1BQU0sY0FBYztVQUNkLElBQUksY0FBYyxHQUFHLE1BQU0sa0JBQWtCO0lBQ25ELE1BQU0sY0FBYzs7R0FFckIsTUFBTSxlQUFlO0dBQ3JCLFFBQVEsWUFBWTtHQUNwQixJQUFJLE9BQU8sT0FBTzs7O0dBR2xCLE9BQU8sVUFBVSxJQUFJO0lBQ3BCLElBQUksUUFBUSxNQUFNLENBQUMsUUFBUSxRQUFRLE1BQU07SUFDekMsWUFBWTtLQUNYLEtBQUssU0FBUyxVQUFVO0lBQ3pCLElBQUksU0FBUyxXQUFXLEtBQUs7S0FDNUIsSUFBSSxjQUFjLEdBQUcsTUFBTSxpQkFBaUI7TUFDM0MsWUFBWSxXQUFXLFFBQVEsWUFBWSxXQUFXLE1BQU0sT0FBTyxTQUFTLE1BQU07T0FDakYsT0FBTyxLQUFLLE9BQU87O1lBRWQsSUFBSSxjQUFjLEdBQUcsTUFBTSxrQkFBa0I7TUFDbkQsWUFBWSxXQUFXLFNBQVMsWUFBWSxXQUFXLE9BQU8sT0FBTyxTQUFTLFFBQVE7T0FDckYsT0FBTyxPQUFPLE9BQU87Ozs7S0FJdkIsT0FBTztXQUNEO0tBQ04sT0FBTzs7Ozs7Ozs7OztBQVVaO0FDaE1BLElBQUk7QUFDSixJQUFJLFFBQVEsZ0dBQWtCLFNBQVMsV0FBVyxvQkFBb0IsU0FBUyxJQUFJLGNBQWMsT0FBTzs7Q0FFdkcsSUFBSSxjQUFjOztDQUVsQixXQUFXLGFBQWE7O0NBRXhCLElBQUksb0JBQW9COztDQUV4QixLQUFLLDJCQUEyQixTQUFTLFVBQVU7RUFDbEQsa0JBQWtCLEtBQUs7OztDQUd4QixJQUFJLGtCQUFrQixTQUFTLFdBQVcsS0FBSztFQUM5QyxJQUFJLEtBQUs7R0FDUixPQUFPO0dBQ1AsS0FBSztHQUNMLFVBQVUsU0FBUzs7RUFFcEIsUUFBUSxRQUFRLG1CQUFtQixTQUFTLFVBQVU7R0FDckQsU0FBUzs7OztDQUlYLEtBQUssWUFBWSxXQUFXO0VBQzNCLE9BQU8sbUJBQW1CLGFBQWEsS0FBSyxTQUFTLHFCQUFxQjtHQUN6RSxJQUFJLFdBQVc7R0FDZixvQkFBb0IsUUFBUSxTQUFTLGFBQWE7SUFDakQsU0FBUztLQUNSLG1CQUFtQixLQUFLLGFBQWEsS0FBSyxTQUFTLGFBQWE7TUFDL0QsSUFBSSxJQUFJLEtBQUssWUFBWSxTQUFTO09BQ2pDLFVBQVUsSUFBSSxRQUFRLGFBQWEsWUFBWSxRQUFRO09BQ3ZELFNBQVMsSUFBSSxRQUFRLE9BQU87Ozs7O0dBS2hDLE9BQU8sR0FBRyxJQUFJLFVBQVUsS0FBSyxXQUFXO0lBQ3ZDLGNBQWM7Ozs7O0NBS2pCLEtBQUssU0FBUyxXQUFXO0VBQ3hCLEdBQUcsZ0JBQWdCLE9BQU87R0FDekIsT0FBTyxLQUFLLFlBQVksS0FBSyxXQUFXO0lBQ3ZDLE9BQU8sU0FBUzs7U0FFWDtHQUNOLE9BQU8sR0FBRyxLQUFLLFNBQVM7Ozs7Q0FJMUIsS0FBSyxZQUFZLFlBQVk7RUFDNUIsT0FBTyxLQUFLLFNBQVMsS0FBSyxTQUFTLFVBQVU7R0FDNUMsT0FBTyxFQUFFLEtBQUssU0FBUyxJQUFJLFVBQVUsU0FBUztJQUM3QyxPQUFPLFFBQVE7TUFDYixPQUFPLFNBQVMsR0FBRyxHQUFHO0lBQ3hCLE9BQU8sRUFBRSxPQUFPO01BQ2QsSUFBSSxRQUFROzs7O0NBSWpCLEtBQUssVUFBVSxTQUFTLEtBQUs7RUFDNUIsR0FBRyxnQkFBZ0IsT0FBTztHQUN6QixPQUFPLEtBQUssWUFBWSxLQUFLLFdBQVc7SUFDdkMsT0FBTyxTQUFTLElBQUk7O1NBRWY7R0FDTixPQUFPLEdBQUcsS0FBSyxTQUFTLElBQUk7Ozs7Q0FJOUIsS0FBSyxTQUFTLFNBQVMsWUFBWSxhQUFhO0VBQy9DLGNBQWMsZUFBZSxtQkFBbUI7RUFDaEQsYUFBYSxjQUFjLElBQUksUUFBUTtFQUN2QyxJQUFJLFNBQVMsTUFBTTtFQUNuQixXQUFXLElBQUk7RUFDZixXQUFXLE9BQU8sYUFBYTtFQUMvQixXQUFXLGdCQUFnQixZQUFZOztFQUV2QyxPQUFPLFVBQVU7R0FDaEI7R0FDQTtJQUNDLE1BQU0sV0FBVyxLQUFLO0lBQ3RCLFVBQVUsU0FBUzs7SUFFbkIsS0FBSyxTQUFTLEtBQUs7R0FDcEIsV0FBVyxRQUFRLElBQUksa0JBQWtCO0dBQ3pDLFNBQVMsSUFBSSxRQUFRO0dBQ3JCLGdCQUFnQixVQUFVO0dBQzFCLE9BQU87S0FDTCxNQUFNLFNBQVMsR0FBRztHQUNwQixRQUFRLElBQUksbUJBQW1COzs7O0NBSWpDLEtBQUssY0FBYyxVQUFVLFNBQVMsYUFBYTtFQUNsRCxJQUFJLFFBQVEsa0JBQWtCLFlBQVksYUFBYTtHQUN0RDs7RUFFRCxRQUFRO0VBQ1IsSUFBSSxRQUFRLFFBQVEsS0FBSzs7O0VBR3pCLEtBQUssT0FBTyxPQUFPOzs7RUFHbkIsS0FBSyxPQUFPOzs7Q0FHYixLQUFLLFNBQVMsU0FBUyxTQUFTO0VBQy9CLFFBQVE7OztFQUdSLE9BQU8sVUFBVSxXQUFXLFFBQVEsTUFBTSxDQUFDLE1BQU0sT0FBTyxLQUFLLFNBQVMsS0FBSztHQUMxRSxJQUFJLFVBQVUsSUFBSSxrQkFBa0I7R0FDcEMsUUFBUSxRQUFROzs7O0NBSWxCLEtBQUssU0FBUyxTQUFTLFNBQVM7O0VBRS9CLE9BQU8sVUFBVSxXQUFXLFFBQVEsTUFBTSxLQUFLLFNBQVMsS0FBSztHQUM1RCxTQUFTLE9BQU8sUUFBUTtHQUN4QixnQkFBZ0IsVUFBVSxRQUFROzs7O0FBSXJDO0FDaklBLElBQUksUUFBUSxhQUFhLFdBQVc7Q0FDbkMsSUFBSSxNQUFNLElBQUksSUFBSSxVQUFVO0VBQzNCLElBQUksSUFBSTs7Q0FFVCxPQUFPLElBQUksSUFBSSxPQUFPO0dBQ3BCO0FDTEgsSUFBSSxRQUFRLDRCQUFjLFNBQVMsV0FBVztDQUM3QyxPQUFPLFVBQVUsY0FBYztFQUM5QixRQUFRLEdBQUcsaUJBQWlCO0VBQzVCLGFBQWE7RUFDYixpQkFBaUI7OztBQUduQjtBQ1BBLElBQUksUUFBUSxpQkFBaUIsV0FBVztDQUN2QyxJQUFJLGFBQWE7O0NBRWpCLElBQUksb0JBQW9COztDQUV4QixLQUFLLDJCQUEyQixTQUFTLFVBQVU7RUFDbEQsa0JBQWtCLEtBQUs7OztDQUd4QixJQUFJLGtCQUFrQixTQUFTLFdBQVc7RUFDekMsSUFBSSxLQUFLO0dBQ1IsTUFBTTtHQUNOLFdBQVcsS0FBSzs7RUFFakIsUUFBUSxRQUFRLG1CQUFtQixTQUFTLFVBQVU7R0FDckQsU0FBUzs7OztDQUlYLElBQUksY0FBYztFQUNqQixRQUFRLFNBQVMsUUFBUTtHQUN4QixPQUFPLFVBQVUsWUFBWSxLQUFLOztFQUVuQyxhQUFhLFNBQVMsT0FBTztHQUM1QixhQUFhO0dBQ2IsZ0JBQWdCOzs7O0NBSWxCLEtBQUssZ0JBQWdCLFdBQVc7RUFDL0IsT0FBTzs7O0NBR1IsS0FBSyxjQUFjLFdBQVc7RUFDN0IsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFFLGdCQUFnQjtHQUNwQyxFQUFFLGNBQWMsR0FBRzs7RUFFcEIsYUFBYTs7O0NBR2QsSUFBSSxDQUFDLEVBQUUsWUFBWSxHQUFHLFVBQVU7RUFDL0IsR0FBRyxRQUFRLFNBQVMsY0FBYzs7O0NBR25DLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBRSxnQkFBZ0I7RUFDcEMsRUFBRSxjQUFjLEdBQUcsaUJBQWlCLFlBQVksU0FBUyxHQUFHO0dBQzNELEdBQUcsRUFBRSxZQUFZLElBQUk7SUFDcEIsZ0JBQWdCOzs7OztBQUtwQjtBQ3BEQSxJQUFJLFFBQVEsbUJBQW1CLFdBQVc7Q0FDekMsSUFBSSxXQUFXO0VBQ2QsY0FBYztHQUNiOzs7O0NBSUYsS0FBSyxNQUFNLFNBQVMsS0FBSyxPQUFPO0VBQy9CLFNBQVMsT0FBTzs7O0NBR2pCLEtBQUssTUFBTSxTQUFTLEtBQUs7RUFDeEIsT0FBTyxTQUFTOzs7Q0FHakIsS0FBSyxTQUFTLFdBQVc7RUFDeEIsT0FBTzs7O0FBR1Q7QUNuQkEsSUFBSSxRQUFRLDBCQUEwQixXQUFXOzs7Ozs7Ozs7OztDQVdoRCxLQUFLLFlBQVk7RUFDaEIsVUFBVTtHQUNULGNBQWMsRUFBRSxZQUFZO0dBQzVCLFVBQVU7O0VBRVgsTUFBTTtHQUNMLGNBQWMsRUFBRSxZQUFZO0dBQzVCLFVBQVU7O0VBRVgsS0FBSztHQUNKLFVBQVU7R0FDVixjQUFjLEVBQUUsWUFBWTtHQUM1QixVQUFVOztFQUVYLE9BQU87R0FDTixVQUFVO0dBQ1YsY0FBYyxFQUFFLFlBQVk7R0FDNUIsVUFBVTtHQUNWLGNBQWM7SUFDYixNQUFNLENBQUM7SUFDUCxLQUFLLENBQUMsS0FBSyxDQUFDOztHQUViLFNBQVM7SUFDUixDQUFDLElBQUksUUFBUSxNQUFNLEVBQUUsWUFBWTtJQUNqQyxDQUFDLElBQUksUUFBUSxNQUFNLEVBQUUsWUFBWTtJQUNqQyxDQUFDLElBQUksU0FBUyxNQUFNLEVBQUUsWUFBWTs7RUFFcEMsS0FBSztHQUNKLFVBQVU7R0FDVixjQUFjLEVBQUUsWUFBWTtHQUM1QixVQUFVO0dBQ1YsY0FBYztJQUNiLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSTtJQUMvQixLQUFLLENBQUMsS0FBSyxDQUFDOztHQUViLFNBQVM7SUFDUixDQUFDLElBQUksUUFBUSxNQUFNLEVBQUUsWUFBWTtJQUNqQyxDQUFDLElBQUksUUFBUSxNQUFNLEVBQUUsWUFBWTtJQUNqQyxDQUFDLElBQUksU0FBUyxNQUFNLEVBQUUsWUFBWTs7O0VBR3BDLFlBQVk7R0FDWCxjQUFjLEVBQUUsWUFBWTtHQUM1QixVQUFVOztFQUVYLE1BQU07R0FDTCxjQUFjLEVBQUUsWUFBWTtHQUM1QixVQUFVOztFQUVYLE9BQU87R0FDTixVQUFVO0dBQ1YsY0FBYyxFQUFFLFlBQVk7R0FDNUIsVUFBVTtHQUNWLGNBQWM7SUFDYixNQUFNO0lBQ04sS0FBSyxDQUFDLEtBQUssQ0FBQzs7R0FFYixTQUFTO0lBQ1IsQ0FBQyxJQUFJLFFBQVEsTUFBTSxFQUFFLFlBQVk7SUFDakMsQ0FBQyxJQUFJLFFBQVEsTUFBTSxFQUFFLFlBQVk7SUFDakMsQ0FBQyxJQUFJLFNBQVMsTUFBTSxFQUFFLFlBQVk7OztFQUdwQyxNQUFNO0dBQ0wsVUFBVTtHQUNWLGNBQWMsRUFBRSxZQUFZO0dBQzVCLFVBQVU7R0FDVixjQUFjO0lBQ2IsTUFBTSxDQUFDO0lBQ1AsS0FBSyxDQUFDLEtBQUssQ0FBQzs7R0FFYixTQUFTO0lBQ1IsQ0FBQyxJQUFJLFFBQVEsTUFBTSxFQUFFLFlBQVk7SUFDakMsQ0FBQyxJQUFJLFFBQVEsTUFBTSxFQUFFLFlBQVk7SUFDakMsQ0FBQyxJQUFJLFNBQVMsTUFBTSxFQUFFLFlBQVk7OztFQUdwQyxLQUFLO0dBQ0osVUFBVTtHQUNWLGNBQWMsRUFBRSxZQUFZO0dBQzVCLFVBQVU7R0FDVixjQUFjO0lBQ2IsTUFBTSxDQUFDO0lBQ1AsS0FBSyxDQUFDLEtBQUssQ0FBQzs7R0FFYixTQUFTO0lBQ1IsQ0FBQyxJQUFJLGNBQWMsTUFBTSxFQUFFLFlBQVk7SUFDdkMsQ0FBQyxJQUFJLGNBQWMsTUFBTSxFQUFFLFlBQVk7SUFDdkMsQ0FBQyxJQUFJLFFBQVEsTUFBTSxFQUFFLFlBQVk7SUFDakMsQ0FBQyxJQUFJLE9BQU8sTUFBTSxFQUFFLFlBQVk7SUFDaEMsQ0FBQyxJQUFJLFlBQVksTUFBTSxFQUFFLFlBQVk7SUFDckMsQ0FBQyxJQUFJLFlBQVksTUFBTSxFQUFFLFlBQVk7SUFDckMsQ0FBQyxJQUFJLFNBQVMsTUFBTSxFQUFFLFlBQVk7SUFDbEMsQ0FBQyxJQUFJLFNBQVMsTUFBTSxFQUFFLFlBQVk7Ozs7O0NBS3JDLEtBQUssYUFBYTtFQUNqQjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztDQUdELEtBQUssbUJBQW1CO0NBQ3hCLEtBQUssSUFBSSxRQUFRLEtBQUssV0FBVztFQUNoQyxLQUFLLGlCQUFpQixLQUFLLENBQUMsSUFBSSxNQUFNLE1BQU0sS0FBSyxVQUFVLE1BQU0sY0FBYyxVQUFVLENBQUMsQ0FBQyxLQUFLLFVBQVUsTUFBTTs7O0NBR2pILEtBQUssZUFBZSxTQUFTLFVBQVU7RUFDdEMsU0FBUyxXQUFXLFFBQVEsRUFBRSxPQUFPLE9BQU8sT0FBTyxHQUFHLGdCQUFnQixPQUFPLE1BQU07RUFDbkYsT0FBTztHQUNOLE1BQU0sYUFBYTtHQUNuQixjQUFjLFdBQVc7R0FDekIsVUFBVTtHQUNWLFdBQVc7Ozs7Q0FJYixLQUFLLFVBQVUsU0FBUyxVQUFVO0VBQ2pDLE9BQU8sS0FBSyxVQUFVLGFBQWEsS0FBSyxhQUFhOzs7O0FBSXZEO0FDaEpBLElBQUksT0FBTyxjQUFjLFdBQVc7Q0FDbkMsT0FBTyxTQUFTLE9BQU87RUFDdEIsT0FBTyxNQUFNLFNBQVM7O0dBRXJCO0FDSkgsSUFBSSxPQUFPLGdCQUFnQixXQUFXO0NBQ3JDLE9BQU8sU0FBUyxPQUFPO0VBQ3RCLElBQUksU0FBUztJQUNYO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO01BQ0UsV0FBVztFQUNmLElBQUksSUFBSSxLQUFLLE9BQU87R0FDbkIsWUFBWSxNQUFNLFdBQVc7O0VBRTlCLE9BQU8sT0FBTyxXQUFXLE9BQU87OztBQUdsQztBQ3BCQSxJQUFJLE9BQU8sc0JBQXNCLFdBQVc7Q0FDM0M7Q0FDQSxPQUFPLFVBQVUsVUFBVSxPQUFPO0VBQ2pDLElBQUksT0FBTyxhQUFhLGFBQWE7R0FDcEMsT0FBTzs7RUFFUixJQUFJLE9BQU8sVUFBVSxlQUFlLE1BQU0sa0JBQWtCLEVBQUUsWUFBWSxnQkFBZ0IsZUFBZTtHQUN4RyxPQUFPOztFQUVSLElBQUksU0FBUztFQUNiLElBQUksU0FBUyxTQUFTLEdBQUc7R0FDeEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLFNBQVMsUUFBUSxLQUFLO0lBQ3pDLElBQUksTUFBTSxrQkFBa0IsRUFBRSxZQUFZLGVBQWUsZUFBZTtLQUN2RSxJQUFJLFNBQVMsR0FBRyxhQUFhLFdBQVcsR0FBRztNQUMxQyxPQUFPLEtBQUssU0FBUzs7V0FFaEI7S0FDTixJQUFJLFNBQVMsR0FBRyxhQUFhLFFBQVEsVUFBVSxHQUFHO01BQ2pELE9BQU8sS0FBSyxTQUFTOzs7OztFQUt6QixPQUFPOzs7QUFHVDtBQzFCQSxJQUFJLE9BQU8sZUFBZSxXQUFXO0NBQ3BDO0NBQ0EsT0FBTyxVQUFVLFFBQVEsU0FBUztFQUNqQyxJQUFJLE9BQU8sV0FBVyxhQUFhO0dBQ2xDLE9BQU87O0VBRVIsSUFBSSxPQUFPLFlBQVksYUFBYTtHQUNuQyxPQUFPOztFQUVSLElBQUksU0FBUztFQUNiLElBQUksT0FBTyxTQUFTLEdBQUc7R0FDdEIsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLE9BQU8sUUFBUSxLQUFLO0lBQ3ZDLElBQUksT0FBTyxHQUFHLFdBQVc7S0FDeEIsT0FBTyxLQUFLLE9BQU87S0FDbkI7O0lBRUQsSUFBSSxFQUFFLFlBQVksUUFBUSxZQUFZLE9BQU8sR0FBRyxNQUFNO0tBQ3JELE9BQU8sS0FBSyxPQUFPOzs7O0VBSXRCLE9BQU87OztBQUdUO0FDeEJBLElBQUksT0FBTyxrQkFBa0IsV0FBVztDQUN2QyxPQUFPLFNBQVMsT0FBTztFQUN0QixPQUFPLE1BQU0sT0FBTzs7O0FBR3RCO0FDTEEsSUFBSSxPQUFPLCtDQUFvQixTQUFTLHdCQUF3QjtDQUMvRDtDQUNBLE9BQU8sU0FBUyxPQUFPLE9BQU8sU0FBUzs7RUFFdEMsSUFBSSxXQUFXO0VBQ2YsUUFBUSxRQUFRLE9BQU8sU0FBUyxNQUFNO0dBQ3JDLFNBQVMsS0FBSzs7O0VBR2YsSUFBSSxhQUFhLFFBQVEsS0FBSyx1QkFBdUI7O0VBRXJELFdBQVc7O0VBRVgsU0FBUyxLQUFLLFVBQVUsR0FBRyxHQUFHO0dBQzdCLEdBQUcsV0FBVyxRQUFRLEVBQUUsVUFBVSxXQUFXLFFBQVEsRUFBRSxTQUFTO0lBQy9ELE9BQU87O0dBRVIsR0FBRyxXQUFXLFFBQVEsRUFBRSxVQUFVLFdBQVcsUUFBUSxFQUFFLFNBQVM7SUFDL0QsT0FBTyxDQUFDOztHQUVULE9BQU87OztFQUdSLEdBQUcsU0FBUyxTQUFTO0VBQ3JCLE9BQU87OztBQUdUO0FDM0JBLElBQUksT0FBTyxXQUFXLFdBQVc7Q0FDaEMsT0FBTyxTQUFTLEtBQUs7RUFDcEIsSUFBSSxFQUFFLGVBQWUsU0FBUyxPQUFPO0VBQ3JDLE9BQU8sRUFBRSxJQUFJLEtBQUssU0FBUyxLQUFLLEtBQUs7R0FDcEMsT0FBTyxPQUFPLGVBQWUsS0FBSyxRQUFRLENBQUMsT0FBTzs7OztBQUlyRDtBQ1JBLElBQUksT0FBTyxjQUFjLFdBQVc7Q0FDbkMsT0FBTyxTQUFTLE9BQU87RUFDdEIsT0FBTyxNQUFNLE1BQU07O0dBRWxCIiwiZmlsZSI6InNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogb3duQ2xvdWQgLSBjb250YWN0c1xuICpcbiAqIFRoaXMgZmlsZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzIG9yXG4gKiBsYXRlci4gU2VlIHRoZSBDT1BZSU5HIGZpbGUuXG4gKlxuICogQGF1dGhvciBIZW5kcmlrIExlcHBlbHNhY2sgPGhlbmRyaWtAbGVwcGVsc2Fjay5kZT5cbiAqIEBjb3B5cmlnaHQgSGVuZHJpayBMZXBwZWxzYWNrIDIwMTVcbiAqL1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2NvbnRhY3RzQXBwJywgWyd1dWlkNCcsICdhbmd1bGFyLWNhY2hlJywgJ25nUm91dGUnLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNlbGVjdCcsICduZ1Nhbml0aXplJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG5cblx0JHJvdXRlUHJvdmlkZXIud2hlbignLzpnaWQnLCB7XG5cdFx0dGVtcGxhdGU6ICc8Y29udGFjdGRldGFpbHM+PC9jb250YWN0ZGV0YWlscz4nXG5cdH0pO1xuXG5cdCRyb3V0ZVByb3ZpZGVyLndoZW4oJy86Z2lkLzp1aWQnLCB7XG5cdFx0dGVtcGxhdGU6ICc8Y29udGFjdGRldGFpbHM+PC9jb250YWN0ZGV0YWlscz4nXG5cdH0pO1xuXG5cdCRyb3V0ZVByb3ZpZGVyLm90aGVyd2lzZSgnLycgKyB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGF0ZXBpY2tlcicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZSA6ICduZ01vZGVsJyxcblx0XHRsaW5rIDogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbEN0cmwpIHtcblx0XHRcdCQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGVsZW1lbnQuZGF0ZXBpY2tlcih7XG5cdFx0XHRcdFx0ZGF0ZUZvcm1hdDoneXktbW0tZGQnLFxuXHRcdFx0XHRcdG1pbkRhdGU6IG51bGwsXG5cdFx0XHRcdFx0bWF4RGF0ZTogbnVsbCxcblx0XHRcdFx0XHRvblNlbGVjdDpmdW5jdGlvbiAoZGF0ZSkge1xuXHRcdFx0XHRcdFx0bmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShkYXRlKTtcblx0XHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2ZvY3VzRXhwcmVzc2lvbicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazoge1xuXHRcdFx0cG9zdDogZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHNjb3BlLiR3YXRjaChhdHRycy5mb2N1c0V4cHJlc3Npb24sIGZ1bmN0aW9uICh2YWx1ZSkge1xuXG5cdFx0XHRcdFx0aWYgKGF0dHJzLmZvY3VzRXhwcmVzc2lvbikge1xuXHRcdFx0XHRcdFx0aWYgKHNjb3BlLiRldmFsKGF0dHJzLmZvY3VzRXhwcmVzc2lvbikpIHtcblx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChlbGVtZW50LmlzKCdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQuZmluZCgnaW5wdXQnKS5mb2N1cygpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSwgMTAwKTsgLy9uZWVkIHNvbWUgZGVsYXkgdG8gd29yayB3aXRoIG5nLWRpc2FibGVkXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdhZGRyZXNzYm9va0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIEFkZHJlc3NCb29rU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC51cmxCYXNlID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXHRjdHJsLnNob3dVcmwgPSBmYWxzZTtcblxuXHRjdHJsLnRvZ2dsZVNob3dVcmwgPSBmdW5jdGlvbigpIHtcblx0XHRjdHJsLnNob3dVcmwgPSAhY3RybC5zaG93VXJsO1xuXHR9O1xuXG5cdGN0cmwudG9nZ2xlU2hhcmVzRWRpdG9yID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vay5lZGl0aW5nU2hhcmVzID0gIWFkZHJlc3NCb29rLmVkaXRpbmdTaGFyZXM7XG5cdFx0YWRkcmVzc0Jvb2suc2VsZWN0ZWRTaGFyZWUgPSBudWxsO1xuXHR9O1xuXG5cdC8qIEZyb20gQ2FsZW5kYXItUmV3b3JrIC0ganMvYXBwL2NvbnRyb2xsZXJzL2NhbGVuZGFybGlzdGNvbnRyb2xsZXIuanMgKi9cblx0Y3RybC5maW5kU2hhcmVlID0gZnVuY3Rpb24gKHZhbCwgYWRkcmVzc0Jvb2spIHtcblx0XHRyZXR1cm4gJC5nZXQoXG5cdFx0XHRPQy5saW5rVG9PQ1MoJ2FwcHMvZmlsZXNfc2hhcmluZy9hcGkvdjEnKSArICdzaGFyZWVzJyxcblx0XHRcdHtcblx0XHRcdFx0Zm9ybWF0OiAnanNvbicsXG5cdFx0XHRcdHNlYXJjaDogdmFsLnRyaW0oKSxcblx0XHRcdFx0cGVyUGFnZTogMjAwLFxuXHRcdFx0XHRpdGVtVHlwZTogJ3ByaW5jaXBhbHMnXG5cdFx0XHR9XG5cdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0Ly8gVG9kbyAtIGZpbHRlciBvdXQgY3VycmVudCB1c2VyLCBleGlzdGluZyBzaGFyZWVzXG5cdFx0XHR2YXIgdXNlcnMgICA9IHJlc3VsdC5vY3MuZGF0YS5leGFjdC51c2Vycy5jb25jYXQocmVzdWx0Lm9jcy5kYXRhLnVzZXJzKTtcblx0XHRcdHZhciBncm91cHMgID0gcmVzdWx0Lm9jcy5kYXRhLmV4YWN0Lmdyb3Vwcy5jb25jYXQocmVzdWx0Lm9jcy5kYXRhLmdyb3Vwcyk7XG5cblx0XHRcdHZhciB1c2VyU2hhcmVzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2Vycztcblx0XHRcdHZhciBncm91cFNoYXJlcyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzO1xuXHRcdFx0dmFyIHVzZXJTaGFyZXNMZW5ndGggPSB1c2VyU2hhcmVzLmxlbmd0aDtcblx0XHRcdHZhciBncm91cFNoYXJlc0xlbmd0aCA9IGdyb3VwU2hhcmVzLmxlbmd0aDtcblx0XHRcdHZhciBpLCBqO1xuXG5cdFx0XHQvLyBGaWx0ZXIgb3V0IGN1cnJlbnQgdXNlclxuXHRcdFx0dmFyIHVzZXJzTGVuZ3RoID0gdXNlcnMubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMCA7IGkgPCB1c2Vyc0xlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh1c2Vyc1tpXS52YWx1ZS5zaGFyZVdpdGggPT09IE9DLmN1cnJlbnRVc2VyKSB7XG5cdFx0XHRcdFx0dXNlcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vdyBmaWx0ZXIgb3V0IGFsbCBzaGFyZWVzIHRoYXQgYXJlIGFscmVhZHkgc2hhcmVkIHdpdGhcblx0XHRcdGZvciAoaSA9IDA7IGkgPCB1c2VyU2hhcmVzTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIHNoYXJlID0gdXNlclNoYXJlc1tpXTtcblx0XHRcdFx0dXNlcnNMZW5ndGggPSB1c2Vycy5sZW5ndGg7XG5cdFx0XHRcdGZvciAoaiA9IDA7IGogPCB1c2Vyc0xlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYgKHVzZXJzW2pdLnZhbHVlLnNoYXJlV2l0aCA9PT0gc2hhcmUuaWQpIHtcblx0XHRcdFx0XHRcdHVzZXJzLnNwbGljZShqLCAxKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21iaW5lIHVzZXJzIGFuZCBncm91cHNcblx0XHRcdHVzZXJzID0gdXNlcnMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkaXNwbGF5OiBpdGVtLnZhbHVlLnNoYXJlV2l0aCxcblx0XHRcdFx0XHR0eXBlOiBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIsXG5cdFx0XHRcdFx0aWRlbnRpZmllcjogaXRlbS52YWx1ZS5zaGFyZVdpdGhcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXG5cdFx0XHRncm91cHMgPSBncm91cHMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkaXNwbGF5OiBpdGVtLnZhbHVlLnNoYXJlV2l0aCArICcgKGdyb3VwKScsXG5cdFx0XHRcdFx0dHlwZTogT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCxcblx0XHRcdFx0XHRpZGVudGlmaWVyOiBpdGVtLnZhbHVlLnNoYXJlV2l0aFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBncm91cHMuY29uY2F0KHVzZXJzKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLm9uU2VsZWN0U2hhcmVlID0gZnVuY3Rpb24gKGl0ZW0sIG1vZGVsLCBsYWJlbCwgYWRkcmVzc0Jvb2spIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rLnNlbGVjdGVkU2hhcmVlID0gbnVsbDtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc2hhcmUoYWRkcmVzc0Jvb2ssIGl0ZW0udHlwZSwgaXRlbS5pZGVudGlmaWVyLCBmYWxzZSwgZmFsc2UpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cblx0fTtcblxuXHRjdHJsLnVwZGF0ZUV4aXN0aW5nVXNlclNoYXJlID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHVzZXJJZCwgd3JpdGFibGUpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUiwgdXNlcklkLCB3cml0YWJsZSwgdHJ1ZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVwZGF0ZUV4aXN0aW5nR3JvdXBTaGFyZSA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBncm91cElkLCB3cml0YWJsZSkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCwgZ3JvdXBJZCwgd3JpdGFibGUsIHRydWUpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51bnNoYXJlRnJvbVVzZXIgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgdXNlcklkKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnVuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUiwgdXNlcklkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudW5zaGFyZUZyb21Hcm91cCA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBncm91cElkKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnVuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVAsIGdyb3VwSWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVBZGRyZXNzQm9vayA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmRlbGV0ZShhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhZGRyZXNzYm9vaycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdhZGRyZXNzYm9va0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGFkZHJlc3NCb29rOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvYWRkcmVzc0Jvb2suaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdhZGRyZXNzYm9va2xpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBBZGRyZXNzQm9va1NlcnZpY2UsIFNldHRpbmdzU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0Y3RybC5hZGRyZXNzQm9va3MgPSBhZGRyZXNzQm9va3M7XG5cdH0pO1xuXG5cdGN0cmwuY3JlYXRlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbigpIHtcblx0XHRpZihjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkge1xuXHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmNyZWF0ZShjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEFkZHJlc3NCb29rKGN0cmwubmV3QWRkcmVzc0Jvb2tOYW1lKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0Y3RybC5hZGRyZXNzQm9va3MucHVzaChhZGRyZXNzQm9vayk7XG5cdFx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWRkcmVzc2Jvb2tsaXN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdhZGRyZXNzYm9va2xpc3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvYWRkcmVzc0Jvb2tMaXN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdEN0cmwnLCBmdW5jdGlvbigkcm91dGUsICRyb3V0ZVBhcmFtcykge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5vcGVuQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0dWlkOiBjdHJsLmNvbnRhY3QudWlkKCl9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdGRldGFpbHNDdHJsJywgZnVuY3Rpb24oQ29udGFjdFNlcnZpY2UsIEFkZHJlc3NCb29rU2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSwgJHJvdXRlUGFyYW1zLCAkc2NvcGUpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwudWlkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0Y3RybC50ID0ge1xuXHRcdG5vQ29udGFjdHMgOiB0KCdjb250YWN0cycsICdObyBjb250YWN0cyBpbiBoZXJlJyksXG5cdFx0cGxhY2Vob2xkZXJOYW1lIDogdCgnY29udGFjdHMnLCAnTmFtZScpLFxuXHRcdHBsYWNlaG9sZGVyT3JnIDogdCgnY29udGFjdHMnLCAnT3JnYW5pemF0aW9uJyksXG5cdFx0cGxhY2Vob2xkZXJUaXRsZSA6IHQoJ2NvbnRhY3RzJywgJ1RpdGxlJyksXG5cdFx0c2VsZWN0RmllbGQgOiB0KCdjb250YWN0cycsICdBZGQgZmllbGQgLi4uJylcblx0fTtcblxuXHRjdHJsLmZpZWxkRGVmaW5pdGlvbnMgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmZpZWxkRGVmaW5pdGlvbnM7XG5cdGN0cmwuZm9jdXMgPSB1bmRlZmluZWQ7XG5cdGN0cmwuZmllbGQgPSB1bmRlZmluZWQ7XG5cdCRzY29wZS5hZGRyZXNzQm9va3MgPSBbXTtcblx0Y3RybC5hZGRyZXNzQm9va3MgPSBbXTtcblxuXHRBZGRyZXNzQm9va1NlcnZpY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rcyA9IGFkZHJlc3NCb29rcztcblx0XHQkc2NvcGUuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWQ6IGVsZW1lbnQuZGlzcGxheU5hbWUsXG5cdFx0XHRcdG5hbWU6IGVsZW1lbnQuZGlzcGxheU5hbWVcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0aWYgKCFfLmlzVW5kZWZpbmVkKGN0cmwuY29udGFjdCkpIHtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcblx0XHRjdHJsLmNoYW5nZUNvbnRhY3QobmV3VmFsdWUpO1xuXHR9KTtcblxuXHRjdHJsLmNoYW5nZUNvbnRhY3QgPSBmdW5jdGlvbih1aWQpIHtcblx0XHRpZiAodHlwZW9mIHVpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Q29udGFjdFNlcnZpY2UuZ2V0QnlJZCh1aWQpLnRoZW4oZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdFx0Y3RybC5jb250YWN0ID0gY29udGFjdDtcblx0XHRcdGN0cmwucGhvdG8gPSBjdHJsLmNvbnRhY3QucGhvdG8oKTtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudXBkYXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLnVwZGF0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLmRlbGV0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuYWRkRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuXHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRjdHJsLmNvbnRhY3QuYWRkUHJvcGVydHkoZmllbGQsIGRlZmF1bHRWYWx1ZSk7XG5cdFx0Y3RybC5mb2N1cyA9IGZpZWxkO1xuXHRcdGN0cmwuZmllbGQgPSAnJztcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUZpZWxkID0gZnVuY3Rpb24gKGZpZWxkLCBwcm9wKSB7XG5cdFx0Y3RybC5jb250YWN0LnJlbW92ZVByb3BlcnR5KGZpZWxkLCBwcm9wKTtcblx0XHRjdHJsLmZvY3VzID0gdW5kZWZpbmVkO1xuXHR9O1xuXG5cdGN0cmwuY2hhbmdlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbiAoYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vayA9IF8uZmluZChjdHJsLmFkZHJlc3NCb29rcywgZnVuY3Rpb24oYm9vaykge1xuXHRcdFx0cmV0dXJuIGJvb2suZGlzcGxheU5hbWUgPT09IGFkZHJlc3NCb29rLmlkO1xuXHRcdH0pO1xuXHRcdENvbnRhY3RTZXJ2aWNlLm1vdmVDb250YWN0KGN0cmwuY29udGFjdCwgYWRkcmVzc0Jvb2spO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdjb250YWN0ZGV0YWlscycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHByaW9yaXR5OiAxLFxuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdGRldGFpbHNDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvY29udGFjdERldGFpbHMuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjb250YWN0bGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRmaWx0ZXIsICRyb3V0ZSwgJHJvdXRlUGFyYW1zLCBDb250YWN0U2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSwgU2VhcmNoU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5yb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtcztcblx0Y3RybC50ID0ge1xuXHRcdGFkZENvbnRhY3QgOiB0KCdjb250YWN0cycsICdBZGQgY29udGFjdCcpLFxuXHRcdGVtcHR5U2VhcmNoIDogdCgnY29udGFjdHMnLCAnTm8gc2VhcmNoIHJlc3VsdCBmb3Ige2N0cmwucXVlcnl9Jylcblx0fTtcblxuXHRjdHJsLmNvbnRhY3RMaXN0ID0gW107XG5cdGN0cmwucXVlcnkgPSAnJztcblx0Y3RybC5zZWxlY3RlZENvbnRhY3RJZCA9IHVuZGVmaW5lZDtcblxuXHQkc2NvcGUucXVlcnkgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0cmV0dXJuIGNvbnRhY3QubWF0Y2hlcyhTZWFyY2hTZXJ2aWNlLmdldFNlYXJjaFRlcm0oKSk7XG5cdH07XG5cblx0U2VhcmNoU2VydmljZS5yZWdpc3Rlck9ic2VydmVyQ2FsbGJhY2soZnVuY3Rpb24oZXYpIHtcblx0XHRpZiAoZXYuZXZlbnQgPT09ICdzdWJtaXRTZWFyY2gnKSB7XG5cdFx0XHR2YXIgdWlkID0gIV8uaXNFbXB0eShjdHJsLmNvbnRhY3RMaXN0KSA/IGN0cmwuY29udGFjdExpc3RbMF0udWlkKCkgOiB1bmRlZmluZWQ7XG5cdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0dWlkOiB1aWRcblx0XHRcdH0pO1xuXHRcdFx0Y3RybC5zZWxlY3RlZENvbnRhY3RJZCA9IHVpZDtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9XG5cdFx0aWYgKGV2LmV2ZW50ID09PSAnY2hhbmdlU2VhcmNoJykge1xuXHRcdFx0Y3RybC5xdWVyeSA9IGV2LnNlYXJjaFRlcm07XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fVxuXHR9KTtcblxuXHRDb250YWN0U2VydmljZS5yZWdpc3Rlck9ic2VydmVyQ2FsbGJhY2soZnVuY3Rpb24oZXYpIHtcblx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGV2LmV2ZW50ID09PSAnZGVsZXRlJykge1xuXHRcdFx0XHRpZiAoY3RybC5jb250YWN0TGlzdC5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHRcdHVpZDogdW5kZWZpbmVkXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGN0cmwuY29udGFjdExpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGlmIChjdHJsLmNvbnRhY3RMaXN0W2ldLnVpZCgpID09PSBldi51aWQpIHtcblx0XHRcdFx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdFx0XHRcdHVpZDogKGN0cmwuY29udGFjdExpc3RbaSsxXSkgPyBjdHJsLmNvbnRhY3RMaXN0W2krMV0udWlkKCkgOiBjdHJsLmNvbnRhY3RMaXN0W2ktMV0udWlkKClcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoZXYuZXZlbnQgPT09ICdjcmVhdGUnKSB7XG5cdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHR1aWQ6IGV2LnVpZFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGN0cmwuY29udGFjdHMgPSBldi5jb250YWN0cztcblx0XHR9KTtcblx0fSk7XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihjb250YWN0cykge1xuXHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRjdHJsLmNvbnRhY3RzID0gY29udGFjdHM7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdCRzY29wZS4kd2F0Y2goJ2N0cmwucm91dGVQYXJhbXMudWlkJywgZnVuY3Rpb24obmV3VmFsdWUpIHtcblx0XHRpZihuZXdWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQvLyB3ZSBtaWdodCBoYXZlIHRvIHdhaXQgdW50aWwgbmctcmVwZWF0IGZpbGxlZCB0aGUgY29udGFjdExpc3Rcblx0XHRcdGlmKGN0cmwuY29udGFjdExpc3QgJiYgY3RybC5jb250YWN0TGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHR1aWQ6IGN0cmwuY29udGFjdExpc3RbMF0udWlkKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyB3YXRjaCBmb3IgbmV4dCBjb250YWN0TGlzdCB1cGRhdGVcblx0XHRcdFx0dmFyIHVuYmluZFdhdGNoID0gJHNjb3BlLiR3YXRjaCgnY3RybC5jb250YWN0TGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKGN0cmwuY29udGFjdExpc3QgJiYgY3RybC5jb250YWN0TGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdFx0XHR1aWQ6IGN0cmwuY29udGFjdExpc3RbMF0udWlkKClcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR1bmJpbmRXYXRjaCgpOyAvLyB1bmJpbmQgYXMgd2Ugb25seSB3YW50IG9uZSB1cGRhdGVcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQkc2NvcGUuJHdhdGNoKCdjdHJsLnJvdXRlUGFyYW1zLmdpZCcsIGZ1bmN0aW9uKCkge1xuXHRcdC8vIHdlIG1pZ2h0IGhhdmUgdG8gd2FpdCB1bnRpbCBuZy1yZXBlYXQgZmlsbGVkIHRoZSBjb250YWN0TGlzdFxuXHRcdGN0cmwuY29udGFjdExpc3QgPSBbXTtcblx0XHQvLyB3YXRjaCBmb3IgbmV4dCBjb250YWN0TGlzdCB1cGRhdGVcblx0XHR2YXIgdW5iaW5kV2F0Y2ggPSAkc2NvcGUuJHdhdGNoKCdjdHJsLmNvbnRhY3RMaXN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZihjdHJsLmNvbnRhY3RMaXN0ICYmIGN0cmwuY29udGFjdExpc3QubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0dWlkOiBjdHJsLmNvbnRhY3RMaXN0WzBdLnVpZCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0dW5iaW5kV2F0Y2goKTsgLy8gdW5iaW5kIGFzIHdlIG9ubHkgd2FudCBvbmUgdXBkYXRlXG5cdFx0fSk7XG5cdH0pO1xuXG5cdGN0cmwuY3JlYXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLmNyZWF0ZSgpLnRoZW4oZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdFx0Wyd0ZWwnLCAnYWRyJywgJ2VtYWlsJ10uZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuXHRcdFx0XHR2YXIgZGVmYXVsdFZhbHVlID0gdkNhcmRQcm9wZXJ0aWVzU2VydmljZS5nZXRNZXRhKGZpZWxkKS5kZWZhdWx0VmFsdWUgfHwge3ZhbHVlOiAnJ307XG5cdFx0XHRcdGNvbnRhY3QuYWRkUHJvcGVydHkoZmllbGQsIGRlZmF1bHRWYWx1ZSk7XG5cdFx0XHR9ICk7XG5cdFx0XHRpZiAoJHJvdXRlUGFyYW1zLmdpZCAhPT0gdCgnY29udGFjdHMnLCAnQWxsIGNvbnRhY3RzJykpIHtcblx0XHRcdFx0Y29udGFjdC5jYXRlZ29yaWVzKCRyb3V0ZVBhcmFtcy5naWQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29udGFjdC5jYXRlZ29yaWVzKCcnKTtcblx0XHRcdH1cblx0XHRcdCQoJyNkZXRhaWxzLWZ1bGxOYW1lJykuZm9jdXMoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLmhhc0NvbnRhY3RzID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICghY3RybC5jb250YWN0cykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gY3RybC5jb250YWN0cy5sZW5ndGggPiAwO1xuXHR9O1xuXG5cdCRzY29wZS5zZWxlY3RlZENvbnRhY3RJZCA9ICRyb3V0ZVBhcmFtcy51aWQ7XG5cdCRzY29wZS5zZXRTZWxlY3RlZCA9IGZ1bmN0aW9uIChzZWxlY3RlZENvbnRhY3RJZCkge1xuXHRcdCRzY29wZS5zZWxlY3RlZENvbnRhY3RJZCA9IHNlbGVjdGVkQ29udGFjdElkO1xuXHR9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2NvbnRhY3RsaXN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cHJpb3JpdHk6IDEsXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdjb250YWN0bGlzdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGFkZHJlc3Nib29rOiAnPWFkcmJvb2snXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvY29udGFjdExpc3QuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdkZXRhaWxzSXRlbUN0cmwnLCBmdW5jdGlvbigkdGVtcGxhdGVSZXF1ZXN0LCB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLCBDb250YWN0U2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5tZXRhID0gdkNhcmRQcm9wZXJ0aWVzU2VydmljZS5nZXRNZXRhKGN0cmwubmFtZSk7XG5cdGN0cmwudHlwZSA9IHVuZGVmaW5lZDtcblx0Y3RybC50ID0ge1xuXHRcdHBvQm94IDogdCgnY29udGFjdHMnLCAnUG9zdCBPZmZpY2UgQm94JyksXG5cdFx0cG9zdGFsQ29kZSA6IHQoJ2NvbnRhY3RzJywgJ1Bvc3RhbCBDb2RlJyksXG5cdFx0Y2l0eSA6IHQoJ2NvbnRhY3RzJywgJ0NpdHknKSxcblx0XHRzdGF0ZSA6IHQoJ2NvbnRhY3RzJywgJ1N0YXRlIG9yIHByb3ZpbmNlJyksXG5cdFx0Y291bnRyeSA6IHQoJ2NvbnRhY3RzJywgJ0NvdW50cnknKSxcblx0XHRhZGRyZXNzOiB0KCdjb250YWN0cycsICdBZGRyZXNzJyksXG5cdFx0bmV3R3JvdXA6IHQoJ2NvbnRhY3RzJywgJyhuZXcgZ3JvdXApJylcblx0fTtcblxuXHRjdHJsLmF2YWlsYWJsZU9wdGlvbnMgPSBjdHJsLm1ldGEub3B0aW9ucyB8fCBbXTtcblx0aWYgKCFfLmlzVW5kZWZpbmVkKGN0cmwuZGF0YSkgJiYgIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhLm1ldGEpICYmICFfLmlzVW5kZWZpbmVkKGN0cmwuZGF0YS5tZXRhLnR5cGUpKSB7XG5cdFx0Y3RybC50eXBlID0gY3RybC5kYXRhLm1ldGEudHlwZVswXTtcblx0XHRpZiAoIWN0cmwuYXZhaWxhYmxlT3B0aW9ucy5zb21lKGZ1bmN0aW9uKGUpIHsgcmV0dXJuIGUuaWQgPT09IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF07IH0gKSkge1xuXHRcdFx0Y3RybC5hdmFpbGFibGVPcHRpb25zID0gY3RybC5hdmFpbGFibGVPcHRpb25zLmNvbmNhdChbe2lkOiBjdHJsLmRhdGEubWV0YS50eXBlWzBdLCBuYW1lOiBjdHJsLmRhdGEubWV0YS50eXBlWzBdfV0pO1xuXHRcdH1cblx0fVxuXHRjdHJsLmF2YWlsYWJsZUdyb3VwcyA9IFtdO1xuXG5cdENvbnRhY3RTZXJ2aWNlLmdldEdyb3VwcygpLnRoZW4oZnVuY3Rpb24oZ3JvdXBzKSB7XG5cdFx0Y3RybC5hdmFpbGFibGVHcm91cHMgPSBfLnVuaXF1ZShncm91cHMpO1xuXHR9KTtcblxuXHRjdHJsLmNoYW5nZVR5cGUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdFx0Y3RybC5kYXRhLm1ldGEgPSBjdHJsLmRhdGEubWV0YSB8fCB7fTtcblx0XHRjdHJsLmRhdGEubWV0YS50eXBlID0gY3RybC5kYXRhLm1ldGEudHlwZSB8fCBbXTtcblx0XHRjdHJsLmRhdGEubWV0YS50eXBlWzBdID0gdmFsO1xuXHRcdGN0cmwubW9kZWwudXBkYXRlQ29udGFjdCgpO1xuXHR9O1xuXG5cdGN0cmwuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGVtcGxhdGVVcmwgPSBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9kZXRhaWxJdGVtcy8nICsgY3RybC5tZXRhLnRlbXBsYXRlICsgJy5odG1sJyk7XG5cdFx0cmV0dXJuICR0ZW1wbGF0ZVJlcXVlc3QodGVtcGxhdGVVcmwpO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Y3RybC5tb2RlbC5kZWxldGVGaWVsZChjdHJsLm5hbWUsIGN0cmwuZGF0YSk7XG5cdFx0Y3RybC5tb2RlbC51cGRhdGVDb250YWN0KCk7XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2RldGFpbHNpdGVtJywgWyckY29tcGlsZScsIGZ1bmN0aW9uKCRjb21waWxlKSB7XG5cdHJldHVybiB7XG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdkZXRhaWxzSXRlbUN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdG5hbWU6ICc9Jyxcblx0XHRcdGRhdGE6ICc9Jyxcblx0XHRcdG1vZGVsOiAnPSdcblx0XHR9LFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY3RybCkge1xuXHRcdFx0Y3RybC5nZXRUZW1wbGF0ZSgpLnRoZW4oZnVuY3Rpb24oaHRtbCkge1xuXHRcdFx0XHR2YXIgdGVtcGxhdGUgPSBhbmd1bGFyLmVsZW1lbnQoaHRtbCk7XG5cdFx0XHRcdGVsZW1lbnQuYXBwZW5kKHRlbXBsYXRlKTtcblx0XHRcdFx0JGNvbXBpbGUodGVtcGxhdGUpKHNjb3BlKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn1dKTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cEN0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdncm91cEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGdyb3VwOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvZ3JvdXAuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cGxpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBDb250YWN0U2VydmljZSwgU2VhcmNoU2VydmljZSwgJHJvdXRlUGFyYW1zKSB7XG5cblx0JHNjb3BlLmdyb3VwcyA9IFt0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSwgdCgnY29udGFjdHMnLCAnTm90IGdyb3VwZWQnKV07XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHQkc2NvcGUuZ3JvdXBzID0gXy51bmlxdWUoW3QoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpLCB0KCdjb250YWN0cycsICdOb3QgZ3JvdXBlZCcpXS5jb25jYXQoZ3JvdXBzKSk7XG5cdH0pO1xuXG5cdCRzY29wZS5zZWxlY3RlZEdyb3VwID0gJHJvdXRlUGFyYW1zLmdpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkR3JvdXApIHtcblx0XHRTZWFyY2hTZXJ2aWNlLmNsZWFuU2VhcmNoKCk7XG5cdFx0JHNjb3BlLnNlbGVjdGVkR3JvdXAgPSBzZWxlY3RlZEdyb3VwO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cGxpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0VBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2dyb3VwbGlzdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9ncm91cExpc3QuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyb3VwTW9kZWwnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG5cdHJldHVybntcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHJlcXVpcmU6ICduZ01vZGVsJyxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0ciwgbmdNb2RlbCkge1xuXHRcdFx0bmdNb2RlbC4kZm9ybWF0dGVycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmICh2YWx1ZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWx1ZS5zcGxpdCgnLCcpO1xuXHRcdFx0fSk7XG5cdFx0XHRuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlLmpvaW4oJywnKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgndGVsTW9kZWwnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJue1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZTogJ25nTW9kZWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyLCBuZ01vZGVsKSB7XG5cdFx0XHRuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0XHRuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnQWRkcmVzc0Jvb2snLCBmdW5jdGlvbigpXG57XG5cdHJldHVybiBmdW5jdGlvbiBBZGRyZXNzQm9vayhkYXRhKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXG5cdFx0XHRkaXNwbGF5TmFtZTogJycsXG5cdFx0XHRjb250YWN0czogW10sXG5cdFx0XHRncm91cHM6IGRhdGEuZGF0YS5wcm9wcy5ncm91cHMsXG5cblx0XHRcdGdldENvbnRhY3Q6IGZ1bmN0aW9uKHVpZCkge1xuXHRcdFx0XHRmb3IodmFyIGkgaW4gdGhpcy5jb250YWN0cykge1xuXHRcdFx0XHRcdGlmKHRoaXMuY29udGFjdHNbaV0udWlkKCkgPT09IHVpZCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuY29udGFjdHNbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHR9LFxuXG5cdFx0XHRzaGFyZWRXaXRoOiB7XG5cdFx0XHRcdHVzZXJzOiBbXSxcblx0XHRcdFx0Z3JvdXBzOiBbXVxuXHRcdFx0fVxuXG5cdFx0fSk7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXHRcdFx0b3duZXI6IGRhdGEudXJsLnNwbGl0KCcvJykuc2xpY2UoLTMsIC0yKVswXVxuXHRcdH0pO1xuXG5cdFx0dmFyIHNoYXJlcyA9IHRoaXMuZGF0YS5wcm9wcy5pbnZpdGU7XG5cdFx0aWYgKHR5cGVvZiBzaGFyZXMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHNoYXJlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHR2YXIgaHJlZiA9IHNoYXJlc1tqXS5ocmVmO1xuXHRcdFx0XHRpZiAoaHJlZi5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgYWNjZXNzID0gc2hhcmVzW2pdLmFjY2Vzcztcblx0XHRcdFx0aWYgKGFjY2Vzcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciByZWFkV3JpdGUgPSAodHlwZW9mIGFjY2Vzcy5yZWFkV3JpdGUgIT09ICd1bmRlZmluZWQnKTtcblxuXHRcdFx0XHRpZiAoaHJlZi5zdGFydHNXaXRoKCdwcmluY2lwYWw6cHJpbmNpcGFscy91c2Vycy8nKSkge1xuXHRcdFx0XHRcdHRoaXMuc2hhcmVkV2l0aC51c2Vycy5wdXNoKHtcblx0XHRcdFx0XHRcdGlkOiBocmVmLnN1YnN0cigyNyksXG5cdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogaHJlZi5zdWJzdHIoMjcpLFxuXHRcdFx0XHRcdFx0d3JpdGFibGU6IHJlYWRXcml0ZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGhyZWYuc3RhcnRzV2l0aCgncHJpbmNpcGFsOnByaW5jaXBhbHMvZ3JvdXBzLycpKSB7XG5cdFx0XHRcdFx0dGhpcy5zaGFyZWRXaXRoLmdyb3Vwcy5wdXNoKHtcblx0XHRcdFx0XHRcdGlkOiBocmVmLnN1YnN0cigyOCksXG5cdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogaHJlZi5zdWJzdHIoMjgpLFxuXHRcdFx0XHRcdFx0d3JpdGFibGU6IHJlYWRXcml0ZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly92YXIgb3duZXIgPSB0aGlzLmRhdGEucHJvcHMub3duZXI7XG5cdFx0Ly9pZiAodHlwZW9mIG93bmVyICE9PSAndW5kZWZpbmVkJyAmJiBvd25lci5sZW5ndGggIT09IDApIHtcblx0XHQvL1x0b3duZXIgPSBvd25lci50cmltKCk7XG5cdFx0Ly9cdGlmIChvd25lci5zdGFydHNXaXRoKCcvcmVtb3RlLnBocC9kYXYvcHJpbmNpcGFscy91c2Vycy8nKSkge1xuXHRcdC8vXHRcdHRoaXMuX3Byb3BlcnRpZXMub3duZXIgPSBvd25lci5zdWJzdHIoMzMpO1xuXHRcdC8vXHR9XG5cdFx0Ly99XG5cblx0fTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NvbnRhY3QnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG5cdHJldHVybiBmdW5jdGlvbiBDb250YWN0KGFkZHJlc3NCb29rLCB2Q2FyZCkge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcblxuXHRcdFx0ZGF0YToge30sXG5cdFx0XHRwcm9wczoge30sXG5cblx0XHRcdGFkZHJlc3NCb29rSWQ6IGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lLFxuXG5cdFx0XHR1aWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgndWlkJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0UHJvcGVydHkoJ3VpZCcpLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRmdWxsTmFtZTogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdmbicsIHsgdmFsdWU6IHZhbHVlIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2ZuJyk7XG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdHRpdGxlOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ3RpdGxlJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgndGl0bGUnKTtcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0b3JnOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdvcmcnKTtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdHZhciB2YWwgPSB2YWx1ZTtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSAmJiBBcnJheS5pc0FycmF5KHByb3BlcnR5LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0dmFsID0gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0XHR2YWxbMF0gPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ29yZycsIHsgdmFsdWU6IHZhbCB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocHJvcGVydHkudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZVswXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGVtYWlsOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2VtYWlsJyk7XG5cdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdHBob3RvOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgncGhvdG8nKTtcblx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0Y2F0ZWdvcmllczogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdjYXRlZ29yaWVzJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRcdGlmKHByb3BlcnR5ICYmIHByb3BlcnR5LnZhbHVlLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZS5zcGxpdCgnLCcpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRnZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0XHRpZiAodGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByb3BzW25hbWVdWzBdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhZGRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRkYXRhID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgaWR4ID0gdGhpcy5wcm9wc1tuYW1lXS5sZW5ndGg7XG5cdFx0XHRcdHRoaXMucHJvcHNbbmFtZV1baWR4XSA9IGRhdGE7XG5cblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdFx0cmV0dXJuIGlkeDtcblx0XHRcdH0sXG5cdFx0XHRzZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnByb3BzW25hbWVdWzBdID0gZGF0YTtcblxuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHJlbW92ZVByb3BlcnR5OiBmdW5jdGlvbiAobmFtZSwgcHJvcCkge1xuXHRcdFx0XHRhbmd1bGFyLmNvcHkoXy53aXRob3V0KHRoaXMucHJvcHNbbmFtZV0sIHByb3ApLCB0aGlzLnByb3BzW25hbWVdKTtcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHNldEVUYWc6IGZ1bmN0aW9uKGV0YWcpIHtcblx0XHRcdFx0dGhpcy5kYXRhLmV0YWcgPSBldGFnO1xuXHRcdFx0fSxcblx0XHRcdHNldFVybDogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHVpZCkge1xuXHRcdFx0XHR0aGlzLmRhdGEudXJsID0gYWRkcmVzc0Jvb2sudXJsICsgdWlkICsgJy52Y2YnO1xuXHRcdFx0fSxcblxuXHRcdFx0c3luY1ZDYXJkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdH0sXG5cblx0XHRcdG1hdGNoZXM6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcblx0XHRcdFx0aWYgKF8uaXNVbmRlZmluZWQocGF0dGVybikgfHwgcGF0dGVybi5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLmFkZHJlc3NEYXRhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihwYXR0ZXJuLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcblx0XHRcdH1cblxuXHRcdH0pO1xuXG5cdFx0aWYoYW5ndWxhci5pc0RlZmluZWQodkNhcmQpKSB7XG5cdFx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLmRhdGEsIHZDYXJkKTtcblx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMucHJvcHMsICRmaWx0ZXIoJ3ZDYXJkMkpTT04nKSh0aGlzLmRhdGEuYWRkcmVzc0RhdGEpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YW5ndWxhci5leHRlbmQodGhpcy5wcm9wcywge1xuXHRcdFx0XHR2ZXJzaW9uOiBbe3ZhbHVlOiAnMy4wJ31dLFxuXHRcdFx0XHRmbjogW3t2YWx1ZTogJyd9XVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0fVxuXG5cdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnY2F0ZWdvcmllcycpO1xuXHRcdGlmKCFwcm9wZXJ0eSkge1xuXHRcdFx0dGhpcy5jYXRlZ29yaWVzKCcnKTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdBZGRyZXNzQm9va1NlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQsIERhdlNlcnZpY2UsIFNldHRpbmdzU2VydmljZSwgQWRkcmVzc0Jvb2ssIENvbnRhY3QpIHtcblxuXHR2YXIgYWRkcmVzc0Jvb2tzID0gW107XG5cblx0dmFyIGxvYWRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdGFkZHJlc3NCb29rcyA9IGFjY291bnQuYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRyZXR1cm4gbmV3IEFkZHJlc3NCb29rKGFkZHJlc3NCb29rKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0QWxsOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBsb2FkQWxsKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rcztcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXRHcm91cHM6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0XHRcdHJldHVybiBhZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuZ3JvdXBzO1xuXHRcdFx0XHR9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuXHRcdFx0XHRcdHJldHVybiBhLmNvbmNhdChiKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Z2V0RW5hYmxlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIGFjY291bnQuYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdHJldHVybiBuZXcgQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXREZWZhdWx0QWRkcmVzc0Jvb2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rc1swXTtcblx0XHR9LFxuXG5cdFx0Z2V0QWRkcmVzc0Jvb2s6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5nZXRBZGRyZXNzQm9vayh7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0YWRkcmVzc0Jvb2sgPSBuZXcgQWRkcmVzc0Jvb2soe1xuXHRcdFx0XHRcdFx0dXJsOiBhZGRyZXNzQm9va1swXS5ocmVmLFxuXHRcdFx0XHRcdFx0ZGF0YTogYWRkcmVzc0Jvb2tbMF1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRhZGRyZXNzQm9vay5kaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lO1xuXHRcdFx0XHRcdHJldHVybiBhZGRyZXNzQm9vaztcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlOiBmdW5jdGlvbihkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQWRkcmVzc0Jvb2soe2Rpc3BsYXlOYW1lOmRpc3BsYXlOYW1lLCB1cmw6YWNjb3VudC5ob21lVXJsfSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlOiBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQuZGVsZXRlQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0YW5ndWxhci5jb3B5KF8ud2l0aG91dChhZGRyZXNzQm9va3MsIGFkZHJlc3NCb29rKSwgYWRkcmVzc0Jvb2tzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0cmVuYW1lOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LnJlbmFtZUFkZHJlc3NCb29rKGFkZHJlc3NCb29rLCB7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXQ6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzLmZpbHRlcihmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50LmRpc3BsYXlOYW1lID09PSBkaXNwbGF5TmFtZTtcblx0XHRcdFx0fSlbMF07XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0c3luYzogZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdHJldHVybiBEYXZDbGllbnQuc3luY0FkZHJlc3NCb29rKGFkZHJlc3NCb29rKTtcblx0XHR9LFxuXG5cdFx0c2hhcmU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBzaGFyZVR5cGUsIHNoYXJlV2l0aCwgd3JpdGFibGUsIGV4aXN0aW5nU2hhcmUpIHtcblx0XHRcdHZhciB4bWxEb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudCgnJywgJycsIG51bGwpO1xuXHRcdFx0dmFyIG9TaGFyZSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnNoYXJlJyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpkJywgJ0RBVjonKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOm8nLCAnaHR0cDovL293bmNsb3VkLm9yZy9ucycpO1xuXHRcdFx0eG1sRG9jLmFwcGVuZENoaWxkKG9TaGFyZSk7XG5cblx0XHRcdHZhciBvU2V0ID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2V0Jyk7XG5cdFx0XHRvU2hhcmUuYXBwZW5kQ2hpbGQob1NldCk7XG5cblx0XHRcdHZhciBkSHJlZiA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdkOmhyZWYnKTtcblx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy91c2Vycy8nO1xuXHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvZ3JvdXBzLyc7XG5cdFx0XHR9XG5cdFx0XHRkSHJlZi50ZXh0Q29udGVudCArPSBzaGFyZVdpdGg7XG5cdFx0XHRvU2V0LmFwcGVuZENoaWxkKGRIcmVmKTtcblxuXHRcdFx0dmFyIG9TdW1tYXJ5ID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c3VtbWFyeScpO1xuXHRcdFx0b1N1bW1hcnkudGV4dENvbnRlbnQgPSB0KCdjb250YWN0cycsICd7YWRkcmVzc2Jvb2t9IHNoYXJlZCBieSB7b3duZXJ9Jywge1xuXHRcdFx0XHRhZGRyZXNzYm9vazogYWRkcmVzc0Jvb2suZGlzcGxheU5hbWUsXG5cdFx0XHRcdG93bmVyOiBhZGRyZXNzQm9vay5vd25lclxuXHRcdFx0fSk7XG5cdFx0XHRvU2V0LmFwcGVuZENoaWxkKG9TdW1tYXJ5KTtcblxuXHRcdFx0aWYgKHdyaXRhYmxlKSB7XG5cdFx0XHRcdHZhciBvUlcgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpyZWFkLXdyaXRlJyk7XG5cdFx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQob1JXKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGJvZHkgPSBvU2hhcmUub3V0ZXJIVE1MO1xuXG5cdFx0XHRyZXR1cm4gRGF2Q2xpZW50Lnhoci5zZW5kKFxuXHRcdFx0XHRkYXYucmVxdWVzdC5iYXNpYyh7bWV0aG9kOiAnUE9TVCcsIGRhdGE6IGJvZHl9KSxcblx0XHRcdFx0YWRkcmVzc0Jvb2sudXJsXG5cdFx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0aWYgKCFleGlzdGluZ1NoYXJlKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2Vycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRpZDogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0d3JpdGFibGU6IHdyaXRhYmxlXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdHdyaXRhYmxlOiB3cml0YWJsZVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fSxcblxuXHRcdHVuc2hhcmU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBzaGFyZVR5cGUsIHNoYXJlV2l0aCkge1xuXHRcdFx0dmFyIHhtbERvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KCcnLCAnJywgbnVsbCk7XG5cdFx0XHR2YXIgb1NoYXJlID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2hhcmUnKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOmQnLCAnREFWOicpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6bycsICdodHRwOi8vb3duY2xvdWQub3JnL25zJyk7XG5cdFx0XHR4bWxEb2MuYXBwZW5kQ2hpbGQob1NoYXJlKTtcblxuXHRcdFx0dmFyIG9SZW1vdmUgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpyZW1vdmUnKTtcblx0XHRcdG9TaGFyZS5hcHBlbmRDaGlsZChvUmVtb3ZlKTtcblxuXHRcdFx0dmFyIGRIcmVmID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ2Q6aHJlZicpO1xuXHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLyc7XG5cdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJztcblx0XHRcdH1cblx0XHRcdGRIcmVmLnRleHRDb250ZW50ICs9IHNoYXJlV2l0aDtcblx0XHRcdG9SZW1vdmUuYXBwZW5kQ2hpbGQoZEhyZWYpO1xuXHRcdFx0dmFyIGJvZHkgPSBvU2hhcmUub3V0ZXJIVE1MO1xuXG5cblx0XHRcdHJldHVybiBEYXZDbGllbnQueGhyLnNlbmQoXG5cdFx0XHRcdGRhdi5yZXF1ZXN0LmJhc2ljKHttZXRob2Q6ICdQT1NUJywgZGF0YTogYm9keX0pLFxuXHRcdFx0XHRhZGRyZXNzQm9vay51cmxcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0XHRcdGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzLmZpbHRlcihmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB1c2VyLmlkICE9PSBzaGFyZVdpdGg7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3Vwcy5maWx0ZXIoZnVuY3Rpb24oZ3JvdXBzKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBncm91cHMuaWQgIT09IHNoYXJlV2l0aDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL3RvZG8gLSByZW1vdmUgZW50cnkgZnJvbSBhZGRyZXNzYm9vayBvYmplY3Rcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fVxuXG5cblx0fTtcblxufSk7XG4iLCJ2YXIgY29udGFjdHM7XG5hcHAuc2VydmljZSgnQ29udGFjdFNlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQsIEFkZHJlc3NCb29rU2VydmljZSwgQ29udGFjdCwgJHEsIENhY2hlRmFjdG9yeSwgdXVpZDQpIHtcblxuXHR2YXIgY2FjaGVGaWxsZWQgPSBmYWxzZTtcblxuXHRjb250YWN0cyA9IENhY2hlRmFjdG9yeSgnY29udGFjdHMnKTtcblxuXHR2YXIgb2JzZXJ2ZXJDYWxsYmFja3MgPSBbXTtcblxuXHR0aGlzLnJlZ2lzdGVyT2JzZXJ2ZXJDYWxsYmFjayA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0b2JzZXJ2ZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdH07XG5cblx0dmFyIG5vdGlmeU9ic2VydmVycyA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgdWlkKSB7XG5cdFx0dmFyIGV2ID0ge1xuXHRcdFx0ZXZlbnQ6IGV2ZW50TmFtZSxcblx0XHRcdHVpZDogdWlkLFxuXHRcdFx0Y29udGFjdHM6IGNvbnRhY3RzLnZhbHVlcygpXG5cdFx0fTtcblx0XHRhbmd1bGFyLmZvckVhY2gob2JzZXJ2ZXJDYWxsYmFja3MsIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjayhldik7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5maWxsQ2FjaGUgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gQWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEVuYWJsZWQoKS50aGVuKGZ1bmN0aW9uKGVuYWJsZWRBZGRyZXNzQm9va3MpIHtcblx0XHRcdHZhciBwcm9taXNlcyA9IFtdO1xuXHRcdFx0ZW5hYmxlZEFkZHJlc3NCb29rcy5mb3JFYWNoKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdHByb21pc2VzLnB1c2goXG5cdFx0XHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnN5bmMoYWRkcmVzc0Jvb2spLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRcdGZvcih2YXIgaSBpbiBhZGRyZXNzQm9vay5vYmplY3RzKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRhY3QgPSBuZXcgQ29udGFjdChhZGRyZXNzQm9vaywgYWRkcmVzc0Jvb2sub2JqZWN0c1tpXSk7XG5cdFx0XHRcdFx0XHRcdGNvbnRhY3RzLnB1dChjb250YWN0LnVpZCgpLCBjb250YWN0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gJHEuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjYWNoZUZpbGxlZCA9IHRydWU7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKGNhY2hlRmlsbGVkID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZmlsbENhY2hlKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRhY3RzLnZhbHVlcygpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAkcS53aGVuKGNvbnRhY3RzLnZhbHVlcygpKTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5nZXRHcm91cHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihjb250YWN0cykge1xuXHRcdFx0cmV0dXJuIF8udW5pcShjb250YWN0cy5tYXAoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuY2F0ZWdvcmllcygpO1xuXHRcdFx0fSkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRcdFx0cmV0dXJuIGEuY29uY2F0KGIpO1xuXHRcdFx0fSwgW10pLnNvcnQoKSwgdHJ1ZSk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5nZXRCeUlkID0gZnVuY3Rpb24odWlkKSB7XG5cdFx0aWYoY2FjaGVGaWxsZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5maWxsQ2FjaGUoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gY29udGFjdHMuZ2V0KHVpZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuICRxLndoZW4oY29udGFjdHMuZ2V0KHVpZCkpO1xuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKG5ld0NvbnRhY3QsIGFkZHJlc3NCb29rKSB7XG5cdFx0YWRkcmVzc0Jvb2sgPSBhZGRyZXNzQm9vayB8fCBBZGRyZXNzQm9va1NlcnZpY2UuZ2V0RGVmYXVsdEFkZHJlc3NCb29rKCk7XG5cdFx0bmV3Q29udGFjdCA9IG5ld0NvbnRhY3QgfHwgbmV3IENvbnRhY3QoYWRkcmVzc0Jvb2spO1xuXHRcdHZhciBuZXdVaWQgPSB1dWlkNC5nZW5lcmF0ZSgpO1xuXHRcdG5ld0NvbnRhY3QudWlkKG5ld1VpZCk7XG5cdFx0bmV3Q29udGFjdC5zZXRVcmwoYWRkcmVzc0Jvb2ssIG5ld1VpZCk7XG5cdFx0bmV3Q29udGFjdC5hZGRyZXNzQm9va0lkID0gYWRkcmVzc0Jvb2suZGlzcGxheU5hbWU7XG5cblx0XHRyZXR1cm4gRGF2Q2xpZW50LmNyZWF0ZUNhcmQoXG5cdFx0XHRhZGRyZXNzQm9vayxcblx0XHRcdHtcblx0XHRcdFx0ZGF0YTogbmV3Q29udGFjdC5kYXRhLmFkZHJlc3NEYXRhLFxuXHRcdFx0XHRmaWxlbmFtZTogbmV3VWlkICsgJy52Y2YnXG5cdFx0XHR9XG5cdFx0KS50aGVuKGZ1bmN0aW9uKHhocikge1xuXHRcdFx0bmV3Q29udGFjdC5zZXRFVGFnKHhoci5nZXRSZXNwb25zZUhlYWRlcignRVRhZycpKTtcblx0XHRcdGNvbnRhY3RzLnB1dChuZXdVaWQsIG5ld0NvbnRhY3QpO1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdjcmVhdGUnLCBuZXdVaWQpO1xuXHRcdFx0cmV0dXJuIG5ld0NvbnRhY3Q7XG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJDb3VsZG4ndCBjcmVhdGVcIiwgZSk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5tb3ZlQ29udGFjdCA9IGZ1bmN0aW9uIChjb250YWN0LCBhZGRyZXNzYm9vaykge1xuXHRcdGlmIChjb250YWN0LmFkZHJlc3NCb29rSWQgPT09IGFkZHJlc3Nib29rLmRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnRhY3Quc3luY1ZDYXJkKCk7XG5cdFx0dmFyIGNsb25lID0gYW5ndWxhci5jb3B5KGNvbnRhY3QpO1xuXG5cdFx0Ly8gY3JlYXRlIHRoZSBjb250YWN0IGluIHRoZSBuZXcgdGFyZ2V0IGFkZHJlc3Nib29rXG5cdFx0dGhpcy5jcmVhdGUoY2xvbmUsIGFkZHJlc3Nib29rKTtcblxuXHRcdC8vIGRlbGV0ZSB0aGUgb2xkIG9uZVxuXHRcdHRoaXMuZGVsZXRlKGNvbnRhY3QpO1xuXHR9O1xuXG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdGNvbnRhY3Quc3luY1ZDYXJkKCk7XG5cblx0XHQvLyB1cGRhdGUgY29udGFjdCBvbiBzZXJ2ZXJcblx0XHRyZXR1cm4gRGF2Q2xpZW50LnVwZGF0ZUNhcmQoY29udGFjdC5kYXRhLCB7anNvbjogdHJ1ZX0pLnRoZW4oZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHR2YXIgbmV3RXRhZyA9IHhoci5nZXRSZXNwb25zZUhlYWRlcignRVRhZycpO1xuXHRcdFx0Y29udGFjdC5zZXRFVGFnKG5ld0V0YWcpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdC8vIGRlbGV0ZSBjb250YWN0IGZyb20gc2VydmVyXG5cdFx0cmV0dXJuIERhdkNsaWVudC5kZWxldGVDYXJkKGNvbnRhY3QuZGF0YSkudGhlbihmdW5jdGlvbih4aHIpIHtcblx0XHRcdGNvbnRhY3RzLnJlbW92ZShjb250YWN0LnVpZCgpKTtcblx0XHRcdG5vdGlmeU9ic2VydmVycygnZGVsZXRlJywgY29udGFjdC51aWQoKSk7XG5cdFx0fSk7XG5cdH07XG59KTtcbiIsImFwcC5zZXJ2aWNlKCdEYXZDbGllbnQnLCBmdW5jdGlvbigpIHtcblx0dmFyIHhociA9IG5ldyBkYXYudHJhbnNwb3J0LkJhc2ljKFxuXHRcdG5ldyBkYXYuQ3JlZGVudGlhbHMoKVxuXHQpO1xuXHRyZXR1cm4gbmV3IGRhdi5DbGllbnQoeGhyKTtcbn0pOyIsImFwcC5zZXJ2aWNlKCdEYXZTZXJ2aWNlJywgZnVuY3Rpb24oRGF2Q2xpZW50KSB7XG5cdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQWNjb3VudCh7XG5cdFx0c2VydmVyOiBPQy5saW5rVG9SZW1vdGVCYXNlKCdkYXYvYWRkcmVzc2Jvb2tzJyksXG5cdFx0YWNjb3VudFR5cGU6ICdjYXJkZGF2Jyxcblx0XHR1c2VQcm92aWRlZFBhdGg6IHRydWVcblx0fSk7XG59KTtcbiIsImFwcC5zZXJ2aWNlKCdTZWFyY2hTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdHZhciBzZWFyY2hUZXJtID0gJyc7XG5cblx0dmFyIG9ic2VydmVyQ2FsbGJhY2tzID0gW107XG5cblx0dGhpcy5yZWdpc3Rlck9ic2VydmVyQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdG9ic2VydmVyQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdHZhciBub3RpZnlPYnNlcnZlcnMgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcblx0XHR2YXIgZXYgPSB7XG5cdFx0XHRldmVudDpldmVudE5hbWUsXG5cdFx0XHRzZWFyY2hUZXJtOnRoaXMuc2VhcmNoVGVybVxuXHRcdH07XG5cdFx0YW5ndWxhci5mb3JFYWNoKG9ic2VydmVyQ2FsbGJhY2tzLCBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2soZXYpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHZhciBTZWFyY2hQcm94eSA9IHtcblx0XHRhdHRhY2g6IGZ1bmN0aW9uKHNlYXJjaCkge1xuXHRcdFx0c2VhcmNoLnNldEZpbHRlcignY29udGFjdHMnLCB0aGlzLmZpbHRlclByb3h5KTtcblx0XHR9LFxuXHRcdGZpbHRlclByb3h5OiBmdW5jdGlvbihxdWVyeSkge1xuXHRcdFx0c2VhcmNoVGVybSA9IHF1ZXJ5O1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdjaGFuZ2VTZWFyY2gnKTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5nZXRTZWFyY2hUZXJtID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNlYXJjaFRlcm07XG5cdH07XG5cblx0dGhpcy5jbGVhblNlYXJjaCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghXy5pc1VuZGVmaW5lZCgkKCcuc2VhcmNoYm94JykpKSB7XG5cdFx0XHQkKCcuc2VhcmNoYm94JylbMF0ucmVzZXQoKTtcblx0XHR9XG5cdFx0c2VhcmNoVGVybSA9ICcnO1xuXHR9O1xuXG5cdGlmICghXy5pc1VuZGVmaW5lZChPQy5QbHVnaW5zKSkge1xuXHRcdE9DLlBsdWdpbnMucmVnaXN0ZXIoJ09DQS5TZWFyY2gnLCBTZWFyY2hQcm94eSk7XG5cdH1cblxuXHRpZiAoIV8uaXNVbmRlZmluZWQoJCgnLnNlYXJjaGJveCcpKSkge1xuXHRcdCQoJy5zZWFyY2hib3gnKVswXS5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmKGUua2V5Q29kZSA9PT0gMTMpIHtcblx0XHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdzdWJtaXRTZWFyY2gnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufSk7XG4iLCJhcHAuc2VydmljZSgnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdHZhciBzZXR0aW5ncyA9IHtcblx0XHRhZGRyZXNzQm9va3M6IFtcblx0XHRcdCd0ZXN0QWRkcidcblx0XHRdXG5cdH07XG5cblx0dGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0c2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuXHR9O1xuXG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG5cdFx0cmV0dXJuIHNldHRpbmdzW2tleV07XG5cdH07XG5cblx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2V0dGluZ3M7XG5cdH07XG59KTtcbiIsImFwcC5zZXJ2aWNlKCd2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdC8qKlxuXHQgKiBtYXAgdkNhcmQgYXR0cmlidXRlcyB0byBpbnRlcm5hbCBhdHRyaWJ1dGVzXG5cdCAqXG5cdCAqIHByb3BOYW1lOiB7XG5cdCAqIFx0XHRtdWx0aXBsZTogW0Jvb2xlYW5dLCAvLyBpcyB0aGlzIHByb3AgYWxsb3dlZCBtb3JlIHRoYW4gb25jZT8gKGRlZmF1bHQgPSBmYWxzZSlcblx0ICogXHRcdHJlYWRhYmxlTmFtZTogW1N0cmluZ10sIC8vIGludGVybmF0aW9uYWxpemVkIHJlYWRhYmxlIG5hbWUgb2YgcHJvcFxuXHQgKiBcdFx0dGVtcGxhdGU6IFtTdHJpbmddLCAvLyB0ZW1wbGF0ZSBuYW1lIGZvdW5kIGluIC90ZW1wbGF0ZXMvZGV0YWlsSXRlbXNcblx0ICogXHRcdFsuLi5dIC8vIG9wdGlvbmFsIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gd2hpY2ggbWlnaHQgZ2V0IHVzZWQgYnkgdGhlIHRlbXBsYXRlXG5cdCAqIH1cblx0ICovXG5cdHRoaXMudkNhcmRNZXRhID0ge1xuXHRcdG5pY2tuYW1lOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ05pY2tuYW1lJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnXG5cdFx0fSxcblx0XHRub3RlOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ05vdGVzJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHRhcmVhJ1xuXHRcdH0sXG5cdFx0dXJsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnV2Vic2l0ZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd1cmwnXG5cdFx0fSxcblx0XHRjbG91ZDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZlZGVyYXRlZCBDbG91ZCBJRCcpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0Jyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXHRcdH0sXG5cdFx0YWRyOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnQWRkcmVzcycpLFxuXHRcdFx0dGVtcGxhdGU6ICdhZHInLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJywgJycsICcnLCAnJywgJycsICcnLCAnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cblx0XHR9LFxuXHRcdGNhdGVnb3JpZXM6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnR3JvdXBzJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ2dyb3Vwcydcblx0XHR9LFxuXHRcdGJkYXk6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnQmlydGhkYXknKSxcblx0XHRcdHRlbXBsYXRlOiAnZGF0ZSdcblx0XHR9LFxuXHRcdGVtYWlsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnRW1haWwnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6JycsXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cblx0XHR9LFxuXHRcdGltcHA6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdJbnN0YW50IG1lc3NhZ2luZycpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0Jyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHR0ZWw6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdQaG9uZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZWwnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FLFZPSUNFJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FLFZPSUNFJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSyxWT0lDRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ0NFTEwnLCBuYW1lOiB0KCdjb250YWN0cycsICdNb2JpbGUnKX0sXG5cdFx0XHRcdHtpZDogJ0ZBWCcsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZheCcpfSxcblx0XHRcdFx0e2lkOiAnSE9NRSxGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXggaG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSyxGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXggd29yaycpfSxcblx0XHRcdFx0e2lkOiAnUEFHRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdQYWdlcicpfSxcblx0XHRcdFx0e2lkOiAnVk9JQ0UnLCBuYW1lOiB0KCdjb250YWN0cycsICdWb2ljZScpfVxuXHRcdFx0XVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmZpZWxkT3JkZXIgPSBbXG5cdFx0J29yZycsXG5cdFx0J3RpdGxlJyxcblx0XHQndGVsJyxcblx0XHQnZW1haWwnLFxuXHRcdCdhZHInLFxuXHRcdCdpbXBwJyxcblx0XHQnbmljaycsXG5cdFx0J2JkYXknLFxuXHRcdCd1cmwnLFxuXHRcdCdub3RlJyxcblx0XHQnY2F0ZWdvcmllcycsXG5cdFx0J3JvbGUnXG5cdF07XG5cblx0dGhpcy5maWVsZERlZmluaXRpb25zID0gW107XG5cdGZvciAodmFyIHByb3AgaW4gdGhpcy52Q2FyZE1ldGEpIHtcblx0XHR0aGlzLmZpZWxkRGVmaW5pdGlvbnMucHVzaCh7aWQ6IHByb3AsIG5hbWU6IHRoaXMudkNhcmRNZXRhW3Byb3BdLnJlYWRhYmxlTmFtZSwgbXVsdGlwbGU6ICEhdGhpcy52Q2FyZE1ldGFbcHJvcF0ubXVsdGlwbGV9KTtcblx0fVxuXG5cdHRoaXMuZmFsbGJhY2tNZXRhID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRmdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZykgeyByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpOyB9XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6ICd1bmtub3duLScgKyBwcm9wZXJ0eSxcblx0XHRcdHJlYWRhYmxlTmFtZTogY2FwaXRhbGl6ZShwcm9wZXJ0eSksXG5cdFx0XHR0ZW1wbGF0ZTogJ2hpZGRlbicsXG5cdFx0XHRuZWNlc3NpdHk6ICdvcHRpb25hbCdcblx0XHR9O1xuXHR9O1xuXG5cdHRoaXMuZ2V0TWV0YSA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0cmV0dXJuIHRoaXMudkNhcmRNZXRhW3Byb3BlcnR5XSB8fCB0aGlzLmZhbGxiYWNrTWV0YShwcm9wZXJ0eSk7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmZpbHRlcignSlNPTjJ2Q2FyZCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gdkNhcmQuZ2VuZXJhdGUoaW5wdXQpO1xuXHR9O1xufSk7IiwiYXBwLmZpbHRlcignY29udGFjdENvbG9yJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHZhciBjb2xvcnMgPSBbXG5cdFx0XHRcdCcjMDAxZjNmJyxcblx0XHRcdFx0JyMwMDc0RDknLFxuXHRcdFx0XHQnIzM5Q0NDQycsXG5cdFx0XHRcdCcjM0Q5OTcwJyxcblx0XHRcdFx0JyMyRUNDNDAnLFxuXHRcdFx0XHQnI0ZGODUxQicsXG5cdFx0XHRcdCcjRkY0MTM2Jyxcblx0XHRcdFx0JyM4NTE0NGInLFxuXHRcdFx0XHQnI0YwMTJCRScsXG5cdFx0XHRcdCcjQjEwREM5J1xuXHRcdFx0XSwgYXNjaWlTdW0gPSAwO1xuXHRcdGZvcih2YXIgaSBpbiBpbnB1dCkge1xuXHRcdFx0YXNjaWlTdW0gKz0gaW5wdXQuY2hhckNvZGVBdChpKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNvbG9yc1thc2NpaVN1bSAlIGNvbG9ycy5sZW5ndGhdO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdjb250YWN0R3JvdXBGaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRhY3RzLCBncm91cCkge1xuXHRcdGlmICh0eXBlb2YgY29udGFjdHMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gY29udGFjdHM7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgZ3JvdXAgPT09ICd1bmRlZmluZWQnIHx8IGdyb3VwLnRvTG93ZXJDYXNlKCkgPT09IHQoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdHJldHVybiBjb250YWN0cztcblx0XHR9XG5cdFx0dmFyIGZpbHRlciA9IFtdO1xuXHRcdGlmIChjb250YWN0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhY3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChncm91cC50b0xvd2VyQ2FzZSgpID09PSB0KCdjb250YWN0cycsICdOb3QgZ3JvdXBlZCcpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0XHRpZiAoY29udGFjdHNbaV0uY2F0ZWdvcmllcygpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0ZmlsdGVyLnB1c2goY29udGFjdHNbaV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZiAoY29udGFjdHNbaV0uY2F0ZWdvcmllcygpLmluZGV4T2YoZ3JvdXApID49IDApIHtcblx0XHRcdFx0XHRcdGZpbHRlci5wdXNoKGNvbnRhY3RzW2ldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZpbHRlcjtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignZmllbGRGaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGZpZWxkcywgY29udGFjdCkge1xuXHRcdGlmICh0eXBlb2YgZmllbGRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBjb250YWN0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0dmFyIGZpbHRlciA9IFtdO1xuXHRcdGlmIChmaWVsZHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGZpZWxkc1tpXS5tdWx0aXBsZSApIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChfLmlzVW5kZWZpbmVkKGNvbnRhY3QuZ2V0UHJvcGVydHkoZmllbGRzW2ldLmlkKSkpIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmaWx0ZXI7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2ZpcnN0Q2hhcmFjdGVyJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHJldHVybiBpbnB1dC5jaGFyQXQoMCk7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ29yZGVyRGV0YWlsSXRlbXMnLCBmdW5jdGlvbih2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uKGl0ZW1zLCBmaWVsZCwgcmV2ZXJzZSkge1xuXG5cdFx0dmFyIGZpbHRlcmVkID0gW107XG5cdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRmaWx0ZXJlZC5wdXNoKGl0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZpZWxkT3JkZXIgPSBhbmd1bGFyLmNvcHkodkNhcmRQcm9wZXJ0aWVzU2VydmljZS5maWVsZE9yZGVyKTtcblx0XHQvLyByZXZlcnNlIHRvIG1vdmUgY3VzdG9tIGl0ZW1zIHRvIHRoZSBlbmQgKGluZGV4T2YgPT0gLTEpXG5cdFx0ZmllbGRPcmRlci5yZXZlcnNlKCk7XG5cblx0XHRmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRpZihmaWVsZE9yZGVyLmluZGV4T2YoYVtmaWVsZF0pIDwgZmllbGRPcmRlci5pbmRleE9mKGJbZmllbGRdKSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblx0XHRcdGlmKGZpZWxkT3JkZXIuaW5kZXhPZihhW2ZpZWxkXSkgPiBmaWVsZE9yZGVyLmluZGV4T2YoYltmaWVsZF0pKSB7XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAwO1xuXHRcdH0pO1xuXG5cdFx0aWYocmV2ZXJzZSkgZmlsdGVyZWQucmV2ZXJzZSgpO1xuXHRcdHJldHVybiBmaWx0ZXJlZDtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndG9BcnJheScsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0KSkgcmV0dXJuIG9iajtcblx0XHRyZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2YWwsICcka2V5Jywge3ZhbHVlOiBrZXl9KTtcblx0XHR9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndkNhcmQySlNPTicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gdkNhcmQucGFyc2UoaW5wdXQpO1xuXHR9O1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
