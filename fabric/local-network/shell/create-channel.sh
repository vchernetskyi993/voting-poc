#!/bin/sh

while [ ! -d "/data/gov/orderer/msp" ] || [ ! -d "/data/gov/peer/msp" ]; do
  echo 'waiting for orderer and peer to become ready...'
  sleep 1
done

. shell/utils.sh

trapErrors

export PATH="$PATH":"$FABRIC_BIN_PATH"

infoln "------ Generating genesis block ------"

configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock /data/channel-artifacts/genesis_voting.pb \
  -channelID voting

infoln "------ Joining orderer ------"

osnadmin channel join \
  --channelID voting \
  --config-block /data/channel-artifacts/genesis_voting.pb \
  -o gov_orderer:7053 \
  --ca-file /data/gov/ca/ca-cert.pem \
  --client-cert /data/gov/orderer/tls/server.crt \
  --client-key /data/gov/orderer/tls/server.key
  # FIXME: "admin client signed certificate from the TLS CA" ???
