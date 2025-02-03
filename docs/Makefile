SHELL = /bin/bash

index.html: index.md template.html
	prettier -w template.html
	pandoc --standalone --template template.html index.md > index.html

.PHONY: clean
clean:
	rm -f index.html
