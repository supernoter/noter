# Makefile to generate index.html from a template (template.html) and markdown
# (index.md). You will need prettier command line tool for HTML formatting and
# pandoc for the conversion.
#
# ┏━┓╻ ╻┏━┓┏━╸┏━┓┏┓╻┏━┓╺┳╸┏━╸┏━┓ ╻ ╻╻ ╻╺━┓
# ┗━┓┃ ┃┣━┛┣╸ ┣┳┛┃┗┫┃ ┃ ┃ ┣╸ ┣┳┛ ┏╋┛┗┳┛┏━┛
# ┗━┛┗━┛╹  ┗━╸╹┗╸╹ ╹┗━┛ ╹ ┗━╸╹┗╸╹╹ ╹ ╹ ┗━╸
#
SHELL = /bin/bash

index.html: index.md template.html
	prettier -w template.html
	pandoc --to=html5 --lua-filter=tools/anchor-links.lua --standalone --template template.html index.md > index.html

.PHONY: clean
clean:
	rm -f index.html
