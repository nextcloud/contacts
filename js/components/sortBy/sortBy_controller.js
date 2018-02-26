angular.module('contactsApp')
.controller('sortbyCtrl', function(SortByService) {
	var ctrl = this;

	var sortText = t('contacts', 'Sort by');
	ctrl.sortText = sortText;

	var sortList = SortByService.getSortByList();
	ctrl.sortList = sortList;

	ctrl.defaultOrder = SortByService.getSortByKey();

	ctrl.updateSortBy = function() {
		SortByService.setSortBy(ctrl.defaultOrder);
	};
});
