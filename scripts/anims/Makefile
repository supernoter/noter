SHELL := /bin/bash

.PHONY: all
all: notebook.webm notebook.webp

notebook.webm: notebook.gif Makefile
	ffmpeg -y -i notebook.gif -c vp9 -b:v 0 -crf 40 notebook.webm

notebook.webp: notebook.gif Makefile
	ffmpeg -y -f gif -i notebook.gif -loop 0 -c libwebp notebook.webp

notebook.gif: placeholder.go Makefile
	go run placeholder.go
