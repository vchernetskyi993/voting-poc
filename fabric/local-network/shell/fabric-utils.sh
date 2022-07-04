#!/bin/sh

#######################################
# Writes default NodeOUs config to DATA_PATH/msp/config.yaml.
# Globals:
#   CA_HOST
#   CA_PORT
#   DATA_PATH
#######################################
writeOUconfig() {
  echo "
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/$CA_HOST-$CA_PORT.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/$CA_HOST-$CA_PORT.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/$CA_HOST-$CA_PORT.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/$CA_HOST-$CA_PORT.pem
    OrganizationalUnitIdentifier: orderer
" >"$DATA_PATH"/msp/config.yaml
}
