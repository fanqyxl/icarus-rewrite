#!/bin/bash
mkdir -p out/PKIMetadata/
SCRIPT_DIR=$(dirname $0)
if [ $# -lt 1 ]
then
    echo "Usage: <root certificates...>"
    exit 1
fi
# Copy all directories, and will be modified by future calls
rm -rvf "${SCRIPT_DIR}"/out
mkdir "${SCRIPT_DIR}"/out
mkdir -p "${SCRIPT_DIR}"/out/PKIMetadata/.
cp -rvf "${SCRIPT_DIR}"/original/PKIMetadata/2000/. "${SCRIPT_DIR}"/out/PKIMetadata
rm -rvf "${SCRIPT_DIR}"/out/PKIMetadata/_metadata # verified contents not necessary
rm -rvf "${SCRIPT_DIR}out/PKIMetadata/"*.fingerprint
python3 ./src/root_store_gen/generate_new_pbs.py "${SCRIPT_DIR}/original/PKIMetadata/2000/crs.pb" "$@" "${SCRIPT_DIR}/out/PKIMetadata/crs.pb"
# Modify version in manifest

python3 <<EOF # Set version in manifest
import json
from pathlib import Path 
mjs = '${SCRIPT_DIR}/original/PKIMetadata/2000/manifest.json'
mjs = Path(mjs)
newfile = Path('${SCRIPT_DIR}/out/PKIMetadata/manifest.json')
dat = Path.read_text(mjs)
x = json.loads(dat)
x['version'] = "2000" 
print(json.dumps(x))
newfile.write_text(json.dumps(x))
EOF