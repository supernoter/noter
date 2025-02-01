# github action setup

electron-builder wants to publish an complains about missing `GH_TOKEN`, try to resolve via:

https://stackoverflow.com/questions/46571742/electron-builder-release-tries-to-publish-to-github-and-complains-about-gh-token/46651348

We need both wine and wine32 and for that we need to enable the arch with `dpkg`.

GitHub may offer a MacOS runner, so we can actually build dmg files.

TODO: figure out code signing.
