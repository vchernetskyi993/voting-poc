#!/bin/sh

. shell/enroll.sh
. shell/shell-utils.sh

trapErrors

# common args
ORG=gov
CA_USER=$GOV_CA_USER
CA_PASSWORD=$GOV_CA_PASSWORD
CA_HOST=ca.gov
CA_PORT=7054
CA_URL=$CA_HOST:$CA_PORT
CA_CERT=/data/$ORG/ca/ca-cert.pem

export PATH="$PATH":"$FABRIC_BIN_PATH"

MAX_WAIT=5
ATTEMPTS=1

echo 'Checking if CA is ready...'
while [ "$(curl -X 'GET' https://$CA_HOST:$CA_PORT/api/v1/cainfo \
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

infoln "------ Enrolling Gov admin ------"

USERNAME=$GOV_ADMIN
PASSWORD=$GOV_ADMIN_PASSWORD

enrollAdmin

infoln "------ Enrolling Gov orderer ------"

USERNAME=$GOV_ORDERER_USER
PASSWORD=$GOV_ORDERER_PASSWORD
NODE_TYPE=orderer

enrollNode

infoln "------ Enrolling Gov peer ------"

USERNAME=$GOV_PEER_USER
PASSWORD=$GOV_PEER_PASSWORD
NODE_TYPE=peer

enrollNode
