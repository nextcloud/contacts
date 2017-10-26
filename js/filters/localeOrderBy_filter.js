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

			// Did we pass multiple sorting options? If not, create an array abyway.
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
				console.log(sortBy, valueA, valueB);
				if (angular.isString(valueA)) {
					if(valueA !== valueB) {
						return !reverseOrder ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
					}
				}

				if (angular.isNumber(valueA) || typeof valueA === 'boolean') {
					if(valueA !== valueB) {
						return !reverseOrder ? valueA - valueB : valueB - valueA;
					}
				}

				if (angular.isArray(valueA)) {
					if (valueA[0] === valueB[0]) {
						if (valueA[1] !== valueB[1]) {
							return !reverseOrder ? valueA[1].localeCompare(valueB[1]) : valueB[1].localeCompare(valueA[1]);
						}
					}
					return !reverseOrder ? valueA[0].localeCompare(valueB[0]) : valueB[0].localeCompare(valueA[0]);
				}
			}
			return 0;
		});

		return arrayCopy;
	};
}]);
