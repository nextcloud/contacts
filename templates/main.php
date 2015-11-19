<?php
script('contactsrework', 'vendor/angular/angular');
script('contactsrework', 'vendor/angular-ui-router/release/angular-ui-router');
script('contactsrework', 'vendor/dav/dav');
script('contactsrework', 'vendor/vcard/src/vcard');
script('contactsrework', 'public/script');
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
		<div id="app-sidebar" ui-view="sidebar"></div>
		<div id="app-content-wrapper" ui-view></div>
	</div>
</div>
