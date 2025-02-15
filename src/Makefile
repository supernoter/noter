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
# Build packages
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

.PHONY: icons
icons:
	./node_modules/.bin/electron-icon-maker --input=../static/nb.png --output=build

.PHONY: build
build:
	npm run build

.PHONY: clean
clean:
	rm -rf dist

.PHONY: test
test:
	npm test

package-lock.json: package.json
	# https://stackoverflow.com/q/57867267/89391
	npm install --package-lock-only

.PHONY: update-outdated-npm-packages
update-outdated-npm-packges:
	# https://stackoverflow.com/a/16074029/89391
	npx npm-check-updates -u

# Extra, one time tasks, e.g. fetching font files.
noto.css:
	../scripts/localcss/localcss -f noto.css -d . -a fonts -u "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
