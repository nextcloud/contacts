<?php
// angular + components
script('contacts', 'vendor/angular/angular.min');
script('contacts', 'vendor/angular-route/angular-route.min');
script('contacts', 'vendor/angular-uuid4/angular-uuid4.min');
script('contacts', 'vendor/angular-cache/angular-cache.min');
script('contacts', 'vendor/angular-sanitize/angular-sanitize.min');
script('contacts', 'vendor/ui-select/select');
script('contacts', 'vendor/angular-click-outside/clickoutside.directive');
script('contacts', 'vendor/ngclipboard/ngclipboard.min');

script('contacts', 'contacts-inject-14');

// DAV libraries
script('contacts', 'dav/dav');
script('contacts', 'vendor/vcard/vcard');

// compiled version of app javascript
script('contacts', 'public/script');

script('contacts', 'vendor/ui-bootstrap/ui-bootstrap');
script('contacts', 'vendor/ui-bootstrap/ui-bootstrap-tpls');
script('contacts', 'vendor/jquery-timepicker/jquery.timepicker');

// all styles
style('contacts', 'style');
style('contacts', 'vendor/ui-select/select.min');
?>
<div id="app-navigation">
	<div id="importscreen-sidebar-block" class="icon-loading" ng-show="$root.importing"></div>
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
			<addressBookList class="settings-section"></addressBookList>
			<contactImport class="settings-section"></contactImport>
			<sortBy class="settings-section"></sortBy>
		</div>
	</div>
</div>

<div id="app-content">
	<div id="app-content-wrapper">
		<div class="app-content-list" contactlist>
		</div>
		<div class="app-content-details" ng-view></div>
		<importscreen id="importscreen-wrapper" ng-show="ctrl.importing"></importscreen>
	</div>
</div>
