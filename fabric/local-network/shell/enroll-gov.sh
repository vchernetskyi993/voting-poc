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

# orderer args
NODE_USER=$GOV_ORDERER_USER
NODE_PASSWORD=$GOV_ORDERER_PASSWORD
NODE_TYPE=orderer
NODE_ADMIN=$GOV_ORDERER_ADMIN
NODE_ADMIN_PASSWORD=$GOV_ORDERER_ADMIN_PASSWORD

infoln "------ Enrolling gov-orderer ------"

enroll

# peer args
NODE_USER=$GOV_PEER_USER
NODE_PASSWORD=$GOV_PEER_PASSWORD
NODE_TYPE=peer
NODE_ADMIN=$GOV_PEER_ADMIN
NODE_ADMIN_PASSWORD=$GOV_PEER_ADMIN_PASSWORD

infoln "------ Enrolling gov-peer ------"

enroll
