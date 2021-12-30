# This file is licensed under the Affero General Public License version 3 or
# later. See the COPYING file.

app_name=$(notdir $(CURDIR))
project_directory=$(CURDIR)/../$(app_name)
appstore_build_directory=$(CURDIR)/build/artifacts
appstore_package_name=$(appstore_build_directory)/$(app_name)

all: appstore

# Cleaning
clean:
	rm -rf js

clean-dev:
	rm -rf node_modules
	rm -rf vendor

# Builds the source package for the app store, ignores php and js tests
appstore:
	rm -rf $(appstore_build_directory)
	mkdir -p $(appstore_build_directory)
	tar cvzf $(appstore_package_name).tar.gz \
	--exclude-vcs \
	$(project_directory)/appinfo \
	$(project_directory)/css \
	$(project_directory)/img \
	$(project_directory)/l10n \
	$(project_directory)/lib \
	$(project_directory)/templates \
	$(project_directory)/js \
	$(project_directory)/COPYING \
	$(project_directory)/CHANGELOG.md
