---
title: NOTER - write together
date: February 3, 2025
header: NOTER is a minimalistic, themable markdown editor that seamlessly integrates with large-language models, while respecting your privacy.
---

# About

NOTER is an [open source](https://github.com/supernoter/noter), minimalistic,
themable markdown editor that seamlessly integrates with large-language models.
If you happen to run [ollama](https://ollama.com/) locally, NOTER will
automatically connect to the instance. It is currently in
[alpha](https://en.wikipedia.org/wiki/Software_release_life_cycle#Alpha) stage:
you can download it and run it, but most functionality is still missing and the
code is not thoroughly tested yet.

# Installation

NOTER is available for MacOS, Windows and Linux - you can download it from our
[releases page](https://github.com/supernoter/noter/releases/latest).


# Demo

<div class="video-container">
  <video loop muted autoplay playsinline preload="auto" poster="/static/intro-fast.jpg" id="intro">
    <source src="/static/intro-fast.webm" type="video/webm" />
    <source src="/static/intro-fast.mp4" type="video/mp4" />
    <source src="/static/intro-fast.ogg" type="video/ogg" />
  </video>
</div>

# Reference

Access help within the editor with CTRL-h or F1.

## Keyboard Shortcuts

| Keyboard Shortcut | Functionality                                                   |
|-------------------|-----------------------------------------------------------------|
| CTRL-e            | Export note to PDF                                              |
| CTRL-b            | Toggle sidebar                                                  |
| CTRL-g            | Call out to the configured LLM and insert response to a prompt. |
| CTRL-h, F1        | Toggle help                                                     |
| CTRL-n            | Create a new file                                               |
| CTRL-o            | Open an existing file                                           |
| CTRL-p            | Toggle preview                                                  |
| CTRL-s            | Save file                                                       |
| CTRL-+            | Increase font size                                              |
| CTRL-- (minus)    | Decreate font size                                              |

## Configuration

You can customize the editor in many ways, using a `config.json` file (in the
current directory). Changes are applied at editor startup time.

```json
{
  "window": {
    "opacity": 1,
    "width": 900,
    "height": 550
  },
  "font": {
    "colour": "blue",
    "size": "16px",
    "family": "monospace, monospace"
  },
  "background": {
    "colour": "white",
    "gradient": null,
    "image": null,
    "opacity": "100%"
  },
  "status-bar": {
    "font": {
      "colour": "black",
      "size": "14px",
      "family": "Arial"
    },
    "background": {
      "colour": "white"
    }
  },
  "preview": {
    "font": {
      "colour": "black",
      "size": "20px",
      "family": "Arial"
    },
    "background": {
      "colour": "blue"
    }
  }
}
```

# Development notes

We compiled a [Git tutorial](git-tutorial.html) to get started with version control.
