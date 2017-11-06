angular.module('contactsApp')
.controller('detailsItemCtrl', function($templateRequest, $filter, vCardPropertiesService, ContactService) {
	var ctrl = this;

	ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
	ctrl.type = undefined;
	ctrl.isPreferred = false;
	ctrl.t = {
		poBox : t('contacts', 'Post office box'),
		postalCode : t('contacts', 'Postal code'),
		city : t('contacts', 'City'),
		state : t('contacts', 'State or province'),
		country : t('contacts', 'Country'),
		address: t('contacts', 'Address'),
		newGroup: t('contacts', '(new group)'),
		familyName: t('contacts', 'Last name'),
		firstName: t('contacts', 'First name'),
		additionalNames: t('contacts', 'Additional names'),
		honorificPrefix: t('contacts', 'Prefix'),
		honorificSuffix: t('contacts', 'Suffix'),
		delete: t('contacts', 'Delete')
	};

	ctrl.availableOptions = ctrl.meta.options || [];
	if (!_.isUndefined(ctrl.data) && !_.isUndefined(ctrl.data.meta) && !_.isUndefined(ctrl.data.meta.type)) {
		// parse type of the property
		var array = ctrl.data.meta.type[0].split(',');
		array = array.map(function (elem) {
			return elem.trim().replace(/\/+$/, '').replace(/\\+$/, '').trim().toUpperCase();
		});
		// the pref value is handled on its own so that we can add some favorite icon to the ui if we want
		if (array.indexOf('PREF') >= 0) {
			ctrl.isPreferred = true;
			array.splice(array.indexOf('PREF'), 1);
		}
		// simply join the upper cased types together as key
		ctrl.type = array.join(',');
		var displayName = array.map(function (element) {
			return element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
		}).join(' ');
		// in case the type is not yet in the default list of available options we add it
		if (!ctrl.availableOptions.some(function(e) { return e.id === ctrl.type; } )) {
			ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.type, name: displayName}]);
		}

		// Remove duplicate entry
		ctrl.availableOptions = _.uniq(ctrl.availableOptions, function(option) { return option.name; });
		if (ctrl.availableOptions.filter(function(option) { return option.id === ctrl.type; }).length === 0) {
			// Our default value has been thrown out by the uniq function, let's find a replacement
			var optionName = ctrl.meta.options.filter(function(option) { return option.id === ctrl.type; })[0].name;
			ctrl.type = ctrl.availableOptions.filter(function(option) { return option.name === optionName; })[0].id;
			// We don't want to override the default keys. Compatibility > standardization
			// ctrl.data.meta.type[0] = ctrl.type;
			// ctrl.model.updateContact();
		}
	}
	if (!_.isUndefined(ctrl.data) && !_.isUndefined(ctrl.data.namespace)) {
		if (!_.isUndefined(ctrl.contact.props['X-ABLABEL'])) {
			var val = _.find(this.contact.props['X-ABLABEL'], function(x) { return x.namespace === ctrl.data.namespace; });
			ctrl.type = val.value.toUpperCase();
			if (!_.isUndefined(val)) {
				// in case the type is not yet in the default list of available options we add it
				if (!ctrl.availableOptions.some(function(e) { return e.id === val.value; } )) {
					ctrl.availableOptions = ctrl.availableOptions.concat([{id: val.value.toUpperCase(), name: val.value.toUpperCase()}]);
				}
			}
		}
	}

	ctrl.availableGroups = [];

	ContactService.getGroups().then(function(groups) {
		ctrl.availableGroups = _.unique(groups);
	});

	ctrl.changeType = function (val) {
		if (ctrl.isPreferred) {
			val += ',PREF';
		}
		ctrl.data.meta = ctrl.data.meta || {};
		ctrl.data.meta.type = ctrl.data.meta.type || [];
		ctrl.data.meta.type[0] = val;
		ContactService.queueUpdate(ctrl.contact);
	};

	ctrl.dateInputChanged = function () {
		ctrl.data.meta = ctrl.data.meta || {};

		var match = ctrl.data.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (match) {
			ctrl.data.meta.value = [];
		} else {
			ctrl.data.meta.value = ctrl.data.meta.value || [];
			ctrl.data.meta.value[0] = 'text';
		}
		ContactService.queueUpdate(ctrl.contact);
	};

	ctrl.updateDetailedName = function () {
		var fn = '';
		if (ctrl.data.value[3]) {
			fn += ctrl.data.value[3] + ' ';
		}
		if (ctrl.data.value[1]) {
			fn += ctrl.data.value[1] + ' ';
		}
		if (ctrl.data.value[2]) {
			fn += ctrl.data.value[2] + ' ';
		}
		if (ctrl.data.value[0]) {
			fn += ctrl.data.value[0] + ' ';
		}
		if (ctrl.data.value[4]) {
			fn += ctrl.data.value[4];
		}

		ctrl.contact.fullName(fn);
		ContactService.queueUpdate(ctrl.contact);
	};

	ctrl.updateContact = function() {
		ContactService.queueUpdate(ctrl.contact);
	};

	ctrl.getTemplate = function() {
		var templateUrl = OC.linkTo('contacts', 'templates/detailItems/' + ctrl.meta.template + '.html');
		return $templateRequest(templateUrl);
	};

	ctrl.deleteField = function () {
		ctrl.contact.removeProperty(ctrl.name, ctrl.data);
		ContactService.queueUpdate(ctrl.contact);
	};
});
