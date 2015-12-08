app.service('SettingsService', function() {

  var settings = {
    addressBooks: [
      "Kontakte"
    ]
  };

	this.set = function(key, value) {
    settings[key] = value;
  };

  this.get = function(key) {
    return settings[key];
  };

  this.getAll = function() {
    return settings;
  };
});
