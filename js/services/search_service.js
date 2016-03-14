app.service('SearchService', function($rootScope) {
	var searchTerm = '';

	var observerCallbacks = [];

	this.registerObserverCallback = function(callback) {
		observerCallbacks.push(callback);
	};

	var notifyObservers = function(eventName) {
		var ev = {
			event:eventName,
			searchTerm:this.searchTerm
		};
		angular.forEach(observerCallbacks, function(callback) {
			callback(ev);
		});
	};

	SearchProxy = {
		attach: function(search) {
			search.setFilter('contacts', this.filterProxy);
		},
		filterProxy: function(query) {
			console.log(query);
			searchTerm = query;
			$rootScope.$apply();
		}
	};

	this.getSearchTerm = function() {
		return searchTerm;
	};

	this.cleanSearch = function() {
		searchTerm = '';
	};

	if (!_.isUndefined(OC.Plugins)) {
		OC.Plugins.register('OCA.Search', SearchProxy);
	}

	if (!_.isUndefined($('.searchbox'))) {
		$('.searchbox')[0].addEventListener('keypress', function(e) {
			if(e.keyCode === 13) {
				notifyObservers('enterOnSearch');
			}
		});
	}
});
