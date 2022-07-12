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

#######################################
# Creates organization msp folder.
# Globals:
#   ORG
#######################################
prepareOrgMsp() {
  mkdir -p /data/"$ORG"/msp/cacerts /data/"$ORG"/msp/tlscacerts
  cp /data/"$ORG"/ca/ca-cert.pem /data/"$ORG"/msp/cacerts
  cp /data/"$ORG"/ca/ca-cert.pem /data/"$ORG"/msp/tlscacerts
  CA_FILE_NAME=ca-cert DATA_PATH=/data/"$ORG" writeOUconfig
}

#######################################
# Uses admin user of requested organization for following peer interactions.
# Globals:
#   ORG
#   MSP_ID
#######################################
useOrgAdmin() {
  export FABRIC_CFG_PATH=/config/peer
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="$MSP_ID"
  export CORE_PEER_MSPCONFIGPATH=/data/"$ORG"/admin/msp
  export CORE_PEER_ADDRESS=peer."$ORG":7051
  export CORE_PEER_TLS_ROOTCERT_FILE=/data/"$ORG"/peer/tls/tlscacerts/tls-ca-"$ORG"-7054.pem
}

#######################################
# Installs and then approves chaincode package. 
# Assumes that `useOrgAdmin` is already called.
#######################################
approveChaincode() {
  peer lifecycle chaincode install /data/channel-artifacts/cc.tar.gz >/data/log 2>&1

  cat /data/log

  PACKAGE_ID=$(tail -n 1 /data/log | awk '{print $NF}')

  peer lifecycle chaincode approveformyorg \
    -o orderer.gov:7050 \
    --tls \
    --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem \
    --channelID voting \
    --name elections \
    --version 0.1.0 \
    --package-id "$PACKAGE_ID" \
    --sequence 1
}
