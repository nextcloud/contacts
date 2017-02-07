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
			var valueA = a[sortPredicate];
			if (angular.isFunction(valueA)) {
				valueA = a[sortPredicate]();
			}
			var valueB = b[sortPredicate];
			if (angular.isFunction(valueB)) {
				valueB = b[sortPredicate]();
			}

			if (angular.isString(valueA)) {
				return !reverseOrder ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
			}

			if (angular.isNumber(valueA) || typeof valueA === 'boolean') {
				return !reverseOrder ? valueA - valueB : valueB - valueA;
			}

			if (angular.isArray(valueA)) {
				if (valueA[0] === valueB[0]) {
					return !reverseOrder ? valueA[1].localeCompare(valueB[1]) : valueB[1].localeCompare(valueA[1]);
				}
				return !reverseOrder ? valueA[0].localeCompare(valueB[0]) : valueB[0].localeCompare(valueA[0]);
			}

			return 0;
		});

		return arrayCopy;
	};
}]);
