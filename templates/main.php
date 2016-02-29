<?php
// angular + components
script('contacts', 'vendor/angular/angular');
script('contacts', 'vendor/angular-route/angular-route');
script('contacts', 'vendor/angular-uuid4/angular-uuid4');
script('contacts', 'vendor/angular-cache/dist/angular-cache');

// DAV libraries
script('contacts', 'dav/dav');
script('contacts', 'vendor/vcard/src/vcard');

// compiled version of app javascript
script('contacts', 'public/script');

script('contacts', 'vendor/angular-bootstrap/ui-bootstrap.min');
script('contacts', 'vendor/angular-bootstrap/ui-bootstrap-tpls.min');

// all styles
style('contacts', 'public/style');

?>

<div id="app" ng-app="contactsApp">
	<div id="app-navigation">

		<ul groupList></ul>

		<div id="app-settings">
			<div id="app-settings-header">
				<button class="settings-button"
						data-apps-slide-toggle="#app-settings-content"
				>Settings</button>
			</div>
			<div id="app-settings-content">
				<addressBookList></addressBookList>
			</div>
		</div>
	</div>

	<div id="app-content">
		<div class="app-content-list">
			<contactlist></contactlist>
		</div>
		<div class="app-content-detail" ng-view></div>
	</div>
</div>
