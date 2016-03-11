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

app.controller('contactlistCtrl', ['$scope', '$filter', '$route', '$routeParams', 'ContactService', 'vCardPropertiesService', function($scope, $filter, $route, $routeParams, ContactService, vCardPropertiesService) {
	var ctrl = this;

	ctrl.routeParams = $routeParams;
	ctrl.t = {
		addContact : t('contacts', 'Add contact')
	};

	ctrl.contactList = [];
	ctrl.query = '';

	$scope.query = function(contact) {
		return contact.matches(ctrl.query);
	};

	SearchProxy.setFilter(function(query) {
		ctrl.query = query.toLowerCase();
		if (ctrl.contactList.length !== 0) {
			$route.updateParams({
				uid: ctrl.contactList[0].uid()
			});
			$scope.selectedContactId = $routeParams.uid;
		} else {
			$route.updateParams({
				uid: undefined
			});
		}
		$scope.$apply();
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

app.controller('grouplistCtrl', ['$scope', 'ContactService', '$routeParams', function($scope, ContactService, $routeParams) {

	$scope.groups = [t('contacts', 'All contacts')];

	ContactService.getGroups().then(function(groups) {
		$scope.groups = _.unique([t('contacts', 'All contacts')].concat(groups));
	});

	$scope.selectedGroup = $routeParams.gid;
	$scope.setSelected = function (selectedGroup) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkYXRlcGlja2VyX2RpcmVjdGl2ZS5qcyIsImZvY3VzX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rL2FkZHJlc3NCb29rX2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9vay9hZGRyZXNzQm9va19kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3QvY29udGFjdF9jb250cm9sbGVyLmpzIiwiY29udGFjdC9jb250YWN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3REZXRhaWxzL2NvbnRhY3REZXRhaWxzX2NvbnRyb2xsZXIuanMiLCJjb250YWN0RGV0YWlscy9jb250YWN0RGV0YWlsc19kaXJlY3RpdmUuanMiLCJjb250YWN0TGlzdC9jb250YWN0TGlzdF9jb250cm9sbGVyLmpzIiwiY29udGFjdExpc3QvY29udGFjdExpc3RfZGlyZWN0aXZlLmpzIiwiZGV0YWlsc1Bob3RvL2RldGFpbHNQaG90b19jb250cm9sbGVyLmpzIiwiZGV0YWlsc1Bob3RvL2RldGFpbHNQaG90b19kaXJlY3RpdmUuanMiLCJkZXRhaWxzSXRlbS9kZXRhaWxzSXRlbV9jb250cm9sbGVyLmpzIiwiZGV0YWlsc0l0ZW0vZGV0YWlsc0l0ZW1fZGlyZWN0aXZlLmpzIiwiZ3JvdXAvZ3JvdXBfY29udHJvbGxlci5qcyIsImdyb3VwL2dyb3VwX2RpcmVjdGl2ZS5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfY29udHJvbGxlci5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfZGlyZWN0aXZlLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19jb250cm9sbGVyLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19kaXJlY3RpdmUuanMiLCJwYXJzZXJzL2dyb3VwTW9kZWxfZGlyZWN0aXZlLmpzIiwicGFyc2Vycy90ZWxNb2RlbF9kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va19tb2RlbC5qcyIsImNvbnRhY3RfbW9kZWwuanMiLCJhZGRyZXNzQm9va19zZXJ2aWNlLmpzIiwiY29udGFjdF9zZXJ2aWNlLmpzIiwiZGF2Q2xpZW50X3NlcnZpY2UuanMiLCJkYXZfc2VydmljZS5qcyIsInNldHRpbmdzX3NlcnZpY2UuanMiLCJ2Q2FyZFByb3BlcnRpZXMuanMiLCJKU09OMnZDYXJkX2ZpbHRlci5qcyIsImNvbnRhY3RDb2xvcl9maWx0ZXIuanMiLCJjb250YWN0R3JvdXBfZmlsdGVyLmpzIiwiZmllbGRfZmlsdGVyLmpzIiwiZmlyc3RDaGFyYWN0ZXJfZmlsdGVyLmpzIiwib3JkZXJEZXRhaWxJdGVtc19maWx0ZXIuanMiLCJ0b0FycmF5X2ZpbHRlci5qcyIsInZDYXJkMkpTT05fZmlsdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBVUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxlQUFlLENBQUMsU0FBUyxpQkFBaUIsV0FBVyxnQkFBZ0IsYUFBYTs7QUFFM0csSUFBSSwwQkFBTyxTQUFTLGdCQUFnQjs7Q0FFbkMsZUFBZSxLQUFLLFNBQVM7RUFDNUIsVUFBVTs7O0NBR1gsZUFBZSxLQUFLLGNBQWM7RUFDakMsVUFBVTs7O0NBR1gsZUFBZSxVQUFVLE1BQU0sRUFBRSxZQUFZOzs7QUFHOUM7QUN6QkEsSUFBSSxVQUFVLGNBQWMsV0FBVztDQUN0QyxPQUFPO0VBQ04sVUFBVTtFQUNWLFVBQVU7RUFDVixPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sYUFBYTtHQUNwRCxFQUFFLFdBQVc7SUFDWixRQUFRLFdBQVc7S0FDbEIsV0FBVztLQUNYLFNBQVM7S0FDVCxTQUFTO0tBQ1QsU0FBUyxVQUFVLE1BQU07TUFDeEIsWUFBWSxjQUFjO01BQzFCLE1BQU07Ozs7Ozs7QUFPWjtBQ25CQSxJQUFJLFVBQVUsZ0NBQW1CLFVBQVUsVUFBVTtDQUNwRCxPQUFPO0VBQ04sVUFBVTtFQUNWLE1BQU07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QUN2QyxPQUFPLFNBQVMsT0FBTztFQUN0QixPQUFPLE1BQU0sT0FBTzs7O0FBR3RCO0FDTEEsSUFBSSxPQUFPLCtDQUFvQixTQUFTLHdCQUF3QjtDQUMvRDtDQUNBLE9BQU8sU0FBUyxPQUFPLE9BQU8sU0FBUzs7RUFFdEMsSUFBSSxXQUFXO0VBQ2YsUUFBUSxRQUFRLE9BQU8sU0FBUyxNQUFNO0dBQ3JDLFNBQVMsS0FBSzs7O0VBR2YsSUFBSSxhQUFhLFFBQVEsS0FBSyx1QkFBdUI7O0VBRXJELFdBQVc7O0VBRVgsU0FBUyxLQUFLLFVBQVUsR0FBRyxHQUFHO0dBQzdCLEdBQUcsV0FBVyxRQUFRLEVBQUUsVUFBVSxXQUFXLFFBQVEsRUFBRSxTQUFTO0lBQy9ELE9BQU87O0dBRVIsR0FBRyxXQUFXLFFBQVEsRUFBRSxVQUFVLFdBQVcsUUFBUSxFQUFFLFNBQVM7SUFDL0QsT0FBTyxDQUFDOztHQUVULE9BQU87OztFQUdSLEdBQUcsU0FBUyxTQUFTO0VBQ3JCLE9BQU87OztBQUdUO0FDM0JBLElBQUksT0FBTyxXQUFXLFdBQVc7Q0FDaEMsT0FBTyxTQUFTLEtBQUs7RUFDcEIsSUFBSSxFQUFFLGVBQWUsU0FBUyxPQUFPO0VBQ3JDLE9BQU8sRUFBRSxJQUFJLEtBQUssU0FBUyxLQUFLLEtBQUs7R0FDcEMsT0FBTyxPQUFPLGVBQWUsS0FBSyxRQUFRLENBQUMsT0FBTzs7OztBQUlyRDtBQ1JBLElBQUksT0FBTyxjQUFjLFdBQVc7Q0FDbkMsT0FBTyxTQUFTLE9BQU87RUFDdEIsT0FBTyxNQUFNLE1BQU07O0dBRWxCIiwiZmlsZSI6InNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogb3duQ2xvdWQgLSBjb250YWN0c1xuICpcbiAqIFRoaXMgZmlsZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdmVyc2lvbiAzIG9yXG4gKiBsYXRlci4gU2VlIHRoZSBDT1BZSU5HIGZpbGUuXG4gKlxuICogQGF1dGhvciBIZW5kcmlrIExlcHBlbHNhY2sgPGhlbmRyaWtAbGVwcGVsc2Fjay5kZT5cbiAqIEBjb3B5cmlnaHQgSGVuZHJpayBMZXBwZWxzYWNrIDIwMTVcbiAqL1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2NvbnRhY3RzQXBwJywgWyd1dWlkNCcsICdhbmd1bGFyLWNhY2hlJywgJ25nUm91dGUnLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNlbGVjdCcsICduZ1Nhbml0aXplJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG5cblx0JHJvdXRlUHJvdmlkZXIud2hlbignLzpnaWQnLCB7XG5cdFx0dGVtcGxhdGU6ICc8Y29udGFjdGRldGFpbHM+PC9jb250YWN0ZGV0YWlscz4nXG5cdH0pO1xuXG5cdCRyb3V0ZVByb3ZpZGVyLndoZW4oJy86Z2lkLzp1aWQnLCB7XG5cdFx0dGVtcGxhdGU6ICc8Y29udGFjdGRldGFpbHM+PC9jb250YWN0ZGV0YWlscz4nXG5cdH0pO1xuXG5cdCRyb3V0ZVByb3ZpZGVyLm90aGVyd2lzZSgnLycgKyB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGF0ZXBpY2tlcicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZSA6ICduZ01vZGVsJyxcblx0XHRsaW5rIDogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbEN0cmwpIHtcblx0XHRcdCQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGVsZW1lbnQuZGF0ZXBpY2tlcih7XG5cdFx0XHRcdFx0ZGF0ZUZvcm1hdDoneXktbW0tZGQnLFxuXHRcdFx0XHRcdG1pbkRhdGU6IG51bGwsXG5cdFx0XHRcdFx0bWF4RGF0ZTogbnVsbCxcblx0XHRcdFx0XHRvblNlbGVjdDpmdW5jdGlvbiAoZGF0ZSkge1xuXHRcdFx0XHRcdFx0bmdNb2RlbEN0cmwuJHNldFZpZXdWYWx1ZShkYXRlKTtcblx0XHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2ZvY3VzRXhwcmVzc2lvbicsIGZ1bmN0aW9uICgkdGltZW91dCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazoge1xuXHRcdFx0cG9zdDogZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG5cdFx0XHRcdHNjb3BlLiR3YXRjaChhdHRycy5mb2N1c0V4cHJlc3Npb24sIGZ1bmN0aW9uICh2YWx1ZSkge1xuXG5cdFx0XHRcdFx0aWYgKGF0dHJzLmZvY3VzRXhwcmVzc2lvbikge1xuXHRcdFx0XHRcdFx0aWYgKHNjb3BlLiRldmFsKGF0dHJzLmZvY3VzRXhwcmVzc2lvbikpIHtcblx0XHRcdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChlbGVtZW50LmlzKCdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQuZmluZCgnaW5wdXQnKS5mb2N1cygpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSwgMTAwKTsgLy9uZWVkIHNvbWUgZGVsYXkgdG8gd29yayB3aXRoIG5nLWRpc2FibGVkXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdhZGRyZXNzYm9va0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIEFkZHJlc3NCb29rU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC51cmxCYXNlID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuXHRjdHJsLnNob3dVcmwgPSBmYWxzZTtcblxuXHRjdHJsLnRvZ2dsZVNob3dVcmwgPSBmdW5jdGlvbigpIHtcblx0XHRjdHJsLnNob3dVcmwgPSAhY3RybC5zaG93VXJsO1xuXHR9O1xuXG5cdGN0cmwudG9nZ2xlU2hhcmVzRWRpdG9yID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vay5lZGl0aW5nU2hhcmVzID0gIWFkZHJlc3NCb29rLmVkaXRpbmdTaGFyZXM7XG5cdFx0YWRkcmVzc0Jvb2suc2VsZWN0ZWRTaGFyZWUgPSBudWxsO1xuXHR9O1xuXG5cdC8qIEZyb20gQ2FsZW5kYXItUmV3b3JrIC0ganMvYXBwL2NvbnRyb2xsZXJzL2NhbGVuZGFybGlzdGNvbnRyb2xsZXIuanMgKi9cblx0Y3RybC5maW5kU2hhcmVlID0gZnVuY3Rpb24gKHZhbCwgYWRkcmVzc0Jvb2spIHtcblx0XHRyZXR1cm4gJC5nZXQoXG5cdFx0XHRPQy5saW5rVG9PQ1MoJ2FwcHMvZmlsZXNfc2hhcmluZy9hcGkvdjEnKSArICdzaGFyZWVzJyxcblx0XHRcdHtcblx0XHRcdFx0Zm9ybWF0OiAnanNvbicsXG5cdFx0XHRcdHNlYXJjaDogdmFsLnRyaW0oKSxcblx0XHRcdFx0cGVyUGFnZTogMjAwLFxuXHRcdFx0XHRpdGVtVHlwZTogJ3ByaW5jaXBhbHMnXG5cdFx0XHR9XG5cdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0Ly8gVG9kbyAtIGZpbHRlciBvdXQgY3VycmVudCB1c2VyLCBleGlzdGluZyBzaGFyZWVzXG5cdFx0XHR2YXIgdXNlcnMgICA9IHJlc3VsdC5vY3MuZGF0YS5leGFjdC51c2Vycy5jb25jYXQocmVzdWx0Lm9jcy5kYXRhLnVzZXJzKTtcblx0XHRcdHZhciBncm91cHMgID0gcmVzdWx0Lm9jcy5kYXRhLmV4YWN0Lmdyb3Vwcy5jb25jYXQocmVzdWx0Lm9jcy5kYXRhLmdyb3Vwcyk7XG5cblx0XHRcdHZhciB1c2VyU2hhcmVzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2Vycztcblx0XHRcdHZhciBncm91cFNoYXJlcyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzO1xuXHRcdFx0dmFyIHVzZXJTaGFyZXNMZW5ndGggPSB1c2VyU2hhcmVzLmxlbmd0aDtcblx0XHRcdHZhciBncm91cFNoYXJlc0xlbmd0aCA9IGdyb3VwU2hhcmVzLmxlbmd0aDtcblx0XHRcdHZhciBpLCBqO1xuXG5cdFx0XHQvLyBGaWx0ZXIgb3V0IGN1cnJlbnQgdXNlclxuXHRcdFx0dmFyIHVzZXJzTGVuZ3RoID0gdXNlcnMubGVuZ3RoO1xuXHRcdFx0Zm9yIChpID0gMCA7IGkgPCB1c2Vyc0xlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh1c2Vyc1tpXS52YWx1ZS5zaGFyZVdpdGggPT09IE9DLmN1cnJlbnRVc2VyKSB7XG5cdFx0XHRcdFx0dXNlcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vdyBmaWx0ZXIgb3V0IGFsbCBzaGFyZWVzIHRoYXQgYXJlIGFscmVhZHkgc2hhcmVkIHdpdGhcblx0XHRcdGZvciAoaSA9IDA7IGkgPCB1c2VyU2hhcmVzTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIHNoYXJlID0gdXNlclNoYXJlc1tpXTtcblx0XHRcdFx0dXNlcnNMZW5ndGggPSB1c2Vycy5sZW5ndGg7XG5cdFx0XHRcdGZvciAoaiA9IDA7IGogPCB1c2Vyc0xlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYgKHVzZXJzW2pdLnZhbHVlLnNoYXJlV2l0aCA9PT0gc2hhcmUuaWQpIHtcblx0XHRcdFx0XHRcdHVzZXJzLnNwbGljZShqLCAxKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21iaW5lIHVzZXJzIGFuZCBncm91cHNcblx0XHRcdHVzZXJzID0gdXNlcnMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkaXNwbGF5OiBpdGVtLnZhbHVlLnNoYXJlV2l0aCxcblx0XHRcdFx0XHR0eXBlOiBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIsXG5cdFx0XHRcdFx0aWRlbnRpZmllcjogaXRlbS52YWx1ZS5zaGFyZVdpdGhcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXG5cdFx0XHRncm91cHMgPSBncm91cHMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRkaXNwbGF5OiBpdGVtLnZhbHVlLnNoYXJlV2l0aCArICcgKGdyb3VwKScsXG5cdFx0XHRcdFx0dHlwZTogT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCxcblx0XHRcdFx0XHRpZGVudGlmaWVyOiBpdGVtLnZhbHVlLnNoYXJlV2l0aFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBncm91cHMuY29uY2F0KHVzZXJzKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLm9uU2VsZWN0U2hhcmVlID0gZnVuY3Rpb24gKGl0ZW0sIG1vZGVsLCBsYWJlbCwgYWRkcmVzc0Jvb2spIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rLnNlbGVjdGVkU2hhcmVlID0gbnVsbDtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc2hhcmUoYWRkcmVzc0Jvb2ssIGl0ZW0udHlwZSwgaXRlbS5pZGVudGlmaWVyLCBmYWxzZSwgZmFsc2UpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cblx0fTtcblxuXHRjdHJsLnVwZGF0ZUV4aXN0aW5nVXNlclNoYXJlID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHVzZXJJZCwgd3JpdGFibGUpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUiwgdXNlcklkLCB3cml0YWJsZSwgdHJ1ZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVwZGF0ZUV4aXN0aW5nR3JvdXBTaGFyZSA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBncm91cElkLCB3cml0YWJsZSkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCwgZ3JvdXBJZCwgd3JpdGFibGUsIHRydWUpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51bnNoYXJlRnJvbVVzZXIgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgdXNlcklkKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnVuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUiwgdXNlcklkKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudW5zaGFyZUZyb21Hcm91cCA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBncm91cElkKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnVuc2hhcmUoYWRkcmVzc0Jvb2ssIE9DLlNoYXJlLlNIQVJFX1RZUEVfR1JPVVAsIGdyb3VwSWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVBZGRyZXNzQm9vayA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmRlbGV0ZShhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhZGRyZXNzYm9vaycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdhZGRyZXNzYm9va0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGFkZHJlc3NCb29rOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvYWRkcmVzc0Jvb2suaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdhZGRyZXNzYm9va2xpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBBZGRyZXNzQm9va1NlcnZpY2UsIFNldHRpbmdzU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0Y3RybC5hZGRyZXNzQm9va3MgPSBhZGRyZXNzQm9va3M7XG5cdH0pO1xuXG5cdGN0cmwuY3JlYXRlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbigpIHtcblx0XHRpZihjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkge1xuXHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmNyZWF0ZShjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLmdldEFkZHJlc3NCb29rKGN0cmwubmV3QWRkcmVzc0Jvb2tOYW1lKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0Y3RybC5hZGRyZXNzQm9va3MucHVzaChhZGRyZXNzQm9vayk7XG5cdFx0XHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWRkcmVzc2Jvb2tsaXN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdhZGRyZXNzYm9va2xpc3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvYWRkcmVzc0Jvb2tMaXN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdEN0cmwnLCBmdW5jdGlvbigkcm91dGUsICRyb3V0ZVBhcmFtcykge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5vcGVuQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0dWlkOiBjdHJsLmNvbnRhY3QudWlkKCl9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdGRldGFpbHNDdHJsJywgZnVuY3Rpb24oQ29udGFjdFNlcnZpY2UsIEFkZHJlc3NCb29rU2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSwgJHJvdXRlUGFyYW1zLCAkc2NvcGUpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwudWlkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0Y3RybC50ID0ge1xuXHRcdG5vQ29udGFjdHMgOiB0KCdjb250YWN0cycsICdObyBjb250YWN0cyBpbiBoZXJlJyksXG5cdFx0cGxhY2Vob2xkZXJOYW1lIDogdCgnY29udGFjdHMnLCAnTmFtZScpLFxuXHRcdHBsYWNlaG9sZGVyT3JnIDogdCgnY29udGFjdHMnLCAnT3JnYW5pemF0aW9uJyksXG5cdFx0cGxhY2Vob2xkZXJUaXRsZSA6IHQoJ2NvbnRhY3RzJywgJ1RpdGxlJyksXG5cdFx0c2VsZWN0RmllbGQgOiB0KCdjb250YWN0cycsICdBZGQgZmllbGQgLi4uJylcblx0fTtcblxuXHRjdHJsLmZpZWxkRGVmaW5pdGlvbnMgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmZpZWxkRGVmaW5pdGlvbnM7XG5cdGN0cmwuZm9jdXMgPSB1bmRlZmluZWQ7XG5cdGN0cmwuZmllbGQgPSB1bmRlZmluZWQ7XG5cdCRzY29wZS5hZGRyZXNzQm9va3MgPSBbXTtcblx0Y3RybC5hZGRyZXNzQm9va3MgPSBbXTtcblxuXHRBZGRyZXNzQm9va1NlcnZpY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rcyA9IGFkZHJlc3NCb29rcztcblx0XHQkc2NvcGUuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWQ6IGVsZW1lbnQuZGlzcGxheU5hbWUsXG5cdFx0XHRcdG5hbWU6IGVsZW1lbnQuZGlzcGxheU5hbWVcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0aWYgKCFfLmlzVW5kZWZpbmVkKGN0cmwuY29udGFjdCkpIHtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcblx0XHRjdHJsLmNoYW5nZUNvbnRhY3QobmV3VmFsdWUpO1xuXHR9KTtcblxuXHRjdHJsLmNoYW5nZUNvbnRhY3QgPSBmdW5jdGlvbih1aWQpIHtcblx0XHRpZiAodHlwZW9mIHVpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Q29udGFjdFNlcnZpY2UuZ2V0QnlJZCh1aWQpLnRoZW4oZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdFx0Y3RybC5jb250YWN0ID0gY29udGFjdDtcblx0XHRcdGN0cmwucGhvdG8gPSBjdHJsLmNvbnRhY3QucGhvdG8oKTtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudXBkYXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLnVwZGF0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLmRlbGV0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuYWRkRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuXHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRjdHJsLmNvbnRhY3QuYWRkUHJvcGVydHkoZmllbGQsIGRlZmF1bHRWYWx1ZSk7XG5cdFx0Y3RybC5mb2N1cyA9IGZpZWxkO1xuXHRcdGN0cmwuZmllbGQgPSAnJztcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUZpZWxkID0gZnVuY3Rpb24gKGZpZWxkLCBwcm9wKSB7XG5cdFx0Y3RybC5jb250YWN0LnJlbW92ZVByb3BlcnR5KGZpZWxkLCBwcm9wKTtcblx0XHRjdHJsLmZvY3VzID0gdW5kZWZpbmVkO1xuXHR9O1xuXG5cdGN0cmwuY2hhbmdlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbiAoYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vayA9IF8uZmluZChjdHJsLmFkZHJlc3NCb29rcywgZnVuY3Rpb24oYm9vaykge1xuXHRcdFx0cmV0dXJuIGJvb2suZGlzcGxheU5hbWUgPT09IGFkZHJlc3NCb29rLmlkO1xuXHRcdH0pO1xuXHRcdENvbnRhY3RTZXJ2aWNlLm1vdmVDb250YWN0KGN0cmwuY29udGFjdCwgYWRkcmVzc0Jvb2spO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdjb250YWN0ZGV0YWlscycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHByaW9yaXR5OiAxLFxuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdGRldGFpbHNDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvY29udGFjdERldGFpbHMuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjb250YWN0bGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRmaWx0ZXIsICRyb3V0ZSwgJHJvdXRlUGFyYW1zLCBDb250YWN0U2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5yb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtcztcblx0Y3RybC50ID0ge1xuXHRcdGFkZENvbnRhY3QgOiB0KCdjb250YWN0cycsICdBZGQgY29udGFjdCcpXG5cdH07XG5cblx0Y3RybC5jb250YWN0TGlzdCA9IFtdO1xuXHRjdHJsLnF1ZXJ5ID0gJyc7XG5cblx0JHNjb3BlLnF1ZXJ5ID0gZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdHJldHVybiBjb250YWN0Lm1hdGNoZXMoY3RybC5xdWVyeSk7XG5cdH07XG5cblx0U2VhcmNoUHJveHkuc2V0RmlsdGVyKGZ1bmN0aW9uKHF1ZXJ5KSB7XG5cdFx0Y3RybC5xdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGN0cmwuY29udGFjdExpc3QubGVuZ3RoICE9PSAwKSB7XG5cdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0dWlkOiBjdHJsLmNvbnRhY3RMaXN0WzBdLnVpZCgpXG5cdFx0XHR9KTtcblx0XHRcdCRzY29wZS5zZWxlY3RlZENvbnRhY3RJZCA9ICRyb3V0ZVBhcmFtcy51aWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHR1aWQ6IHVuZGVmaW5lZFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdCRzY29wZS4kYXBwbHkoKTtcblx0fSk7XG5cblx0Q29udGFjdFNlcnZpY2UucmVnaXN0ZXJPYnNlcnZlckNhbGxiYWNrKGZ1bmN0aW9uKGV2KSB7XG5cdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdGlmIChldi5ldmVudCA9PT0gJ2RlbGV0ZScpIHtcblx0XHRcdFx0aWYgKGN0cmwuY29udGFjdExpc3QubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHR1aWQ6IHVuZGVmaW5lZFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRpZiAoY3RybC5jb250YWN0TGlzdFtpXS51aWQoKSA9PT0gZXYudWlkKSB7XG5cdFx0XHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHRcdFx0XHR1aWQ6IChjdHJsLmNvbnRhY3RMaXN0W2krMV0pID8gY3RybC5jb250YWN0TGlzdFtpKzFdLnVpZCgpIDogY3RybC5jb250YWN0TGlzdFtpLTFdLnVpZCgpXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGV2LmV2ZW50ID09PSAnY3JlYXRlJykge1xuXHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0dWlkOiBldi51aWRcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRjdHJsLmNvbnRhY3RzID0gZXYuY29udGFjdHM7XG5cdFx0fSk7XG5cdH0pO1xuXG5cdENvbnRhY3RTZXJ2aWNlLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oY29udGFjdHMpIHtcblx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0Y3RybC5jb250YWN0cyA9IGNvbnRhY3RzO1xuXHRcdH0pO1xuXHR9KTtcblxuXHQkc2NvcGUuJHdhdGNoKCdjdHJsLnJvdXRlUGFyYW1zLnVpZCcsIGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XG5cdFx0aWYobmV3VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Ly8gd2UgbWlnaHQgaGF2ZSB0byB3YWl0IHVudGlsIG5nLXJlcGVhdCBmaWxsZWQgdGhlIGNvbnRhY3RMaXN0XG5cdFx0XHRpZihjdHJsLmNvbnRhY3RMaXN0ICYmIGN0cmwuY29udGFjdExpc3QubGVuZ3RoID4gMCkge1xuXHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0dWlkOiBjdHJsLmNvbnRhY3RMaXN0WzBdLnVpZCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gd2F0Y2ggZm9yIG5leHQgY29udGFjdExpc3QgdXBkYXRlXG5cdFx0XHRcdHZhciB1bmJpbmRXYXRjaCA9ICRzY29wZS4kd2F0Y2goJ2N0cmwuY29udGFjdExpc3QnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZihjdHJsLmNvbnRhY3RMaXN0ICYmIGN0cmwuY29udGFjdExpc3QubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHRcdFx0dWlkOiBjdHJsLmNvbnRhY3RMaXN0WzBdLnVpZCgpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dW5iaW5kV2F0Y2goKTsgLy8gdW5iaW5kIGFzIHdlIG9ubHkgd2FudCBvbmUgdXBkYXRlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC5yb3V0ZVBhcmFtcy5naWQnLCBmdW5jdGlvbigpIHtcblx0XHQvLyB3ZSBtaWdodCBoYXZlIHRvIHdhaXQgdW50aWwgbmctcmVwZWF0IGZpbGxlZCB0aGUgY29udGFjdExpc3Rcblx0XHRjdHJsLmNvbnRhY3RMaXN0ID0gW107XG5cdFx0Ly8gd2F0Y2ggZm9yIG5leHQgY29udGFjdExpc3QgdXBkYXRlXG5cdFx0dmFyIHVuYmluZFdhdGNoID0gJHNjb3BlLiR3YXRjaCgnY3RybC5jb250YWN0TGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHVuYmluZFdhdGNoKCk7IC8vIHVuYmluZCBhcyB3ZSBvbmx5IHdhbnQgb25lIHVwZGF0ZVxuXHRcdH0pO1xuXHR9KTtcblxuXHRjdHJsLmNyZWF0ZUNvbnRhY3QgPSBmdW5jdGlvbigpIHtcblx0XHRDb250YWN0U2VydmljZS5jcmVhdGUoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3QpIHtcblx0XHRcdFsndGVsJywgJ2FkcicsICdlbWFpbCddLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcblx0XHRcdFx0dmFyIGRlZmF1bHRWYWx1ZSA9IHZDYXJkUHJvcGVydGllc1NlcnZpY2UuZ2V0TWV0YShmaWVsZCkuZGVmYXVsdFZhbHVlIHx8IHt2YWx1ZTogJyd9O1xuXHRcdFx0XHRjb250YWN0LmFkZFByb3BlcnR5KGZpZWxkLCBkZWZhdWx0VmFsdWUpO1xuXHRcdFx0fSApO1xuXHRcdFx0aWYgKCRyb3V0ZVBhcmFtcy5naWQgIT09IHQoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpKSB7XG5cdFx0XHRcdGNvbnRhY3QuY2F0ZWdvcmllcygkcm91dGVQYXJhbXMuZ2lkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnRhY3QuY2F0ZWdvcmllcygnJyk7XG5cdFx0XHR9XG5cdFx0XHQkKCcjZGV0YWlscy1mdWxsTmFtZScpLmZvY3VzKCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC5oYXNDb250YWN0cyA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIWN0cmwuY29udGFjdHMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIGN0cmwuY29udGFjdHMubGVuZ3RoID4gMDtcblx0fTtcblxuXHQkc2NvcGUuc2VsZWN0ZWRDb250YWN0SWQgPSAkcm91dGVQYXJhbXMudWlkO1xuXHQkc2NvcGUuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoc2VsZWN0ZWRDb250YWN0SWQpIHtcblx0XHQkc2NvcGUuc2VsZWN0ZWRDb250YWN0SWQgPSBzZWxlY3RlZENvbnRhY3RJZDtcblx0fTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdjb250YWN0bGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHByaW9yaXR5OiAxLFxuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdGxpc3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7XG5cdFx0XHRhZGRyZXNzYm9vazogJz1hZHJib29rJ1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2NvbnRhY3RMaXN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignZGV0YWlsc1Bob3RvQ3RybCcsIGZ1bmN0aW9uKCkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2RldGFpbHNwaG90bycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnZGV0YWlsc1Bob3RvQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0Y29udGFjdDogJz1kYXRhJ1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2RldGFpbHNQaG90by5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNJdGVtQ3RybCcsIGZ1bmN0aW9uKCR0ZW1wbGF0ZVJlcXVlc3QsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UsIENvbnRhY3RTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLm1ldGEgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoY3RybC5uYW1lKTtcblx0Y3RybC50eXBlID0gdW5kZWZpbmVkO1xuXHRjdHJsLnQgPSB7XG5cdFx0cG9Cb3ggOiB0KCdjb250YWN0cycsICdQb3N0IE9mZmljZSBCb3gnKSxcblx0XHRwb3N0YWxDb2RlIDogdCgnY29udGFjdHMnLCAnUG9zdGFsIENvZGUnKSxcblx0XHRjaXR5IDogdCgnY29udGFjdHMnLCAnQ2l0eScpLFxuXHRcdHN0YXRlIDogdCgnY29udGFjdHMnLCAnU3RhdGUgb3IgcHJvdmluY2UnKSxcblx0XHRjb3VudHJ5IDogdCgnY29udGFjdHMnLCAnQ291bnRyeScpLFxuXHRcdGFkZHJlc3M6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRuZXdHcm91cDogdCgnY29udGFjdHMnLCAnKG5ldyBncm91cCknKVxuXHR9O1xuXG5cdGN0cmwuYXZhaWxhYmxlT3B0aW9ucyA9IGN0cmwubWV0YS5vcHRpb25zIHx8IFtdO1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhKSAmJiAhXy5pc1VuZGVmaW5lZChjdHJsLmRhdGEubWV0YSkgJiYgIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhLm1ldGEudHlwZSkpIHtcblx0XHRjdHJsLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlWzBdO1xuXHRcdGlmICghY3RybC5hdmFpbGFibGVPcHRpb25zLnNvbWUoZnVuY3Rpb24oZSkgeyByZXR1cm4gZS5pZCA9PT0gY3RybC5kYXRhLm1ldGEudHlwZVswXTsgfSApKSB7XG5cdFx0XHRjdHJsLmF2YWlsYWJsZU9wdGlvbnMgPSBjdHJsLmF2YWlsYWJsZU9wdGlvbnMuY29uY2F0KFt7aWQ6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0sIG5hbWU6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF19XSk7XG5cdFx0fVxuXHR9XG5cdGN0cmwuYXZhaWxhYmxlR3JvdXBzID0gW107XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHRjdHJsLmF2YWlsYWJsZUdyb3VwcyA9IF8udW5pcXVlKGdyb3Vwcyk7XG5cdH0pO1xuXG5cdGN0cmwuY2hhbmdlVHlwZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRjdHJsLmRhdGEubWV0YSA9IGN0cmwuZGF0YS5tZXRhIHx8IHt9O1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlIHx8IFtdO1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0gPSB2YWw7XG5cdFx0Y3RybC5tb2RlbC51cGRhdGVDb250YWN0KCk7XG5cdH07XG5cblx0Y3RybC5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZW1wbGF0ZVVybCA9IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2RldGFpbEl0ZW1zLycgKyBjdHJsLm1ldGEudGVtcGxhdGUgKyAnLmh0bWwnKTtcblx0XHRyZXR1cm4gJHRlbXBsYXRlUmVxdWVzdCh0ZW1wbGF0ZVVybCk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRjdHJsLm1vZGVsLmRlbGV0ZUZpZWxkKGN0cmwubmFtZSwgY3RybC5kYXRhKTtcblx0XHRjdHJsLm1vZGVsLnVwZGF0ZUNvbnRhY3QoKTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGV0YWlsc2l0ZW0nLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNJdGVtQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0bmFtZTogJz0nLFxuXHRcdFx0ZGF0YTogJz0nLFxuXHRcdFx0bW9kZWw6ICc9J1xuXHRcdH0sXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRjdHJsLmdldFRlbXBsYXRlKCkudGhlbihmdW5jdGlvbihodG1sKSB7XG5cdFx0XHRcdHZhciB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChodG1sKTtcblx0XHRcdFx0ZWxlbWVudC5hcHBlbmQodGVtcGxhdGUpO1xuXHRcdFx0XHQkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufV0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2dyb3VwQ3RybCcsIGZ1bmN0aW9uKCkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyb3VwJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2dyb3VwQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0Z3JvdXA6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9ncm91cC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2dyb3VwbGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIENvbnRhY3RTZXJ2aWNlLCAkcm91dGVQYXJhbXMpIHtcblxuXHQkc2NvcGUuZ3JvdXBzID0gW3QoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpXTtcblxuXHRDb250YWN0U2VydmljZS5nZXRHcm91cHMoKS50aGVuKGZ1bmN0aW9uKGdyb3Vwcykge1xuXHRcdCRzY29wZS5ncm91cHMgPSBfLnVuaXF1ZShbdCgnY29udGFjdHMnLCAnQWxsIGNvbnRhY3RzJyldLmNvbmNhdChncm91cHMpKTtcblx0fSk7XG5cblx0JHNjb3BlLnNlbGVjdGVkR3JvdXAgPSAkcm91dGVQYXJhbXMuZ2lkO1xuXHQkc2NvcGUuc2V0U2VsZWN0ZWQgPSBmdW5jdGlvbiAoc2VsZWN0ZWRHcm91cCkge1xuXHRcdCRzY29wZS5zZWxlY3RlZEdyb3VwID0gc2VsZWN0ZWRHcm91cDtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JvdXBsaXN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdncm91cGxpc3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvZ3JvdXBMaXN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignaW1hZ2VQcmV2aWV3Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5sb2FkSW1hZ2UgPSBmdW5jdGlvbihmaWxlKSB7XG5cdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRyZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRzY29wZS5pbWFnZXByZXZpZXcgPSByZWFkZXIucmVzdWx0O1xuXHRcdFx0fSk7XG5cdFx0fSwgZmFsc2UpO1xuXG5cdFx0aWYgKGZpbGUpIHtcblx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnaW1hZ2VwcmV2aWV3JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0c2NvcGU6IHtcblx0XHRcdHBob3RvQ2FsbGJhY2s6ICcmaW1hZ2VwcmV2aWV3J1xuXHRcdH0sXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRlbGVtZW50LmJpbmQoJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgZmlsZSA9IGVsZW1lbnQuZ2V0KDApLmZpbGVzWzBdO1xuXHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuXHRcdFx0XHRyZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnaGknLCBzY29wZS5waG90b0NhbGxiYWNrKCkgKyAnJyk7XG5cdFx0XHRcdFx0c2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0c2NvcGUucGhvdG9DYWxsYmFjaygpKHJlYWRlci5yZXN1bHQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9LCBmYWxzZSk7XG5cblx0XHRcdFx0aWYgKGZpbGUpIHtcblx0XHRcdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cE1vZGVsJywgZnVuY3Rpb24oJGZpbHRlcikge1xuXHRyZXR1cm57XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRyZXF1aXJlOiAnbmdNb2RlbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIsIG5nTW9kZWwpIHtcblx0XHRcdG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAodmFsdWUudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdmFsdWUuc3BsaXQoJywnKTtcblx0XHRcdH0pO1xuXHRcdFx0bmdNb2RlbC4kcGFyc2Vycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZS5qb2luKCcsJyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3RlbE1vZGVsJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybntcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdHJlcXVpcmU6ICduZ01vZGVsJyxcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0ciwgbmdNb2RlbCkge1xuXHRcdFx0bmdNb2RlbC4kZm9ybWF0dGVycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH0pO1xuXHRcdFx0bmdNb2RlbC4kcGFyc2Vycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0FkZHJlc3NCb29rJywgZnVuY3Rpb24oKVxue1xuXHRyZXR1cm4gZnVuY3Rpb24gQWRkcmVzc0Jvb2soZGF0YSkge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcblxuXHRcdFx0ZGlzcGxheU5hbWU6ICcnLFxuXHRcdFx0Y29udGFjdHM6IFtdLFxuXHRcdFx0Z3JvdXBzOiBkYXRhLmRhdGEucHJvcHMuZ3JvdXBzLFxuXG5cdFx0XHRnZXRDb250YWN0OiBmdW5jdGlvbih1aWQpIHtcblx0XHRcdFx0Zm9yKHZhciBpIGluIHRoaXMuY29udGFjdHMpIHtcblx0XHRcdFx0XHRpZih0aGlzLmNvbnRhY3RzW2ldLnVpZCgpID09PSB1aWQpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmNvbnRhY3RzW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0fSxcblxuXHRcdFx0c2hhcmVkV2l0aDoge1xuXHRcdFx0XHR1c2VyczogW10sXG5cdFx0XHRcdGdyb3VwczogW11cblx0XHRcdH1cblxuXHRcdH0pO1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIGRhdGEpO1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcblx0XHRcdG93bmVyOiBkYXRhLnVybC5zcGxpdCgnLycpLnNsaWNlKC0zLCAtMilbMF1cblx0XHR9KTtcblxuXHRcdHZhciBzaGFyZXMgPSB0aGlzLmRhdGEucHJvcHMuaW52aXRlO1xuXHRcdGlmICh0eXBlb2Ygc2hhcmVzICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBzaGFyZXMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0dmFyIGhyZWYgPSBzaGFyZXNbal0uaHJlZjtcblx0XHRcdFx0aWYgKGhyZWYubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGFjY2VzcyA9IHNoYXJlc1tqXS5hY2Nlc3M7XG5cdFx0XHRcdGlmIChhY2Nlc3MubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgcmVhZFdyaXRlID0gKHR5cGVvZiBhY2Nlc3MucmVhZFdyaXRlICE9PSAndW5kZWZpbmVkJyk7XG5cblx0XHRcdFx0aWYgKGhyZWYuc3RhcnRzV2l0aCgncHJpbmNpcGFsOnByaW5jaXBhbHMvdXNlcnMvJykpIHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlZFdpdGgudXNlcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRpZDogaHJlZi5zdWJzdHIoMjcpLFxuXHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IGhyZWYuc3Vic3RyKDI3KSxcblx0XHRcdFx0XHRcdHdyaXRhYmxlOiByZWFkV3JpdGVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIGlmIChocmVmLnN0YXJ0c1dpdGgoJ3ByaW5jaXBhbDpwcmluY2lwYWxzL2dyb3Vwcy8nKSkge1xuXHRcdFx0XHRcdHRoaXMuc2hhcmVkV2l0aC5ncm91cHMucHVzaCh7XG5cdFx0XHRcdFx0XHRpZDogaHJlZi5zdWJzdHIoMjgpLFxuXHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IGhyZWYuc3Vic3RyKDI4KSxcblx0XHRcdFx0XHRcdHdyaXRhYmxlOiByZWFkV3JpdGVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vdmFyIG93bmVyID0gdGhpcy5kYXRhLnByb3BzLm93bmVyO1xuXHRcdC8vaWYgKHR5cGVvZiBvd25lciAhPT0gJ3VuZGVmaW5lZCcgJiYgb3duZXIubGVuZ3RoICE9PSAwKSB7XG5cdFx0Ly9cdG93bmVyID0gb3duZXIudHJpbSgpO1xuXHRcdC8vXHRpZiAob3duZXIuc3RhcnRzV2l0aCgnL3JlbW90ZS5waHAvZGF2L3ByaW5jaXBhbHMvdXNlcnMvJykpIHtcblx0XHQvL1x0XHR0aGlzLl9wcm9wZXJ0aWVzLm93bmVyID0gb3duZXIuc3Vic3RyKDMzKTtcblx0XHQvL1x0fVxuXHRcdC8vfVxuXG5cdH07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdDb250YWN0JywgZnVuY3Rpb24oJGZpbHRlcikge1xuXHRyZXR1cm4gZnVuY3Rpb24gQ29udGFjdChhZGRyZXNzQm9vaywgdkNhcmQpIHtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XG5cblx0XHRcdGRhdGE6IHt9LFxuXHRcdFx0cHJvcHM6IHt9LFxuXG5cdFx0XHRhZGRyZXNzQm9va0lkOiBhZGRyZXNzQm9vay5kaXNwbGF5TmFtZSxcblxuXHRcdFx0dWlkOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ3VpZCcsIHsgdmFsdWU6IHZhbHVlIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmdldFByb3BlcnR5KCd1aWQnKS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0ZnVsbE5hbWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgnZm4nLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdmbicpO1xuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHR0aXRsZTogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCd0aXRsZScsIHsgdmFsdWU6IHZhbHVlIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ3RpdGxlJyk7XG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdG9yZzogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnb3JnJyk7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHR2YXIgdmFsID0gdmFsdWU7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0aWYocHJvcGVydHkgJiYgQXJyYXkuaXNBcnJheShwcm9wZXJ0eS52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdHZhbCA9IHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdFx0dmFsWzBdID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCdvcmcnLCB7IHZhbHVlOiB2YWwgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHByb3BlcnR5LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWVbMF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRlbWFpbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdlbWFpbCcpO1xuXHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRwaG90bzogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ3Bob3RvJyk7XG5cdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGNhdGVnb3JpZXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgnY2F0ZWdvcmllcycsIHsgdmFsdWU6IHZhbHVlIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ2NhdGVnb3JpZXMnKTtcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlLnNwbGl0KCcsJyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGdldFByb3BlcnR5OiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRcdGlmICh0aGlzLnByb3BzW25hbWVdKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMucHJvcHNbbmFtZV1bMF07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFkZFByb3BlcnR5OiBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG5cdFx0XHRcdGRhdGEgPSBhbmd1bGFyLmNvcHkoZGF0YSk7XG5cdFx0XHRcdGlmKCF0aGlzLnByb3BzW25hbWVdKSB7XG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tuYW1lXSA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBpZHggPSB0aGlzLnByb3BzW25hbWVdLmxlbmd0aDtcblx0XHRcdFx0dGhpcy5wcm9wc1tuYW1lXVtpZHhdID0gZGF0YTtcblxuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0XHRyZXR1cm4gaWR4O1xuXHRcdFx0fSxcblx0XHRcdHNldFByb3BlcnR5OiBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG5cdFx0XHRcdGlmKCF0aGlzLnByb3BzW25hbWVdKSB7XG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tuYW1lXSA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMucHJvcHNbbmFtZV1bMF0gPSBkYXRhO1xuXG5cdFx0XHRcdC8vIGtlZXAgdkNhcmQgaW4gc3luY1xuXHRcdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0XHR9LFxuXHRcdFx0cmVtb3ZlUHJvcGVydHk6IGZ1bmN0aW9uIChuYW1lLCBwcm9wKSB7XG5cdFx0XHRcdGFuZ3VsYXIuY29weShfLndpdGhvdXQodGhpcy5wcm9wc1tuYW1lXSwgcHJvcCksIHRoaXMucHJvcHNbbmFtZV0pO1xuXHRcdFx0XHR0aGlzLmRhdGEuYWRkcmVzc0RhdGEgPSAkZmlsdGVyKCdKU09OMnZDYXJkJykodGhpcy5wcm9wcyk7XG5cdFx0XHR9LFxuXHRcdFx0c2V0RVRhZzogZnVuY3Rpb24oZXRhZykge1xuXHRcdFx0XHR0aGlzLmRhdGEuZXRhZyA9IGV0YWc7XG5cdFx0XHR9LFxuXHRcdFx0c2V0VXJsOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgdWlkKSB7XG5cdFx0XHRcdHRoaXMuZGF0YS51cmwgPSBhZGRyZXNzQm9vay51cmwgKyB1aWQgKyAnLnZjZic7XG5cdFx0XHR9LFxuXG5cdFx0XHRzeW5jVkNhcmQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblxuXHRcdFx0bWF0Y2hlczogZnVuY3Rpb24ocGF0dGVybikge1xuXHRcdFx0XHRpZiAoXy5pc1VuZGVmaW5lZChwYXR0ZXJuKSB8fCBwYXR0ZXJuLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuYWRkcmVzc0RhdGEudG9Mb3dlckNhc2UoKS5pbmRleE9mKHBhdHRlcm4udG9Mb3dlckNhc2UoKSkgIT09IC0xO1xuXHRcdFx0fVxuXG5cdFx0fSk7XG5cblx0XHRpZihhbmd1bGFyLmlzRGVmaW5lZCh2Q2FyZCkpIHtcblx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMuZGF0YSwgdkNhcmQpO1xuXHRcdFx0YW5ndWxhci5leHRlbmQodGhpcy5wcm9wcywgJGZpbHRlcigndkNhcmQySlNPTicpKHRoaXMuZGF0YS5hZGRyZXNzRGF0YSkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLnByb3BzLCB7XG5cdFx0XHRcdHZlcnNpb246IFt7dmFsdWU6ICczLjAnfV0sXG5cdFx0XHRcdGZuOiBbe3ZhbHVlOiAnJ31dXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHR9XG5cblx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdjYXRlZ29yaWVzJyk7XG5cdFx0aWYoIXByb3BlcnR5KSB7XG5cdFx0XHR0aGlzLmNhdGVnb3JpZXMoJycpO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0FkZHJlc3NCb29rU2VydmljZScsIGZ1bmN0aW9uKERhdkNsaWVudCwgRGF2U2VydmljZSwgU2V0dGluZ3NTZXJ2aWNlLCBBZGRyZXNzQm9vaywgQ29udGFjdCkge1xuXG5cdHZhciBhZGRyZXNzQm9va3MgPSBbXTtcblxuXHR2YXIgbG9hZEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0YWRkcmVzc0Jvb2tzID0gYWNjb3VudC5hZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH07XG5cblx0cmV0dXJuIHtcblx0XHRnZXRBbGw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGxvYWRBbGwoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldEdyb3VwczogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rcy5tYXAoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC5ncm91cHM7XG5cdFx0XHRcdH0pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGEuY29uY2F0KGIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXRFbmFibGVkOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gYWNjb3VudC5hZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBBZGRyZXNzQm9vayhhZGRyZXNzQm9vayk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldERlZmF1bHRBZGRyZXNzQm9vazogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzWzBdO1xuXHRcdH0sXG5cblx0XHRnZXRBZGRyZXNzQm9vazogZnVuY3Rpb24oZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LmdldEFkZHJlc3NCb29rKHtkaXNwbGF5TmFtZTpkaXNwbGF5TmFtZSwgdXJsOmFjY291bnQuaG9tZVVybH0pLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRhZGRyZXNzQm9vayA9IG5ldyBBZGRyZXNzQm9vayh7XG5cdFx0XHRcdFx0XHR1cmw6IGFkZHJlc3NCb29rWzBdLmhyZWYsXG5cdFx0XHRcdFx0XHRkYXRhOiBhZGRyZXNzQm9va1swXVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWU7XG5cdFx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5jcmVhdGVBZGRyZXNzQm9vayh7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRkZWxldGU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5kZWxldGVBZGRyZXNzQm9vayhhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRhbmd1bGFyLmNvcHkoXy53aXRob3V0KGFkZHJlc3NCb29rcywgYWRkcmVzc0Jvb2spLCBhZGRyZXNzQm9va3MpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRyZW5hbWU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQucmVuYW1lQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2ssIHtkaXNwbGF5TmFtZTpkaXNwbGF5TmFtZSwgdXJsOmFjY291bnQuaG9tZVVybH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldDogZnVuY3Rpb24oZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiB0aGlzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0XHRcdHJldHVybiBhZGRyZXNzQm9va3MuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuZGlzcGxheU5hbWUgPT09IGRpc3BsYXlOYW1lO1xuXHRcdFx0XHR9KVswXTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzeW5jOiBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0cmV0dXJuIERhdkNsaWVudC5zeW5jQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdH0sXG5cblx0XHRzaGFyZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHNoYXJlVHlwZSwgc2hhcmVXaXRoLCB3cml0YWJsZSwgZXhpc3RpbmdTaGFyZSkge1xuXHRcdFx0dmFyIHhtbERvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KCcnLCAnJywgbnVsbCk7XG5cdFx0XHR2YXIgb1NoYXJlID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2hhcmUnKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOmQnLCAnREFWOicpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6bycsICdodHRwOi8vb3duY2xvdWQub3JnL25zJyk7XG5cdFx0XHR4bWxEb2MuYXBwZW5kQ2hpbGQob1NoYXJlKTtcblxuXHRcdFx0dmFyIG9TZXQgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzZXQnKTtcblx0XHRcdG9TaGFyZS5hcHBlbmRDaGlsZChvU2V0KTtcblxuXHRcdFx0dmFyIGRIcmVmID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ2Q6aHJlZicpO1xuXHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLyc7XG5cdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJztcblx0XHRcdH1cblx0XHRcdGRIcmVmLnRleHRDb250ZW50ICs9IHNoYXJlV2l0aDtcblx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQoZEhyZWYpO1xuXG5cdFx0XHR2YXIgb1N1bW1hcnkgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzdW1tYXJ5Jyk7XG5cdFx0XHRvU3VtbWFyeS50ZXh0Q29udGVudCA9IHQoJ2NvbnRhY3RzJywgJ3thZGRyZXNzYm9va30gc2hhcmVkIGJ5IHtvd25lcn0nLCB7XG5cdFx0XHRcdGFkZHJlc3Nib29rOiBhZGRyZXNzQm9vay5kaXNwbGF5TmFtZSxcblx0XHRcdFx0b3duZXI6IGFkZHJlc3NCb29rLm93bmVyXG5cdFx0XHR9KTtcblx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQob1N1bW1hcnkpO1xuXG5cdFx0XHRpZiAod3JpdGFibGUpIHtcblx0XHRcdFx0dmFyIG9SVyA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnJlYWQtd3JpdGUnKTtcblx0XHRcdFx0b1NldC5hcHBlbmRDaGlsZChvUlcpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgYm9keSA9IG9TaGFyZS5vdXRlckhUTUw7XG5cblx0XHRcdHJldHVybiBEYXZDbGllbnQueGhyLnNlbmQoXG5cdFx0XHRcdGRhdi5yZXF1ZXN0LmJhc2ljKHttZXRob2Q6ICdQT1NUJywgZGF0YTogYm9keX0pLFxuXHRcdFx0XHRhZGRyZXNzQm9vay51cmxcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRpZiAoIWV4aXN0aW5nU2hhcmUpIHtcblx0XHRcdFx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGlkOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHR3cml0YWJsZTogd3JpdGFibGVcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3Vwcy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRpZDogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0d3JpdGFibGU6IHdyaXRhYmxlXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHR9LFxuXG5cdFx0dW5zaGFyZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHNoYXJlVHlwZSwgc2hhcmVXaXRoKSB7XG5cdFx0XHR2YXIgeG1sRG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoJycsICcnLCBudWxsKTtcblx0XHRcdHZhciBvU2hhcmUgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzaGFyZScpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6ZCcsICdEQVY6Jyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpvJywgJ2h0dHA6Ly9vd25jbG91ZC5vcmcvbnMnKTtcblx0XHRcdHhtbERvYy5hcHBlbmRDaGlsZChvU2hhcmUpO1xuXG5cdFx0XHR2YXIgb1JlbW92ZSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnJlbW92ZScpO1xuXHRcdFx0b1NoYXJlLmFwcGVuZENoaWxkKG9SZW1vdmUpO1xuXG5cdFx0XHR2YXIgZEhyZWYgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnZDpocmVmJyk7XG5cdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvdXNlcnMvJztcblx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL2dyb3Vwcy8nO1xuXHRcdFx0fVxuXHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgKz0gc2hhcmVXaXRoO1xuXHRcdFx0b1JlbW92ZS5hcHBlbmRDaGlsZChkSHJlZik7XG5cdFx0XHR2YXIgYm9keSA9IG9TaGFyZS5vdXRlckhUTUw7XG5cblxuXHRcdFx0cmV0dXJuIERhdkNsaWVudC54aHIuc2VuZChcblx0XHRcdFx0ZGF2LnJlcXVlc3QuYmFzaWMoe21ldGhvZDogJ1BPU1QnLCBkYXRhOiBib2R5fSksXG5cdFx0XHRcdGFkZHJlc3NCb29rLnVybFxuXHRcdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2VycyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnMuZmlsdGVyKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHVzZXIuaWQgIT09IHNoYXJlV2l0aDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3VwcyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzLmZpbHRlcihmdW5jdGlvbihncm91cHMpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGdyb3Vwcy5pZCAhPT0gc2hhcmVXaXRoO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vdG9kbyAtIHJlbW92ZSBlbnRyeSBmcm9tIGFkZHJlc3Nib29rIG9iamVjdFxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHR9XG5cblxuXHR9O1xuXG59KTtcbiIsInZhciBjb250YWN0cztcbmFwcC5zZXJ2aWNlKCdDb250YWN0U2VydmljZScsIGZ1bmN0aW9uKERhdkNsaWVudCwgQWRkcmVzc0Jvb2tTZXJ2aWNlLCBDb250YWN0LCAkcSwgQ2FjaGVGYWN0b3J5LCB1dWlkNCkge1xuXG5cdHZhciBjYWNoZUZpbGxlZCA9IGZhbHNlO1xuXG5cdGNvbnRhY3RzID0gQ2FjaGVGYWN0b3J5KCdjb250YWN0cycpO1xuXG5cdHZhciBvYnNlcnZlckNhbGxiYWNrcyA9IFtdO1xuXG5cdHRoaXMucmVnaXN0ZXJPYnNlcnZlckNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRvYnNlcnZlckNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblx0fTtcblxuXHR2YXIgbm90aWZ5T2JzZXJ2ZXJzID0gZnVuY3Rpb24oZXZlbnROYW1lLCB1aWQpIHtcblx0XHR2YXIgZXYgPSB7XG5cdFx0XHRldmVudDogZXZlbnROYW1lLFxuXHRcdFx0dWlkOiB1aWQsXG5cdFx0XHRjb250YWN0czogY29udGFjdHMudmFsdWVzKClcblx0XHR9O1xuXHRcdGFuZ3VsYXIuZm9yRWFjaChvYnNlcnZlckNhbGxiYWNrcywgZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGNhbGxiYWNrKGV2KTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmZpbGxDYWNoZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBBZGRyZXNzQm9va1NlcnZpY2UuZ2V0RW5hYmxlZCgpLnRoZW4oZnVuY3Rpb24oZW5hYmxlZEFkZHJlc3NCb29rcykge1xuXHRcdFx0dmFyIHByb21pc2VzID0gW107XG5cdFx0XHRlbmFibGVkQWRkcmVzc0Jvb2tzLmZvckVhY2goZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChcblx0XHRcdFx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc3luYyhhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdFx0Zm9yKHZhciBpIGluIGFkZHJlc3NCb29rLm9iamVjdHMpIHtcblx0XHRcdFx0XHRcdFx0Y29udGFjdCA9IG5ldyBDb250YWN0KGFkZHJlc3NCb29rLCBhZGRyZXNzQm9vay5vYmplY3RzW2ldKTtcblx0XHRcdFx0XHRcdFx0Y29udGFjdHMucHV0KGNvbnRhY3QudWlkKCksIGNvbnRhY3QpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiAkcS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhY2hlRmlsbGVkID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoY2FjaGVGaWxsZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5maWxsQ2FjaGUoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gY29udGFjdHMudmFsdWVzKCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuICRxLndoZW4oY29udGFjdHMudmFsdWVzKCkpO1xuXHRcdH1cblx0fTtcblxuXHR0aGlzLmdldEdyb3VwcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3RzKSB7XG5cdFx0XHRyZXR1cm4gXy51bmlxKGNvbnRhY3RzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC5jYXRlZ29yaWVzKCk7XG5cdFx0XHR9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuXHRcdFx0XHRyZXR1cm4gYS5jb25jYXQoYik7XG5cdFx0XHR9LCBbXSkuc29ydCgpLCB0cnVlKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmdldEJ5SWQgPSBmdW5jdGlvbih1aWQpIHtcblx0XHRpZihjYWNoZUZpbGxlZCA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiB0aGlzLmZpbGxDYWNoZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBjb250YWN0cy5nZXQodWlkKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gJHEud2hlbihjb250YWN0cy5nZXQodWlkKSk7XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24obmV3Q29udGFjdCwgYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vayA9IGFkZHJlc3NCb29rIHx8IEFkZHJlc3NCb29rU2VydmljZS5nZXREZWZhdWx0QWRkcmVzc0Jvb2soKTtcblx0XHRuZXdDb250YWN0ID0gbmV3Q29udGFjdCB8fCBuZXcgQ29udGFjdChhZGRyZXNzQm9vayk7XG5cdFx0dmFyIG5ld1VpZCA9IHV1aWQ0LmdlbmVyYXRlKCk7XG5cdFx0bmV3Q29udGFjdC51aWQobmV3VWlkKTtcblx0XHRuZXdDb250YWN0LnNldFVybChhZGRyZXNzQm9vaywgbmV3VWlkKTtcblx0XHRuZXdDb250YWN0LmFkZHJlc3NCb29rSWQgPSBhZGRyZXNzQm9vay5kaXNwbGF5TmFtZTtcblxuXHRcdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQ2FyZChcblx0XHRcdGFkZHJlc3NCb29rLFxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhOiBuZXdDb250YWN0LmRhdGEuYWRkcmVzc0RhdGEsXG5cdFx0XHRcdGZpbGVuYW1lOiBuZXdVaWQgKyAnLnZjZidcblx0XHRcdH1cblx0XHQpLnRoZW4oZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRuZXdDb250YWN0LnNldEVUYWcoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdFVGFnJykpO1xuXHRcdFx0Y29udGFjdHMucHV0KG5ld1VpZCwgbmV3Q29udGFjdCk7XG5cdFx0XHRub3RpZnlPYnNlcnZlcnMoJ2NyZWF0ZScsIG5ld1VpZCk7XG5cdFx0XHRyZXR1cm4gbmV3Q29udGFjdDtcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkNvdWxkbid0IGNyZWF0ZVwiLCBlKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLm1vdmVDb250YWN0ID0gZnVuY3Rpb24gKGNvbnRhY3QsIGFkZHJlc3Nib29rKSB7XG5cdFx0aWYgKGNvbnRhY3QuYWRkcmVzc0Jvb2tJZCA9PT0gYWRkcmVzc2Jvb2suZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Y29udGFjdC5zeW5jVkNhcmQoKTtcblx0XHR2YXIgY2xvbmUgPSBhbmd1bGFyLmNvcHkoY29udGFjdCk7XG5cblx0XHQvLyBjcmVhdGUgdGhlIGNvbnRhY3QgaW4gdGhlIG5ldyB0YXJnZXQgYWRkcmVzc2Jvb2tcblx0XHR0aGlzLmNyZWF0ZShjbG9uZSwgYWRkcmVzc2Jvb2spO1xuXG5cdFx0Ly8gZGVsZXRlIHRoZSBvbGQgb25lXG5cdFx0dGhpcy5kZWxldGUoY29udGFjdCk7XG5cdH07XG5cblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0Y29udGFjdC5zeW5jVkNhcmQoKTtcblxuXHRcdC8vIHVwZGF0ZSBjb250YWN0IG9uIHNlcnZlclxuXHRcdHJldHVybiBEYXZDbGllbnQudXBkYXRlQ2FyZChjb250YWN0LmRhdGEsIHtqc29uOiB0cnVlfSkudGhlbihmdW5jdGlvbih4aHIpIHtcblx0XHRcdHZhciBuZXdFdGFnID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdFVGFnJyk7XG5cdFx0XHRjb250YWN0LnNldEVUYWcobmV3RXRhZyk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0Ly8gZGVsZXRlIGNvbnRhY3QgZnJvbSBzZXJ2ZXJcblx0XHRyZXR1cm4gRGF2Q2xpZW50LmRlbGV0ZUNhcmQoY29udGFjdC5kYXRhKS50aGVuKGZ1bmN0aW9uKHhocikge1xuXHRcdFx0Y29udGFjdHMucmVtb3ZlKGNvbnRhY3QudWlkKCkpO1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdkZWxldGUnLCBjb250YWN0LnVpZCgpKTtcblx0XHR9KTtcblx0fTtcbn0pO1xuIiwiYXBwLnNlcnZpY2UoJ0RhdkNsaWVudCcsIGZ1bmN0aW9uKCkge1xuXHR2YXIgeGhyID0gbmV3IGRhdi50cmFuc3BvcnQuQmFzaWMoXG5cdFx0bmV3IGRhdi5DcmVkZW50aWFscygpXG5cdCk7XG5cdHJldHVybiBuZXcgZGF2LkNsaWVudCh4aHIpO1xufSk7IiwiYXBwLnNlcnZpY2UoJ0RhdlNlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQpIHtcblx0cmV0dXJuIERhdkNsaWVudC5jcmVhdGVBY2NvdW50KHtcblx0XHRzZXJ2ZXI6IE9DLmxpbmtUb1JlbW90ZUJhc2UoJ2Rhdi9hZGRyZXNzYm9va3MnKSxcblx0XHRhY2NvdW50VHlwZTogJ2NhcmRkYXYnLFxuXHRcdHVzZVByb3ZpZGVkUGF0aDogdHJ1ZVxuXHR9KTtcbn0pO1xuIiwiYXBwLnNlcnZpY2UoJ1NldHRpbmdzU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHR2YXIgc2V0dGluZ3MgPSB7XG5cdFx0YWRkcmVzc0Jvb2tzOiBbXG5cdFx0XHQndGVzdEFkZHInXG5cdFx0XVxuXHR9O1xuXG5cdHRoaXMuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcblx0fTtcblxuXHR0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdHJldHVybiBzZXR0aW5nc1trZXldO1xuXHR9O1xuXG5cdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9O1xufSk7XG4iLCJhcHAuc2VydmljZSgndkNhcmRQcm9wZXJ0aWVzU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHQvKipcblx0ICogbWFwIHZDYXJkIGF0dHJpYnV0ZXMgdG8gaW50ZXJuYWwgYXR0cmlidXRlc1xuXHQgKlxuXHQgKiBwcm9wTmFtZToge1xuXHQgKiBcdFx0bXVsdGlwbGU6IFtCb29sZWFuXSwgLy8gaXMgdGhpcyBwcm9wIGFsbG93ZWQgbW9yZSB0aGFuIG9uY2U/IChkZWZhdWx0ID0gZmFsc2UpXG5cdCAqIFx0XHRyZWFkYWJsZU5hbWU6IFtTdHJpbmddLCAvLyBpbnRlcm5hdGlvbmFsaXplZCByZWFkYWJsZSBuYW1lIG9mIHByb3Bcblx0ICogXHRcdHRlbXBsYXRlOiBbU3RyaW5nXSwgLy8gdGVtcGxhdGUgbmFtZSBmb3VuZCBpbiAvdGVtcGxhdGVzL2RldGFpbEl0ZW1zXG5cdCAqIFx0XHRbLi4uXSAvLyBvcHRpb25hbCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIHdoaWNoIG1pZ2h0IGdldCB1c2VkIGJ5IHRoZSB0ZW1wbGF0ZVxuXHQgKiB9XG5cdCAqL1xuXHR0aGlzLnZDYXJkTWV0YSA9IHtcblx0XHRuaWNrbmFtZToge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdOaWNrbmFtZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0J1xuXHRcdH0sXG5cdFx0bm90ZToge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdOb3RlcycpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0YXJlYSdcblx0XHR9LFxuXHRcdHVybDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dlYnNpdGUnKSxcblx0XHRcdHRlbXBsYXRlOiAndXJsJ1xuXHRcdH0sXG5cdFx0Y2xvdWQ6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdGZWRlcmF0ZWQgQ2xvdWQgSUQnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVx0XHR9LFxuXHRcdGFkcjoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRcdHRlbXBsYXRlOiAnYWRyJyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJycsICcnLCAnJywgJycsICcnLCAnJywgJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHRjYXRlZ29yaWVzOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0dyb3VwcycpLFxuXHRcdFx0dGVtcGxhdGU6ICdncm91cHMnXG5cdFx0fSxcblx0XHRiZGF5OiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0JpcnRoZGF5JyksXG5cdFx0XHR0ZW1wbGF0ZTogJ2RhdGUnXG5cdFx0fSxcblx0XHRlbWFpbDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0VtYWlsJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOicnLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHRpbXBwOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnSW5zdGFudCBtZXNzYWdpbmcnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0dGVsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnUGhvbmUnKSxcblx0XHRcdHRlbXBsYXRlOiAndGVsJyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSxWT0lDRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRSxWT0lDRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUkssVk9JQ0UnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdDRUxMJywgbmFtZTogdCgnY29udGFjdHMnLCAnTW9iaWxlJyl9LFxuXHRcdFx0XHR7aWQ6ICdGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXgnKX0sXG5cdFx0XHRcdHtpZDogJ0hPTUUsRkFYJywgbmFtZTogdCgnY29udGFjdHMnLCAnRmF4IGhvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUkssRkFYJywgbmFtZTogdCgnY29udGFjdHMnLCAnRmF4IHdvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ1BBR0VSJywgbmFtZTogdCgnY29udGFjdHMnLCAnUGFnZXInKX0sXG5cdFx0XHRcdHtpZDogJ1ZPSUNFJywgbmFtZTogdCgnY29udGFjdHMnLCAnVm9pY2UnKX1cblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0dGhpcy5maWVsZE9yZGVyID0gW1xuXHRcdCdvcmcnLFxuXHRcdCd0aXRsZScsXG5cdFx0J3RlbCcsXG5cdFx0J2VtYWlsJyxcblx0XHQnYWRyJyxcblx0XHQnaW1wcCcsXG5cdFx0J25pY2snLFxuXHRcdCdiZGF5Jyxcblx0XHQndXJsJyxcblx0XHQnbm90ZScsXG5cdFx0J2NhdGVnb3JpZXMnLFxuXHRcdCdyb2xlJ1xuXHRdO1xuXG5cdHRoaXMuZmllbGREZWZpbml0aW9ucyA9IFtdO1xuXHRmb3IgKHZhciBwcm9wIGluIHRoaXMudkNhcmRNZXRhKSB7XG5cdFx0dGhpcy5maWVsZERlZmluaXRpb25zLnB1c2goe2lkOiBwcm9wLCBuYW1lOiB0aGlzLnZDYXJkTWV0YVtwcm9wXS5yZWFkYWJsZU5hbWUsIG11bHRpcGxlOiAhIXRoaXMudkNhcmRNZXRhW3Byb3BdLm11bHRpcGxlfSk7XG5cdH1cblxuXHR0aGlzLmZhbGxiYWNrTWV0YSA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0ZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHJpbmcpIHsgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTsgfVxuXHRcdHJldHVybiB7XG5cdFx0XHRuYW1lOiAndW5rbm93bi0nICsgcHJvcGVydHksXG5cdFx0XHRyZWFkYWJsZU5hbWU6IGNhcGl0YWxpemUocHJvcGVydHkpLFxuXHRcdFx0dGVtcGxhdGU6ICdoaWRkZW4nLFxuXHRcdFx0bmVjZXNzaXR5OiAnb3B0aW9uYWwnXG5cdFx0fTtcblx0fTtcblxuXHR0aGlzLmdldE1ldGEgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiB0aGlzLnZDYXJkTWV0YVtwcm9wZXJ0eV0gfHwgdGhpcy5mYWxsYmFja01ldGEocHJvcGVydHkpO1xuXHR9O1xuXG59KTtcbiIsImFwcC5maWx0ZXIoJ0pTT04ydkNhcmQnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0cmV0dXJuIHZDYXJkLmdlbmVyYXRlKGlucHV0KTtcblx0fTtcbn0pOyIsImFwcC5maWx0ZXIoJ2NvbnRhY3RDb2xvcicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHR2YXIgY29sb3JzID0gW1xuXHRcdFx0XHQnIzAwMWYzZicsXG5cdFx0XHRcdCcjMDA3NEQ5Jyxcblx0XHRcdFx0JyMzOUNDQ0MnLFxuXHRcdFx0XHQnIzNEOTk3MCcsXG5cdFx0XHRcdCcjMkVDQzQwJyxcblx0XHRcdFx0JyNGRjg1MUInLFxuXHRcdFx0XHQnI0ZGNDEzNicsXG5cdFx0XHRcdCcjODUxNDRiJyxcblx0XHRcdFx0JyNGMDEyQkUnLFxuXHRcdFx0XHQnI0IxMERDOSdcblx0XHRcdF0sIGFzY2lpU3VtID0gMDtcblx0XHRmb3IodmFyIGkgaW4gaW5wdXQpIHtcblx0XHRcdGFzY2lpU3VtICs9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG5cdFx0fVxuXHRcdHJldHVybiBjb2xvcnNbYXNjaWlTdW0gJSBjb2xvcnMubGVuZ3RoXTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignY29udGFjdEdyb3VwRmlsdGVyJywgZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uIChjb250YWN0cywgZ3JvdXApIHtcblx0XHRpZiAodHlwZW9mIGNvbnRhY3RzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGNvbnRhY3RzO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGdyb3VwID09PSAndW5kZWZpbmVkJyB8fCBncm91cC50b0xvd2VyQ2FzZSgpID09PSB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRyZXR1cm4gY29udGFjdHM7XG5cdFx0fVxuXHRcdHZhciBmaWx0ZXIgPSBbXTtcblx0XHRpZiAoY29udGFjdHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY29udGFjdHNbaV0uY2F0ZWdvcmllcygpLmluZGV4T2YoZ3JvdXApID49IDApIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChjb250YWN0c1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZpbHRlcjtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignZmllbGRGaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGZpZWxkcywgY29udGFjdCkge1xuXHRcdGlmICh0eXBlb2YgZmllbGRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBjb250YWN0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0dmFyIGZpbHRlciA9IFtdO1xuXHRcdGlmIChmaWVsZHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGZpZWxkc1tpXS5tdWx0aXBsZSApIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChfLmlzVW5kZWZpbmVkKGNvbnRhY3QuZ2V0UHJvcGVydHkoZmllbGRzW2ldLmlkKSkpIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmaWx0ZXI7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2ZpcnN0Q2hhcmFjdGVyJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHJldHVybiBpbnB1dC5jaGFyQXQoMCk7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ29yZGVyRGV0YWlsSXRlbXMnLCBmdW5jdGlvbih2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uKGl0ZW1zLCBmaWVsZCwgcmV2ZXJzZSkge1xuXG5cdFx0dmFyIGZpbHRlcmVkID0gW107XG5cdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRmaWx0ZXJlZC5wdXNoKGl0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZpZWxkT3JkZXIgPSBhbmd1bGFyLmNvcHkodkNhcmRQcm9wZXJ0aWVzU2VydmljZS5maWVsZE9yZGVyKTtcblx0XHQvLyByZXZlcnNlIHRvIG1vdmUgY3VzdG9tIGl0ZW1zIHRvIHRoZSBlbmQgKGluZGV4T2YgPT0gLTEpXG5cdFx0ZmllbGRPcmRlci5yZXZlcnNlKCk7XG5cblx0XHRmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRpZihmaWVsZE9yZGVyLmluZGV4T2YoYVtmaWVsZF0pIDwgZmllbGRPcmRlci5pbmRleE9mKGJbZmllbGRdKSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblx0XHRcdGlmKGZpZWxkT3JkZXIuaW5kZXhPZihhW2ZpZWxkXSkgPiBmaWVsZE9yZGVyLmluZGV4T2YoYltmaWVsZF0pKSB7XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAwO1xuXHRcdH0pO1xuXG5cdFx0aWYocmV2ZXJzZSkgZmlsdGVyZWQucmV2ZXJzZSgpO1xuXHRcdHJldHVybiBmaWx0ZXJlZDtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndG9BcnJheScsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0KSkgcmV0dXJuIG9iajtcblx0XHRyZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2YWwsICcka2V5Jywge3ZhbHVlOiBrZXl9KTtcblx0XHR9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndkNhcmQySlNPTicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gdkNhcmQucGFyc2UoaW5wdXQpO1xuXHR9O1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
