# github action setup

electron-builder wants to publish an complains about missing `GH_TOKEN`, try to resolve via:

https://stackoverflow.com/questions/46571742/electron-builder-release-tries-to-publish-to-github-and-complains-about-gh-token/46651348

We need both wine and wine32 and for that we need to enable the arch with `dpkg`.

GitHub may offer a MacOS runner, so we can actually build dmg files; https://docs.github.com/en/actions/using-github-hosted-runners/using-github-hosted-runners/about-github-hosted-runners

TODO: figure out code signing.


## CI

* need to create a personal (fine grained) token from a user account; there is an option to put the token under the organization realm
* the token needs "Contents" read-write access
* update package.json and create a tag, like v1.2.3
* git push commits and tags

A run will be triggered, like
[job/36613233945](https://github.com/supernoter/noter/actions/runs/13123027958/job/36613233945);
this may take a few minutes

* https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release
