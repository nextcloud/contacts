<?php
// angular + components
script('contacts', 'vendor/angular/angular');
script('contacts', 'vendor/angular-route/angular-route');
script('contacts', 'vendor/angular-uuid4/angular-uuid4');
script('contacts', 'vendor/angular-cache/dist/angular-cache');
script('contacts', 'vendor/angular-sanitize/angular-sanitize');
script('contacts', 'vendor/ui-select/dist/select');
script('contacts', 'vendor/angular-click-outside/clickoutside.directive');

// DAV libraries
script('contacts', 'dav/dav');
script('contacts', 'vendor/vcard/src/vcard');

// compiled version of app javascript
script('contacts', 'public/script');

script('contacts', 'vendor/angular-bootstrap/ui-bootstrap.min');
script('contacts', 'vendor/angular-bootstrap/ui-bootstrap-tpls.min');
script('contacts', 'vendor/jquery-timepicker/jquery.ui.timepicker');

// all styles
style('contacts', 'public/style');
vendor_style('select2/select2');
?>

<div id="app" ng-app="contactsApp">
	<div id="app-navigation">
		<newContactButton></newContactButton>
		<ul groupList></ul>

		<div id="app-settings">
			<div id="app-settings-header">
				<button class="settings-button"
						data-apps-slide-toggle="#app-settings-content">
					<?php p($l->t('Settings'));?>
				</button>
			</div>
			<div id="app-settings-content">
				<addressBookList></addressBookList>
				<contactImport></contactImport>
				<sortBy></sortBy>
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
