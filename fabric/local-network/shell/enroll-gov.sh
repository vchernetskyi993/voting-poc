#!/bin/sh

. shell/enroll.sh
. shell/utils.sh

trapErrors

# common args
ORG=gov
CA_USER=$GOV_CA_USER
CA_PASSWORD=$GOV_CA_PASSWORD
CA_HOST=gov_ca
CA_PORT=7054
CA_URL=$CA_HOST:$CA_PORT
CA_CERT=/data/$ORG/ca/ca-cert.pem

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
