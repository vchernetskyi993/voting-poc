#!/bin/sh

. shell/enroll.sh
. shell/shell-utils.sh

trapErrors

# common args
CA_HOST=ca.$ORG
CA_PORT=7054
CA_URL=$CA_HOST:$CA_PORT
CA_CERT=/data/$ORG/ca/ca-cert.pem

export PATH="$PATH":"$FABRIC_BIN_PATH"

MAX_WAIT=5
ATTEMPTS=1

echo 'Checking if CA is ready...'
while [ "$(curl -X 'GET' https://"$CA_URL"/api/v1/cainfo \
  -H 'accept: application/json' -m 1 \
  --insecure -w '%{http_code}' -o /dev/null -s)" != "200" ]; do
  if [ $ATTEMPTS = $MAX_WAIT ]; then
    echo "CA is down. Exiting..."
    exit 1
  else
    echo 'Waiting for CA to become ready...'
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
  fi
done

infoln "------ Enrolling CA client ------"

fabric-ca-client enroll \
  -u https://"$CA_USER":"$CA_PASSWORD"@"$CA_URL" \
  --tls.certfiles "$CA_CERT"

infoln "------ Enrolling $ORG admin ------"

USERNAME=$ADMIN_USER
PASSWORD=$ADMIN_PASSWORD

enrollAdmin

if [ "$SHOULD_ENROLL_ORDERER" = "true" ]; then
  infoln "------ Enrolling $ORG orderer ------"

  USERNAME=$ORDERER_USER
  PASSWORD=$ORDERER_PASSWORD
  NODE_TYPE=orderer

  enrollNode
fi

infoln "------ Enrolling $ORG peer ------"

USERNAME=$PEER_USER
PASSWORD=$PEER_PASSWORD
NODE_TYPE=peer

enrollNode
