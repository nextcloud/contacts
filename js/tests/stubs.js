before(function() {
	window.t = function(a, b) { return b; };

	window.OC = {
		linkToRemoteBase: function(url) {
			return '/base' + url;
		}
	};
});
