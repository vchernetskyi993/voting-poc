#!/bin/sh

. shell/utils.sh

#######################################
# Register and enroll node.
# Globals:
#   ORG
#   CA_HOST
#   CA_PORT
#   CA_URL
#   CA_CERT
#   NODE_TYPE
#   DATA_PATH
#   USERNAME
#   PASSWORD
#######################################
enrollNode() {
  DATA_PATH=/data/$ORG/$NODE_TYPE

  infoln "--- Registering node ---"

  fabric-ca-client register \
    --url "https://$CA_URL" \
    --id.name "$USERNAME" \
    --id.secret "$PASSWORD" \
    --id.type "$NODE_TYPE" \
    --tls.certfiles "$CA_CERT"

  mkdir -p "$DATA_PATH"

  infoln "--- Enrolling node ---"

  fabric-ca-client enroll \
    -u https://"$USERNAME":"$PASSWORD"@"$CA_URL" \
    -M "$DATA_PATH"/msp \
    --csr.hosts "$CA_HOST" \
    --tls.certfiles "$CA_CERT"

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

  fabric-ca-client enroll \
    -u https://"$USERNAME":"$PASSWORD"@"$CA_URL" \
    -M "$DATA_PATH"/tls \
    --enrollment.profile tls \
    --csr.hosts "$ORG"_"$NODE_TYPE" \
    --csr.hosts localhost \
    --tls.certfiles "$CA_CERT"

  cp "$DATA_PATH"/tls/signcerts/cert.pem "$DATA_PATH"/tls/server.crt
  cp "$DATA_PATH"/tls/keystore/* "$DATA_PATH"/tls/server.key
  cp "$DATA_PATH"/tls/tlscacerts/tls-"$CA_HOST"-"$CA_PORT".pem "$DATA_PATH"/tls/ca.crt
}

#######################################
# Register and enroll administrator.
# Globals:
#   ORG
#   CA_URL
#   CA_CERT
#   USERNAME
#   PASSWORD
#######################################
enrollAdmin() {
  DATA_PATH=/data/$ORG/admin

  infoln "--- Registering admin ---"

  fabric-ca-client register \
    --url "https://$CA_URL" \
    --id.name "$USERNAME" \
    --id.secret "$PASSWORD" \
    --id.type admin \
    --tls.certfiles "$CA_CERT"

  infoln "--- Enrolling admin ---"

  fabric-ca-client enroll \
    -u https://"$USERNAME":"$PASSWORD"@"$CA_URL" \
    -M "$DATA_PATH"/msp \
    --tls.certfiles "$CA_CERT"
}
