#!/bin/sh

CA_USER=govadmin
CA_PASSWORD=govadminpw
CA_HOST=localhost:7054
CA_NAME=gov-ca
CA_CERT="$(pwd)"/data/${CA_NAME}/ca-cert.pem
NODE_USER=govorderer
NODE_PASSWORD=govordererpw
NODE_TYPE=orderer
NODE_NAME=gov-orderer
NODE_DATA_PATH="$(pwd)"/data/$NODE_NAME
NODE_ADMIN=govordereradmin
NODE_ADMIN_PASSWORD=govordereradminpw

fabric-ca-client enroll \
    -u https://$CA_USER:$CA_PASSWORD@$CA_HOST \
    --tls.certfiles "$CA_CERT"

# register & enroll node
fabric-ca-client register \
    --id.name $NODE_USER \
    --id.secret $NODE_PASSWORD \
    --id.type $NODE_TYPE \
    --tls.certfiles "$CA_CERT"

mkdir -p "$NODE_DATA_PATH"

fabric-ca-client enroll \
    -u https://$NODE_USER:$NODE_PASSWORD@$CA_HOST \
    -M "$NODE_DATA_PATH"/msp \
    --csr.hosts localhost \
    --tls.certfiles "$CA_CERT"

echo "NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054.pem
    OrganizationalUnitIdentifier: orderer" >"$NODE_DATA_PATH"/msp/config.yaml

fabric-ca-client enroll \
    -u https://$NODE_USER:$NODE_PASSWORD@$CA_HOST \
    -M "$NODE_DATA_PATH"/tls \
    --enrollment.profile tls \
    --csr.hosts localhost \
    --tls.certfiles "$CA_CERT"

cp "$NODE_DATA_PATH"/tls/signcerts/cert.pem "$NODE_DATA_PATH"/tls/server.crt
cp "$NODE_DATA_PATH"/tls/keystore/* "$NODE_DATA_PATH"/tls/server.key
cp "$NODE_DATA_PATH"/tls/tlscacerts/tls-localhost-7054.pem "$NODE_DATA_PATH"/tls/ca.crt

# register & enroll node admin
fabric-ca-client register \
    --id.name $NODE_ADMIN \
    --id.secret $NODE_ADMIN_PASSWORD \
    --id.type admin \
    --tls.certfiles "$CA_CERT"

fabric-ca-client enroll \
    -u https://$NODE_ADMIN:$NODE_ADMIN_PASSWORD@$CA_HOST \
    -M "$NODE_DATA_PATH"/admin/msp \
    --tls.certfiles "$CA_CERT"
