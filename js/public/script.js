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
		addContact : t('contacts', 'Add contact')
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

app.controller('detailsPhotoCtrl', function() {
	var ctrl = this;
});

app.directive('detailsphoto', function() {
	return {
		scope: {},
		controller: 'detailsPhotoCtrl',
		controllerAs: 'ctrl',
		bindToController: {
			contact: '=data'
		},
		templateUrl: OC.linkTo('contacts', 'templates/detailsPhoto.html')
	};
});

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

	$scope.groups = [t('contacts', 'All contacts')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = _.unique([t('contacts', 'All contacts')].concat(groups));
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

app.controller('imagePreviewCtrl', ['$scope', function($scope) {
	var ctrl = this;

	ctrl.loadImage = function(file) {
		var reader = new FileReader();

		reader.addEventListener('load', function () {
			$scope.$apply(function() {
				$scope.imagepreview = reader.result;
			});
		}, false);

		if (file) {
			reader.readAsDataURL(file);
		}
	};
}]);

app.directive('imagepreview', function() {
	return {
		scope: {
			photoCallback: '&imagepreview'
		},
		link: function(scope, element, attrs, ctrl) {
			element.bind('change', function() {
				var file = element.get(0).files[0];
				var reader = new FileReader();

				reader.addEventListener('load', function () {
					console.log('hi', scope.photoCallback() + '');
					scope.$apply(function() {
						scope.photoCallback()(reader.result);
					});
				}, false);

				if (file) {
					reader.readAsDataURL(file);
				}
			});
		}
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
					if(property) {
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
				if (contacts[i].categories().indexOf(group) >= 0) {
					filter.push(contacts[i]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkYXRlcGlja2VyX2RpcmVjdGl2ZS5qcyIsImZvY3VzX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rL2FkZHJlc3NCb29rX2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9vay9hZGRyZXNzQm9va19kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3QvY29udGFjdF9jb250cm9sbGVyLmpzIiwiY29udGFjdC9jb250YWN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3REZXRhaWxzL2NvbnRhY3REZXRhaWxzX2NvbnRyb2xsZXIuanMiLCJjb250YWN0RGV0YWlscy9jb250YWN0RGV0YWlsc19kaXJlY3RpdmUuanMiLCJjb250YWN0TGlzdC9jb250YWN0TGlzdF9jb250cm9sbGVyLmpzIiwiY29udGFjdExpc3QvY29udGFjdExpc3RfZGlyZWN0aXZlLmpzIiwiZGV0YWlsc0l0ZW0vZGV0YWlsc0l0ZW1fY29udHJvbGxlci5qcyIsImRldGFpbHNJdGVtL2RldGFpbHNJdGVtX2RpcmVjdGl2ZS5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fY29udHJvbGxlci5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fZGlyZWN0aXZlLmpzIiwiZ3JvdXAvZ3JvdXBfY29udHJvbGxlci5qcyIsImdyb3VwL2dyb3VwX2RpcmVjdGl2ZS5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfY29udHJvbGxlci5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfZGlyZWN0aXZlLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19jb250cm9sbGVyLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19kaXJlY3RpdmUuanMiLCJwYXJzZXJzL2dyb3VwTW9kZWxfZGlyZWN0aXZlLmpzIiwicGFyc2Vycy90ZWxNb2RlbF9kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va19tb2RlbC5qcyIsImNvbnRhY3RfbW9kZWwuanMiLCJhZGRyZXNzQm9va19zZXJ2aWNlLmpzIiwiY29udGFjdF9zZXJ2aWNlLmpzIiwiZGF2Q2xpZW50X3NlcnZpY2UuanMiLCJkYXZfc2VydmljZS5qcyIsInNldHRpbmdzX3NlcnZpY2UuanMiLCJ2Q2FyZFByb3BlcnRpZXMuanMiLCJKU09OMnZDYXJkX2ZpbHRlci5qcyIsImNvbnRhY3RDb2xvcl9maWx0ZXIuanMiLCJjb250YWN0R3JvdXBfZmlsdGVyLmpzIiwiZmllbGRfZmlsdGVyLmpzIiwiZmlyc3RDaGFyYWN0ZXJfZmlsdGVyLmpzIiwib3JkZXJEZXRhaWxJdGVtc19maWx0ZXIuanMiLCJ0b0FycmF5X2ZpbHRlci5qcyIsInZDYXJkMkpTT05fZmlsdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBVUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxlQUFlLENBQUMsU0FBUyxpQkFBaUIsV0FBVyxnQkFBZ0IsYUFBYTs7QUFFM0csSUFBSSwwQkFBTyxTQUFTLGdCQUFnQjs7Q0FFbkMsZUFBZSxLQUFLLFNBQVM7RUFDNUIsVUFBVTs7O0NBR1gsZUFBZSxLQUFLLGNBQWM7RUFDakMsVUFBVTs7O0NBR1gsZUFBZSxVQUFVLE1BQU0sRUFBRSxZQUFZOzs7QUFHOUM7QUN6QkEsSUFBSSxVQUFVLGNBQWMsV0FBVztDQUN0QyxPQUFPO0VBQ04sVUFBVTtFQUNWLFVBQVU7RUFDVixPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sYUFBYTtHQUNwRCxFQUFFLFdBQVc7SUFDWixRQUFRLFdBQVc7S0FDbEIsV0FBVztLQUNYLFNBQVM7S0FDVCxTQUFTO0tBQ1QsU0FBUyxVQUFVLE1BQU07TUFDeEIsWUFBWSxjQUFjO01BQzFCLE1BQU07Ozs7Ozs7QUFPWjtBQ25CQSxJQUFJLFVBQVUsZ0NBQW1CLFVBQVUsVUFBVTtDQUNwRCxPQUFPO0VBQ04sVUFBVTtFQUNWLE1BQU07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Ozs7QUFHVDtBQ3hCQSxJQUFJLE9BQU8sa0JBQWtCLFdBQVc7Q0FDdkMsT0FBTyxTQUFTLE9BQU87RUFDdEIsT0FBTyxNQUFNLE9BQU87OztBQUd0QjtBQ0xBLElBQUksT0FBTywrQ0FBb0IsU0FBUyx3QkFBd0I7Q0FDL0Q7Q0FDQSxPQUFPLFNBQVMsT0FBTyxPQUFPLFNBQVM7O0VBRXRDLElBQUksV0FBVztFQUNmLFFBQVEsUUFBUSxPQUFPLFNBQVMsTUFBTTtHQUNyQyxTQUFTLEtBQUs7OztFQUdmLElBQUksYUFBYSxRQUFRLEtBQUssdUJBQXVCOztFQUVyRCxXQUFXOztFQUVYLFNBQVMsS0FBSyxVQUFVLEdBQUcsR0FBRztHQUM3QixHQUFHLFdBQVcsUUFBUSxFQUFFLFVBQVUsV0FBVyxRQUFRLEVBQUUsU0FBUztJQUMvRCxPQUFPOztHQUVSLEdBQUcsV0FBVyxRQUFRLEVBQUUsVUFBVSxXQUFXLFFBQVEsRUFBRSxTQUFTO0lBQy9ELE9BQU8sQ0FBQzs7R0FFVCxPQUFPOzs7RUFHUixHQUFHLFNBQVMsU0FBUztFQUNyQixPQUFPOzs7QUFHVDtBQzNCQSxJQUFJLE9BQU8sV0FBVyxXQUFXO0NBQ2hDLE9BQU8sU0FBUyxLQUFLO0VBQ3BCLElBQUksRUFBRSxlQUFlLFNBQVMsT0FBTztFQUNyQyxPQUFPLEVBQUUsSUFBSSxLQUFLLFNBQVMsS0FBSyxLQUFLO0dBQ3BDLE9BQU8sT0FBTyxlQUFlLEtBQUssUUFBUSxDQUFDLE9BQU87Ozs7QUFJckQ7QUNSQSxJQUFJLE9BQU8sY0FBYyxXQUFXO0NBQ25DLE9BQU8sU0FBUyxPQUFPO0VBQ3RCLE9BQU8sTUFBTSxNQUFNOztHQUVsQiIsImZpbGUiOiJzY3JpcHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIG93bkNsb3VkIC0gY29udGFjdHNcbiAqXG4gKiBUaGlzIGZpbGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIHZlcnNpb24gMyBvclxuICogbGF0ZXIuIFNlZSB0aGUgQ09QWUlORyBmaWxlLlxuICpcbiAqIEBhdXRob3IgSGVuZHJpayBMZXBwZWxzYWNrIDxoZW5kcmlrQGxlcHBlbHNhY2suZGU+XG4gKiBAY29weXJpZ2h0IEhlbmRyaWsgTGVwcGVsc2FjayAyMDE1XG4gKi9cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdjb250YWN0c0FwcCcsIFsndXVpZDQnLCAnYW5ndWxhci1jYWNoZScsICduZ1JvdXRlJywgJ3VpLmJvb3RzdHJhcCcsICd1aS5zZWxlY3QnLCAnbmdTYW5pdGl6ZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuXG5cdCRyb3V0ZVByb3ZpZGVyLndoZW4oJy86Z2lkJywge1xuXHRcdHRlbXBsYXRlOiAnPGNvbnRhY3RkZXRhaWxzPjwvY29udGFjdGRldGFpbHM+J1xuXHR9KTtcblxuXHQkcm91dGVQcm92aWRlci53aGVuKCcvOmdpZC86dWlkJywge1xuXHRcdHRlbXBsYXRlOiAnPGNvbnRhY3RkZXRhaWxzPjwvY29udGFjdGRldGFpbHM+J1xuXHR9KTtcblxuXHQkcm91dGVQcm92aWRlci5vdGhlcndpc2UoJy8nICsgdCgnY29udGFjdHMnLCAnQWxsIGNvbnRhY3RzJykpO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2RhdGVwaWNrZXInLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHJlcXVpcmUgOiAnbmdNb2RlbCcsXG5cdFx0bGluayA6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWxDdHJsKSB7XG5cdFx0XHQkKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRlbGVtZW50LmRhdGVwaWNrZXIoe1xuXHRcdFx0XHRcdGRhdGVGb3JtYXQ6J3l5LW1tLWRkJyxcblx0XHRcdFx0XHRtaW5EYXRlOiBudWxsLFxuXHRcdFx0XHRcdG1heERhdGU6IG51bGwsXG5cdFx0XHRcdFx0b25TZWxlY3Q6ZnVuY3Rpb24gKGRhdGUpIHtcblx0XHRcdFx0XHRcdG5nTW9kZWxDdHJsLiRzZXRWaWV3VmFsdWUoZGF0ZSk7XG5cdFx0XHRcdFx0XHRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmb2N1c0V4cHJlc3Npb24nLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdGxpbms6IHtcblx0XHRcdHBvc3Q6IGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuXHRcdFx0XHRzY29wZS4kd2F0Y2goYXR0cnMuZm9jdXNFeHByZXNzaW9uLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuXHRcdFx0XHRcdGlmIChhdHRycy5mb2N1c0V4cHJlc3Npb24pIHtcblx0XHRcdFx0XHRcdGlmIChzY29wZS4kZXZhbChhdHRycy5mb2N1c0V4cHJlc3Npb24pKSB7XG5cdFx0XHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoZWxlbWVudC5pcygnaW5wdXQnKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudC5mb2N1cygpO1xuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LmZpbmQoJ2lucHV0JykuZm9jdXMoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0sIDEwMCk7IC8vbmVlZCBzb21lIGRlbGF5IHRvIHdvcmsgd2l0aCBuZy1kaXNhYmxlZFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignYWRkcmVzc2Jvb2tDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBBZGRyZXNzQm9va1NlcnZpY2UpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwudXJsQmFzZSA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblx0Y3RybC5zaG93VXJsID0gZmFsc2U7XG5cblx0Y3RybC50b2dnbGVTaG93VXJsID0gZnVuY3Rpb24oKSB7XG5cdFx0Y3RybC5zaG93VXJsID0gIWN0cmwuc2hvd1VybDtcblx0fTtcblxuXHRjdHJsLnRvZ2dsZVNoYXJlc0VkaXRvciA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0YWRkcmVzc0Jvb2suZWRpdGluZ1NoYXJlcyA9ICFhZGRyZXNzQm9vay5lZGl0aW5nU2hhcmVzO1xuXHRcdGFkZHJlc3NCb29rLnNlbGVjdGVkU2hhcmVlID0gbnVsbDtcblx0fTtcblxuXHQvKiBGcm9tIENhbGVuZGFyLVJld29yayAtIGpzL2FwcC9jb250cm9sbGVycy9jYWxlbmRhcmxpc3Rjb250cm9sbGVyLmpzICovXG5cdGN0cmwuZmluZFNoYXJlZSA9IGZ1bmN0aW9uICh2YWwsIGFkZHJlc3NCb29rKSB7XG5cdFx0cmV0dXJuICQuZ2V0KFxuXHRcdFx0T0MubGlua1RvT0NTKCdhcHBzL2ZpbGVzX3NoYXJpbmcvYXBpL3YxJykgKyAnc2hhcmVlcycsXG5cdFx0XHR7XG5cdFx0XHRcdGZvcm1hdDogJ2pzb24nLFxuXHRcdFx0XHRzZWFyY2g6IHZhbC50cmltKCksXG5cdFx0XHRcdHBlclBhZ2U6IDIwMCxcblx0XHRcdFx0aXRlbVR5cGU6ICdwcmluY2lwYWxzJ1xuXHRcdFx0fVxuXHRcdCkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdC8vIFRvZG8gLSBmaWx0ZXIgb3V0IGN1cnJlbnQgdXNlciwgZXhpc3Rpbmcgc2hhcmVlc1xuXHRcdFx0dmFyIHVzZXJzICAgPSByZXN1bHQub2NzLmRhdGEuZXhhY3QudXNlcnMuY29uY2F0KHJlc3VsdC5vY3MuZGF0YS51c2Vycyk7XG5cdFx0XHR2YXIgZ3JvdXBzICA9IHJlc3VsdC5vY3MuZGF0YS5leGFjdC5ncm91cHMuY29uY2F0KHJlc3VsdC5vY3MuZGF0YS5ncm91cHMpO1xuXG5cdFx0XHR2YXIgdXNlclNoYXJlcyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnM7XG5cdFx0XHR2YXIgZ3JvdXBTaGFyZXMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3Vwcztcblx0XHRcdHZhciB1c2VyU2hhcmVzTGVuZ3RoID0gdXNlclNoYXJlcy5sZW5ndGg7XG5cdFx0XHR2YXIgZ3JvdXBTaGFyZXNMZW5ndGggPSBncm91cFNoYXJlcy5sZW5ndGg7XG5cdFx0XHR2YXIgaSwgajtcblxuXHRcdFx0Ly8gRmlsdGVyIG91dCBjdXJyZW50IHVzZXJcblx0XHRcdHZhciB1c2Vyc0xlbmd0aCA9IHVzZXJzLmxlbmd0aDtcblx0XHRcdGZvciAoaSA9IDAgOyBpIDwgdXNlcnNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodXNlcnNbaV0udmFsdWUuc2hhcmVXaXRoID09PSBPQy5jdXJyZW50VXNlcikge1xuXHRcdFx0XHRcdHVzZXJzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBOb3cgZmlsdGVyIG91dCBhbGwgc2hhcmVlcyB0aGF0IGFyZSBhbHJlYWR5IHNoYXJlZCB3aXRoXG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgdXNlclNoYXJlc0xlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBzaGFyZSA9IHVzZXJTaGFyZXNbaV07XG5cdFx0XHRcdHVzZXJzTGVuZ3RoID0gdXNlcnMubGVuZ3RoO1xuXHRcdFx0XHRmb3IgKGogPSAwOyBqIDwgdXNlcnNMZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGlmICh1c2Vyc1tqXS52YWx1ZS5zaGFyZVdpdGggPT09IHNoYXJlLmlkKSB7XG5cdFx0XHRcdFx0XHR1c2Vycy5zcGxpY2UoaiwgMSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29tYmluZSB1c2VycyBhbmQgZ3JvdXBzXG5cdFx0XHR1c2VycyA9IHVzZXJzLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGlzcGxheTogaXRlbS52YWx1ZS5zaGFyZVdpdGgsXG5cdFx0XHRcdFx0dHlwZTogT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSLFxuXHRcdFx0XHRcdGlkZW50aWZpZXI6IGl0ZW0udmFsdWUuc2hhcmVXaXRoXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0Z3JvdXBzID0gZ3JvdXBzLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZGlzcGxheTogaXRlbS52YWx1ZS5zaGFyZVdpdGggKyAnIChncm91cCknLFxuXHRcdFx0XHRcdHR5cGU6IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVAsXG5cdFx0XHRcdFx0aWRlbnRpZmllcjogaXRlbS52YWx1ZS5zaGFyZVdpdGhcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gZ3JvdXBzLmNvbmNhdCh1c2Vycyk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC5vblNlbGVjdFNoYXJlZSA9IGZ1bmN0aW9uIChpdGVtLCBtb2RlbCwgbGFiZWwsIGFkZHJlc3NCb29rKSB7XG5cdFx0Y3RybC5hZGRyZXNzQm9vay5zZWxlY3RlZFNoYXJlZSA9IG51bGw7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnNoYXJlKGFkZHJlc3NCb29rLCBpdGVtLnR5cGUsIGl0ZW0uaWRlbnRpZmllciwgZmFsc2UsIGZhbHNlKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXG5cdH07XG5cblx0Y3RybC51cGRhdGVFeGlzdGluZ1VzZXJTaGFyZSA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCB1c2VySWQsIHdyaXRhYmxlKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnNoYXJlKGFkZHJlc3NCb29rLCBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIsIHVzZXJJZCwgd3JpdGFibGUsIHRydWUpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51cGRhdGVFeGlzdGluZ0dyb3VwU2hhcmUgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgZ3JvdXBJZCwgd3JpdGFibGUpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVAsIGdyb3VwSWQsIHdyaXRhYmxlLCB0cnVlKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudW5zaGFyZUZyb21Vc2VyID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHVzZXJJZCkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS51bnNoYXJlKGFkZHJlc3NCb29rLCBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIsIHVzZXJJZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVuc2hhcmVGcm9tR3JvdXAgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgZ3JvdXBJZCkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS51bnNoYXJlKGFkZHJlc3NCb29rLCBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQLCBncm91cElkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5kZWxldGUoYWRkcmVzc0Jvb2spLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWRkcmVzc2Jvb2snLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLCAvLyBoYXMgdG8gYmUgYW4gYXR0cmlidXRlIHRvIHdvcmsgd2l0aCBjb3JlIGNzc1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnYWRkcmVzc2Jvb2tDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7XG5cdFx0XHRhZGRyZXNzQm9vazogJz1kYXRhJ1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2FkZHJlc3NCb29rLmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignYWRkcmVzc2Jvb2tsaXN0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgQWRkcmVzc0Jvb2tTZXJ2aWNlLCBTZXR0aW5nc1NlcnZpY2UpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdEFkZHJlc3NCb29rU2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdGN0cmwuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzO1xuXHR9KTtcblxuXHRjdHJsLmNyZWF0ZUFkZHJlc3NCb29rID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoY3RybC5uZXdBZGRyZXNzQm9va05hbWUpIHtcblx0XHRcdEFkZHJlc3NCb29rU2VydmljZS5jcmVhdGUoY3RybC5uZXdBZGRyZXNzQm9va05hbWUpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEFkZHJlc3NCb29rU2VydmljZS5nZXRBZGRyZXNzQm9vayhjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdGN0cmwuYWRkcmVzc0Jvb2tzLnB1c2goYWRkcmVzc0Jvb2spO1xuXHRcdFx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FkZHJlc3Nib29rbGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLCAvLyBoYXMgdG8gYmUgYW4gYXR0cmlidXRlIHRvIHdvcmsgd2l0aCBjb3JlIGNzc1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnYWRkcmVzc2Jvb2tsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge30sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2FkZHJlc3NCb29rTGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2NvbnRhY3RDdHJsJywgZnVuY3Rpb24oJHJvdXRlLCAkcm91dGVQYXJhbXMpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwub3BlbkNvbnRhY3QgPSBmdW5jdGlvbigpIHtcblx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdHVpZDogY3RybC5jb250YWN0LnVpZCgpfSk7XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2NvbnRhY3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2NvbnRhY3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7XG5cdFx0XHRjb250YWN0OiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvY29udGFjdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2NvbnRhY3RkZXRhaWxzQ3RybCcsIGZ1bmN0aW9uKENvbnRhY3RTZXJ2aWNlLCBBZGRyZXNzQm9va1NlcnZpY2UsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UsICRyb3V0ZVBhcmFtcywgJHNjb3BlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLnVpZCA9ICRyb3V0ZVBhcmFtcy51aWQ7XG5cdGN0cmwudCA9IHtcblx0XHRub0NvbnRhY3RzIDogdCgnY29udGFjdHMnLCAnTm8gY29udGFjdHMgaW4gaGVyZScpLFxuXHRcdHBsYWNlaG9sZGVyTmFtZSA6IHQoJ2NvbnRhY3RzJywgJ05hbWUnKSxcblx0XHRwbGFjZWhvbGRlck9yZyA6IHQoJ2NvbnRhY3RzJywgJ09yZ2FuaXphdGlvbicpLFxuXHRcdHBsYWNlaG9sZGVyVGl0bGUgOiB0KCdjb250YWN0cycsICdUaXRsZScpLFxuXHRcdHNlbGVjdEZpZWxkIDogdCgnY29udGFjdHMnLCAnQWRkIGZpZWxkIC4uLicpXG5cdH07XG5cblx0Y3RybC5maWVsZERlZmluaXRpb25zID0gdkNhcmRQcm9wZXJ0aWVzU2VydmljZS5maWVsZERlZmluaXRpb25zO1xuXHRjdHJsLmZvY3VzID0gdW5kZWZpbmVkO1xuXHRjdHJsLmZpZWxkID0gdW5kZWZpbmVkO1xuXHQkc2NvcGUuYWRkcmVzc0Jvb2tzID0gW107XG5cdGN0cmwuYWRkcmVzc0Jvb2tzID0gW107XG5cblx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0Y3RybC5hZGRyZXNzQm9va3MgPSBhZGRyZXNzQm9va3M7XG5cdFx0JHNjb3BlLmFkZHJlc3NCb29rcyA9IGFkZHJlc3NCb29rcy5tYXAoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGlkOiBlbGVtZW50LmRpc3BsYXlOYW1lLFxuXHRcdFx0XHRuYW1lOiBlbGVtZW50LmRpc3BsYXlOYW1lXG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdGlmICghXy5pc1VuZGVmaW5lZChjdHJsLmNvbnRhY3QpKSB7XG5cdFx0XHQkc2NvcGUuYWRkcmVzc0Jvb2sgPSBfLmZpbmQoJHNjb3BlLmFkZHJlc3NCb29rcywgZnVuY3Rpb24oYm9vaykge1xuXHRcdFx0XHRyZXR1cm4gYm9vay5pZCA9PT0gY3RybC5jb250YWN0LmFkZHJlc3NCb29rSWQ7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xuXG5cdCRzY29wZS4kd2F0Y2goJ2N0cmwudWlkJywgZnVuY3Rpb24obmV3VmFsdWUsIG9sZFZhbHVlKSB7XG5cdFx0Y3RybC5jaGFuZ2VDb250YWN0KG5ld1ZhbHVlKTtcblx0fSk7XG5cblx0Y3RybC5jaGFuZ2VDb250YWN0ID0gZnVuY3Rpb24odWlkKSB7XG5cdFx0aWYgKHR5cGVvZiB1aWQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdENvbnRhY3RTZXJ2aWNlLmdldEJ5SWQodWlkKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3QpIHtcblx0XHRcdGN0cmwuY29udGFjdCA9IGNvbnRhY3Q7XG5cdFx0XHRjdHJsLnBob3RvID0gY3RybC5jb250YWN0LnBob3RvKCk7XG5cdFx0XHQkc2NvcGUuYWRkcmVzc0Jvb2sgPSBfLmZpbmQoJHNjb3BlLmFkZHJlc3NCb29rcywgZnVuY3Rpb24oYm9vaykge1xuXHRcdFx0XHRyZXR1cm4gYm9vay5pZCA9PT0gY3RybC5jb250YWN0LmFkZHJlc3NCb29rSWQ7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVwZGF0ZUNvbnRhY3QgPSBmdW5jdGlvbigpIHtcblx0XHRDb250YWN0U2VydmljZS51cGRhdGUoY3RybC5jb250YWN0KTtcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUNvbnRhY3QgPSBmdW5jdGlvbigpIHtcblx0XHRDb250YWN0U2VydmljZS5kZWxldGUoY3RybC5jb250YWN0KTtcblx0fTtcblxuXHRjdHJsLmFkZEZpZWxkID0gZnVuY3Rpb24oZmllbGQpIHtcblx0XHR2YXIgZGVmYXVsdFZhbHVlID0gdkNhcmRQcm9wZXJ0aWVzU2VydmljZS5nZXRNZXRhKGZpZWxkKS5kZWZhdWx0VmFsdWUgfHwge3ZhbHVlOiAnJ307XG5cdFx0Y3RybC5jb250YWN0LmFkZFByb3BlcnR5KGZpZWxkLCBkZWZhdWx0VmFsdWUpO1xuXHRcdGN0cmwuZm9jdXMgPSBmaWVsZDtcblx0XHRjdHJsLmZpZWxkID0gJyc7XG5cdH07XG5cblx0Y3RybC5kZWxldGVGaWVsZCA9IGZ1bmN0aW9uIChmaWVsZCwgcHJvcCkge1xuXHRcdGN0cmwuY29udGFjdC5yZW1vdmVQcm9wZXJ0eShmaWVsZCwgcHJvcCk7XG5cdFx0Y3RybC5mb2N1cyA9IHVuZGVmaW5lZDtcblx0fTtcblxuXHRjdHJsLmNoYW5nZUFkZHJlc3NCb29rID0gZnVuY3Rpb24gKGFkZHJlc3NCb29rKSB7XG5cdFx0YWRkcmVzc0Jvb2sgPSBfLmZpbmQoY3RybC5hZGRyZXNzQm9va3MsIGZ1bmN0aW9uKGJvb2spIHtcblx0XHRcdHJldHVybiBib29rLmRpc3BsYXlOYW1lID09PSBhZGRyZXNzQm9vay5pZDtcblx0XHR9KTtcblx0XHRDb250YWN0U2VydmljZS5tb3ZlQ29udGFjdChjdHJsLmNvbnRhY3QsIGFkZHJlc3NCb29rKTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdGRldGFpbHMnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRwcmlvcml0eTogMSxcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2NvbnRhY3RkZXRhaWxzQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge30sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2NvbnRhY3REZXRhaWxzLmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdGxpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkZmlsdGVyLCAkcm91dGUsICRyb3V0ZVBhcmFtcywgQ29udGFjdFNlcnZpY2UsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwucm91dGVQYXJhbXMgPSAkcm91dGVQYXJhbXM7XG5cdGN0cmwudCA9IHtcblx0XHRhZGRDb250YWN0IDogdCgnY29udGFjdHMnLCAnQWRkIGNvbnRhY3QnKVxuXHR9O1xuXG5cdGN0cmwuY29udGFjdExpc3QgPSBbXTtcblx0Y3RybC5xdWVyeSA9ICcnO1xuXG5cdCRzY29wZS5xdWVyeSA9IGZ1bmN0aW9uKGNvbnRhY3QpIHtcblx0XHRyZXR1cm4gY29udGFjdC5tYXRjaGVzKGN0cmwucXVlcnkpO1xuXHR9O1xuXG5cdFNlYXJjaFByb3h5LnNldEZpbHRlcihmdW5jdGlvbihxdWVyeSkge1xuXHRcdGN0cmwucXVlcnkgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmIChjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCAhPT0gMCkge1xuXHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0fSk7XG5cdFx0XHQkc2NvcGUuc2VsZWN0ZWRDb250YWN0SWQgPSAkcm91dGVQYXJhbXMudWlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0dWlkOiB1bmRlZmluZWRcblx0XHRcdH0pO1xuXHRcdH1cblx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdH0pO1xuXG5cdENvbnRhY3RTZXJ2aWNlLnJlZ2lzdGVyT2JzZXJ2ZXJDYWxsYmFjayhmdW5jdGlvbihldikge1xuXHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoZXYuZXZlbnQgPT09ICdkZWxldGUnKSB7XG5cdFx0XHRcdGlmIChjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdFx0dWlkOiB1bmRlZmluZWRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3RybC5jb250YWN0TGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0aWYgKGN0cmwuY29udGFjdExpc3RbaV0udWlkKCkgPT09IGV2LnVpZCkge1xuXHRcdFx0XHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdFx0dWlkOiAoY3RybC5jb250YWN0TGlzdFtpKzFdKSA/IGN0cmwuY29udGFjdExpc3RbaSsxXS51aWQoKSA6IGN0cmwuY29udGFjdExpc3RbaS0xXS51aWQoKVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChldi5ldmVudCA9PT0gJ2NyZWF0ZScpIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogZXYudWlkXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Y3RybC5jb250YWN0cyA9IGV2LmNvbnRhY3RzO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRDb250YWN0U2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3RzKSB7XG5cdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdGN0cmwuY29udGFjdHMgPSBjb250YWN0cztcblx0XHR9KTtcblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC5yb3V0ZVBhcmFtcy51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSkge1xuXHRcdGlmKG5ld1ZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIHdlIG1pZ2h0IGhhdmUgdG8gd2FpdCB1bnRpbCBuZy1yZXBlYXQgZmlsbGVkIHRoZSBjb250YWN0TGlzdFxuXHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdFx0XHR2YXIgdW5iaW5kV2F0Y2ggPSAkc2NvcGUuJHdhdGNoKCdjdHJsLmNvbnRhY3RMaXN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHVuYmluZFdhdGNoKCk7IC8vIHVuYmluZCBhcyB3ZSBvbmx5IHdhbnQgb25lIHVwZGF0ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdCRzY29wZS4kd2F0Y2goJ2N0cmwucm91dGVQYXJhbXMuZ2lkJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gd2UgbWlnaHQgaGF2ZSB0byB3YWl0IHVudGlsIG5nLXJlcGVhdCBmaWxsZWQgdGhlIGNvbnRhY3RMaXN0XG5cdFx0Y3RybC5jb250YWN0TGlzdCA9IFtdO1xuXHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdHZhciB1bmJpbmRXYXRjaCA9ICRzY29wZS4kd2F0Y2goJ2N0cmwuY29udGFjdExpc3QnLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmKGN0cmwuY29udGFjdExpc3QgJiYgY3RybC5jb250YWN0TGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHR1aWQ6IGN0cmwuY29udGFjdExpc3RbMF0udWlkKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHR1bmJpbmRXYXRjaCgpOyAvLyB1bmJpbmQgYXMgd2Ugb25seSB3YW50IG9uZSB1cGRhdGVcblx0XHR9KTtcblx0fSk7XG5cblx0Y3RybC5jcmVhdGVDb250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Q29udGFjdFNlcnZpY2UuY3JlYXRlKCkudGhlbihmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0XHRbJ3RlbCcsICdhZHInLCAnZW1haWwnXS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG5cdFx0XHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRcdFx0Y29udGFjdC5hZGRQcm9wZXJ0eShmaWVsZCwgZGVmYXVsdFZhbHVlKTtcblx0XHRcdH0gKTtcblx0XHRcdGlmICgkcm91dGVQYXJhbXMuZ2lkICE9PSB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSkge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJHJvdXRlUGFyYW1zLmdpZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJycpO1xuXHRcdFx0fVxuXHRcdFx0JCgnI2RldGFpbHMtZnVsbE5hbWUnKS5mb2N1cygpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwuaGFzQ29udGFjdHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFjdHJsLmNvbnRhY3RzKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBjdHJsLmNvbnRhY3RzLmxlbmd0aCA+IDA7XG5cdH07XG5cblx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkQ29udGFjdElkKSB7XG5cdFx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gc2VsZWN0ZWRDb250YWN0SWQ7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdGxpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRwcmlvcml0eTogMSxcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2NvbnRhY3RsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0YWRkcmVzc2Jvb2s6ICc9YWRyYm9vaydcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0TGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNJdGVtQ3RybCcsIGZ1bmN0aW9uKCR0ZW1wbGF0ZVJlcXVlc3QsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UsIENvbnRhY3RTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLm1ldGEgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoY3RybC5uYW1lKTtcblx0Y3RybC50eXBlID0gdW5kZWZpbmVkO1xuXHRjdHJsLnQgPSB7XG5cdFx0cG9Cb3ggOiB0KCdjb250YWN0cycsICdQb3N0IE9mZmljZSBCb3gnKSxcblx0XHRwb3N0YWxDb2RlIDogdCgnY29udGFjdHMnLCAnUG9zdGFsIENvZGUnKSxcblx0XHRjaXR5IDogdCgnY29udGFjdHMnLCAnQ2l0eScpLFxuXHRcdHN0YXRlIDogdCgnY29udGFjdHMnLCAnU3RhdGUgb3IgcHJvdmluY2UnKSxcblx0XHRjb3VudHJ5IDogdCgnY29udGFjdHMnLCAnQ291bnRyeScpLFxuXHRcdGFkZHJlc3M6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRuZXdHcm91cDogdCgnY29udGFjdHMnLCAnKG5ldyBncm91cCknKVxuXHR9O1xuXG5cdGN0cmwuYXZhaWxhYmxlT3B0aW9ucyA9IGN0cmwubWV0YS5vcHRpb25zIHx8IFtdO1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhKSAmJiAhXy5pc1VuZGVmaW5lZChjdHJsLmRhdGEubWV0YSkgJiYgIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhLm1ldGEudHlwZSkpIHtcblx0XHRjdHJsLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlWzBdO1xuXHRcdGlmICghY3RybC5hdmFpbGFibGVPcHRpb25zLnNvbWUoZnVuY3Rpb24oZSkgeyByZXR1cm4gZS5pZCA9PT0gY3RybC5kYXRhLm1ldGEudHlwZVswXTsgfSApKSB7XG5cdFx0XHRjdHJsLmF2YWlsYWJsZU9wdGlvbnMgPSBjdHJsLmF2YWlsYWJsZU9wdGlvbnMuY29uY2F0KFt7aWQ6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0sIG5hbWU6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF19XSk7XG5cdFx0fVxuXHR9XG5cdGN0cmwuYXZhaWxhYmxlR3JvdXBzID0gW107XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHRjdHJsLmF2YWlsYWJsZUdyb3VwcyA9IF8udW5pcXVlKGdyb3Vwcyk7XG5cdH0pO1xuXG5cdGN0cmwuY2hhbmdlVHlwZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRjdHJsLmRhdGEubWV0YSA9IGN0cmwuZGF0YS5tZXRhIHx8IHt9O1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlIHx8IFtdO1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0gPSB2YWw7XG5cdFx0Y3RybC5tb2RlbC51cGRhdGVDb250YWN0KCk7XG5cdH07XG5cblx0Y3RybC5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZW1wbGF0ZVVybCA9IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2RldGFpbEl0ZW1zLycgKyBjdHJsLm1ldGEudGVtcGxhdGUgKyAnLmh0bWwnKTtcblx0XHRyZXR1cm4gJHRlbXBsYXRlUmVxdWVzdCh0ZW1wbGF0ZVVybCk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRjdHJsLm1vZGVsLmRlbGV0ZUZpZWxkKGN0cmwubmFtZSwgY3RybC5kYXRhKTtcblx0XHRjdHJsLm1vZGVsLnVwZGF0ZUNvbnRhY3QoKTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGV0YWlsc2l0ZW0nLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNJdGVtQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0bmFtZTogJz0nLFxuXHRcdFx0ZGF0YTogJz0nLFxuXHRcdFx0bW9kZWw6ICc9J1xuXHRcdH0sXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRjdHJsLmdldFRlbXBsYXRlKCkudGhlbihmdW5jdGlvbihodG1sKSB7XG5cdFx0XHRcdHZhciB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChodG1sKTtcblx0XHRcdFx0ZWxlbWVudC5hcHBlbmQodGVtcGxhdGUpO1xuXHRcdFx0XHQkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufV0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNQaG90b0N0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdkZXRhaWxzcGhvdG8nLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNQaG90b0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9kZXRhaWxzUGhvdG8uaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cEN0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdncm91cEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGdyb3VwOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvZ3JvdXAuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cGxpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBDb250YWN0U2VydmljZSwgJHJvdXRlUGFyYW1zKSB7XG5cblx0JHNjb3BlLmdyb3VwcyA9IFt0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKV07XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHQkc2NvcGUuZ3JvdXBzID0gXy51bmlxdWUoW3QoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpXS5jb25jYXQoZ3JvdXBzKSk7XG5cdH0pO1xuXG5cdCRzY29wZS5zZWxlY3RlZEdyb3VwID0gJHJvdXRlUGFyYW1zLmdpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkR3JvdXApIHtcblx0XHQkc2NvcGUuc2VsZWN0ZWRHcm91cCA9IHNlbGVjdGVkR3JvdXA7XG5cdFx0JCgnLnNlYXJjaGJveCcpWzBdLnJlc2V0KCk7XG5cdFx0U2VhcmNoUHJveHkuZmlsdGVyUHJveHkoJycpO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cGxpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0VBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2dyb3VwbGlzdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9ncm91cExpc3QuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdpbWFnZVByZXZpZXdDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLmxvYWRJbWFnZSA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuXHRcdHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmltYWdlcHJldmlldyA9IHJlYWRlci5yZXN1bHQ7XG5cdFx0XHR9KTtcblx0XHR9LCBmYWxzZSk7XG5cblx0XHRpZiAoZmlsZSkge1xuXHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdpbWFnZXByZXZpZXcnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge1xuXHRcdFx0cGhvdG9DYWxsYmFjazogJyZpbWFnZXByZXZpZXcnXG5cdFx0fSxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGN0cmwpIHtcblx0XHRcdGVsZW1lbnQuYmluZCgnY2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBmaWxlID0gZWxlbWVudC5nZXQoMCkuZmlsZXNbMF07XG5cdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG5cdFx0XHRcdHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdoaScsIHNjb3BlLnBob3RvQ2FsbGJhY2soKSArICcnKTtcblx0XHRcdFx0XHRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRzY29wZS5waG90b0NhbGxiYWNrKCkocmVhZGVyLnJlc3VsdCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sIGZhbHNlKTtcblxuXHRcdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyb3VwTW9kZWwnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG5cdHJldHVybntcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHJlcXVpcmU6ICduZ01vZGVsJyxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0ciwgbmdNb2RlbCkge1xuXHRcdFx0bmdNb2RlbC4kZm9ybWF0dGVycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmICh2YWx1ZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWx1ZS5zcGxpdCgnLCcpO1xuXHRcdFx0fSk7XG5cdFx0XHRuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlLmpvaW4oJywnKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgndGVsTW9kZWwnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJue1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZTogJ25nTW9kZWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyLCBuZ01vZGVsKSB7XG5cdFx0XHRuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0XHRuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnQWRkcmVzc0Jvb2snLCBmdW5jdGlvbigpXG57XG5cdHJldHVybiBmdW5jdGlvbiBBZGRyZXNzQm9vayhkYXRhKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXG5cdFx0XHRkaXNwbGF5TmFtZTogJycsXG5cdFx0XHRjb250YWN0czogW10sXG5cdFx0XHRncm91cHM6IGRhdGEuZGF0YS5wcm9wcy5ncm91cHMsXG5cblx0XHRcdGdldENvbnRhY3Q6IGZ1bmN0aW9uKHVpZCkge1xuXHRcdFx0XHRmb3IodmFyIGkgaW4gdGhpcy5jb250YWN0cykge1xuXHRcdFx0XHRcdGlmKHRoaXMuY29udGFjdHNbaV0udWlkKCkgPT09IHVpZCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuY29udGFjdHNbaV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHR9LFxuXG5cdFx0XHRzaGFyZWRXaXRoOiB7XG5cdFx0XHRcdHVzZXJzOiBbXSxcblx0XHRcdFx0Z3JvdXBzOiBbXVxuXHRcdFx0fVxuXG5cdFx0fSk7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXHRcdFx0b3duZXI6IGRhdGEudXJsLnNwbGl0KCcvJykuc2xpY2UoLTMsIC0yKVswXVxuXHRcdH0pO1xuXG5cdFx0dmFyIHNoYXJlcyA9IHRoaXMuZGF0YS5wcm9wcy5pbnZpdGU7XG5cdFx0aWYgKHR5cGVvZiBzaGFyZXMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHNoYXJlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHR2YXIgaHJlZiA9IHNoYXJlc1tqXS5ocmVmO1xuXHRcdFx0XHRpZiAoaHJlZi5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgYWNjZXNzID0gc2hhcmVzW2pdLmFjY2Vzcztcblx0XHRcdFx0aWYgKGFjY2Vzcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciByZWFkV3JpdGUgPSAodHlwZW9mIGFjY2Vzcy5yZWFkV3JpdGUgIT09ICd1bmRlZmluZWQnKTtcblxuXHRcdFx0XHRpZiAoaHJlZi5zdGFydHNXaXRoKCdwcmluY2lwYWw6cHJpbmNpcGFscy91c2Vycy8nKSkge1xuXHRcdFx0XHRcdHRoaXMuc2hhcmVkV2l0aC51c2Vycy5wdXNoKHtcblx0XHRcdFx0XHRcdGlkOiBocmVmLnN1YnN0cigyNyksXG5cdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogaHJlZi5zdWJzdHIoMjcpLFxuXHRcdFx0XHRcdFx0d3JpdGFibGU6IHJlYWRXcml0ZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGhyZWYuc3RhcnRzV2l0aCgncHJpbmNpcGFsOnByaW5jaXBhbHMvZ3JvdXBzLycpKSB7XG5cdFx0XHRcdFx0dGhpcy5zaGFyZWRXaXRoLmdyb3Vwcy5wdXNoKHtcblx0XHRcdFx0XHRcdGlkOiBocmVmLnN1YnN0cigyOCksXG5cdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogaHJlZi5zdWJzdHIoMjgpLFxuXHRcdFx0XHRcdFx0d3JpdGFibGU6IHJlYWRXcml0ZVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly92YXIgb3duZXIgPSB0aGlzLmRhdGEucHJvcHMub3duZXI7XG5cdFx0Ly9pZiAodHlwZW9mIG93bmVyICE9PSAndW5kZWZpbmVkJyAmJiBvd25lci5sZW5ndGggIT09IDApIHtcblx0XHQvL1x0b3duZXIgPSBvd25lci50cmltKCk7XG5cdFx0Ly9cdGlmIChvd25lci5zdGFydHNXaXRoKCcvcmVtb3RlLnBocC9kYXYvcHJpbmNpcGFscy91c2Vycy8nKSkge1xuXHRcdC8vXHRcdHRoaXMuX3Byb3BlcnRpZXMub3duZXIgPSBvd25lci5zdWJzdHIoMzMpO1xuXHRcdC8vXHR9XG5cdFx0Ly99XG5cblx0fTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NvbnRhY3QnLCBmdW5jdGlvbigkZmlsdGVyKSB7XG5cdHJldHVybiBmdW5jdGlvbiBDb250YWN0KGFkZHJlc3NCb29rLCB2Q2FyZCkge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcblxuXHRcdFx0ZGF0YToge30sXG5cdFx0XHRwcm9wczoge30sXG5cblx0XHRcdGFkZHJlc3NCb29rSWQ6IGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lLFxuXG5cdFx0XHR1aWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgndWlkJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0UHJvcGVydHkoJ3VpZCcpLnZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRmdWxsTmFtZTogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdmbicsIHsgdmFsdWU6IHZhbHVlIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2ZuJyk7XG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdHRpdGxlOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ3RpdGxlJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgndGl0bGUnKTtcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0b3JnOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdvcmcnKTtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdHZhciB2YWwgPSB2YWx1ZTtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSAmJiBBcnJheS5pc0FycmF5KHByb3BlcnR5LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0dmFsID0gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0XHR2YWxbMF0gPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ29yZycsIHsgdmFsdWU6IHZhbCB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocHJvcGVydHkudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZVswXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGVtYWlsOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2VtYWlsJyk7XG5cdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdHBob3RvOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgncGhvdG8nKTtcblx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0Y2F0ZWdvcmllczogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdjYXRlZ29yaWVzJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnY2F0ZWdvcmllcycpO1xuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWUuc3BsaXQoJywnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0Z2V0UHJvcGVydHk6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdFx0aWYgKHRoaXMucHJvcHNbbmFtZV0pIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9wc1tuYW1lXVswXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YWRkUHJvcGVydHk6IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcblx0XHRcdFx0ZGF0YSA9IGFuZ3VsYXIuY29weShkYXRhKTtcblx0XHRcdFx0aWYoIXRoaXMucHJvcHNbbmFtZV0pIHtcblx0XHRcdFx0XHR0aGlzLnByb3BzW25hbWVdID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGlkeCA9IHRoaXMucHJvcHNbbmFtZV0ubGVuZ3RoO1xuXHRcdFx0XHR0aGlzLnByb3BzW25hbWVdW2lkeF0gPSBkYXRhO1xuXG5cdFx0XHRcdC8vIGtlZXAgdkNhcmQgaW4gc3luY1xuXHRcdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0XHRcdHJldHVybiBpZHg7XG5cdFx0XHR9LFxuXHRcdFx0c2V0UHJvcGVydHk6IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcblx0XHRcdFx0aWYoIXRoaXMucHJvcHNbbmFtZV0pIHtcblx0XHRcdFx0XHR0aGlzLnByb3BzW25hbWVdID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5wcm9wc1tuYW1lXVswXSA9IGRhdGE7XG5cblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdH0sXG5cdFx0XHRyZW1vdmVQcm9wZXJ0eTogZnVuY3Rpb24gKG5hbWUsIHByb3ApIHtcblx0XHRcdFx0YW5ndWxhci5jb3B5KF8ud2l0aG91dCh0aGlzLnByb3BzW25hbWVdLCBwcm9wKSwgdGhpcy5wcm9wc1tuYW1lXSk7XG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdH0sXG5cdFx0XHRzZXRFVGFnOiBmdW5jdGlvbihldGFnKSB7XG5cdFx0XHRcdHRoaXMuZGF0YS5ldGFnID0gZXRhZztcblx0XHRcdH0sXG5cdFx0XHRzZXRVcmw6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCB1aWQpIHtcblx0XHRcdFx0dGhpcy5kYXRhLnVybCA9IGFkZHJlc3NCb29rLnVybCArIHVpZCArICcudmNmJztcblx0XHRcdH0sXG5cblx0XHRcdHN5bmNWQ2FyZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIGtlZXAgdkNhcmQgaW4gc3luY1xuXHRcdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0XHR9LFxuXG5cdFx0XHRtYXRjaGVzOiBmdW5jdGlvbihwYXR0ZXJuKSB7XG5cdFx0XHRcdGlmIChfLmlzVW5kZWZpbmVkKHBhdHRlcm4pIHx8IHBhdHRlcm4ubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5hZGRyZXNzRGF0YS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocGF0dGVybi50b0xvd2VyQ2FzZSgpKSAhPT0gLTE7XG5cdFx0XHR9XG5cblx0XHR9KTtcblxuXHRcdGlmKGFuZ3VsYXIuaXNEZWZpbmVkKHZDYXJkKSkge1xuXHRcdFx0YW5ndWxhci5leHRlbmQodGhpcy5kYXRhLCB2Q2FyZCk7XG5cdFx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLnByb3BzLCAkZmlsdGVyKCd2Q2FyZDJKU09OJykodGhpcy5kYXRhLmFkZHJlc3NEYXRhKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMucHJvcHMsIHtcblx0XHRcdFx0dmVyc2lvbjogW3t2YWx1ZTogJzMuMCd9XSxcblx0XHRcdFx0Zm46IFt7dmFsdWU6ICcnfV1cblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdH1cblxuXHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2NhdGVnb3JpZXMnKTtcblx0XHRpZighcHJvcGVydHkpIHtcblx0XHRcdHRoaXMuY2F0ZWdvcmllcygnJyk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnQWRkcmVzc0Jvb2tTZXJ2aWNlJywgZnVuY3Rpb24oRGF2Q2xpZW50LCBEYXZTZXJ2aWNlLCBTZXR0aW5nc1NlcnZpY2UsIEFkZHJlc3NCb29rLCBDb250YWN0KSB7XG5cblx0dmFyIGFkZHJlc3NCb29rcyA9IFtdO1xuXG5cdHZhciBsb2FkQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRhZGRyZXNzQm9va3MgPSBhY2NvdW50LmFkZHJlc3NCb29rcy5tYXAoZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBBZGRyZXNzQm9vayhhZGRyZXNzQm9vayk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdGdldEFsbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gbG9hZEFsbCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBhZGRyZXNzQm9va3M7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Z2V0R3JvdXBzOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50Lmdyb3Vwcztcblx0XHRcdFx0fSkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRcdFx0XHRyZXR1cm4gYS5jb25jYXQoYik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldEVuYWJsZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBhY2NvdW50LmFkZHJlc3NCb29rcy5tYXAoZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRyZXR1cm4gbmV3IEFkZHJlc3NCb29rKGFkZHJlc3NCb29rKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Z2V0RGVmYXVsdEFkZHJlc3NCb29rOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBhZGRyZXNzQm9va3NbMF07XG5cdFx0fSxcblxuXHRcdGdldEFkZHJlc3NCb29rOiBmdW5jdGlvbihkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQuZ2V0QWRkcmVzc0Jvb2soe2Rpc3BsYXlOYW1lOmRpc3BsYXlOYW1lLCB1cmw6YWNjb3VudC5ob21lVXJsfSkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdGFkZHJlc3NCb29rID0gbmV3IEFkZHJlc3NCb29rKHtcblx0XHRcdFx0XHRcdHVybDogYWRkcmVzc0Jvb2tbMF0uaHJlZixcblx0XHRcdFx0XHRcdGRhdGE6IGFkZHJlc3NCb29rWzBdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YWRkcmVzc0Jvb2suZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZTtcblx0XHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2s7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGNyZWF0ZTogZnVuY3Rpb24oZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LmNyZWF0ZUFkZHJlc3NCb29rKHtkaXNwbGF5TmFtZTpkaXNwbGF5TmFtZSwgdXJsOmFjY291bnQuaG9tZVVybH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LmRlbGV0ZUFkZHJlc3NCb29rKGFkZHJlc3NCb29rKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGFuZ3VsYXIuY29weShfLndpdGhvdXQoYWRkcmVzc0Jvb2tzLCBhZGRyZXNzQm9vayksIGFkZHJlc3NCb29rcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdHJlbmFtZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5yZW5hbWVBZGRyZXNzQm9vayhhZGRyZXNzQm9vaywge2Rpc3BsYXlOYW1lOmRpc3BsYXlOYW1lLCB1cmw6YWNjb3VudC5ob21lVXJsfSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Z2V0OiBmdW5jdGlvbihkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rcy5maWx0ZXIoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC5kaXNwbGF5TmFtZSA9PT0gZGlzcGxheU5hbWU7XG5cdFx0XHRcdH0pWzBdO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdHN5bmM6IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRyZXR1cm4gRGF2Q2xpZW50LnN5bmNBZGRyZXNzQm9vayhhZGRyZXNzQm9vayk7XG5cdFx0fSxcblxuXHRcdHNoYXJlOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgc2hhcmVUeXBlLCBzaGFyZVdpdGgsIHdyaXRhYmxlLCBleGlzdGluZ1NoYXJlKSB7XG5cdFx0XHR2YXIgeG1sRG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoJycsICcnLCBudWxsKTtcblx0XHRcdHZhciBvU2hhcmUgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzaGFyZScpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6ZCcsICdEQVY6Jyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpvJywgJ2h0dHA6Ly9vd25jbG91ZC5vcmcvbnMnKTtcblx0XHRcdHhtbERvYy5hcHBlbmRDaGlsZChvU2hhcmUpO1xuXG5cdFx0XHR2YXIgb1NldCA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnNldCcpO1xuXHRcdFx0b1NoYXJlLmFwcGVuZENoaWxkKG9TZXQpO1xuXG5cdFx0XHR2YXIgZEhyZWYgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnZDpocmVmJyk7XG5cdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvdXNlcnMvJztcblx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL2dyb3Vwcy8nO1xuXHRcdFx0fVxuXHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgKz0gc2hhcmVXaXRoO1xuXHRcdFx0b1NldC5hcHBlbmRDaGlsZChkSHJlZik7XG5cblx0XHRcdHZhciBvU3VtbWFyeSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnN1bW1hcnknKTtcblx0XHRcdG9TdW1tYXJ5LnRleHRDb250ZW50ID0gdCgnY29udGFjdHMnLCAne2FkZHJlc3Nib29rfSBzaGFyZWQgYnkge293bmVyfScsIHtcblx0XHRcdFx0YWRkcmVzc2Jvb2s6IGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lLFxuXHRcdFx0XHRvd25lcjogYWRkcmVzc0Jvb2sub3duZXJcblx0XHRcdH0pO1xuXHRcdFx0b1NldC5hcHBlbmRDaGlsZChvU3VtbWFyeSk7XG5cblx0XHRcdGlmICh3cml0YWJsZSkge1xuXHRcdFx0XHR2YXIgb1JXID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286cmVhZC13cml0ZScpO1xuXHRcdFx0XHRvU2V0LmFwcGVuZENoaWxkKG9SVyk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBib2R5ID0gb1NoYXJlLm91dGVySFRNTDtcblxuXHRcdFx0cmV0dXJuIERhdkNsaWVudC54aHIuc2VuZChcblx0XHRcdFx0ZGF2LnJlcXVlc3QuYmFzaWMoe21ldGhvZDogJ1BPU1QnLCBkYXRhOiBib2R5fSksXG5cdFx0XHRcdGFkZHJlc3NCb29rLnVybFxuXHRcdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdGlmICghZXhpc3RpbmdTaGFyZSkge1xuXHRcdFx0XHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdFx0XHRcdGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHRkaXNwbGF5bmFtZTogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdHdyaXRhYmxlOiB3cml0YWJsZVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdFx0XHRcdGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGlkOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHR3cml0YWJsZTogd3JpdGFibGVcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdH0sXG5cblx0XHR1bnNoYXJlOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgc2hhcmVUeXBlLCBzaGFyZVdpdGgpIHtcblx0XHRcdHZhciB4bWxEb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVEb2N1bWVudCgnJywgJycsIG51bGwpO1xuXHRcdFx0dmFyIG9TaGFyZSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnNoYXJlJyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpkJywgJ0RBVjonKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOm8nLCAnaHR0cDovL293bmNsb3VkLm9yZy9ucycpO1xuXHRcdFx0eG1sRG9jLmFwcGVuZENoaWxkKG9TaGFyZSk7XG5cblx0XHRcdHZhciBvUmVtb3ZlID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286cmVtb3ZlJyk7XG5cdFx0XHRvU2hhcmUuYXBwZW5kQ2hpbGQob1JlbW92ZSk7XG5cblx0XHRcdHZhciBkSHJlZiA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdkOmhyZWYnKTtcblx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy91c2Vycy8nO1xuXHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvZ3JvdXBzLyc7XG5cdFx0XHR9XG5cdFx0XHRkSHJlZi50ZXh0Q29udGVudCArPSBzaGFyZVdpdGg7XG5cdFx0XHRvUmVtb3ZlLmFwcGVuZENoaWxkKGRIcmVmKTtcblx0XHRcdHZhciBib2R5ID0gb1NoYXJlLm91dGVySFRNTDtcblxuXG5cdFx0XHRyZXR1cm4gRGF2Q2xpZW50Lnhoci5zZW5kKFxuXHRcdFx0XHRkYXYucmVxdWVzdC5iYXNpYyh7bWV0aG9kOiAnUE9TVCcsIGRhdGE6IGJvZHl9KSxcblx0XHRcdFx0YWRkcmVzc0Jvb2sudXJsXG5cdFx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2Vycy5maWx0ZXIoZnVuY3Rpb24odXNlcikge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdXNlci5pZCAhPT0gc2hhcmVXaXRoO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVApIHtcblx0XHRcdFx0XHRcdGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHMuZmlsdGVyKGZ1bmN0aW9uKGdyb3Vwcykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZ3JvdXBzLmlkICE9PSBzaGFyZVdpdGg7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly90b2RvIC0gcmVtb3ZlIGVudHJ5IGZyb20gYWRkcmVzc2Jvb2sgb2JqZWN0XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdH1cblxuXG5cdH07XG5cbn0pO1xuIiwidmFyIGNvbnRhY3RzO1xuYXBwLnNlcnZpY2UoJ0NvbnRhY3RTZXJ2aWNlJywgZnVuY3Rpb24oRGF2Q2xpZW50LCBBZGRyZXNzQm9va1NlcnZpY2UsIENvbnRhY3QsICRxLCBDYWNoZUZhY3RvcnksIHV1aWQ0KSB7XG5cblx0dmFyIGNhY2hlRmlsbGVkID0gZmFsc2U7XG5cblx0Y29udGFjdHMgPSBDYWNoZUZhY3RvcnkoJ2NvbnRhY3RzJyk7XG5cblx0dmFyIG9ic2VydmVyQ2FsbGJhY2tzID0gW107XG5cblx0dGhpcy5yZWdpc3Rlck9ic2VydmVyQ2FsbGJhY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdG9ic2VydmVyQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuXHR9O1xuXG5cdHZhciBub3RpZnlPYnNlcnZlcnMgPSBmdW5jdGlvbihldmVudE5hbWUsIHVpZCkge1xuXHRcdHZhciBldiA9IHtcblx0XHRcdGV2ZW50OiBldmVudE5hbWUsXG5cdFx0XHR1aWQ6IHVpZCxcblx0XHRcdGNvbnRhY3RzOiBjb250YWN0cy52YWx1ZXMoKVxuXHRcdH07XG5cdFx0YW5ndWxhci5mb3JFYWNoKG9ic2VydmVyQ2FsbGJhY2tzLCBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2soZXYpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZmlsbENhY2hlID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIEFkZHJlc3NCb29rU2VydmljZS5nZXRFbmFibGVkKCkudGhlbihmdW5jdGlvbihlbmFibGVkQWRkcmVzc0Jvb2tzKSB7XG5cdFx0XHR2YXIgcHJvbWlzZXMgPSBbXTtcblx0XHRcdGVuYWJsZWRBZGRyZXNzQm9va3MuZm9yRWFjaChmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRwcm9taXNlcy5wdXNoKFxuXHRcdFx0XHRcdEFkZHJlc3NCb29rU2VydmljZS5zeW5jKGFkZHJlc3NCb29rKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0XHRmb3IodmFyIGkgaW4gYWRkcmVzc0Jvb2sub2JqZWN0cykge1xuXHRcdFx0XHRcdFx0XHRjb250YWN0ID0gbmV3IENvbnRhY3QoYWRkcmVzc0Jvb2ssIGFkZHJlc3NCb29rLm9iamVjdHNbaV0pO1xuXHRcdFx0XHRcdFx0XHRjb250YWN0cy5wdXQoY29udGFjdC51aWQoKSwgY29udGFjdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuICRxLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0Y2FjaGVGaWxsZWQgPSB0cnVlO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRpZihjYWNoZUZpbGxlZCA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiB0aGlzLmZpbGxDYWNoZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBjb250YWN0cy52YWx1ZXMoKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gJHEud2hlbihjb250YWN0cy52YWx1ZXMoKSk7XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuZ2V0R3JvdXBzID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oY29udGFjdHMpIHtcblx0XHRcdHJldHVybiBfLnVuaXEoY29udGFjdHMubWFwKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdHJldHVybiBlbGVtZW50LmNhdGVnb3JpZXMoKTtcblx0XHRcdH0pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRcdHJldHVybiBhLmNvbmNhdChiKTtcblx0XHRcdH0sIFtdKS5zb3J0KCksIHRydWUpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZ2V0QnlJZCA9IGZ1bmN0aW9uKHVpZCkge1xuXHRcdGlmKGNhY2hlRmlsbGVkID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZmlsbENhY2hlKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGNvbnRhY3RzLmdldCh1aWQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiAkcS53aGVuKGNvbnRhY3RzLmdldCh1aWQpKTtcblx0XHR9XG5cdH07XG5cblx0dGhpcy5jcmVhdGUgPSBmdW5jdGlvbihuZXdDb250YWN0LCBhZGRyZXNzQm9vaykge1xuXHRcdGFkZHJlc3NCb29rID0gYWRkcmVzc0Jvb2sgfHwgQWRkcmVzc0Jvb2tTZXJ2aWNlLmdldERlZmF1bHRBZGRyZXNzQm9vaygpO1xuXHRcdG5ld0NvbnRhY3QgPSBuZXdDb250YWN0IHx8IG5ldyBDb250YWN0KGFkZHJlc3NCb29rKTtcblx0XHR2YXIgbmV3VWlkID0gdXVpZDQuZ2VuZXJhdGUoKTtcblx0XHRuZXdDb250YWN0LnVpZChuZXdVaWQpO1xuXHRcdG5ld0NvbnRhY3Quc2V0VXJsKGFkZHJlc3NCb29rLCBuZXdVaWQpO1xuXHRcdG5ld0NvbnRhY3QuYWRkcmVzc0Jvb2tJZCA9IGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lO1xuXG5cdFx0cmV0dXJuIERhdkNsaWVudC5jcmVhdGVDYXJkKFxuXHRcdFx0YWRkcmVzc0Jvb2ssXG5cdFx0XHR7XG5cdFx0XHRcdGRhdGE6IG5ld0NvbnRhY3QuZGF0YS5hZGRyZXNzRGF0YSxcblx0XHRcdFx0ZmlsZW5hbWU6IG5ld1VpZCArICcudmNmJ1xuXHRcdFx0fVxuXHRcdCkudGhlbihmdW5jdGlvbih4aHIpIHtcblx0XHRcdG5ld0NvbnRhY3Quc2V0RVRhZyh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0VUYWcnKSk7XG5cdFx0XHRjb250YWN0cy5wdXQobmV3VWlkLCBuZXdDb250YWN0KTtcblx0XHRcdG5vdGlmeU9ic2VydmVycygnY3JlYXRlJywgbmV3VWlkKTtcblx0XHRcdHJldHVybiBuZXdDb250YWN0O1xuXHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiQ291bGRuJ3QgY3JlYXRlXCIsIGUpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMubW92ZUNvbnRhY3QgPSBmdW5jdGlvbiAoY29udGFjdCwgYWRkcmVzc2Jvb2spIHtcblx0XHRpZiAoY29udGFjdC5hZGRyZXNzQm9va0lkID09PSBhZGRyZXNzYm9vay5kaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb250YWN0LnN5bmNWQ2FyZCgpO1xuXHRcdHZhciBjbG9uZSA9IGFuZ3VsYXIuY29weShjb250YWN0KTtcblxuXHRcdC8vIGNyZWF0ZSB0aGUgY29udGFjdCBpbiB0aGUgbmV3IHRhcmdldCBhZGRyZXNzYm9va1xuXHRcdHRoaXMuY3JlYXRlKGNsb25lLCBhZGRyZXNzYm9vayk7XG5cblx0XHQvLyBkZWxldGUgdGhlIG9sZCBvbmVcblx0XHR0aGlzLmRlbGV0ZShjb250YWN0KTtcblx0fTtcblxuXHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uKGNvbnRhY3QpIHtcblx0XHRjb250YWN0LnN5bmNWQ2FyZCgpO1xuXG5cdFx0Ly8gdXBkYXRlIGNvbnRhY3Qgb24gc2VydmVyXG5cdFx0cmV0dXJuIERhdkNsaWVudC51cGRhdGVDYXJkKGNvbnRhY3QuZGF0YSwge2pzb246IHRydWV9KS50aGVuKGZ1bmN0aW9uKHhocikge1xuXHRcdFx0dmFyIG5ld0V0YWcgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ0VUYWcnKTtcblx0XHRcdGNvbnRhY3Quc2V0RVRhZyhuZXdFdGFnKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKGNvbnRhY3QpIHtcblx0XHQvLyBkZWxldGUgY29udGFjdCBmcm9tIHNlcnZlclxuXHRcdHJldHVybiBEYXZDbGllbnQuZGVsZXRlQ2FyZChjb250YWN0LmRhdGEpLnRoZW4oZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRjb250YWN0cy5yZW1vdmUoY29udGFjdC51aWQoKSk7XG5cdFx0XHRub3RpZnlPYnNlcnZlcnMoJ2RlbGV0ZScsIGNvbnRhY3QudWlkKCkpO1xuXHRcdH0pO1xuXHR9O1xufSk7XG4iLCJhcHAuc2VydmljZSgnRGF2Q2xpZW50JywgZnVuY3Rpb24oKSB7XG5cdHZhciB4aHIgPSBuZXcgZGF2LnRyYW5zcG9ydC5CYXNpYyhcblx0XHRuZXcgZGF2LkNyZWRlbnRpYWxzKClcblx0KTtcblx0cmV0dXJuIG5ldyBkYXYuQ2xpZW50KHhocik7XG59KTsiLCJhcHAuc2VydmljZSgnRGF2U2VydmljZScsIGZ1bmN0aW9uKERhdkNsaWVudCkge1xuXHRyZXR1cm4gRGF2Q2xpZW50LmNyZWF0ZUFjY291bnQoe1xuXHRcdHNlcnZlcjogT0MubGlua1RvUmVtb3RlQmFzZSgnZGF2L2FkZHJlc3Nib29rcycpLFxuXHRcdGFjY291bnRUeXBlOiAnY2FyZGRhdicsXG5cdFx0dXNlUHJvdmlkZWRQYXRoOiB0cnVlXG5cdH0pO1xufSk7XG4iLCJhcHAuc2VydmljZSgnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdHZhciBzZXR0aW5ncyA9IHtcblx0XHRhZGRyZXNzQm9va3M6IFtcblx0XHRcdCd0ZXN0QWRkcidcblx0XHRdXG5cdH07XG5cblx0dGhpcy5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0c2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuXHR9O1xuXG5cdHRoaXMuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7XG5cdFx0cmV0dXJuIHNldHRpbmdzW2tleV07XG5cdH07XG5cblx0dGhpcy5nZXRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2V0dGluZ3M7XG5cdH07XG59KTtcbiIsImFwcC5zZXJ2aWNlKCd2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdC8qKlxuXHQgKiBtYXAgdkNhcmQgYXR0cmlidXRlcyB0byBpbnRlcm5hbCBhdHRyaWJ1dGVzXG5cdCAqXG5cdCAqIHByb3BOYW1lOiB7XG5cdCAqIFx0XHRtdWx0aXBsZTogW0Jvb2xlYW5dLCAvLyBpcyB0aGlzIHByb3AgYWxsb3dlZCBtb3JlIHRoYW4gb25jZT8gKGRlZmF1bHQgPSBmYWxzZSlcblx0ICogXHRcdHJlYWRhYmxlTmFtZTogW1N0cmluZ10sIC8vIGludGVybmF0aW9uYWxpemVkIHJlYWRhYmxlIG5hbWUgb2YgcHJvcFxuXHQgKiBcdFx0dGVtcGxhdGU6IFtTdHJpbmddLCAvLyB0ZW1wbGF0ZSBuYW1lIGZvdW5kIGluIC90ZW1wbGF0ZXMvZGV0YWlsSXRlbXNcblx0ICogXHRcdFsuLi5dIC8vIG9wdGlvbmFsIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gd2hpY2ggbWlnaHQgZ2V0IHVzZWQgYnkgdGhlIHRlbXBsYXRlXG5cdCAqIH1cblx0ICovXG5cdHRoaXMudkNhcmRNZXRhID0ge1xuXHRcdG5pY2tuYW1lOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ05pY2tuYW1lJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnXG5cdFx0fSxcblx0XHRub3RlOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ05vdGVzJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHRhcmVhJ1xuXHRcdH0sXG5cdFx0dXJsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnV2Vic2l0ZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd1cmwnXG5cdFx0fSxcblx0XHRjbG91ZDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZlZGVyYXRlZCBDbG91ZCBJRCcpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0Jyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXHRcdH0sXG5cdFx0YWRyOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnQWRkcmVzcycpLFxuXHRcdFx0dGVtcGxhdGU6ICdhZHInLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJywgJycsICcnLCAnJywgJycsICcnLCAnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cblx0XHR9LFxuXHRcdGNhdGVnb3JpZXM6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnR3JvdXBzJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ2dyb3Vwcydcblx0XHR9LFxuXHRcdGJkYXk6IHtcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnQmlydGhkYXknKSxcblx0XHRcdHRlbXBsYXRlOiAnZGF0ZSdcblx0XHR9LFxuXHRcdGVtYWlsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnRW1haWwnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6JycsXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSycsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ09USEVSJywgbmFtZTogdCgnY29udGFjdHMnLCAnT3RoZXInKX1cblx0XHRcdF1cblx0XHR9LFxuXHRcdGltcHA6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdJbnN0YW50IG1lc3NhZ2luZycpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0Jyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHR0ZWw6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdQaG9uZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZWwnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOlsnJ10sXG5cdFx0XHRcdG1ldGE6e3R5cGU6WydIT01FLFZPSUNFJ119XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHR7aWQ6ICdIT01FLFZPSUNFJywgbmFtZTogdCgnY29udGFjdHMnLCAnSG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSyxWT0lDRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ0NFTEwnLCBuYW1lOiB0KCdjb250YWN0cycsICdNb2JpbGUnKX0sXG5cdFx0XHRcdHtpZDogJ0ZBWCcsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0ZheCcpfSxcblx0XHRcdFx0e2lkOiAnSE9NRSxGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXggaG9tZScpfSxcblx0XHRcdFx0e2lkOiAnV09SSyxGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXggd29yaycpfSxcblx0XHRcdFx0e2lkOiAnUEFHRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdQYWdlcicpfSxcblx0XHRcdFx0e2lkOiAnVk9JQ0UnLCBuYW1lOiB0KCdjb250YWN0cycsICdWb2ljZScpfVxuXHRcdFx0XVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmZpZWxkT3JkZXIgPSBbXG5cdFx0J29yZycsXG5cdFx0J3RpdGxlJyxcblx0XHQndGVsJyxcblx0XHQnZW1haWwnLFxuXHRcdCdhZHInLFxuXHRcdCdpbXBwJyxcblx0XHQnbmljaycsXG5cdFx0J2JkYXknLFxuXHRcdCd1cmwnLFxuXHRcdCdub3RlJyxcblx0XHQnY2F0ZWdvcmllcycsXG5cdFx0J3JvbGUnXG5cdF07XG5cblx0dGhpcy5maWVsZERlZmluaXRpb25zID0gW107XG5cdGZvciAodmFyIHByb3AgaW4gdGhpcy52Q2FyZE1ldGEpIHtcblx0XHR0aGlzLmZpZWxkRGVmaW5pdGlvbnMucHVzaCh7aWQ6IHByb3AsIG5hbWU6IHRoaXMudkNhcmRNZXRhW3Byb3BdLnJlYWRhYmxlTmFtZSwgbXVsdGlwbGU6ICEhdGhpcy52Q2FyZE1ldGFbcHJvcF0ubXVsdGlwbGV9KTtcblx0fVxuXG5cdHRoaXMuZmFsbGJhY2tNZXRhID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRmdW5jdGlvbiBjYXBpdGFsaXplKHN0cmluZykgeyByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpOyB9XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6ICd1bmtub3duLScgKyBwcm9wZXJ0eSxcblx0XHRcdHJlYWRhYmxlTmFtZTogY2FwaXRhbGl6ZShwcm9wZXJ0eSksXG5cdFx0XHR0ZW1wbGF0ZTogJ2hpZGRlbicsXG5cdFx0XHRuZWNlc3NpdHk6ICdvcHRpb25hbCdcblx0XHR9O1xuXHR9O1xuXG5cdHRoaXMuZ2V0TWV0YSA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0cmV0dXJuIHRoaXMudkNhcmRNZXRhW3Byb3BlcnR5XSB8fCB0aGlzLmZhbGxiYWNrTWV0YShwcm9wZXJ0eSk7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmZpbHRlcignSlNPTjJ2Q2FyZCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gdkNhcmQuZ2VuZXJhdGUoaW5wdXQpO1xuXHR9O1xufSk7IiwiYXBwLmZpbHRlcignY29udGFjdENvbG9yJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHZhciBjb2xvcnMgPSBbXG5cdFx0XHRcdCcjMDAxZjNmJyxcblx0XHRcdFx0JyMwMDc0RDknLFxuXHRcdFx0XHQnIzM5Q0NDQycsXG5cdFx0XHRcdCcjM0Q5OTcwJyxcblx0XHRcdFx0JyMyRUNDNDAnLFxuXHRcdFx0XHQnI0ZGODUxQicsXG5cdFx0XHRcdCcjRkY0MTM2Jyxcblx0XHRcdFx0JyM4NTE0NGInLFxuXHRcdFx0XHQnI0YwMTJCRScsXG5cdFx0XHRcdCcjQjEwREM5J1xuXHRcdFx0XSwgYXNjaWlTdW0gPSAwO1xuXHRcdGZvcih2YXIgaSBpbiBpbnB1dCkge1xuXHRcdFx0YXNjaWlTdW0gKz0gaW5wdXQuY2hhckNvZGVBdChpKTtcblx0XHR9XG5cdFx0cmV0dXJuIGNvbG9yc1thc2NpaVN1bSAlIGNvbG9ycy5sZW5ndGhdO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdjb250YWN0R3JvdXBGaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRhY3RzLCBncm91cCkge1xuXHRcdGlmICh0eXBlb2YgY29udGFjdHMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gY29udGFjdHM7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgZ3JvdXAgPT09ICd1bmRlZmluZWQnIHx8IGdyb3VwLnRvTG93ZXJDYXNlKCkgPT09IHQoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdHJldHVybiBjb250YWN0cztcblx0XHR9XG5cdFx0dmFyIGZpbHRlciA9IFtdO1xuXHRcdGlmIChjb250YWN0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhY3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChjb250YWN0c1tpXS5jYXRlZ29yaWVzKCkuaW5kZXhPZihncm91cCkgPj0gMCkge1xuXHRcdFx0XHRcdGZpbHRlci5wdXNoKGNvbnRhY3RzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmlsdGVyO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdmaWVsZEZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cdHJldHVybiBmdW5jdGlvbiAoZmllbGRzLCBjb250YWN0KSB7XG5cdFx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gZmllbGRzO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGNvbnRhY3QgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gZmllbGRzO1xuXHRcdH1cblx0XHR2YXIgZmlsdGVyID0gW107XG5cdFx0aWYgKGZpZWxkcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoZmllbGRzW2ldLm11bHRpcGxlICkge1xuXHRcdFx0XHRcdGZpbHRlci5wdXNoKGZpZWxkc1tpXSk7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKF8uaXNVbmRlZmluZWQoY29udGFjdC5nZXRQcm9wZXJ0eShmaWVsZHNbaV0uaWQpKSkge1xuXHRcdFx0XHRcdGZpbHRlci5wdXNoKGZpZWxkc1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZpbHRlcjtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignZmlyc3RDaGFyYWN0ZXInLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0cmV0dXJuIGlucHV0LmNoYXJBdCgwKTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignb3JkZXJEZXRhaWxJdGVtcycsIGZ1bmN0aW9uKHZDYXJkUHJvcGVydGllc1NlcnZpY2UpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24oaXRlbXMsIGZpZWxkLCByZXZlcnNlKSB7XG5cblx0XHR2YXIgZmlsdGVyZWQgPSBbXTtcblx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdGZpbHRlcmVkLnB1c2goaXRlbSk7XG5cdFx0fSk7XG5cblx0XHR2YXIgZmllbGRPcmRlciA9IGFuZ3VsYXIuY29weSh2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmZpZWxkT3JkZXIpO1xuXHRcdC8vIHJldmVyc2UgdG8gbW92ZSBjdXN0b20gaXRlbXMgdG8gdGhlIGVuZCAoaW5kZXhPZiA9PSAtMSlcblx0XHRmaWVsZE9yZGVyLnJldmVyc2UoKTtcblxuXHRcdGZpbHRlcmVkLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdGlmKGZpZWxkT3JkZXIuaW5kZXhPZihhW2ZpZWxkXSkgPCBmaWVsZE9yZGVyLmluZGV4T2YoYltmaWVsZF0pKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXHRcdFx0aWYoZmllbGRPcmRlci5pbmRleE9mKGFbZmllbGRdKSA+IGZpZWxkT3JkZXIuaW5kZXhPZihiW2ZpZWxkXSkpIHtcblx0XHRcdFx0cmV0dXJuIC0xO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fSk7XG5cblx0XHRpZihyZXZlcnNlKSBmaWx0ZXJlZC5yZXZlcnNlKCk7XG5cdFx0cmV0dXJuIGZpbHRlcmVkO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCd0b0FycmF5JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihvYmopIHtcblx0XHRpZiAoIShvYmogaW5zdGFuY2VvZiBPYmplY3QpKSByZXR1cm4gb2JqO1xuXHRcdHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG5cdFx0XHRyZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHZhbCwgJyRrZXknLCB7dmFsdWU6IGtleX0pO1xuXHRcdH0pO1xuXHR9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCd2Q2FyZDJKU09OJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHJldHVybiB2Q2FyZC5wYXJzZShpbnB1dCk7XG5cdH07XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
