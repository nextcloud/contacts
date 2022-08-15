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
	krankerl package
