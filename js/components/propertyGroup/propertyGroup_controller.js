angular.module('contactsApp')
.controller('propertyGroupCtrl', function(vCardPropertiesService) {
	var ctrl = this;

	ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);

	this.isHidden = function() {
		return ctrl.meta.hasOwnProperty('hidden') && ctrl.meta.hidden === true;
	};

	this.getIconClass = function() {
		return 'icon-contacts-dark';
	};

	this.getReadableName = function() {
		return ctrl.meta.readableName;
	};
});
