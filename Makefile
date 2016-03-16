# Makefile for building the project

app_name=contacts
project_dir=$(CURDIR)/../$(app_name)
build_dir=$(CURDIR)/build/artifacts
appstore_dir=$(build_dir)/appstore
source_dir=$(build_dir)/source
package_name=$(app_name)

all: appstore

clean:
	rm -rf $(build_dir)

appstore: appstore_package

appstore_package: clean
	mkdir -p $(appstore_dir)
	tar cvzf $(appstore_dir)/$(package_name).tar.gz \
	--exclude-vcs \
	$(project_dir)/appinfo \
	$(project_dir)/controller \
	$(project_dir)/css \
	$(project_dir)/img \
	$(project_dir)/l10n \
	$(project_dir)/templates \
	$(project_dir)/js/public \
	$(project_dir)/js/dav/dav.js \
	$(project_dir)/js/vendor/angular/angular.js \
	$(project_dir)/js/vendor/angular-route/angular-route.js \
	$(project_dir)/js/vendor/angular-cache/dist/angular-cache.js \
	$(project_dir)/js/vendor/angular-uuid4/angular-uuid4.js \
	$(project_dir)/js/vendor/vcard/src/vcard.js \
	$(project_dir)/js/vendor/angular-bootstrap/ui-bootstrap.min.js \
	$(project_dir)/js/vendor/angular-bootstrap/ui-bootstrap-tpls.min.js \
	$(project_dir)/js/vendor/angular-sanitize/angular-sanitize.js \
	$(project_dir)/js/vendor/ui-select/dist/select.js \
	$(project_dir)/js/vendor/jquery-timepicker/jquery.ui.timepicker.js
