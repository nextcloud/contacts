app.directive('groupModel', ['$filter', function($filter){
    return{
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$formatters.push(function(value) {
                return value.split(',');
            });
            ngModel.$parsers.push(function(value) {
                return value.join(",");
            });
        }
    };
}]);
