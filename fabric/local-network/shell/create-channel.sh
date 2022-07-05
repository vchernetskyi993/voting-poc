#!/bin/sh

MAX_WAIT=5
ATTEMPTS=1

while [ ! -d "/data/gov/orderer/tls" ] || [ ! -d "/data/gov/peer/production/ledgersData" ]; do
  if [ $ATTEMPTS = $MAX_WAIT ]; then
    echo "Orderer and/or peer aren't ready. Exiting..."
    exit 1
  else
    echo 'Waiting for orderer and peer to become ready...'
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
  fi
done

. shell/shell-utils.sh
. shell/fabric-utils.sh

trapErrors

export PATH="$PATH":"$FABRIC_BIN_PATH"

infoln "------ Preparing Gov MSP ------"

mkdir -p /data/gov/msp/cacerts /data/gov/msp/tlscacerts
cp /data/gov/ca/ca-cert.pem /data/gov/msp/cacerts
cp /data/gov/ca/ca-cert.pem /data/gov/msp/tlscacerts
CA_FILE_NAME=ca-cert DATA_PATH=/data/gov writeOUconfig

infoln "------ Generating genesis block ------"

GENESIS_BLOCK=/data/channel-artifacts/genesis_voting.pb

configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock $GENESIS_BLOCK \
  -channelID voting

infoln "------ Joining orderer ------"

osnadmin channel join \
  --channelID voting \
  --config-block $GENESIS_BLOCK \
  -o orderer.gov:7053 \
  --ca-file /data/gov/ca/ca-cert.pem \
  --client-cert /data/gov/orderer/tls/server.crt \
  --client-key /data/gov/orderer/tls/server.key

sleep 2

infoln "------ Joining peer ------"

CORE_PEER_TLS_ENABLED=true \
  CORE_PEER_LOCALMSPID=Government \
  CORE_PEER_MSPCONFIGPATH=/data/gov/admin/msp \
  CORE_PEER_ADDRESS=peer.gov:7051 \
  CORE_PEER_TLS_ROOTCERT_FILE=/data/gov/peer/tls/tlscacerts/tls-ca-gov-7054.pem \
  peer channel join -b $GENESIS_BLOCK
