app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', function($templateRequest, vCardPropertiesService) {
	var ctrl = this;

    ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
    ctrl.type = undefined;
    ctrl.t = {
        poBox : t('contacts', 'Post Office Box'),
        postalCode : t('contacts', 'Postal Code'),
        city : t('contacts', 'City'),
        state : t('contacts', 'State or province'),
        country : t('contacts', 'Country'),
        address: t('contacts', 'Address')
    };

    ctrl.availableOptions = ctrl.meta.options || [];
    if (!_.isUndefined(ctrl.data) && !_.isUndefined(ctrl.data.meta)) {
        ctrl.type = ctrl.data.meta.type[0];
        if (!ctrl.availableOptions.some(function(e){ return e.id === ctrl.data.meta.type[0];})) {
            ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.data.meta.type[0], name: ctrl.data.meta.type[0]}]);
        }
    }

    ctrl.changeType = function (val) {
        ctrl.data.meta = ctrl.data.meta || {};
        ctrl.data.meta.type = ctrl.data.meta.type || [];
        ctrl.data.meta.type[0] = val;
        ctrl.model.updateContact();
    };

    ctrl.getTemplate = function() {
        var templateUrl = OC.linkTo('contacts', 'templates/detailItems/'+ ctrl.meta.template +'.html');
        return $templateRequest(templateUrl);
    };

    ctrl.deleteField = function () {
        ctrl.model.deleteField(ctrl.name, ctrl.data);
		ctrl.model.updateContact();
    };
}]);
