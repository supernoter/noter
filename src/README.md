# NOTER Application

This is the source code for the Electron.js application NOTER, a markdown
note-taking application. User documentation can be found at
[supernoter.xyz](https://supernoter.xyz).

## Install dependencies

```
$ npm install --include=dev
```

## Run the application

```
$ npm run start
```

In addition, NOTER will respond to the DEBUG environment variable. If DEBUG is set, the developer tools window will automatically open on startup:

```
$ DEBUG=1 npm run start
```

You can also run the application with make:

```
$ make
```

## Run tests

We implement unit and integration tests. The easiest way to run all tests is to use make:

```
$ make test
```

To only run the unit tests:

```
$ npm run test
```

To only run the integration tests:

```
$ npm run test:app
```

## Formatting code

We use [prettier](https://prettier.io/) to format all code, HTML and CSS:

```
$ make fmt
```

## Build packages

This may require additional packages installed and it may take a few minutes.

```
$ make build
```

## Find and update outdated dependencies

To find and update outdated dependencies, run:

```
$ make update-outdated-npm-packages
```

This will adjust package.json only. To also update package-lock.json, you will need to run one additional command:

```
$ make package-lock.json
```

More on this here: [SO: How to update package-lock.json without doing npm install?](https://stackoverflow.com/a/16074029/89391)

## Configuration file

NOTER reads a config file at startup. The location of the config file follows common platform patterns:

| OS      | Location of configuration file        |
|---------|---------------------------------------|
| Windows | [`%APPDATA%`](https://superuser.com/questions/632891/what-is-appdata)                          |
| Linux   | [`$XDG_CONFIG_HOME`](https://wiki.archlinux.org/title/XDG_Base_Directory) or `~/.config`     |
| MacOS   | `~/Library/Application Support/noter` |

An example configuration file can be found here:
[supernoter.xyz/config.json](https://supernoter.xyz/config.json) and also in
the local documentation directory.

## Using a local LLM in conjuction with NOTER

By default, NOTER will try to discover a running [ollama](https://ollama.com)
instance on the default host and port, which is
[localhost:11434](http://localhost:11434).

You can adjust this setting in the configuration file:

```json
{
  ...
  "ollama_host": "http://localhost:11434",
  "ollama_model_name": "gemma"
}

