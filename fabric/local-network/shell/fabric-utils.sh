#!/bin/sh

#######################################
# Writes default NodeOUs config to DATA_PATH/msp/config.yaml.
# Globals:
#   CA_FILE_NAME
#   DATA_PATH
#######################################
writeOUconfig() {
  echo "
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: orderer
" >"$DATA_PATH"/msp/config.yaml
}
