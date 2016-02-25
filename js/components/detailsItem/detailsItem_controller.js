app.controller('detailsItemCtrl', ['$templateRequest', 'vCardPropertiesService', function($templateRequest, vCardPropertiesService) {
	var ctrl = this;

    ctrl.meta = vCardPropertiesService.getMeta(ctrl.name);

    console.log(ctrl);

    ctrl.getTemplate = function() {
        var templateUrl = OC.linkTo('contactsrework', 'templates/detailItems/'+ ctrl.meta.template +'.html');
        return $templateRequest(templateUrl);
    };
}]);
