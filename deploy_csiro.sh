#!/usr/bin/env bash

# Run this with 'npm run deploy:csiro' or directly

# Pass in any first argument and it will trigger a deploy to the dev server - https://research.csiro.au/static/eyeonwater-dev/
# Otherwise will go to production server - https://research.csiro.au/static/eyeonwater/

# To run this, a user will need to be given permission to the server / dir:
#    research.csiro.au:/srv/www/research.csiro.au/html/static/eyeonwater
#    research.csiro.au:/srv/www/research.csiro.au/html/static/eyeonwater-dev
# Change the USER in this script to that person
# Setup a ssh private / public key and deploy to the server.  See hint below.

# Hint:  To ssh to the deployed server / directory:
# ssh -vt <USER>@research.csiro.au 'cd /srv/www/research.csiro.au/html/static/eyeonwater; bash'
# Choose your own user and add your public ssh key to ~/.ssh/authorized_keys on the server (use ssh-copy-id)
# See https://www.ssh.com/ssh/copy-id

NPM_BUILD_SCRIPT="build"
SERVERDIR=/srv/www/research.csiro.au/html/static/eyeonwater

if [[ -n "$1" ]]; then
  NPM_BUILD_SCRIPT="build:dev"
  SERVERDIR=/srv/www/research.csiro.au/html/static/eyeonwater-dev
fi
TEMPDIR=$SERVERDIR/tmp

USER=smi9b6
SITE_SERVER=research.csiro.au

echo USER: $USER
echo SITE_SERVER: $SITE_SERVER
echo SERVERDIR: $SERVERDIR
echo NPM_BUILD_SCRIPT: $NPM_BUILD_SCRIPT
echo TEMPDIR: $TEMPDIR


if [ -f dist.tgz ]; then
   echo "Removing dist ..."
   rm dist.tgz
fi

echo "NPM INSTALL"
npm install

# Only build if was done more than a minute ago (since this script can be run from npm package.json
# where the build could also have been run)
DIST=$(find . -maxdepth 1 -type d -name dist -mmin +1)

if [ ! -d dist ]; then
  echo "Building...  "
  npm run $NPM_BUILD_SCRIPT
else
  for dist in $DIST
  do
    echo "Building..."
    npm run $NPM_BUILD_SCRIPT
  done
fi

echo "tar files in to dist.tgz"
tar --directory=dist/ng-eow -czvf dist.tgz ./

echo "Copy dist.tgz to the server: ${USER}@${SITE_SERVER}:/tmp"
scp dist.tgz ${USER}@${SITE_SERVER}:/tmp

RM="rm -rf $SERVERDIR/*"
MKDIR="mkdir -p $TEMPDIR"
CD1="cd $SERVERDIR"
CPTAR="cp /tmp/dist.tgz ."
UNTAR="tar xzvf dist.tgz --strip-components=1"
MVFILES="mv $TEMPDIR/* $SERVERDIR"

echo Setup the web files in $SERVERDIR

ssh ${USER}@${SITE_SERVER} "eval $RM && eval $MKDIR && cd $TEMPDIR && pwd && $CPTAR && eval $UNTAR && eval $MVFILES"

echo Deploy complete
