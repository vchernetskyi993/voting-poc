#!/bin/bash

. scripts/utils.sh

enroll() {
    # --- parameters ---
    # CA_USER, CA_PASSWORD, CA_HOST, CA_PORT, CA_NAME
    # NODE_USER, NODE_PASSWORD, NODE_TYPE, NODE_NAME, NODE_ADMIN, NODE_ADMIN_PASSWORD

    CA_URL=$CA_HOST:$CA_PORT
    CA_CERT="$(pwd)"/data/${CA_NAME}/ca-cert.pem
    NODE_DATA_PATH="$(pwd)"/data/$NODE_NAME

    fabric-ca-client enroll \
        -u https://"$CA_USER":"$CA_PASSWORD"@"$CA_URL" \
        --tls.certfiles "$CA_CERT"

    enrollNode

    enrollAdmin
}

enrollNode() {
    # --- parameters ---
    # NODE_TYPE, NODE_DATA_PATH, NODE_USER, NODE_PASSWORD
    # CA_HOST, CA_PORT, CA_URL, CA_CERT

    infoln "--- Registering node ---"

    fabric-ca-client register \
        --id.name "$NODE_USER" \
        --id.secret "$NODE_PASSWORD" \
        --id.type "$NODE_TYPE" \
        --tls.certfiles "$CA_CERT"

    mkdir -p "$NODE_DATA_PATH"

    infoln "--- Enrolling node ---"

    fabric-ca-client enroll \
        -u https://"$NODE_USER":"$NODE_PASSWORD"@"$CA_URL" \
        -M "$NODE_DATA_PATH"/msp \
        --csr.hosts localhost \
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
" >"$NODE_DATA_PATH"/msp/config.yaml

    fabric-ca-client enroll \
        -u https://"$NODE_USER":"$NODE_PASSWORD"@"$CA_URL" \
        -M "$NODE_DATA_PATH"/tls \
        --enrollment.profile tls \
        --csr.hosts localhost \
        --tls.certfiles "$CA_CERT"

    cp "$NODE_DATA_PATH"/tls/signcerts/cert.pem "$NODE_DATA_PATH"/tls/server.crt
    cp "$NODE_DATA_PATH"/tls/keystore/* "$NODE_DATA_PATH"/tls/server.key
    cp "$NODE_DATA_PATH"/tls/tlscacerts/tls-localhost-7054.pem "$NODE_DATA_PATH"/tls/ca.crt
}

enrollAdmin() {
    # --- parameters ---
    # CA_URL, CA_CERT,
    # NODE_DATA_PATH, NODE_ADMIN, NODE_ADMIN_PASSWORD
    infoln "--- Registering admin ---"

    fabric-ca-client register \
        --id.name "$NODE_ADMIN" \
        --id.secret "$NODE_ADMIN_PASSWORD" \
        --id.type admin \
        --tls.certfiles "$CA_CERT"

    infoln "--- Enrolling admin ---"

    fabric-ca-client enroll \
        -u https://"$NODE_ADMIN":"$NODE_ADMIN_PASSWORD"@"$CA_URL" \
        -M "$NODE_DATA_PATH"/admin/msp \
        --tls.certfiles "$CA_CERT"
}
