#!/bin/sh

while [ ! -d "/data/gov/orderer/msp" ] || [ ! -d "/data/gov/peer/production/ledgersData" ]; do
  echo 'waiting for orderer and peer to become ready...'
  sleep 1
done

. shell/shell-utils.sh
. shell/fabric-utils.sh

trapErrors

export PATH="$PATH":"$FABRIC_BIN_PATH"

infoln "------ Preparing Gov MSP ------"

mkdir -p /data/gov/msp/cacerts /data/gov/msp/tlscacerts
cp /data/gov/ca/ca-cert.pem /data/gov/msp/cacerts
cp /data/gov/ca/ca-cert.pem /data/gov/msp/tlscacerts
CA_HOST=ca_gov CA_PORT=7054 DATA_PATH=/data/gov writeOUconfig

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
  -o gov_orderer:7053 \
  --ca-file /data/gov/ca/ca-cert.pem \
  --client-cert /data/gov/orderer/tls/server.crt \
  --client-key /data/gov/orderer/tls/server.key

infoln "------ Joining peer ------"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Government
export CORE_PEER_MSPCONFIGPATH=/data/gov/peer/msp
export CORE_PEER_ADDRESS=gov_peer:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/data/gov/peer/tls/tlscacerts/tls-gov_ca-7054.pem
# cp /data/gov/admin/msp/keystore/* /data/gov/admin/msp/client.key
# export CORE_PEER_TLS_CLIENTKEY=/data/gov/admin/msp/client.key
# export CORE_PEER_TLS_CLIENTCERT=/data/gov/admin/msp/signcerts/cert.pem

peer channel join -b $GENESIS_BLOCK
