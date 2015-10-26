HBS := $(shell find lib/template/ -name "*.hbs")
JS := $(shell find lib/ -name "*.js")

SABRE_DAV_VERSION=2.0.1
SABRE_DAV_RELEASE=sabredav-$(SABRE_DAV_VERSION)
SABRE_DAV_ZIPBALL=$(SABRE_DAV_RELEASE).zip

dav.zip: dav.js dav.min.js dav.js.map
	zip dav dav.js dav.js.map dav.min.js

dav.min.js dav.js.map: dav.js node_modules
	./node_modules/.bin/uglifyjs dav.js \
		--lint \
		--screw-ie8 \
		--output ./dav.min.js \
		--source-map ./dav.js.map

dav.js: build node_modules
	rm -rf dav.js /tmp/dav.js
	./node_modules/.bin/browserify --standalone dav ./build/index.js > /tmp/dav.js
	cat lib/polyfill/*.js /tmp/dav.js > dav.js

build: $(JS) $(HBS) node_modules
	rm -rf build/
	./node_modules/.bin/babel lib \
		--modules common \
		--out-dir build \
		--stage 4

node_modules: package.json
	npm install

.PHONY: clean
clean:
	rm -rf *.zip SabreDAV build coverage dav.* node_modules test/integration/server/SabreDAV

.PHONY: test
test: test-unit test-integration

.PHONY: test-unit
test-unit: node_modules
	./node_modules/.bin/mocha test/unit

.PHONY: test-integration
test-integration: node_modules test/integration/server/SabreDAV
	./node_modules/.bin/mocha test/integration

.PHONY: toc
toc: node_modules
	./node_modules/.bin/doctoc CONTRIBUTING.md
	./node_modules/.bin/doctoc HISTORY.md
	./node_modules/.bin/doctoc README.md

test/integration/server/SabreDAV: SabreDAV
	cp -r SabreDAV test/integration/server/SabreDAV
	cd test/integration/server/SabreDAV && cp ../calendarserver.php calendarserver.php

SabreDAV:
	wget -O $(SABRE_DAV_ZIPBALL) https://github.com/fruux/sabre-dav/releases/download/$(SABRE_DAV_VERSION)/$(SABRE_DAV_ZIPBALL)
	unzip -q $(SABRE_DAV_ZIPBALL)
