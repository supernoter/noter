# docs

Documentation and website. The website is served on
[supernoter.xyz](http://web.archive.org/web/20250714111623/https://supernoter.xyz/), via [GitHub
Pages](https://pages.github.com/).

## Requirements

Install [pandoc](https://pandoc.org/) and [prettier](https://prettier.io/) to run website updates.


## Workflow

* edit `index.md` to update website content
* run `make` to regeneate `index.html` file that is actually served
* to change any style, adjust `template.html` file

```
$ make
prettier -w template.html
template.html 124ms (unchanged)
pandoc \
        --to=html5 \
        --lua-filter=tools/anchor-links.lua \
        --standalone \
        --template template.html \
        index.md > index.html
```

Push changes on main branch to GitHub and wait a few minutes for the changes to
appear on [supernoter.xyz](http://web.archive.org/web/20250714111623/https://supernoter.xyz/).

