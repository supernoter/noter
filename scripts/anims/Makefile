SHELL := /bin/bash

.PHONY: all
all: notebook.webm notebook.webp

notebook.webm: notebook.gif
	ffmpeg -i notebook.gif -c vp9 -b:v 0 -crf 40 notebook.webm

notebook.webp: notebook.gif
	ffmpeg -f gif -i notebook.gif -c libwebp notebook.webp

notebook.gif: placeholder.go
	go run placeholder.go
