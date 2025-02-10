---
title: NOTER - git tutorial
date: February 1, 2025
header: Notes on git usage and workflow
---

# Git Workflow Tutorial

## 1st - Ensure git is installed

* run `git --version` in your command line
* if something like `git version 2.47.0.windows.2` appears, you're fine
* if not, follow the installation tutorial at https://git-scm.com/downloads

## 2nd - Generate an SSH key pair [I'm assuming you have SSH installed]

* go to your home directory in the command line
* check if theres a hidden folder called `.ssh`
* if so, run `cd .ssh`. Otherwise, SSH might not be installed ... run `ssh -v` to make sure
* if you find a keypair there that you'd like to use ... go to the 3rd step
* otherwise, in the .ssh folder run `ssh-keygen` and just press `<Enter>` to everything if don't know what's happening
* If you did everything correclty, you should have two new files in the .ssh folder : `something` and `something.pub`

## 3rd - Link to your GitHub account using the ssh key

* login into your github account and go to the main page at the `https://github.com/` URL
* click on your `profile picture` [up right corner]
* click on `Settings`
* your URL should be something like `https://github.com/settings/profile`
* find an option called `SSH and GPG keys` and click on it
* you should see a `New SSH key` green button ... click on it
* add a `title` to your key and set its `Key type` to `Authentication Key`
* from your .ssh folder, copy the !!!entire!!! content of the `something.pub` file into the `Key` textarea
* click the `Add SSH key` green button and you're done!

## 4th - Clone the repository of our project

* go to https://github.com/supernoter/noter
* click the `Code` green button
* select the `SSH` option and copy the URL it gives you ... something like `git@github.com:supernoter/noter.git`
* chose a place on your computer to store the local copy of the repo ... I like to put it in the Desktop
* wherever it is ... open the command line on that place and type `git clone git@github.com:supernoter/noter.git`
* accept everything ... and you should see a `noter` folder there ... if so, congrats!

## 5th - Add your own branch

* let's say you have already created a `card` at the Trello board (https://trello.com/c/1axqVOjS/22-interface-for-configuration-file)
* and let's say you have already created an issue for your demand on github (https://github.com/supernoter/noter/issues)
* run `git branch issue-10` [change the number for the number of your issue]
* run `git checkout issue-10` [again, change the number for the number of your issue]
* do what you have to do [add files or change existing ones]
* when you're finished, run `git add *`
* then, run `git commit -m '[feat] : <what you did here>` (https://www.conventionalcommits.org/en/v1.0.0/)
* finally, run `git push` and you're done!

## 6th - Epilogue

* I'm not a mac user, so this flow might differ on a macos machine. Search on YouTube for `SSH Github configuration on mac`
* Read the git documentation  `https://git-scm.com/docs/git` or simply search for a git tutorial on YouTube

# Any issues, hit me via Slack! Thanks! 🤠
