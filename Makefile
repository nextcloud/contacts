# SPDX-FileCopyrightText: 2016-2024 Nextcloud GmbH and Nextcloud contributors
# SPDX-FileCopyrightText: 2015-2016 ownCloud, Inc. 
# SPDX-License-Identifier: AGPL-3.0-or-later

app_name="contacts"
project_folder="nextcloud-contacts"

project_directory=$(CURDIR)/../$(project_folder)
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

# Builds the source package for the app store, ignores php and js tests
# command: make version={version_number} buildapp
# concatenate cd, ls and tar commands with '&&' otherwise the script context will remain the root instead of build
.PHONY: buildapp
buildapp:
	make check-version

	version=$(version)

	make clean-buildapp

	mkdir -p $(appstore_build_directory)
	cd build &&	\
	ln -s ../ $(app_name) && \
	tar cvzfh $(appstore_build_directory)/$(app_name)_$(version).tar.gz \
	--exclude="$(app_name)/build" \
	--exclude="$(app_name)/release" \
	--exclude="$(app_name)/src" \
	--exclude="$(app_name)/vite.config.js" \
	--exclude="$(app_name)/*.log" \
	--exclude="$(app_name)/composer.*" \
	--exclude="$(app_name)/node_modules" \
	--exclude="$(app_name)/js/node_modules" \
	--exclude="$(app_name)/js/tests" \
	--exclude="$(app_name)/js/test" \
	--exclude="$(app_name)/js/*.log" \
	--exclude="$(app_name)/js/package.json" \
	--exclude="$(app_name)/js/bower.json" \
	--exclude="$(app_name)/js/karma.*" \
	--exclude="$(app_name)/js/protractor.*" \
	--exclude="$(app_name)/package.json" \
	--exclude="$(app_name)/bower.json" \
	--exclude="$(app_name)/karma.*" \
	--exclude="$(app_name)/protractor\.*" \
	--exclude="$(app_name)/.*" \
	--exclude="$(app_name)/js/.*" \
	--exclude-vcs \
	$(app_name) && \
	rm $(app_name)

clean-buildapp:
	rm -rf ${appstore_build_directory}

check-version:
	@if [ "${version}" = "" ]; then\
		echo "Error: You must set version, eg. make -e version=v0.0.1 buildapp";\
		exit 1;\
	fi