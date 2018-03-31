angular.module('contactsApp')
.controller('propertyGroupCtrl', function(vCardPropertiesService) {
	var ctrl = this;

	ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);

	this.isHidden = function() {
		return ctrl.meta.hasOwnProperty('hidden') && ctrl.meta.hidden === true;
	};

	this.getIconClass = function() {
		return ctrl.meta.icon || 'icon-contacts-dark';
	};

	this.getInfoClass = function() {
		if (ctrl.meta.hasOwnProperty('info')) {
			return 'icon-info';

		}
	};

	this.getInfoText = function() {
		return ctrl.meta.info;
	};

	this.getReadableName = function() {
		return ctrl.meta.readableName;
	};
});
