<?php
// angular + components
script('contactsrework', 'vendor/angular/angular');
script('contactsrework', 'vendor/angular-route/angular-route');
script('contactsrework', 'vendor/angular-uuid4/angular-uuid4');
script('contactsrework', 'vendor/angular-cache/dist/angular-cache');

// DAV libraries
script('contactsrework', 'dav/dav');
script('contactsrework', 'vendor/vcard/src/vcard');

// compiled version of app javascript
script('contactsrework', 'public/script');

// all styles
style('contactsrework', 'public/style');
?>

<div id="app" ng-app="contactsApp">
	<div id="app-navigation">

		<ul addressBookList></ul>

		<div id="app-settings">
			<div id="app-settings-header">
				<button class="settings-button"
						data-apps-slide-toggle="#app-settings-content"
				></button>
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
