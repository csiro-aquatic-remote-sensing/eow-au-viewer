# EyeOnWater: Australia - WFS Viewer

A simple viewer to visualize EOW:AU data.

## Fixes
- Fixed most active user sorting

## New Features
- Sliding side panels with User information and Recent Measurements
- Click on user to see their measurements and statistics
- Click on a recent measurement to see more details
- Retrieve data from EyeOnWater.org Users API

## Features
- Click on map to get features in a popup
- Click on results for more details
- Statistics for the whole feature collection
- Statistics for the result set
- Colors based on FU value
- Pie chart showing FU values across water bodies.

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

    cd ng-eow  # this project
    npm run deploy
    # Open https://research.csiro.au/static/eyeonwater/ in browswer

See `Developer notes` below for more information.

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

Always work on branches made from the `develop` branch.  The `Master` branch should always remain stable with releases being performed from it.

    git checkout develop
    git checkout -b <bug_or_feature_branch>
    # Push to the git server BUT ONLY WHEN THE FEATURE / BUG FIX IS COMPLETE AND TESTED
    git push origin/<bug_or_feature_branch> <bug_or_feature_branch>
    # For pushing it may be easier to use a client such as 'git gui' (part of git - start from the command line)
    # since it will make it easier
    # Then on the git server (the origin), create a pull request to merge your branch in to 'develop' branch
    # Back in the developer's environment pull the develop branch.  
    # Any new bug_or_feature_branches will be branced from this (go to the start and repeat).  
    # Pull the changes
    git checkout develop
    git pull
    git branch -d bug_or_feature_branch  # Delete it

The develop branch can be used to perform a development deploy (see below). When the develop branch is complete with all features / bug fixes for the next release,  perform a pull request on the git server, in to the master branch

# Deploying development version

After you have merged all applicable work to the `develop` branch you can deploy it to the development server to demonstrate to others - https://research.csiro.au/static/eyeonwater-dev/.

You should tag it with a release name and log that describes the changes since last production release.  This development release may build on a previous development release that also came after the last production release.  The work log for this next release should include the changes listed in that previous one.

You can find the tags with 

    git tag # show all
    
    git tag -l "v1.2*"  # For example to list all tags that start with 'v1.2' such as 'v1.2.0, v1.2.1, ...'
    
    git show v1.2.1     # To show the commit log for that tag

    git checkout development
    git tag -a <release>   # An editor will open allowing you to detail the changes this release includes
    
    git push origin --tags
    
Now run a deploy.  This happens from the currently checked out code, not the tag.

    npm run deploy:csiro:dev # Development

After a minute or two it should be at https://research.csiro.au/static/eyeonwater-dev/.

# Deploying production version

    # You will need to have a copy of the code - skip if you've already been devloping it
    git clone git@github.com:csiro-aquatic-remote-sensing/eow-au-viewer.git
    git checkout master

If you've been performing development and the changes are on the `develop` branch then they need to be merged in to the `master` branch.  On the origin server, create a pull request from `develop` to `master`.
  
You should tag the release.  It is more than likely that no code has changed (no commits have been performed) since the last development release was done.  In which case you just want to move the tag to the current commit on `master` (the merge of `develop` in to `master`).

    git pull

According to https://stackoverflow.com/a/8044605/1019307, to move tags do:

    git push origin :refs/tags/<tagname>    # Delete the tag on any remote before you push
    git tag -fa <tagname>   # The -f forces reusing an existing tag
    git push origin --tags

Or if it has new changes that wasn't tagged on `develop` just add a new tag (this strategy should be avoided - always perform development releases first):

    git tag -a <next version> # And type in the changes since the last production release
    git push origin --tags

Then deploy - https://research.csiro.au/static/eyeonwater

    npm run deploy:csiro
