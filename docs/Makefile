SHELL = /bin/bash

index.html: index.md template.html
	prettier -w template.html
	pandoc --to=html5 --lua-filter=tools/anchor-links.lua --standalone --template template.html index.md > index.html

.PHONY: clean
clean:
	rm -f index.html
