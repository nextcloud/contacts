app.filter('JSON2vCard', function() {
	return function(input) {
		return vCard.generate(input);
	};
});