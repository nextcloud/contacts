angular.module('contactsApp')
.filter('localeOrderBy', [function () {
	return function (array, sortPredicate, reverseOrder) {
		if (!Array.isArray(array)) return array;
		if (!sortPredicate) return array;

		var arrayCopy = [];
		angular.forEach(array, function (item) {
			arrayCopy.push(item);
		});

		arrayCopy.sort(function (a, b) {


			// Did we pass multiple sorting options? If not, create an array anyway.
			sortPredicate = angular.isArray(sortPredicate) ? sortPredicate: [sortPredicate];
			// Let's test the first sort and continue if no sort occured
			for(var i=0; i<sortPredicate.length; i++) {
				var sortBy = sortPredicate[i];

				var valueA = a[sortBy];
				if (angular.isFunction(valueA)) {
					valueA = a[sortBy]();
				}
				var valueB = b[sortBy];
				if (angular.isFunction(valueB)) {
					valueB = b[sortBy]();
				}

				// Start sorting
				if (angular.isString(valueA)) {
					if(valueA !== valueB) {
						return reverseOrder ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
					}
				}

				if (angular.isNumber(valueA) || typeof valueA === 'boolean') {
					if(valueA !== valueB) {
						return reverseOrder ? valueB - valueA : valueA - valueB;
					}
				}
			}

			return 0;
		});

		return arrayCopy;
	};
}]);
