# EyeOnWater: Australia - WFS Viewer

A map of the Australian EOW data.

## Features
- Sidebar with User information and Recent Measurements
- Click on user to see their measurements and statistics
- Click on a recent measurement to see more details
- Retrieve data from EyeOnWater.org Users API
- Click on map to get features in a popup
- Click on results for more details
- Statistics for the whole feature collection
- Statistics for the result set
- Colors based on FU value
- Pie chart showing FU values across water bodies.
- Time series graph of FU values for a water body over time.

## Installation
- clone this repository
- cd into project folder
- run `npm install`

## Run
- To start development server with live reload run command
  - `npm start`
- To build production ready distribution run command
  - `npm run build`
  
## Deploy (CSIRO)

### TLDR;

    cd ng-eow  # this project
    npm run deploy
    # Open https://research.csiro.au/static/eyeonwater/ in browswer

### More detailed information

See [Developer notes](#developers-notes) below for more information.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

# Repositories

    Maris: https://github.com/maris-development/eow-au-viewer
    CSIRO Fork: https://github.com/csiro-aquatic-remote-sensing/eow-au-viewer

## Old and other

    https://bitbucket.csiro.au/projects/ASC/repos/eyeonwater-map - prior to December 2019 version of https://research.csiro.au/eyeonwater/observation/
    https://github.com/JordanMaris/eow-au-viewer/ - Old source code from Europeans
    https://github.com/kieranongh/eow-au-viewer/ - Australian developer's update to that (forked).  However no real changes are visible and I suspect that Kieran didn't commit and push before leavingg

# Sites
## Production

    https://research.csiro.au/eyeonwater/ - Top-level  Eye On Water Wordpress site
    https://research.csiro.au/eyeonwater/wp-admin/ - Eye On Water Wordpress admin
    https://research.csiro.au/static/eyeonwater/ - Eye On Water Map
    https://www.eyeonwater.org/content/map.php?map_type=color&menu=2&center=11.2617867032656,8.271160433377043,2 - European Eye On Water

## Development

    https://research.csiro.au/eyeonwater-dev/ - Top-level  Eye On Water Wordpress site
    https://research.csiro.au/eyeonwater-dev/wp-admin/ - Eye On Water Wordpress admin
    https://research.csiro.au/static/eyeonwater-dev/ - Eye On Water Map

# Server directories

Development deploys seen in action at https://research.csiro.au/static/eyeonwater-dev/ can be ssh'd to with the following.  A password can be typed, however deploys require that public / private keys are used.  See https://www.ssh.com/ssh/copy-id
    
    ssh -vt <USER>@research.csiro.au 'cd /srv/www/research.csiro.au/html/static/eyeonwater-dev; bash'

For production equivalent use `eyeonwater` instead of `eyeonwater-dev`.

# Developers notes

Always work on branches made from the `develop` branch.  Make *development* releases from this.  The `Master` branch should always remain stable with *production* releases being performed from it.

    git checkout develop
    git checkout -b <bug_or_feature_branch>
    # Push to the git server BUT ONLY WHEN THE FEATURE / BUG FIX IS COMPLETE AND TESTED
    git push origin/<bug_or_feature_branch> <bug_or_feature_branch>
    # For pushing it may be easier to use a client such as 'git gui' (part of git - start from the command line)
    # since it will makes such push operations easier
    # Then on the git server (the origin), create a pull request to merge your branch in to 'develop' branch
    # Back in the developer's environment pull the develop branch.  
    # Any new bug_or_feature_branches will be branced from this (go to the start and repeat).  
    # Pull the changes
    git checkout develop
    git pull
    git branch -d bug_or_feature_branch  # Delete it

The develop branch can be used to perform a *development* release / deploy (see below). When the develop branch is complete with all features / bug fixes for the next release,  perform a pull request on the git server, in to the master branch and perform a *production* release / deploy from it.

# New releases

The basic strategy is this:
1. Only release new code as `pre-release` versions and from the `develop` branch.  It should be tagged as a release first.  
2. Deploy this to the development site.  
2. Announce the new development release to your small set of test users and the business representative(s)
2. Have them test it
2. Once happy, merge the code from `develop` to `master` using a github pull request.  This will add the tag to the `master` branch also
3. Update the release in github, moving it from `pre-release` to a production release.
4. Check out this release in your local git repository.
5. Deploy this to the production site.
6. Announce the new release to your users

## Pre-release version

After you have merged all applicable work to the `develop` branch, you can deploy it to the development server at https://research.csiro.au/static/eyeonwater-dev/.

You should tag it with a release name and log that describes the changes since last release (development or production).  The format `release_<date>` is the easiest for this simple project (more complex applications should use semantic versioning).

    git checkout development

    git tag # show all exist tags
    
    git tag -l "*_release"  # For example to list all tags that ends with '_release'
    
    git show 2020-03-03_release     # To show the commit log for that tag

    git tag -a yyyymmdd_release   # An editor will open allowing you to detail the changes this release includes.  Be detailed.
    
    git push origin --tags
    
You need to formally make this a release in github.  Go to (https://github.com/csiro-aquatic-remote-sensing/eow-au-viewer) `github >  csiro-aquatic-remote-sensing / eow-au-viewer > code`.

In here are listed the releases and tags.  You need to convert the tag you just created in to a release:
1. Click on `Draft a new release`
2. Choose the tag you just created and the `develop` branch
3. Click `This is a pre-release` box

Now run a deploy.  This happens from the currently checked out code, not the tag.  You can check out a specific release with `git checkout <tag>`.

    npm run deploy:csiro:dev # Development

After a minute or two it should be at https://research.csiro.au/static/eyeonwater-dev/.

# Deploying production version

If  you haven't been following the release process and have come in here needing to run a production release from master perform this:
1. Choose a location to check out the repository
2. `git clone git@github.com:csiro-aquatic-remote-sensing/eow-au-viewer.git`
3. `git checkout master`

If you have been following the release process, continue from here.

Deployment to *production* should be from the `master` branch.  The only code modifications to `master` should come via pull requests from the `develop` branch.  *No code changes should be made directly to `master` without going to `develop` first, released and tested.  The `master` branch should always be stable code.*  

## Create pull request - develop to master
 
On the origin server, create a pull request from `develop` to `master`.  Merge it.

This will also bring the release tag from `develop` (ie. pre-release) to `master` (ie. production).  You need to let github know this.

In github, find the release (tag) under code.  Uncheck the `This is a pre-release` box.

It is possible that more than one development `pre-production` releases had been made between production release.  The production release in github should be updated with the previous pre-production release notes so as to give a complete picture of the full extent of the changes. 
  
Deploy to the production site - https://research.csiro.au/static/eyeonwater

    npm run deploy:csiro

# Testing

To run all tests type this on the command-line:

    npm test
    
The tests are run with the [Karma](https://karma-runner.github.io) runner and the [Jasmine](https://jasmine.github.io/) testing framework.  A browser will open to run the testing code and display the results.
  
To run individual tests (especially those that have failed), click on their title in the browser page.

## Debugging

One typical way to debug the test and the tested code is to use your Integrated Development Environment (IDE).  The simplest way is to perform the analysis through the browser.  Editing will still need to be through the IDE, however when you save the tests will be re-run giving you immediate feedback.

In the browser open the Developer Tools.  Find the source under the source tab (Chrome) or Debugger tab (Firefox).  Set breakpoints and run the test by clicking on it in the main part of the browser.

