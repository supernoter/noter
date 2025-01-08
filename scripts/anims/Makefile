SHELL := /bin/bash

notebook.webm: notebook.gif
	ffmpeg -i notebook.gif -c vp9 -b:v 0 -crf 40 notebook.webm

notebook.gif: placeholder.go
	go run placeholder.go
