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

app.controller('addressbooklistCtrl', ['scope', 'AddressBookService', 'SettingsService', function(scope, AddressBookService, SettingsService) {
	var ctrl = this;

	AddressBookService.getAll().then(function(addressBooks) {
		ctrl.addressBooks = addressBooks;
	});

	ctrl.createAddressBook = function() {
		if(ctrl.newAddressBookName) {
			AddressBookService.create(ctrl.newAddressBookName).then(function() {
				AddressBookService.getAddressBook(ctrl.newAddressBookName).then(function(addressBook) {
					ctrl.addressBooks.push(addressBook);
					scope.$apply();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJkYXRlcGlja2VyX2RpcmVjdGl2ZS5qcyIsImZvY3VzX2RpcmVjdGl2ZS5qcyIsImFkZHJlc3NCb29rL2FkZHJlc3NCb29rX2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9vay9hZGRyZXNzQm9va19kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2NvbnRyb2xsZXIuanMiLCJhZGRyZXNzQm9va0xpc3QvYWRkcmVzc0Jvb2tMaXN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3QvY29udGFjdF9jb250cm9sbGVyLmpzIiwiY29udGFjdC9jb250YWN0X2RpcmVjdGl2ZS5qcyIsImNvbnRhY3REZXRhaWxzL2NvbnRhY3REZXRhaWxzX2NvbnRyb2xsZXIuanMiLCJjb250YWN0RGV0YWlscy9jb250YWN0RGV0YWlsc19kaXJlY3RpdmUuanMiLCJjb250YWN0TGlzdC9jb250YWN0TGlzdF9jb250cm9sbGVyLmpzIiwiY29udGFjdExpc3QvY29udGFjdExpc3RfZGlyZWN0aXZlLmpzIiwiZGV0YWlsc0l0ZW0vZGV0YWlsc0l0ZW1fY29udHJvbGxlci5qcyIsImRldGFpbHNJdGVtL2RldGFpbHNJdGVtX2RpcmVjdGl2ZS5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fY29udHJvbGxlci5qcyIsImRldGFpbHNQaG90by9kZXRhaWxzUGhvdG9fZGlyZWN0aXZlLmpzIiwiZ3JvdXAvZ3JvdXBfY29udHJvbGxlci5qcyIsImdyb3VwL2dyb3VwX2RpcmVjdGl2ZS5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfY29udHJvbGxlci5qcyIsImdyb3VwTGlzdC9ncm91cExpc3RfZGlyZWN0aXZlLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19jb250cm9sbGVyLmpzIiwiaW1hZ2VQcmV2aWV3L2ltYWdlUHJldmlld19kaXJlY3RpdmUuanMiLCJwYXJzZXJzL2dyb3VwTW9kZWxfZGlyZWN0aXZlLmpzIiwicGFyc2Vycy90ZWxNb2RlbF9kaXJlY3RpdmUuanMiLCJhZGRyZXNzQm9va19tb2RlbC5qcyIsImNvbnRhY3RfbW9kZWwuanMiLCJhZGRyZXNzQm9va19zZXJ2aWNlLmpzIiwiY29udGFjdF9zZXJ2aWNlLmpzIiwiZGF2Q2xpZW50X3NlcnZpY2UuanMiLCJkYXZfc2VydmljZS5qcyIsInNldHRpbmdzX3NlcnZpY2UuanMiLCJ2Q2FyZFByb3BlcnRpZXMuanMiLCJKU09OMnZDYXJkX2ZpbHRlci5qcyIsImNvbnRhY3RDb2xvcl9maWx0ZXIuanMiLCJjb250YWN0R3JvdXBfZmlsdGVyLmpzIiwiZmllbGRfZmlsdGVyLmpzIiwiZmlyc3RDaGFyYWN0ZXJfZmlsdGVyLmpzIiwib3JkZXJEZXRhaWxJdGVtc19maWx0ZXIuanMiLCJ0b0FycmF5X2ZpbHRlci5qcyIsInZDYXJkMkpTT05fZmlsdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBVUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxlQUFlLENBQUMsU0FBUyxpQkFBaUIsV0FBVyxnQkFBZ0IsYUFBYTs7QUFFM0csSUFBSSwwQkFBTyxTQUFTLGdCQUFnQjs7Q0FFbkMsZUFBZSxLQUFLLFNBQVM7RUFDNUIsVUFBVTs7O0NBR1gsZUFBZSxLQUFLLGNBQWM7RUFDakMsVUFBVTs7O0NBR1gsZUFBZSxVQUFVLE1BQU0sRUFBRSxZQUFZOzs7QUFHOUM7QUN6QkEsSUFBSSxVQUFVLGNBQWMsV0FBVztDQUN0QyxPQUFPO0VBQ04sVUFBVTtFQUNWLFVBQVU7RUFDVixPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sYUFBYTtHQUNwRCxFQUFFLFdBQVc7SUFDWixRQUFRLFdBQVc7S0FDbEIsV0FBVztLQUNYLFNBQVM7S0FDVCxTQUFTO0tBQ1QsU0FBUyxVQUFVLE1BQU07TUFDeEIsWUFBWSxjQUFjO01BQzFCLE1BQU07Ozs7Ozs7QUFPWjtBQ25CQSxJQUFJLFVBQVUsZ0NBQW1CLFVBQVUsVUFBVTtDQUNwRCxPQUFPO0VBQ04sVUFBVTtFQUNWLE1BQU07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QUM7O0dBRVQsT0FBTzs7O0VBR1IsR0FBRyxTQUFTLFNBQVM7RUFDckIsT0FBTzs7O0FBR1Q7QUMzQkEsSUFBSSxPQUFPLFdBQVcsV0FBVztDQUNoQyxPQUFPLFNBQVMsS0FBSztFQUNwQixJQUFJLEVBQUUsZUFBZSxTQUFTLE9BQU87RUFDckMsT0FBTyxFQUFFLElBQUksS0FBSyxTQUFTLEtBQUssS0FBSztHQUNwQyxPQUFPLE9BQU8sZUFBZSxLQUFLLFFBQVEsQ0FBQyxPQUFPOzs7O0FBSXJEO0FDUkEsSUFBSSxPQUFPLGNBQWMsV0FBVztDQUNuQyxPQUFPLFNBQVMsT0FBTztFQUN0QixPQUFPLE1BQU0sTUFBTTs7R0FFbEIiLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBvd25DbG91ZCAtIGNvbnRhY3RzXG4gKlxuICogVGhpcyBmaWxlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSB2ZXJzaW9uIDMgb3JcbiAqIGxhdGVyLiBTZWUgdGhlIENPUFlJTkcgZmlsZS5cbiAqXG4gKiBAYXV0aG9yIEhlbmRyaWsgTGVwcGVsc2FjayA8aGVuZHJpa0BsZXBwZWxzYWNrLmRlPlxuICogQGNvcHlyaWdodCBIZW5kcmlrIExlcHBlbHNhY2sgMjAxNVxuICovXG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnY29udGFjdHNBcHAnLCBbJ3V1aWQ0JywgJ2FuZ3VsYXItY2FjaGUnLCAnbmdSb3V0ZScsICd1aS5ib290c3RyYXAnLCAndWkuc2VsZWN0JywgJ25nU2FuaXRpemUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcblxuXHQkcm91dGVQcm92aWRlci53aGVuKCcvOmdpZCcsIHtcblx0XHR0ZW1wbGF0ZTogJzxjb250YWN0ZGV0YWlscz48L2NvbnRhY3RkZXRhaWxzPidcblx0fSk7XG5cblx0JHJvdXRlUHJvdmlkZXIud2hlbignLzpnaWQvOnVpZCcsIHtcblx0XHR0ZW1wbGF0ZTogJzxjb250YWN0ZGV0YWlscz48L2NvbnRhY3RkZXRhaWxzPidcblx0fSk7XG5cblx0JHJvdXRlUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyArIHQoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpKTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdkYXRlcGlja2VyJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRyZXF1aXJlIDogJ25nTW9kZWwnLFxuXHRcdGxpbmsgOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsQ3RybCkge1xuXHRcdFx0JChmdW5jdGlvbigpIHtcblx0XHRcdFx0ZWxlbWVudC5kYXRlcGlja2VyKHtcblx0XHRcdFx0XHRkYXRlRm9ybWF0Oid5eS1tbS1kZCcsXG5cdFx0XHRcdFx0bWluRGF0ZTogbnVsbCxcblx0XHRcdFx0XHRtYXhEYXRlOiBudWxsLFxuXHRcdFx0XHRcdG9uU2VsZWN0OmZ1bmN0aW9uIChkYXRlKSB7XG5cdFx0XHRcdFx0XHRuZ01vZGVsQ3RybC4kc2V0Vmlld1ZhbHVlKGRhdGUpO1xuXHRcdFx0XHRcdFx0c2NvcGUuJGFwcGx5KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZm9jdXNFeHByZXNzaW9uJywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRsaW5rOiB7XG5cdFx0XHRwb3N0OiBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblx0XHRcdFx0c2NvcGUuJHdhdGNoKGF0dHJzLmZvY3VzRXhwcmVzc2lvbiwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cblx0XHRcdFx0XHRpZiAoYXR0cnMuZm9jdXNFeHByZXNzaW9uKSB7XG5cdFx0XHRcdFx0XHRpZiAoc2NvcGUuJGV2YWwoYXR0cnMuZm9jdXNFeHByZXNzaW9uKSkge1xuXHRcdFx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGVsZW1lbnQuaXMoJ2lucHV0JykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQuZm9jdXMoKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudC5maW5kKCdpbnB1dCcpLmZvY3VzKCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LCAxMDApOyAvL25lZWQgc29tZSBkZWxheSB0byB3b3JrIHdpdGggbmctZGlzYWJsZWRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2FkZHJlc3Nib29rQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgQWRkcmVzc0Jvb2tTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLnVybEJhc2UgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG5cdGN0cmwuc2hvd1VybCA9IGZhbHNlO1xuXG5cdGN0cmwudG9nZ2xlU2hvd1VybCA9IGZ1bmN0aW9uKCkge1xuXHRcdGN0cmwuc2hvd1VybCA9ICFjdHJsLnNob3dVcmw7XG5cdH07XG5cblx0Y3RybC50b2dnbGVTaGFyZXNFZGl0b3IgPSBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdGFkZHJlc3NCb29rLmVkaXRpbmdTaGFyZXMgPSAhYWRkcmVzc0Jvb2suZWRpdGluZ1NoYXJlcztcblx0XHRhZGRyZXNzQm9vay5zZWxlY3RlZFNoYXJlZSA9IG51bGw7XG5cdH07XG5cblx0LyogRnJvbSBDYWxlbmRhci1SZXdvcmsgLSBqcy9hcHAvY29udHJvbGxlcnMvY2FsZW5kYXJsaXN0Y29udHJvbGxlci5qcyAqL1xuXHRjdHJsLmZpbmRTaGFyZWUgPSBmdW5jdGlvbiAodmFsLCBhZGRyZXNzQm9vaykge1xuXHRcdHJldHVybiAkLmdldChcblx0XHRcdE9DLmxpbmtUb09DUygnYXBwcy9maWxlc19zaGFyaW5nL2FwaS92MScpICsgJ3NoYXJlZXMnLFxuXHRcdFx0e1xuXHRcdFx0XHRmb3JtYXQ6ICdqc29uJyxcblx0XHRcdFx0c2VhcmNoOiB2YWwudHJpbSgpLFxuXHRcdFx0XHRwZXJQYWdlOiAyMDAsXG5cdFx0XHRcdGl0ZW1UeXBlOiAncHJpbmNpcGFscydcblx0XHRcdH1cblx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHQvLyBUb2RvIC0gZmlsdGVyIG91dCBjdXJyZW50IHVzZXIsIGV4aXN0aW5nIHNoYXJlZXNcblx0XHRcdHZhciB1c2VycyAgID0gcmVzdWx0Lm9jcy5kYXRhLmV4YWN0LnVzZXJzLmNvbmNhdChyZXN1bHQub2NzLmRhdGEudXNlcnMpO1xuXHRcdFx0dmFyIGdyb3VwcyAgPSByZXN1bHQub2NzLmRhdGEuZXhhY3QuZ3JvdXBzLmNvbmNhdChyZXN1bHQub2NzLmRhdGEuZ3JvdXBzKTtcblxuXHRcdFx0dmFyIHVzZXJTaGFyZXMgPSBhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzO1xuXHRcdFx0dmFyIGdyb3VwU2hhcmVzID0gYWRkcmVzc0Jvb2suc2hhcmVkV2l0aC5ncm91cHM7XG5cdFx0XHR2YXIgdXNlclNoYXJlc0xlbmd0aCA9IHVzZXJTaGFyZXMubGVuZ3RoO1xuXHRcdFx0dmFyIGdyb3VwU2hhcmVzTGVuZ3RoID0gZ3JvdXBTaGFyZXMubGVuZ3RoO1xuXHRcdFx0dmFyIGksIGo7XG5cblx0XHRcdC8vIEZpbHRlciBvdXQgY3VycmVudCB1c2VyXG5cdFx0XHR2YXIgdXNlcnNMZW5ndGggPSB1c2Vycy5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwIDsgaSA8IHVzZXJzTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHVzZXJzW2ldLnZhbHVlLnNoYXJlV2l0aCA9PT0gT0MuY3VycmVudFVzZXIpIHtcblx0XHRcdFx0XHR1c2Vycy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gTm93IGZpbHRlciBvdXQgYWxsIHNoYXJlZXMgdGhhdCBhcmUgYWxyZWFkeSBzaGFyZWQgd2l0aFxuXHRcdFx0Zm9yIChpID0gMDsgaSA8IHVzZXJTaGFyZXNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgc2hhcmUgPSB1c2VyU2hhcmVzW2ldO1xuXHRcdFx0XHR1c2Vyc0xlbmd0aCA9IHVzZXJzLmxlbmd0aDtcblx0XHRcdFx0Zm9yIChqID0gMDsgaiA8IHVzZXJzTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRpZiAodXNlcnNbal0udmFsdWUuc2hhcmVXaXRoID09PSBzaGFyZS5pZCkge1xuXHRcdFx0XHRcdFx0dXNlcnMuc3BsaWNlKGosIDEpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIENvbWJpbmUgdXNlcnMgYW5kIGdyb3Vwc1xuXHRcdFx0dXNlcnMgPSB1c2Vycy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRpc3BsYXk6IGl0ZW0udmFsdWUuc2hhcmVXaXRoLFxuXHRcdFx0XHRcdHR5cGU6IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUixcblx0XHRcdFx0XHRpZGVudGlmaWVyOiBpdGVtLnZhbHVlLnNoYXJlV2l0aFxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdGdyb3VwcyA9IGdyb3Vwcy5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRpc3BsYXk6IGl0ZW0udmFsdWUuc2hhcmVXaXRoICsgJyAoZ3JvdXApJyxcblx0XHRcdFx0XHR0eXBlOiBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQLFxuXHRcdFx0XHRcdGlkZW50aWZpZXI6IGl0ZW0udmFsdWUuc2hhcmVXaXRoXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGdyb3Vwcy5jb25jYXQodXNlcnMpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwub25TZWxlY3RTaGFyZWUgPSBmdW5jdGlvbiAoaXRlbSwgbW9kZWwsIGxhYmVsLCBhZGRyZXNzQm9vaykge1xuXHRcdGN0cmwuYWRkcmVzc0Jvb2suc2VsZWN0ZWRTaGFyZWUgPSBudWxsO1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgaXRlbS50eXBlLCBpdGVtLmlkZW50aWZpZXIsIGZhbHNlLCBmYWxzZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblxuXHR9O1xuXG5cdGN0cmwudXBkYXRlRXhpc3RpbmdVc2VyU2hhcmUgPSBmdW5jdGlvbihhZGRyZXNzQm9vaywgdXNlcklkLCB3cml0YWJsZSkge1xuXHRcdEFkZHJlc3NCb29rU2VydmljZS5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSLCB1c2VySWQsIHdyaXRhYmxlLCB0cnVlKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudXBkYXRlRXhpc3RpbmdHcm91cFNoYXJlID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIGdyb3VwSWQsIHdyaXRhYmxlKSB7XG5cdFx0QWRkcmVzc0Jvb2tTZXJ2aWNlLnNoYXJlKGFkZHJlc3NCb29rLCBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQLCBncm91cElkLCB3cml0YWJsZSwgdHJ1ZSkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLnVuc2hhcmVGcm9tVXNlciA9IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCB1c2VySWQpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UudW5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSLCB1c2VySWQpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KCk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y3RybC51bnNoYXJlRnJvbUdyb3VwID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIGdyb3VwSWQpIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UudW5zaGFyZShhZGRyZXNzQm9vaywgT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCwgZ3JvdXBJZCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS4kYXBwbHkoKTtcblx0XHR9KTtcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUFkZHJlc3NCb29rID0gZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRBZGRyZXNzQm9va1NlcnZpY2UuZGVsZXRlKGFkZHJlc3NCb29rKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLiRhcHBseSgpO1xuXHRcdH0pO1xuXHR9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FkZHJlc3Nib29rJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJywgLy8gaGFzIHRvIGJlIGFuIGF0dHJpYnV0ZSB0byB3b3JrIHdpdGggY29yZSBjc3Ncblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2FkZHJlc3Nib29rQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0YWRkcmVzc0Jvb2s6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9hZGRyZXNzQm9vay5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2FkZHJlc3Nib29rbGlzdEN0cmwnLCBmdW5jdGlvbihzY29wZSwgQWRkcmVzc0Jvb2tTZXJ2aWNlLCBTZXR0aW5nc1NlcnZpY2UpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdEFkZHJlc3NCb29rU2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGFkZHJlc3NCb29rcykge1xuXHRcdGN0cmwuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzO1xuXHR9KTtcblxuXHRjdHJsLmNyZWF0ZUFkZHJlc3NCb29rID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoY3RybC5uZXdBZGRyZXNzQm9va05hbWUpIHtcblx0XHRcdEFkZHJlc3NCb29rU2VydmljZS5jcmVhdGUoY3RybC5uZXdBZGRyZXNzQm9va05hbWUpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEFkZHJlc3NCb29rU2VydmljZS5nZXRBZGRyZXNzQm9vayhjdHJsLm5ld0FkZHJlc3NCb29rTmFtZSkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdGN0cmwuYWRkcmVzc0Jvb2tzLnB1c2goYWRkcmVzc0Jvb2spO1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWRkcmVzc2Jvb2tsaXN0JywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdhZGRyZXNzYm9va2xpc3RDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvYWRkcmVzc0Jvb2tMaXN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdEN0cmwnLCBmdW5jdGlvbigkcm91dGUsICRyb3V0ZVBhcmFtcykge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5vcGVuQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0dWlkOiBjdHJsLmNvbnRhY3QudWlkKCl9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0Lmh0bWwnKVxuXHR9O1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignY29udGFjdGRldGFpbHNDdHJsJywgZnVuY3Rpb24oQ29udGFjdFNlcnZpY2UsIEFkZHJlc3NCb29rU2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSwgJHJvdXRlUGFyYW1zLCAkc2NvcGUpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwudWlkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0Y3RybC50ID0ge1xuXHRcdG5vQ29udGFjdHMgOiB0KCdjb250YWN0cycsICdObyBjb250YWN0cyBpbiBoZXJlJyksXG5cdFx0cGxhY2Vob2xkZXJOYW1lIDogdCgnY29udGFjdHMnLCAnTmFtZScpLFxuXHRcdHBsYWNlaG9sZGVyT3JnIDogdCgnY29udGFjdHMnLCAnT3JnYW5pemF0aW9uJyksXG5cdFx0cGxhY2Vob2xkZXJUaXRsZSA6IHQoJ2NvbnRhY3RzJywgJ1RpdGxlJyksXG5cdFx0c2VsZWN0RmllbGQgOiB0KCdjb250YWN0cycsICdBZGQgZmllbGQgLi4uJylcblx0fTtcblxuXHRjdHJsLmZpZWxkRGVmaW5pdGlvbnMgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmZpZWxkRGVmaW5pdGlvbnM7XG5cdGN0cmwuZm9jdXMgPSB1bmRlZmluZWQ7XG5cdGN0cmwuZmllbGQgPSB1bmRlZmluZWQ7XG5cdCRzY29wZS5hZGRyZXNzQm9va3MgPSBbXTtcblx0Y3RybC5hZGRyZXNzQm9va3MgPSBbXTtcblxuXHRBZGRyZXNzQm9va1NlcnZpY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRjdHJsLmFkZHJlc3NCb29rcyA9IGFkZHJlc3NCb29rcztcblx0XHQkc2NvcGUuYWRkcmVzc0Jvb2tzID0gYWRkcmVzc0Jvb2tzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWQ6IGVsZW1lbnQuZGlzcGxheU5hbWUsXG5cdFx0XHRcdG5hbWU6IGVsZW1lbnQuZGlzcGxheU5hbWVcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0aWYgKCFfLmlzVW5kZWZpbmVkKGN0cmwuY29udGFjdCkpIHtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcblx0XHRjdHJsLmNoYW5nZUNvbnRhY3QobmV3VmFsdWUpO1xuXHR9KTtcblxuXHRjdHJsLmNoYW5nZUNvbnRhY3QgPSBmdW5jdGlvbih1aWQpIHtcblx0XHRpZiAodHlwZW9mIHVpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Q29udGFjdFNlcnZpY2UuZ2V0QnlJZCh1aWQpLnRoZW4oZnVuY3Rpb24oY29udGFjdCkge1xuXHRcdFx0Y3RybC5jb250YWN0ID0gY29udGFjdDtcblx0XHRcdGN0cmwucGhvdG8gPSBjdHJsLmNvbnRhY3QucGhvdG8oKTtcblx0XHRcdCRzY29wZS5hZGRyZXNzQm9vayA9IF8uZmluZCgkc2NvcGUuYWRkcmVzc0Jvb2tzLCBmdW5jdGlvbihib29rKSB7XG5cdFx0XHRcdHJldHVybiBib29rLmlkID09PSBjdHJsLmNvbnRhY3QuYWRkcmVzc0Jvb2tJZDtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwudXBkYXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLnVwZGF0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuZGVsZXRlQ29udGFjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdENvbnRhY3RTZXJ2aWNlLmRlbGV0ZShjdHJsLmNvbnRhY3QpO1xuXHR9O1xuXG5cdGN0cmwuYWRkRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuXHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRjdHJsLmNvbnRhY3QuYWRkUHJvcGVydHkoZmllbGQsIGRlZmF1bHRWYWx1ZSk7XG5cdFx0Y3RybC5mb2N1cyA9IGZpZWxkO1xuXHRcdGN0cmwuZmllbGQgPSAnJztcblx0fTtcblxuXHRjdHJsLmRlbGV0ZUZpZWxkID0gZnVuY3Rpb24gKGZpZWxkLCBwcm9wKSB7XG5cdFx0Y3RybC5jb250YWN0LnJlbW92ZVByb3BlcnR5KGZpZWxkLCBwcm9wKTtcblx0XHRjdHJsLmZvY3VzID0gdW5kZWZpbmVkO1xuXHR9O1xuXG5cdGN0cmwuY2hhbmdlQWRkcmVzc0Jvb2sgPSBmdW5jdGlvbiAoYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vayA9IF8uZmluZChjdHJsLmFkZHJlc3NCb29rcywgZnVuY3Rpb24oYm9vaykge1xuXHRcdFx0cmV0dXJuIGJvb2suZGlzcGxheU5hbWUgPT09IGFkZHJlc3NCb29rLmlkO1xuXHRcdH0pO1xuXHRcdENvbnRhY3RTZXJ2aWNlLm1vdmVDb250YWN0KGN0cmwuY29udGFjdCwgYWRkcmVzc0Jvb2spO1xuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdjb250YWN0ZGV0YWlscycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHByaW9yaXR5OiAxLFxuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnY29udGFjdGRldGFpbHNDdHJsJyxcblx0XHRjb250cm9sbGVyQXM6ICdjdHJsJyxcblx0XHRiaW5kVG9Db250cm9sbGVyOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvY29udGFjdERldGFpbHMuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdjb250YWN0bGlzdEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRmaWx0ZXIsICRyb3V0ZSwgJHJvdXRlUGFyYW1zLCBDb250YWN0U2VydmljZSwgdkNhcmRQcm9wZXJ0aWVzU2VydmljZSkge1xuXHR2YXIgY3RybCA9IHRoaXM7XG5cblx0Y3RybC5yb3V0ZVBhcmFtcyA9ICRyb3V0ZVBhcmFtcztcblx0Y3RybC50ID0ge1xuXHRcdGFkZENvbnRhY3QgOiB0KCdjb250YWN0cycsICdBZGQgY29udGFjdCcpXG5cdH07XG5cblx0Y3RybC5jb250YWN0TGlzdCA9IFtdO1xuXG5cdENvbnRhY3RTZXJ2aWNlLnJlZ2lzdGVyT2JzZXJ2ZXJDYWxsYmFjayhmdW5jdGlvbihldikge1xuXHRcdCRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoZXYuZXZlbnQgPT09ICdkZWxldGUnKSB7XG5cdFx0XHRcdGlmIChjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdFx0dWlkOiB1bmRlZmluZWRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3RybC5jb250YWN0TGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0aWYgKGN0cmwuY29udGFjdExpc3RbaV0udWlkKCkgPT09IGV2LnVpZCkge1xuXHRcdFx0XHRcdFx0XHQkcm91dGUudXBkYXRlUGFyYW1zKHtcblx0XHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdFx0dWlkOiAoY3RybC5jb250YWN0TGlzdFtpKzFdKSA/IGN0cmwuY29udGFjdExpc3RbaSsxXS51aWQoKSA6IGN0cmwuY29udGFjdExpc3RbaS0xXS51aWQoKVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChldi5ldmVudCA9PT0gJ2NyZWF0ZScpIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogZXYudWlkXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0Y3RybC5jb250YWN0cyA9IGV2LmNvbnRhY3RzO1xuXHRcdH0pO1xuXHR9KTtcblxuXHRDb250YWN0U2VydmljZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3RzKSB7XG5cdFx0JHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdGN0cmwuY29udGFjdHMgPSBjb250YWN0cztcblx0XHR9KTtcblx0fSk7XG5cblx0JHNjb3BlLiR3YXRjaCgnY3RybC5yb3V0ZVBhcmFtcy51aWQnLCBmdW5jdGlvbihuZXdWYWx1ZSkge1xuXHRcdGlmKG5ld1ZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIHdlIG1pZ2h0IGhhdmUgdG8gd2FpdCB1bnRpbCBuZy1yZXBlYXQgZmlsbGVkIHRoZSBjb250YWN0TGlzdFxuXHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0JHJvdXRlLnVwZGF0ZVBhcmFtcyh7XG5cdFx0XHRcdFx0Z2lkOiAkcm91dGVQYXJhbXMuZ2lkLFxuXHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdFx0XHR2YXIgdW5iaW5kV2F0Y2ggPSAkc2NvcGUuJHdhdGNoKCdjdHJsLmNvbnRhY3RMaXN0JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYoY3RybC5jb250YWN0TGlzdCAmJiBjdHJsLmNvbnRhY3RMaXN0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdFx0XHRnaWQ6ICRyb3V0ZVBhcmFtcy5naWQsXG5cdFx0XHRcdFx0XHRcdHVpZDogY3RybC5jb250YWN0TGlzdFswXS51aWQoKVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHVuYmluZFdhdGNoKCk7IC8vIHVuYmluZCBhcyB3ZSBvbmx5IHdhbnQgb25lIHVwZGF0ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdCRzY29wZS4kd2F0Y2goJ2N0cmwucm91dGVQYXJhbXMuZ2lkJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gd2UgbWlnaHQgaGF2ZSB0byB3YWl0IHVudGlsIG5nLXJlcGVhdCBmaWxsZWQgdGhlIGNvbnRhY3RMaXN0XG5cdFx0Y3RybC5jb250YWN0TGlzdCA9IFtdO1xuXHRcdC8vIHdhdGNoIGZvciBuZXh0IGNvbnRhY3RMaXN0IHVwZGF0ZVxuXHRcdHZhciB1bmJpbmRXYXRjaCA9ICRzY29wZS4kd2F0Y2goJ2N0cmwuY29udGFjdExpc3QnLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmKGN0cmwuY29udGFjdExpc3QgJiYgY3RybC5jb250YWN0TGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdCRyb3V0ZS51cGRhdGVQYXJhbXMoe1xuXHRcdFx0XHRcdGdpZDogJHJvdXRlUGFyYW1zLmdpZCxcblx0XHRcdFx0XHR1aWQ6IGN0cmwuY29udGFjdExpc3RbMF0udWlkKClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHR1bmJpbmRXYXRjaCgpOyAvLyB1bmJpbmQgYXMgd2Ugb25seSB3YW50IG9uZSB1cGRhdGVcblx0XHR9KTtcblx0fSk7XG5cblx0Y3RybC5jcmVhdGVDb250YWN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0Q29udGFjdFNlcnZpY2UuY3JlYXRlKCkudGhlbihmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0XHRbJ3RlbCcsICdhZHInLCAnZW1haWwnXS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG5cdFx0XHRcdHZhciBkZWZhdWx0VmFsdWUgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoZmllbGQpLmRlZmF1bHRWYWx1ZSB8fCB7dmFsdWU6ICcnfTtcblx0XHRcdFx0Y29udGFjdC5hZGRQcm9wZXJ0eShmaWVsZCwgZGVmYXVsdFZhbHVlKTtcblx0XHRcdH0gKTtcblx0XHRcdGlmICgkcm91dGVQYXJhbXMuZ2lkICE9PSB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKSkge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJHJvdXRlUGFyYW1zLmdpZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb250YWN0LmNhdGVnb3JpZXMoJycpO1xuXHRcdFx0fVxuXHRcdFx0JCgnI2RldGFpbHMtZnVsbE5hbWUnKS5mb2N1cygpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGN0cmwuaGFzQ29udGFjdHMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFjdHJsLmNvbnRhY3RzKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBjdHJsLmNvbnRhY3RzLmxlbmd0aCA+IDA7XG5cdH07XG5cblx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gJHJvdXRlUGFyYW1zLnVpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkQ29udGFjdElkKSB7XG5cdFx0JHNjb3BlLnNlbGVjdGVkQ29udGFjdElkID0gc2VsZWN0ZWRDb250YWN0SWQ7XG5cdH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnY29udGFjdGxpc3QnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRwcmlvcml0eTogMSxcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2NvbnRhY3RsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0YWRkcmVzc2Jvb2s6ICc9YWRyYm9vaydcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9jb250YWN0TGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNJdGVtQ3RybCcsIGZ1bmN0aW9uKCR0ZW1wbGF0ZVJlcXVlc3QsIHZDYXJkUHJvcGVydGllc1NlcnZpY2UsIENvbnRhY3RTZXJ2aWNlKSB7XG5cdHZhciBjdHJsID0gdGhpcztcblxuXHRjdHJsLm1ldGEgPSB2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlLmdldE1ldGEoY3RybC5uYW1lKTtcblx0Y3RybC50eXBlID0gdW5kZWZpbmVkO1xuXHRjdHJsLnQgPSB7XG5cdFx0cG9Cb3ggOiB0KCdjb250YWN0cycsICdQb3N0IE9mZmljZSBCb3gnKSxcblx0XHRwb3N0YWxDb2RlIDogdCgnY29udGFjdHMnLCAnUG9zdGFsIENvZGUnKSxcblx0XHRjaXR5IDogdCgnY29udGFjdHMnLCAnQ2l0eScpLFxuXHRcdHN0YXRlIDogdCgnY29udGFjdHMnLCAnU3RhdGUgb3IgcHJvdmluY2UnKSxcblx0XHRjb3VudHJ5IDogdCgnY29udGFjdHMnLCAnQ291bnRyeScpLFxuXHRcdGFkZHJlc3M6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRuZXdHcm91cDogdCgnY29udGFjdHMnLCAnKG5ldyBncm91cCknKVxuXHR9O1xuXG5cdGN0cmwuYXZhaWxhYmxlT3B0aW9ucyA9IGN0cmwubWV0YS5vcHRpb25zIHx8IFtdO1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhKSAmJiAhXy5pc1VuZGVmaW5lZChjdHJsLmRhdGEubWV0YSkgJiYgIV8uaXNVbmRlZmluZWQoY3RybC5kYXRhLm1ldGEudHlwZSkpIHtcblx0XHRjdHJsLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlWzBdO1xuXHRcdGlmICghY3RybC5hdmFpbGFibGVPcHRpb25zLnNvbWUoZnVuY3Rpb24oZSkgeyByZXR1cm4gZS5pZCA9PT0gY3RybC5kYXRhLm1ldGEudHlwZVswXTsgfSApKSB7XG5cdFx0XHRjdHJsLmF2YWlsYWJsZU9wdGlvbnMgPSBjdHJsLmF2YWlsYWJsZU9wdGlvbnMuY29uY2F0KFt7aWQ6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0sIG5hbWU6IGN0cmwuZGF0YS5tZXRhLnR5cGVbMF19XSk7XG5cdFx0fVxuXHR9XG5cdGN0cmwuYXZhaWxhYmxlR3JvdXBzID0gW107XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHRjdHJsLmF2YWlsYWJsZUdyb3VwcyA9IF8udW5pcXVlKGdyb3Vwcyk7XG5cdH0pO1xuXG5cdGN0cmwuY2hhbmdlVHlwZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0XHRjdHJsLmRhdGEubWV0YSA9IGN0cmwuZGF0YS5tZXRhIHx8IHt9O1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGUgPSBjdHJsLmRhdGEubWV0YS50eXBlIHx8IFtdO1xuXHRcdGN0cmwuZGF0YS5tZXRhLnR5cGVbMF0gPSB2YWw7XG5cdFx0Y3RybC5tb2RlbC51cGRhdGVDb250YWN0KCk7XG5cdH07XG5cblx0Y3RybC5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZW1wbGF0ZVVybCA9IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2RldGFpbEl0ZW1zLycgKyBjdHJsLm1ldGEudGVtcGxhdGUgKyAnLmh0bWwnKTtcblx0XHRyZXR1cm4gJHRlbXBsYXRlUmVxdWVzdCh0ZW1wbGF0ZVVybCk7XG5cdH07XG5cblx0Y3RybC5kZWxldGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRjdHJsLm1vZGVsLmRlbGV0ZUZpZWxkKGN0cmwubmFtZSwgY3RybC5kYXRhKTtcblx0XHRjdHJsLm1vZGVsLnVwZGF0ZUNvbnRhY3QoKTtcblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZGV0YWlsc2l0ZW0nLCBbJyRjb21waWxlJywgZnVuY3Rpb24oJGNvbXBpbGUpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNJdGVtQ3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge1xuXHRcdFx0bmFtZTogJz0nLFxuXHRcdFx0ZGF0YTogJz0nLFxuXHRcdFx0bW9kZWw6ICc9J1xuXHRcdH0sXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRjdHJsLmdldFRlbXBsYXRlKCkudGhlbihmdW5jdGlvbihodG1sKSB7XG5cdFx0XHRcdHZhciB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudChodG1sKTtcblx0XHRcdFx0ZWxlbWVudC5hcHBlbmQodGVtcGxhdGUpO1xuXHRcdFx0XHQkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufV0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2RldGFpbHNQaG90b0N0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdkZXRhaWxzcGhvdG8nLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge30sXG5cdFx0Y29udHJvbGxlcjogJ2RldGFpbHNQaG90b0N0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGNvbnRhY3Q6ICc9ZGF0YSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiBPQy5saW5rVG8oJ2NvbnRhY3RzJywgJ3RlbXBsYXRlcy9kZXRhaWxzUGhvdG8uaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cEN0cmwnLCBmdW5jdGlvbigpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncm91cCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsIC8vIGhhcyB0byBiZSBhbiBhdHRyaWJ1dGUgdG8gd29yayB3aXRoIGNvcmUgY3NzXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGNvbnRyb2xsZXI6ICdncm91cEN0cmwnLFxuXHRcdGNvbnRyb2xsZXJBczogJ2N0cmwnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdGdyb3VwOiAnPWRhdGEnXG5cdFx0fSxcblx0XHR0ZW1wbGF0ZVVybDogT0MubGlua1RvKCdjb250YWN0cycsICd0ZW1wbGF0ZXMvZ3JvdXAuaHRtbCcpXG5cdH07XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdncm91cGxpc3RDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBDb250YWN0U2VydmljZSwgJHJvdXRlUGFyYW1zKSB7XG5cblx0JHNjb3BlLmdyb3VwcyA9IFt0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKV07XG5cblx0Q29udGFjdFNlcnZpY2UuZ2V0R3JvdXBzKCkudGhlbihmdW5jdGlvbihncm91cHMpIHtcblx0XHQkc2NvcGUuZ3JvdXBzID0gXy51bmlxdWUoW3QoJ2NvbnRhY3RzJywgJ0FsbCBjb250YWN0cycpXS5jb25jYXQoZ3JvdXBzKSk7XG5cdH0pO1xuXG5cdCRzY29wZS5zZWxlY3RlZEdyb3VwID0gJHJvdXRlUGFyYW1zLmdpZDtcblx0JHNjb3BlLnNldFNlbGVjdGVkID0gZnVuY3Rpb24gKHNlbGVjdGVkR3JvdXApIHtcblx0XHQkc2NvcGUuc2VsZWN0ZWRHcm91cCA9IHNlbGVjdGVkR3JvdXA7XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyb3VwbGlzdCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRUEnLCAvLyBoYXMgdG8gYmUgYW4gYXR0cmlidXRlIHRvIHdvcmsgd2l0aCBjb3JlIGNzc1xuXHRcdHNjb3BlOiB7fSxcblx0XHRjb250cm9sbGVyOiAnZ3JvdXBsaXN0Q3RybCcsXG5cdFx0Y29udHJvbGxlckFzOiAnY3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlcjoge30sXG5cdFx0dGVtcGxhdGVVcmw6IE9DLmxpbmtUbygnY29udGFjdHMnLCAndGVtcGxhdGVzL2dyb3VwTGlzdC5odG1sJylcblx0fTtcbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoJ2ltYWdlUHJldmlld0N0cmwnLCBmdW5jdGlvbigkc2NvcGUpIHtcblx0dmFyIGN0cmwgPSB0aGlzO1xuXG5cdGN0cmwubG9hZEltYWdlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG5cdFx0cmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkc2NvcGUuaW1hZ2VwcmV2aWV3ID0gcmVhZGVyLnJlc3VsdDtcblx0XHRcdH0pO1xuXHRcdH0sIGZhbHNlKTtcblxuXHRcdGlmIChmaWxlKSB7XG5cdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2ltYWdlcHJldmlldycsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdHNjb3BlOiB7XG5cdFx0XHRwaG90b0NhbGxiYWNrOiAnJmltYWdlcHJldmlldydcblx0XHR9LFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY3RybCkge1xuXHRcdFx0ZWxlbWVudC5iaW5kKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGZpbGUgPSBlbGVtZW50LmdldCgwKS5maWxlc1swXTtcblx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblx0XHRcdFx0cmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2hpJywgc2NvcGUucGhvdG9DYWxsYmFjaygpICsgJycpO1xuXHRcdFx0XHRcdHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHNjb3BlLnBob3RvQ2FsbGJhY2soKShyZWFkZXIucmVzdWx0KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSwgZmFsc2UpO1xuXG5cdFx0XHRcdGlmIChmaWxlKSB7XG5cdFx0XHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JvdXBNb2RlbCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcblx0cmV0dXJue1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0cmVxdWlyZTogJ25nTW9kZWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyLCBuZ01vZGVsKSB7XG5cdFx0XHRuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHZhbHVlLnNwbGl0KCcsJyk7XG5cdFx0XHR9KTtcblx0XHRcdG5nTW9kZWwuJHBhcnNlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWUuam9pbignLCcpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCd0ZWxNb2RlbCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm57XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRyZXF1aXJlOiAnbmdNb2RlbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIsIG5nTW9kZWwpIHtcblx0XHRcdG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9KTtcblx0XHRcdG5nTW9kZWwuJHBhcnNlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFsdWU7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdBZGRyZXNzQm9vaycsIGZ1bmN0aW9uKClcbntcblx0cmV0dXJuIGZ1bmN0aW9uIEFkZHJlc3NCb29rKGRhdGEpIHtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XG5cblx0XHRcdGRpc3BsYXlOYW1lOiAnJyxcblx0XHRcdGNvbnRhY3RzOiBbXSxcblx0XHRcdGdyb3VwczogZGF0YS5kYXRhLnByb3BzLmdyb3VwcyxcblxuXHRcdFx0Z2V0Q29udGFjdDogZnVuY3Rpb24odWlkKSB7XG5cdFx0XHRcdGZvcih2YXIgaSBpbiB0aGlzLmNvbnRhY3RzKSB7XG5cdFx0XHRcdFx0aWYodGhpcy5jb250YWN0c1tpXS51aWQoKSA9PT0gdWlkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jb250YWN0c1tpXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdH0sXG5cblx0XHRcdHNoYXJlZFdpdGg6IHtcblx0XHRcdFx0dXNlcnM6IFtdLFxuXHRcdFx0XHRncm91cHM6IFtdXG5cdFx0XHR9XG5cblx0XHR9KTtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCBkYXRhKTtcblx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XG5cdFx0XHRvd25lcjogZGF0YS51cmwuc3BsaXQoJy8nKS5zbGljZSgtMywgLTIpWzBdXG5cdFx0fSk7XG5cblx0XHR2YXIgc2hhcmVzID0gdGhpcy5kYXRhLnByb3BzLmludml0ZTtcblx0XHRpZiAodHlwZW9mIHNoYXJlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgc2hhcmVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHZhciBocmVmID0gc2hhcmVzW2pdLmhyZWY7XG5cdFx0XHRcdGlmIChocmVmLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBhY2Nlc3MgPSBzaGFyZXNbal0uYWNjZXNzO1xuXHRcdFx0XHRpZiAoYWNjZXNzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHJlYWRXcml0ZSA9ICh0eXBlb2YgYWNjZXNzLnJlYWRXcml0ZSAhPT0gJ3VuZGVmaW5lZCcpO1xuXG5cdFx0XHRcdGlmIChocmVmLnN0YXJ0c1dpdGgoJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLycpKSB7XG5cdFx0XHRcdFx0dGhpcy5zaGFyZWRXaXRoLnVzZXJzLnB1c2goe1xuXHRcdFx0XHRcdFx0aWQ6IGhyZWYuc3Vic3RyKDI3KSxcblx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBocmVmLnN1YnN0cigyNyksXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogcmVhZFdyaXRlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoaHJlZi5zdGFydHNXaXRoKCdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJykpIHtcblx0XHRcdFx0XHR0aGlzLnNoYXJlZFdpdGguZ3JvdXBzLnB1c2goe1xuXHRcdFx0XHRcdFx0aWQ6IGhyZWYuc3Vic3RyKDI4KSxcblx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBocmVmLnN1YnN0cigyOCksXG5cdFx0XHRcdFx0XHR3cml0YWJsZTogcmVhZFdyaXRlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL3ZhciBvd25lciA9IHRoaXMuZGF0YS5wcm9wcy5vd25lcjtcblx0XHQvL2lmICh0eXBlb2Ygb3duZXIgIT09ICd1bmRlZmluZWQnICYmIG93bmVyLmxlbmd0aCAhPT0gMCkge1xuXHRcdC8vXHRvd25lciA9IG93bmVyLnRyaW0oKTtcblx0XHQvL1x0aWYgKG93bmVyLnN0YXJ0c1dpdGgoJy9yZW1vdGUucGhwL2Rhdi9wcmluY2lwYWxzL3VzZXJzLycpKSB7XG5cdFx0Ly9cdFx0dGhpcy5fcHJvcGVydGllcy5vd25lciA9IG93bmVyLnN1YnN0cigzMyk7XG5cdFx0Ly9cdH1cblx0XHQvL31cblxuXHR9O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ29udGFjdCcsIGZ1bmN0aW9uKCRmaWx0ZXIpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIENvbnRhY3QoYWRkcmVzc0Jvb2ssIHZDYXJkKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywge1xuXG5cdFx0XHRkYXRhOiB7fSxcblx0XHRcdHByb3BzOiB7fSxcblxuXHRcdFx0YWRkcmVzc0Jvb2tJZDogYWRkcmVzc0Jvb2suZGlzcGxheU5hbWUsXG5cblx0XHRcdHVpZDogZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNEZWZpbmVkKHZhbHVlKSkge1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnNldFByb3BlcnR5KCd1aWQnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRQcm9wZXJ0eSgndWlkJykudmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGZ1bGxOYW1lOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ2ZuJywgeyB2YWx1ZTogdmFsdWUgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZ2V0dGVyXG5cdFx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnZm4nKTtcblx0XHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0dGl0bGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChhbmd1bGFyLmlzRGVmaW5lZCh2YWx1ZSkpIHtcblx0XHRcdFx0XHQvLyBzZXR0ZXJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgndGl0bGUnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCd0aXRsZScpO1xuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRvcmc6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHZhciBwcm9wZXJ0eSA9IHRoaXMuZ2V0UHJvcGVydHkoJ29yZycpO1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0dmFyIHZhbCA9IHZhbHVlO1xuXHRcdFx0XHRcdC8vIHNldHRlclxuXHRcdFx0XHRcdGlmKHByb3BlcnR5ICYmIEFycmF5LmlzQXJyYXkocHJvcGVydHkudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR2YWwgPSBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0XHRcdHZhbFswXSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZXRQcm9wZXJ0eSgnb3JnJywgeyB2YWx1ZTogdmFsIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGdldHRlclxuXHRcdFx0XHRcdGlmKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShwcm9wZXJ0eS52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlWzBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5LnZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0ZW1haWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0dmFyIHByb3BlcnR5ID0gdGhpcy5nZXRQcm9wZXJ0eSgnZW1haWwnKTtcblx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkudmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0cGhvdG86IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdwaG90bycpO1xuXHRcdFx0XHRpZihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRjYXRlZ29yaWVzOiBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRpZiAoYW5ndWxhci5pc0RlZmluZWQodmFsdWUpKSB7XG5cdFx0XHRcdFx0Ly8gc2V0dGVyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ2NhdGVnb3JpZXMnLCB7IHZhbHVlOiB2YWx1ZSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBnZXR0ZXJcblx0XHRcdFx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdjYXRlZ29yaWVzJyk7XG5cdFx0XHRcdFx0aWYocHJvcGVydHkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eS52YWx1ZS5zcGxpdCgnLCcpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRnZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0XHRpZiAodGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByb3BzW25hbWVdWzBdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhZGRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRkYXRhID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgaWR4ID0gdGhpcy5wcm9wc1tuYW1lXS5sZW5ndGg7XG5cdFx0XHRcdHRoaXMucHJvcHNbbmFtZV1baWR4XSA9IGRhdGE7XG5cblx0XHRcdFx0Ly8ga2VlcCB2Q2FyZCBpbiBzeW5jXG5cdFx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHRcdFx0cmV0dXJuIGlkeDtcblx0XHRcdH0sXG5cdFx0XHRzZXRQcm9wZXJ0eTogZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHRcdFx0XHRpZighdGhpcy5wcm9wc1tuYW1lXSkge1xuXHRcdFx0XHRcdHRoaXMucHJvcHNbbmFtZV0gPSBbXTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnByb3BzW25hbWVdWzBdID0gZGF0YTtcblxuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHJlbW92ZVByb3BlcnR5OiBmdW5jdGlvbiAobmFtZSwgcHJvcCkge1xuXHRcdFx0XHRhbmd1bGFyLmNvcHkoXy53aXRob3V0KHRoaXMucHJvcHNbbmFtZV0sIHByb3ApLCB0aGlzLnByb3BzW25hbWVdKTtcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fSxcblx0XHRcdHNldEVUYWc6IGZ1bmN0aW9uKGV0YWcpIHtcblx0XHRcdFx0dGhpcy5kYXRhLmV0YWcgPSBldGFnO1xuXHRcdFx0fSxcblxuXHRcdFx0c2V0VXJsOiBmdW5jdGlvbihhZGRyZXNzQm9vaywgdWlkKSB7XG5cdFx0XHRcdHRoaXMuZGF0YS51cmwgPSBhZGRyZXNzQm9vay51cmwgKyB1aWQgKyAnLnZjZic7XG5cdFx0XHR9LFxuXG5cdFx0XHRzeW5jVkNhcmQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBrZWVwIHZDYXJkIGluIHN5bmNcblx0XHRcdFx0dGhpcy5kYXRhLmFkZHJlc3NEYXRhID0gJGZpbHRlcignSlNPTjJ2Q2FyZCcpKHRoaXMucHJvcHMpO1xuXHRcdFx0fVxuXG5cdFx0fSk7XG5cblx0XHRpZihhbmd1bGFyLmlzRGVmaW5lZCh2Q2FyZCkpIHtcblx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMuZGF0YSwgdkNhcmQpO1xuXHRcdFx0YW5ndWxhci5leHRlbmQodGhpcy5wcm9wcywgJGZpbHRlcigndkNhcmQySlNPTicpKHRoaXMuZGF0YS5hZGRyZXNzRGF0YSkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhbmd1bGFyLmV4dGVuZCh0aGlzLnByb3BzLCB7XG5cdFx0XHRcdHZlcnNpb246IFt7dmFsdWU6ICczLjAnfV0sXG5cdFx0XHRcdGZuOiBbe3ZhbHVlOiAnJ31dXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuZGF0YS5hZGRyZXNzRGF0YSA9ICRmaWx0ZXIoJ0pTT04ydkNhcmQnKSh0aGlzLnByb3BzKTtcblx0XHR9XG5cblx0XHR2YXIgcHJvcGVydHkgPSB0aGlzLmdldFByb3BlcnR5KCdjYXRlZ29yaWVzJyk7XG5cdFx0aWYoIXByb3BlcnR5KSB7XG5cdFx0XHR0aGlzLmNhdGVnb3JpZXMoJycpO1xuXHRcdH1cblx0fTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0FkZHJlc3NCb29rU2VydmljZScsIGZ1bmN0aW9uKERhdkNsaWVudCwgRGF2U2VydmljZSwgU2V0dGluZ3NTZXJ2aWNlLCBBZGRyZXNzQm9vaywgQ29udGFjdCkge1xuXG5cdHZhciBhZGRyZXNzQm9va3MgPSBbXTtcblxuXHR2YXIgbG9hZEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0YWRkcmVzc0Jvb2tzID0gYWNjb3VudC5hZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH07XG5cblx0cmV0dXJuIHtcblx0XHRnZXRBbGw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGxvYWRBbGwoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldEdyb3VwczogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihhZGRyZXNzQm9va3MpIHtcblx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rcy5tYXAoZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC5ncm91cHM7XG5cdFx0XHRcdH0pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGEuY29uY2F0KGIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRnZXRFbmFibGVkOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gYWNjb3VudC5hZGRyZXNzQm9va3MubWFwKGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBBZGRyZXNzQm9vayhhZGRyZXNzQm9vayk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldERlZmF1bHRBZGRyZXNzQm9vazogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gYWRkcmVzc0Jvb2tzWzBdO1xuXHRcdH0sXG5cblx0XHRnZXRBZGRyZXNzQm9vazogZnVuY3Rpb24oZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiBEYXZTZXJ2aWNlLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXHRcdFx0XHRyZXR1cm4gRGF2Q2xpZW50LmdldEFkZHJlc3NCb29rKHtkaXNwbGF5TmFtZTpkaXNwbGF5TmFtZSwgdXJsOmFjY291bnQuaG9tZVVybH0pLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0XHRhZGRyZXNzQm9vayA9IG5ldyBBZGRyZXNzQm9vayh7XG5cdFx0XHRcdFx0XHR1cmw6IGFkZHJlc3NCb29rWzBdLmhyZWYsXG5cdFx0XHRcdFx0XHRkYXRhOiBhZGRyZXNzQm9va1swXVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGFkZHJlc3NCb29rLmRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWU7XG5cdFx0XHRcdFx0cmV0dXJuIGFkZHJlc3NCb29rO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRpc3BsYXlOYW1lKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5jcmVhdGVBZGRyZXNzQm9vayh7ZGlzcGxheU5hbWU6ZGlzcGxheU5hbWUsIHVybDphY2NvdW50LmhvbWVVcmx9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRkZWxldGU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rKSB7XG5cdFx0XHRyZXR1cm4gRGF2U2VydmljZS50aGVuKGZ1bmN0aW9uKGFjY291bnQpIHtcblx0XHRcdFx0cmV0dXJuIERhdkNsaWVudC5kZWxldGVBZGRyZXNzQm9vayhhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRhbmd1bGFyLmNvcHkoXy53aXRob3V0KGFkZHJlc3NCb29rcywgYWRkcmVzc0Jvb2spLCBhZGRyZXNzQm9va3MpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRyZW5hbWU6IGZ1bmN0aW9uKGFkZHJlc3NCb29rLCBkaXNwbGF5TmFtZSkge1xuXHRcdFx0cmV0dXJuIERhdlNlcnZpY2UudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cdFx0XHRcdHJldHVybiBEYXZDbGllbnQucmVuYW1lQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2ssIHtkaXNwbGF5TmFtZTpkaXNwbGF5TmFtZSwgdXJsOmFjY291bnQuaG9tZVVybH0pO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGdldDogZnVuY3Rpb24oZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybiB0aGlzLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oYWRkcmVzc0Jvb2tzKSB7XG5cdFx0XHRcdHJldHVybiBhZGRyZXNzQm9va3MuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW1lbnQuZGlzcGxheU5hbWUgPT09IGRpc3BsYXlOYW1lO1xuXHRcdFx0XHR9KVswXTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzeW5jOiBmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0cmV0dXJuIERhdkNsaWVudC5zeW5jQWRkcmVzc0Jvb2soYWRkcmVzc0Jvb2spO1xuXHRcdH0sXG5cblx0XHRzaGFyZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHNoYXJlVHlwZSwgc2hhcmVXaXRoLCB3cml0YWJsZSwgZXhpc3RpbmdTaGFyZSkge1xuXHRcdFx0dmFyIHhtbERvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZURvY3VtZW50KCcnLCAnJywgbnVsbCk7XG5cdFx0XHR2YXIgb1NoYXJlID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ286c2hhcmUnKTtcblx0XHRcdG9TaGFyZS5zZXRBdHRyaWJ1dGUoJ3htbG5zOmQnLCAnREFWOicpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6bycsICdodHRwOi8vb3duY2xvdWQub3JnL25zJyk7XG5cdFx0XHR4bWxEb2MuYXBwZW5kQ2hpbGQob1NoYXJlKTtcblxuXHRcdFx0dmFyIG9TZXQgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzZXQnKTtcblx0XHRcdG9TaGFyZS5hcHBlbmRDaGlsZChvU2V0KTtcblxuXHRcdFx0dmFyIGRIcmVmID0geG1sRG9jLmNyZWF0ZUVsZW1lbnQoJ2Q6aHJlZicpO1xuXHRcdFx0aWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9VU0VSKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL3VzZXJzLyc7XG5cdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRkSHJlZi50ZXh0Q29udGVudCA9ICdwcmluY2lwYWw6cHJpbmNpcGFscy9ncm91cHMvJztcblx0XHRcdH1cblx0XHRcdGRIcmVmLnRleHRDb250ZW50ICs9IHNoYXJlV2l0aDtcblx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQoZEhyZWYpO1xuXG5cdFx0XHR2YXIgb1N1bW1hcnkgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzdW1tYXJ5Jyk7XG5cdFx0XHRvU3VtbWFyeS50ZXh0Q29udGVudCA9IHQoJ2NvbnRhY3RzJywgJ3thZGRyZXNzYm9va30gc2hhcmVkIGJ5IHtvd25lcn0nLCB7XG5cdFx0XHRcdGFkZHJlc3Nib29rOiBhZGRyZXNzQm9vay5kaXNwbGF5TmFtZSxcblx0XHRcdFx0b3duZXI6IGFkZHJlc3NCb29rLm93bmVyXG5cdFx0XHR9KTtcblx0XHRcdG9TZXQuYXBwZW5kQ2hpbGQob1N1bW1hcnkpO1xuXG5cdFx0XHRpZiAod3JpdGFibGUpIHtcblx0XHRcdFx0dmFyIG9SVyA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnJlYWQtd3JpdGUnKTtcblx0XHRcdFx0b1NldC5hcHBlbmRDaGlsZChvUlcpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgYm9keSA9IG9TaGFyZS5vdXRlckhUTUw7XG5cblx0XHRcdHJldHVybiBEYXZDbGllbnQueGhyLnNlbmQoXG5cdFx0XHRcdGRhdi5yZXF1ZXN0LmJhc2ljKHttZXRob2Q6ICdQT1NUJywgZGF0YTogYm9keX0pLFxuXHRcdFx0XHRhZGRyZXNzQm9vay51cmxcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHRpZiAoIWV4aXN0aW5nU2hhcmUpIHtcblx0XHRcdFx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLnVzZXJzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGlkOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IHNoYXJlV2l0aCxcblx0XHRcdFx0XHRcdFx0XHR3cml0YWJsZTogd3JpdGFibGVcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHNoYXJlVHlwZSA9PT0gT0MuU2hhcmUuU0hBUkVfVFlQRV9HUk9VUCkge1xuXHRcdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3Vwcy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRpZDogc2hhcmVXaXRoLFxuXHRcdFx0XHRcdFx0XHRcdGRpc3BsYXluYW1lOiBzaGFyZVdpdGgsXG5cdFx0XHRcdFx0XHRcdFx0d3JpdGFibGU6IHdyaXRhYmxlXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHR9LFxuXG5cdFx0dW5zaGFyZTogZnVuY3Rpb24oYWRkcmVzc0Jvb2ssIHNoYXJlVHlwZSwgc2hhcmVXaXRoKSB7XG5cdFx0XHR2YXIgeG1sRG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoJycsICcnLCBudWxsKTtcblx0XHRcdHZhciBvU2hhcmUgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnbzpzaGFyZScpO1xuXHRcdFx0b1NoYXJlLnNldEF0dHJpYnV0ZSgneG1sbnM6ZCcsICdEQVY6Jyk7XG5cdFx0XHRvU2hhcmUuc2V0QXR0cmlidXRlKCd4bWxuczpvJywgJ2h0dHA6Ly9vd25jbG91ZC5vcmcvbnMnKTtcblx0XHRcdHhtbERvYy5hcHBlbmRDaGlsZChvU2hhcmUpO1xuXG5cdFx0XHR2YXIgb1JlbW92ZSA9IHhtbERvYy5jcmVhdGVFbGVtZW50KCdvOnJlbW92ZScpO1xuXHRcdFx0b1NoYXJlLmFwcGVuZENoaWxkKG9SZW1vdmUpO1xuXG5cdFx0XHR2YXIgZEhyZWYgPSB4bWxEb2MuY3JlYXRlRWxlbWVudCgnZDpocmVmJyk7XG5cdFx0XHRpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX1VTRVIpIHtcblx0XHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgPSAncHJpbmNpcGFsOnByaW5jaXBhbHMvdXNlcnMvJztcblx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdGRIcmVmLnRleHRDb250ZW50ID0gJ3ByaW5jaXBhbDpwcmluY2lwYWxzL2dyb3Vwcy8nO1xuXHRcdFx0fVxuXHRcdFx0ZEhyZWYudGV4dENvbnRlbnQgKz0gc2hhcmVXaXRoO1xuXHRcdFx0b1JlbW92ZS5hcHBlbmRDaGlsZChkSHJlZik7XG5cdFx0XHR2YXIgYm9keSA9IG9TaGFyZS5vdXRlckhUTUw7XG5cblxuXHRcdFx0cmV0dXJuIERhdkNsaWVudC54aHIuc2VuZChcblx0XHRcdFx0ZGF2LnJlcXVlc3QuYmFzaWMoe21ldGhvZDogJ1BPU1QnLCBkYXRhOiBib2R5fSksXG5cdFx0XHRcdGFkZHJlc3NCb29rLnVybFxuXHRcdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdGlmIChzaGFyZVR5cGUgPT09IE9DLlNoYXJlLlNIQVJFX1RZUEVfVVNFUikge1xuXHRcdFx0XHRcdFx0YWRkcmVzc0Jvb2suc2hhcmVkV2l0aC51c2VycyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGgudXNlcnMuZmlsdGVyKGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHVzZXIuaWQgIT09IHNoYXJlV2l0aDtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoc2hhcmVUeXBlID09PSBPQy5TaGFyZS5TSEFSRV9UWVBFX0dST1VQKSB7XG5cdFx0XHRcdFx0XHRhZGRyZXNzQm9vay5zaGFyZWRXaXRoLmdyb3VwcyA9IGFkZHJlc3NCb29rLnNoYXJlZFdpdGguZ3JvdXBzLmZpbHRlcihmdW5jdGlvbihncm91cHMpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGdyb3Vwcy5pZCAhPT0gc2hhcmVXaXRoO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vdG9kbyAtIHJlbW92ZSBlbnRyeSBmcm9tIGFkZHJlc3Nib29rIG9iamVjdFxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHR9XG5cblxuXHR9O1xuXG59KTtcbiIsInZhciBjb250YWN0cztcbmFwcC5zZXJ2aWNlKCdDb250YWN0U2VydmljZScsIGZ1bmN0aW9uKERhdkNsaWVudCwgQWRkcmVzc0Jvb2tTZXJ2aWNlLCBDb250YWN0LCAkcSwgQ2FjaGVGYWN0b3J5LCB1dWlkNCkge1xuXG5cdHZhciBjYWNoZUZpbGxlZCA9IGZhbHNlO1xuXG5cdGNvbnRhY3RzID0gQ2FjaGVGYWN0b3J5KCdjb250YWN0cycpO1xuXG5cdHZhciBvYnNlcnZlckNhbGxiYWNrcyA9IFtdO1xuXG5cdHRoaXMucmVnaXN0ZXJPYnNlcnZlckNhbGxiYWNrID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRvYnNlcnZlckNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcblx0fTtcblxuXHR2YXIgbm90aWZ5T2JzZXJ2ZXJzID0gZnVuY3Rpb24oZXZlbnROYW1lLCB1aWQpIHtcblx0XHR2YXIgZXYgPSB7XG5cdFx0XHRldmVudDogZXZlbnROYW1lLFxuXHRcdFx0dWlkOiB1aWQsXG5cdFx0XHRjb250YWN0czogY29udGFjdHMudmFsdWVzKClcblx0XHR9O1xuXHRcdGFuZ3VsYXIuZm9yRWFjaChvYnNlcnZlckNhbGxiYWNrcywgZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGNhbGxiYWNrKGV2KTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmZpbGxDYWNoZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBBZGRyZXNzQm9va1NlcnZpY2UuZ2V0RW5hYmxlZCgpLnRoZW4oZnVuY3Rpb24oZW5hYmxlZEFkZHJlc3NCb29rcykge1xuXHRcdFx0dmFyIHByb21pc2VzID0gW107XG5cdFx0XHRlbmFibGVkQWRkcmVzc0Jvb2tzLmZvckVhY2goZnVuY3Rpb24oYWRkcmVzc0Jvb2spIHtcblx0XHRcdFx0cHJvbWlzZXMucHVzaChcblx0XHRcdFx0XHRBZGRyZXNzQm9va1NlcnZpY2Uuc3luYyhhZGRyZXNzQm9vaykudGhlbihmdW5jdGlvbihhZGRyZXNzQm9vaykge1xuXHRcdFx0XHRcdFx0Zm9yKHZhciBpIGluIGFkZHJlc3NCb29rLm9iamVjdHMpIHtcblx0XHRcdFx0XHRcdFx0Y29udGFjdCA9IG5ldyBDb250YWN0KGFkZHJlc3NCb29rLCBhZGRyZXNzQm9vay5vYmplY3RzW2ldKTtcblx0XHRcdFx0XHRcdFx0Y29udGFjdHMucHV0KGNvbnRhY3QudWlkKCksIGNvbnRhY3QpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiAkcS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhY2hlRmlsbGVkID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoY2FjaGVGaWxsZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5maWxsQ2FjaGUoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gY29udGFjdHMudmFsdWVzKCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuICRxLndoZW4oY29udGFjdHMudmFsdWVzKCkpO1xuXHRcdH1cblx0fTtcblxuXHR0aGlzLmdldEdyb3VwcyA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKGNvbnRhY3RzKSB7XG5cdFx0XHRyZXR1cm4gXy51bmlxKGNvbnRhY3RzLm1hcChmdW5jdGlvbiAoZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC5jYXRlZ29yaWVzKCk7XG5cdFx0XHR9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuXHRcdFx0XHRyZXR1cm4gYS5jb25jYXQoYik7XG5cdFx0XHR9LCBbXSkuc29ydCgpLCB0cnVlKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmdldEJ5SWQgPSBmdW5jdGlvbih1aWQpIHtcblx0XHRpZihjYWNoZUZpbGxlZCA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiB0aGlzLmZpbGxDYWNoZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBjb250YWN0cy5nZXQodWlkKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gJHEud2hlbihjb250YWN0cy5nZXQodWlkKSk7XG5cdFx0fVxuXHR9O1xuXG5cdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24obmV3Q29udGFjdCwgYWRkcmVzc0Jvb2spIHtcblx0XHRhZGRyZXNzQm9vayA9IGFkZHJlc3NCb29rIHx8IEFkZHJlc3NCb29rU2VydmljZS5nZXREZWZhdWx0QWRkcmVzc0Jvb2soKTtcblx0XHRuZXdDb250YWN0ID0gbmV3Q29udGFjdCB8fCBuZXcgQ29udGFjdChhZGRyZXNzQm9vayk7XG5cdFx0dmFyIG5ld1VpZCA9IHV1aWQ0LmdlbmVyYXRlKCk7XG5cdFx0bmV3Q29udGFjdC51aWQobmV3VWlkKTtcblx0XHRuZXdDb250YWN0LnNldFVybChhZGRyZXNzQm9vaywgbmV3VWlkKTtcblx0XHRuZXdDb250YWN0LmFkZHJlc3NCb29rSWQgPSBhZGRyZXNzQm9vay5kaXNwbGF5TmFtZTtcblxuXHRcdHJldHVybiBEYXZDbGllbnQuY3JlYXRlQ2FyZChcblx0XHRcdGFkZHJlc3NCb29rLFxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhOiBuZXdDb250YWN0LmRhdGEuYWRkcmVzc0RhdGEsXG5cdFx0XHRcdGZpbGVuYW1lOiBuZXdVaWQgKyAnLnZjZidcblx0XHRcdH1cblx0XHQpLnRoZW4oZnVuY3Rpb24oeGhyKSB7XG5cdFx0XHRuZXdDb250YWN0LnNldEVUYWcoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdFVGFnJykpO1xuXHRcdFx0Y29udGFjdHMucHV0KG5ld1VpZCwgbmV3Q29udGFjdCk7XG5cdFx0XHRub3RpZnlPYnNlcnZlcnMoJ2NyZWF0ZScsIG5ld1VpZCk7XG5cdFx0XHRyZXR1cm4gbmV3Q29udGFjdDtcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkNvdWxkbid0IGNyZWF0ZVwiLCBlKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLm1vdmVDb250YWN0ID0gZnVuY3Rpb24gKGNvbnRhY3QsIGFkZHJlc3Nib29rKSB7XG5cdFx0aWYgKGNvbnRhY3QuYWRkcmVzc0Jvb2tJZCA9PT0gYWRkcmVzc2Jvb2suZGlzcGxheU5hbWUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Y29udGFjdC5zeW5jVkNhcmQoKTtcblx0XHR2YXIgY2xvbmUgPSBhbmd1bGFyLmNvcHkoY29udGFjdCk7XG5cblx0XHQvLyBjcmVhdGUgdGhlIGNvbnRhY3QgaW4gdGhlIG5ldyB0YXJnZXQgYWRkcmVzc2Jvb2tcblx0XHR0aGlzLmNyZWF0ZShjbG9uZSwgYWRkcmVzc2Jvb2spO1xuXG5cdFx0Ly8gZGVsZXRlIHRoZSBvbGQgb25lXG5cdFx0dGhpcy5kZWxldGUoY29udGFjdCk7XG5cdH07XG5cblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0Y29udGFjdC5zeW5jVkNhcmQoKTtcblxuXHRcdC8vIHVwZGF0ZSBjb250YWN0IG9uIHNlcnZlclxuXHRcdHJldHVybiBEYXZDbGllbnQudXBkYXRlQ2FyZChjb250YWN0LmRhdGEsIHtqc29uOiB0cnVlfSkudGhlbihmdW5jdGlvbih4aHIpIHtcblx0XHRcdHZhciBuZXdFdGFnID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdFVGFnJyk7XG5cdFx0XHRjb250YWN0LnNldEVUYWcobmV3RXRhZyk7XG5cdFx0fSk7XG5cdH07XG5cblx0dGhpcy5kZWxldGUgPSBmdW5jdGlvbihjb250YWN0KSB7XG5cdFx0Ly8gZGVsZXRlIGNvbnRhY3QgZnJvbSBzZXJ2ZXJcblx0XHRyZXR1cm4gRGF2Q2xpZW50LmRlbGV0ZUNhcmQoY29udGFjdC5kYXRhKS50aGVuKGZ1bmN0aW9uKHhocikge1xuXHRcdFx0Y29udGFjdHMucmVtb3ZlKGNvbnRhY3QudWlkKCkpO1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXJzKCdkZWxldGUnLCBjb250YWN0LnVpZCgpKTtcblx0XHR9KTtcblx0fTtcbn0pO1xuIiwiYXBwLnNlcnZpY2UoJ0RhdkNsaWVudCcsIGZ1bmN0aW9uKCkge1xuXHR2YXIgeGhyID0gbmV3IGRhdi50cmFuc3BvcnQuQmFzaWMoXG5cdFx0bmV3IGRhdi5DcmVkZW50aWFscygpXG5cdCk7XG5cdHJldHVybiBuZXcgZGF2LkNsaWVudCh4aHIpO1xufSk7IiwiYXBwLnNlcnZpY2UoJ0RhdlNlcnZpY2UnLCBmdW5jdGlvbihEYXZDbGllbnQpIHtcblx0cmV0dXJuIERhdkNsaWVudC5jcmVhdGVBY2NvdW50KHtcblx0XHRzZXJ2ZXI6IE9DLmxpbmtUb1JlbW90ZUJhc2UoJ2Rhdi9hZGRyZXNzYm9va3MnKSxcblx0XHRhY2NvdW50VHlwZTogJ2NhcmRkYXYnLFxuXHRcdHVzZVByb3ZpZGVkUGF0aDogdHJ1ZVxuXHR9KTtcbn0pO1xuIiwiYXBwLnNlcnZpY2UoJ1NldHRpbmdzU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHR2YXIgc2V0dGluZ3MgPSB7XG5cdFx0YWRkcmVzc0Jvb2tzOiBbXG5cdFx0XHQndGVzdEFkZHInXG5cdFx0XVxuXHR9O1xuXG5cdHRoaXMuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdHNldHRpbmdzW2tleV0gPSB2YWx1ZTtcblx0fTtcblxuXHR0aGlzLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdHJldHVybiBzZXR0aW5nc1trZXldO1xuXHR9O1xuXG5cdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9O1xufSk7XG4iLCJhcHAuc2VydmljZSgndkNhcmRQcm9wZXJ0aWVzU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHQvKipcblx0ICogbWFwIHZDYXJkIGF0dHJpYnV0ZXMgdG8gaW50ZXJuYWwgYXR0cmlidXRlc1xuXHQgKlxuXHQgKiBwcm9wTmFtZToge1xuXHQgKiBcdFx0bXVsdGlwbGU6IFtCb29sZWFuXSwgLy8gaXMgdGhpcyBwcm9wIGFsbG93ZWQgbW9yZSB0aGFuIG9uY2U/IChkZWZhdWx0ID0gZmFsc2UpXG5cdCAqIFx0XHRyZWFkYWJsZU5hbWU6IFtTdHJpbmddLCAvLyBpbnRlcm5hdGlvbmFsaXplZCByZWFkYWJsZSBuYW1lIG9mIHByb3Bcblx0ICogXHRcdHRlbXBsYXRlOiBbU3RyaW5nXSwgLy8gdGVtcGxhdGUgbmFtZSBmb3VuZCBpbiAvdGVtcGxhdGVzL2RldGFpbEl0ZW1zXG5cdCAqIFx0XHRbLi4uXSAvLyBvcHRpb25hbCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIHdoaWNoIG1pZ2h0IGdldCB1c2VkIGJ5IHRoZSB0ZW1wbGF0ZVxuXHQgKiB9XG5cdCAqL1xuXHR0aGlzLnZDYXJkTWV0YSA9IHtcblx0XHRuaWNrbmFtZToge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdOaWNrbmFtZScpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0J1xuXHRcdH0sXG5cdFx0bm90ZToge1xuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdOb3RlcycpLFxuXHRcdFx0dGVtcGxhdGU6ICd0ZXh0YXJlYSdcblx0XHR9LFxuXHRcdHVybDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ1dlYnNpdGUnKSxcblx0XHRcdHRlbXBsYXRlOiAndXJsJ1xuXHRcdH0sXG5cdFx0Y2xvdWQ6IHtcblx0XHRcdG11bHRpcGxlOiB0cnVlLFxuXHRcdFx0cmVhZGFibGVOYW1lOiB0KCdjb250YWN0cycsICdGZWRlcmF0ZWQgQ2xvdWQgSUQnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVx0XHR9LFxuXHRcdGFkcjoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0FkZHJlc3MnKSxcblx0XHRcdHRlbXBsYXRlOiAnYWRyJyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJycsICcnLCAnJywgJycsICcnLCAnJywgJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHRjYXRlZ29yaWVzOiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0dyb3VwcycpLFxuXHRcdFx0dGVtcGxhdGU6ICdncm91cHMnXG5cdFx0fSxcblx0XHRiZGF5OiB7XG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0JpcnRoZGF5JyksXG5cdFx0XHR0ZW1wbGF0ZTogJ2RhdGUnXG5cdFx0fSxcblx0XHRlbWFpbDoge1xuXHRcdFx0bXVsdGlwbGU6IHRydWUsXG5cdFx0XHRyZWFkYWJsZU5hbWU6IHQoJ2NvbnRhY3RzJywgJ0VtYWlsJyksXG5cdFx0XHR0ZW1wbGF0ZTogJ3RleHQnLFxuXHRcdFx0ZGVmYXVsdFZhbHVlOiB7XG5cdFx0XHRcdHZhbHVlOicnLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUksnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdPVEhFUicsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ090aGVyJyl9XG5cdFx0XHRdXG5cdFx0fSxcblx0XHRpbXBwOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnSW5zdGFudCBtZXNzYWdpbmcnKSxcblx0XHRcdHRlbXBsYXRlOiAndGV4dCcsXG5cdFx0XHRkZWZhdWx0VmFsdWU6IHtcblx0XHRcdFx0dmFsdWU6WycnXSxcblx0XHRcdFx0bWV0YTp7dHlwZTpbJ0hPTUUnXX1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdHtpZDogJ0hPTUUnLCBuYW1lOiB0KCdjb250YWN0cycsICdIb21lJyl9LFxuXHRcdFx0XHR7aWQ6ICdXT1JLJywgbmFtZTogdCgnY29udGFjdHMnLCAnV29yaycpfSxcblx0XHRcdFx0e2lkOiAnT1RIRVInLCBuYW1lOiB0KCdjb250YWN0cycsICdPdGhlcicpfVxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0dGVsOiB7XG5cdFx0XHRtdWx0aXBsZTogdHJ1ZSxcblx0XHRcdHJlYWRhYmxlTmFtZTogdCgnY29udGFjdHMnLCAnUGhvbmUnKSxcblx0XHRcdHRlbXBsYXRlOiAndGVsJyxcblx0XHRcdGRlZmF1bHRWYWx1ZToge1xuXHRcdFx0XHR2YWx1ZTpbJyddLFxuXHRcdFx0XHRtZXRhOnt0eXBlOlsnSE9NRSxWT0lDRSddfVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e2lkOiAnSE9NRSxWT0lDRScsIG5hbWU6IHQoJ2NvbnRhY3RzJywgJ0hvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUkssVk9JQ0UnLCBuYW1lOiB0KCdjb250YWN0cycsICdXb3JrJyl9LFxuXHRcdFx0XHR7aWQ6ICdDRUxMJywgbmFtZTogdCgnY29udGFjdHMnLCAnTW9iaWxlJyl9LFxuXHRcdFx0XHR7aWQ6ICdGQVgnLCBuYW1lOiB0KCdjb250YWN0cycsICdGYXgnKX0sXG5cdFx0XHRcdHtpZDogJ0hPTUUsRkFYJywgbmFtZTogdCgnY29udGFjdHMnLCAnRmF4IGhvbWUnKX0sXG5cdFx0XHRcdHtpZDogJ1dPUkssRkFYJywgbmFtZTogdCgnY29udGFjdHMnLCAnRmF4IHdvcmsnKX0sXG5cdFx0XHRcdHtpZDogJ1BBR0VSJywgbmFtZTogdCgnY29udGFjdHMnLCAnUGFnZXInKX0sXG5cdFx0XHRcdHtpZDogJ1ZPSUNFJywgbmFtZTogdCgnY29udGFjdHMnLCAnVm9pY2UnKX1cblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0dGhpcy5maWVsZE9yZGVyID0gW1xuXHRcdCdvcmcnLFxuXHRcdCd0aXRsZScsXG5cdFx0J3RlbCcsXG5cdFx0J2VtYWlsJyxcblx0XHQnYWRyJyxcblx0XHQnaW1wcCcsXG5cdFx0J25pY2snLFxuXHRcdCdiZGF5Jyxcblx0XHQndXJsJyxcblx0XHQnbm90ZScsXG5cdFx0J2NhdGVnb3JpZXMnLFxuXHRcdCdyb2xlJ1xuXHRdO1xuXG5cdHRoaXMuZmllbGREZWZpbml0aW9ucyA9IFtdO1xuXHRmb3IgKHZhciBwcm9wIGluIHRoaXMudkNhcmRNZXRhKSB7XG5cdFx0dGhpcy5maWVsZERlZmluaXRpb25zLnB1c2goe2lkOiBwcm9wLCBuYW1lOiB0aGlzLnZDYXJkTWV0YVtwcm9wXS5yZWFkYWJsZU5hbWUsIG11bHRpcGxlOiAhIXRoaXMudkNhcmRNZXRhW3Byb3BdLm11bHRpcGxlfSk7XG5cdH1cblxuXHR0aGlzLmZhbGxiYWNrTWV0YSA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0ZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHJpbmcpIHsgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTsgfVxuXHRcdHJldHVybiB7XG5cdFx0XHRuYW1lOiAndW5rbm93bi0nICsgcHJvcGVydHksXG5cdFx0XHRyZWFkYWJsZU5hbWU6IGNhcGl0YWxpemUocHJvcGVydHkpLFxuXHRcdFx0dGVtcGxhdGU6ICdoaWRkZW4nLFxuXHRcdFx0bmVjZXNzaXR5OiAnb3B0aW9uYWwnXG5cdFx0fTtcblx0fTtcblxuXHR0aGlzLmdldE1ldGEgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdHJldHVybiB0aGlzLnZDYXJkTWV0YVtwcm9wZXJ0eV0gfHwgdGhpcy5mYWxsYmFja01ldGEocHJvcGVydHkpO1xuXHR9O1xuXG59KTtcbiIsImFwcC5maWx0ZXIoJ0pTT04ydkNhcmQnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG5cdFx0cmV0dXJuIHZDYXJkLmdlbmVyYXRlKGlucHV0KTtcblx0fTtcbn0pOyIsImFwcC5maWx0ZXIoJ2NvbnRhY3RDb2xvcicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHR2YXIgY29sb3JzID0gW1xuXHRcdFx0XHQnIzAwMWYzZicsXG5cdFx0XHRcdCcjMDA3NEQ5Jyxcblx0XHRcdFx0JyMzOUNDQ0MnLFxuXHRcdFx0XHQnIzNEOTk3MCcsXG5cdFx0XHRcdCcjMkVDQzQwJyxcblx0XHRcdFx0JyNGRjg1MUInLFxuXHRcdFx0XHQnI0ZGNDEzNicsXG5cdFx0XHRcdCcjODUxNDRiJyxcblx0XHRcdFx0JyNGMDEyQkUnLFxuXHRcdFx0XHQnI0IxMERDOSdcblx0XHRcdF0sIGFzY2lpU3VtID0gMDtcblx0XHRmb3IodmFyIGkgaW4gaW5wdXQpIHtcblx0XHRcdGFzY2lpU3VtICs9IGlucHV0LmNoYXJDb2RlQXQoaSk7XG5cdFx0fVxuXHRcdHJldHVybiBjb2xvcnNbYXNjaWlTdW0gJSBjb2xvcnMubGVuZ3RoXTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignY29udGFjdEdyb3VwRmlsdGVyJywgZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uIChjb250YWN0cywgZ3JvdXApIHtcblx0XHRpZiAodHlwZW9mIGNvbnRhY3RzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGNvbnRhY3RzO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIGdyb3VwID09PSAndW5kZWZpbmVkJyB8fCBncm91cC50b0xvd2VyQ2FzZSgpID09PSB0KCdjb250YWN0cycsICdBbGwgY29udGFjdHMnKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRyZXR1cm4gY29udGFjdHM7XG5cdFx0fVxuXHRcdHZhciBmaWx0ZXIgPSBbXTtcblx0XHRpZiAoY29udGFjdHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoY29udGFjdHNbaV0uY2F0ZWdvcmllcygpLmluZGV4T2YoZ3JvdXApID49IDApIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChjb250YWN0c1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZpbHRlcjtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcignZmllbGRGaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRyZXR1cm4gZnVuY3Rpb24gKGZpZWxkcywgY29udGFjdCkge1xuXHRcdGlmICh0eXBlb2YgZmllbGRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiBjb250YWN0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIGZpZWxkcztcblx0XHR9XG5cdFx0dmFyIGZpbHRlciA9IFtdO1xuXHRcdGlmIChmaWVsZHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKGZpZWxkc1tpXS5tdWx0aXBsZSApIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChfLmlzVW5kZWZpbmVkKGNvbnRhY3QuZ2V0UHJvcGVydHkoZmllbGRzW2ldLmlkKSkpIHtcblx0XHRcdFx0XHRmaWx0ZXIucHVzaChmaWVsZHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmaWx0ZXI7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2ZpcnN0Q2hhcmFjdGVyJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuXHRcdHJldHVybiBpbnB1dC5jaGFyQXQoMCk7XG5cdH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ29yZGVyRGV0YWlsSXRlbXMnLCBmdW5jdGlvbih2Q2FyZFByb3BlcnRpZXNTZXJ2aWNlKSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0cmV0dXJuIGZ1bmN0aW9uKGl0ZW1zLCBmaWVsZCwgcmV2ZXJzZSkge1xuXG5cdFx0dmFyIGZpbHRlcmVkID0gW107XG5cdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRmaWx0ZXJlZC5wdXNoKGl0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZpZWxkT3JkZXIgPSBhbmd1bGFyLmNvcHkodkNhcmRQcm9wZXJ0aWVzU2VydmljZS5maWVsZE9yZGVyKTtcblx0XHQvLyByZXZlcnNlIHRvIG1vdmUgY3VzdG9tIGl0ZW1zIHRvIHRoZSBlbmQgKGluZGV4T2YgPT0gLTEpXG5cdFx0ZmllbGRPcmRlci5yZXZlcnNlKCk7XG5cblx0XHRmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRpZihmaWVsZE9yZGVyLmluZGV4T2YoYVtmaWVsZF0pIDwgZmllbGRPcmRlci5pbmRleE9mKGJbZmllbGRdKSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblx0XHRcdGlmKGZpZWxkT3JkZXIuaW5kZXhPZihhW2ZpZWxkXSkgPiBmaWVsZE9yZGVyLmluZGV4T2YoYltmaWVsZF0pKSB7XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAwO1xuXHRcdH0pO1xuXG5cdFx0aWYocmV2ZXJzZSkgZmlsdGVyZWQucmV2ZXJzZSgpO1xuXHRcdHJldHVybiBmaWx0ZXJlZDtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndG9BcnJheScsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKCEob2JqIGluc3RhbmNlb2YgT2JqZWN0KSkgcmV0dXJuIG9iajtcblx0XHRyZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2YWwsICcka2V5Jywge3ZhbHVlOiBrZXl9KTtcblx0XHR9KTtcblx0fTtcbn0pO1xuIiwiYXBwLmZpbHRlcigndkNhcmQySlNPTicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcblx0XHRyZXR1cm4gdkNhcmQucGFyc2UoaW5wdXQpO1xuXHR9O1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
