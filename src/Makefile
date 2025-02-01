# Makefile for common tasks around NOTER project, like running the application
# # or formatting the code. In the JS world, npm scripts fullfil somewhat the
# same role: https://docs.npmjs.com/cli/v10/using-npm/scripts.
#
# $ make run # start the application
#
# $ make fmt # will format all JS, CSS and HTML files in the project
#

SHELL = /bin/bash

.PHONY: run
run:
	npm run start

.PHONY: fmt
fmt:
	# beware, this does inplace edits, https://prettier.io/
	prettier -w .

