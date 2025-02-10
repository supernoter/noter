# Makefile to generate index.html from a template (template.html) and markdown
# (index.md). You will need prettier command line tool for HTML formatting and
# pandoc for the conversion.
#
# In order to keep it simple, we only publish a single page, that will contain
# download links, basic documentation and possibly some demos.
#
# ┏━┓╻ ╻┏━┓┏━╸┏━┓┏┓╻┏━┓╺┳╸┏━╸┏━┓ ╻ ╻╻ ╻╺━┓
# ┗━┓┃ ┃┣━┛┣╸ ┣┳┛┃┗┫┃ ┃ ┃ ┣╸ ┣┳┛ ┏╋┛┗┳┛┏━┛
# ┗━┛┗━┛╹  ┗━╸╹┗╸╹ ╹┗━┛ ╹ ┗━╸╹┗╸╹╹ ╹ ╹ ┗━╸
#
SHELL = /bin/bash
TARGETS = index.html git-tutorial.html

.PHONY: all
all: $(TARGETS)

%.html: %.md template.html
	prettier -w template.html
	pandoc \
		--to=html5 \
		--lua-filter=tools/anchor-links.lua \
		--standalone \
		--template template.html \
		$< > $@


.PHONY: clean
clean:
	rm -f $(TARGETS)
