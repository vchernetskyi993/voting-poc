#!/bin/sh

. shell/shell-utils.sh
. shell/fabric-utils.sh

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

  CA_FILE_NAME=ca-$ORG-$CA_PORT writeOUconfig

  fabric-ca-client enroll \
    -u https://"$USERNAME":"$PASSWORD"@"$CA_URL" \
    -M "$DATA_PATH"/tls \
    --enrollment.profile tls \
    --csr.hosts "$NODE_TYPE"."$ORG" \
    --csr.hosts localhost \
    --tls.certfiles "$CA_CERT"

  cp "$DATA_PATH"/tls/signcerts/cert.pem "$DATA_PATH"/tls/server.crt
  cp "$DATA_PATH"/tls/keystore/* "$DATA_PATH"/tls/server.key
  cp "$DATA_PATH"/tls/tlscacerts/tls-ca-"$ORG"-"$CA_PORT".pem "$DATA_PATH"/tls/ca.crt
}

#######################################
# Register and enroll administrator.
# Globals:
#   ORG
#   CA_PORT
#   CA_URL
#   CA_CERT
#   USERNAME
#   PASSWORD
#######################################
enrollAdmin() {
  DATA_PATH=/data/$ORG/admin

  infoln "--- Registering admin ---"

  fabric-ca-client register -d \
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

  CA_FILE_NAME=ca-$ORG-$CA_PORT writeOUconfig

  cp "$DATA_PATH"/msp/signcerts/cert.pem "$DATA_PATH"/msp/client.crt
  cp "$DATA_PATH"/msp/keystore/* "$DATA_PATH"/msp/client.key
  cp "$DATA_PATH"/msp/cacerts/ca-"$ORG"-"$CA_PORT".pem "$DATA_PATH"/msp/ca.crt
}
