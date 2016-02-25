app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', function($templateRequest, vCardPropertiesService) {
	var ctrl = this;

    ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);
    ctrl.t = {
        country : t('contactsrework', 'Country'),
    };

    ctrl.availableOptions = ctrl.meta.options || [];
    if (!_.isUndefined(ctrl.data.meta)) {
        if (!ctrl.availableOptions.some(function(e){ return e.id === ctrl.data.meta.type[0];})) {
            ctrl.availableOptions = ctrl.availableOptions.concat([{id: ctrl.data.meta.type[0], name: ctrl.data.meta.type[0]}]);
        }
    }

    console.log(ctrl);

    ctrl.getTemplate = function() {
        var templateUrl = OC.linkTo('contactsrework', 'templates/detailItems/'+ ctrl.meta.template +'.html');
        return $templateRequest(templateUrl);
    };
}]);
