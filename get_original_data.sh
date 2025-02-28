#!/bin/bash
echo This script may be removed or disabled later with discretion of google.

echo "using chrome ${CHROME:="google-chrome"}"

if [ ! -d "$HOME/.config/$CHROME/PKIMetadata" ]
then
    "$CHROME" chrome://components &> /dev/null &
    exit 0  
fi
# Search directory for versions
HIGHESTVERSIONAPPARENTLY=$(find  "$HOME/.config/$CHROME/PKIMetadata/" -maxdepth 1 -mindepth 1 -type d| head -n 1)
if [ -z ${HIGHESTVERSIONAPPARENTLY} ]; then
	echo "Failed to find PKIMetadata directory"
	exit 1
fi

#Let the user know what version we are on
echo "$HIGHESTVERSIONAPPARENTLY"

# Prepare output directory (version is 2000 for now. Don't ask why)
mkdir -p original/PKIMetadata/2000

#Copy latest version as base (idk if this is reliable)
if [ "$HIGHESTVERSIONAPPARENTLY" != "" ]; then
    cp -rvf "$HIGHESTVERSIONAPPARENTLY"/. original/PKIMetadata/2000
else
    echo "Variable HIGHESTVERSIONAPPARENTLY returned empty, failing."
    exit 1
fi

#Remove metadata and fingerprint(just sha256 of manifest) to be accepted
rm -rvf original/PKIMetadata/2000/_metadata
rm -rvf original/PKIMetadata/2000/manifest.fingerprint

#end of script
