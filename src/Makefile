# Makefile for common tasks around NOTER project, like running the application
# or formatting the code. In the JS world, npm scripts fullfil somewhat the
# same role: https://docs.npmjs.com/cli/v10/using-npm/scripts.
#
# Start the application
#
#   $ make run
#
# Format all code (JS, CSS and HTML)
#
#   $ make fmt
#
# Build packages for MacOS, Linux and Windows
#
#   $ make build
#
# Run tests
#
#   $ make test

SHELL = /bin/bash

.PHONY: run
run:
	npm run start

.PHONY: fmt
fmt:
	# beware, this does inplace edits, https://prettier.io/
	prettier -w .

.PHONY: build
build:
	npm run build

.PHONY: clean
clean:
	rm -rf dist
	rm -f .DS_Store
	rm -f noter-testrun-*png

.PHONY: test
test:
	npm run test # unit tests
	npm run test:app # integration tests

package-lock.json: package.json
	# https://stackoverflow.com/q/57867267/89391
	npm install --package-lock-only

.PHONY: update-outdated-npm-packages
update-outdated-npm-packages:
	# https://stackoverflow.com/a/16074029/89391
	npx npm-check-updates -u

# Extra, one time tasks e.g. fetching font files.
noto.css:
	../scripts/localcss/localcss -f noto.css -d . -a fonts -u "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"

.PHONY: icons
icons:
	# note: we needed to remove this dev dependency, because it triggered lots
	# of security warnings
	# echo ./node_modules/.bin/electron-icon-maker --input=../static/nb.png --output=build
