app.directive('dateModel', ['$filter', function($filter){
    return{
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attr, ngModel) {
            ngModel.$formatters.push(function(value) {
                return new Date(value);
            });
            ngModel.$parsers.push(function(value) {
                return $filter('date')(value, 'yyyy-MM-dd');
            });
        }
    };
}]);
