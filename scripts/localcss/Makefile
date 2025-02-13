SHELL = /bin/bash

localcss: main.go
	go build -o localcss main.go

.PHONY: clean
clean:
	rm -f localcss

dist/noto.css: localcss
	./localcss -d dist -f noto.css -u "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
