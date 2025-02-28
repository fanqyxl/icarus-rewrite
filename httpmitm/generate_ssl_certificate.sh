#!/bin/bash

# Arguments: <server address>
DIR=.
mkdir -p "$DIR"
SCRIPTDIR=$(dirname "$(readlink -f "$0")")


openssl genrsa -out "$DIR/$1".key 4096
openssl req -new -key "$1".key -out "$DIR/in.csr" -subj "/C=US/ST=PRIVATE/L=PRIVATE/O=Success!/OU=Success/CN=$1"
cat > "$DIR/extfile" <<EOF

authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $2
EOF

openssl x509 -req -out "$DIR/$1.pem" -CA "$SCRIPTDIR/myCA.pem" -CAkey "$SCRIPTDIR/myCA.key" -extfile "$DIR/extfile" -in "$DIR/in.csr"
# rm -rf "$DIR"