#!/bin/sh

while [ ! -d "/data/gov/orderer/admin/msp" ] || [ ! -d "/data/gov/peer/admin/msp" ]; do
  echo 'waiting for orderer and peer to become ready...'
  sleep 1
done

FABRIC_CFG_PATH=/fabric/config \
  /fabric/bin/configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock /data/channel-artifacts/genesis_voting.pb \
  -channelID voting

/fabric/bin/osnadmin channel join \
  --channelID voting \
  --config-block /data/channel-artifacts/genesis_voting.pb \
  -o gov_orderer:7053 \
  --ca-file /data/gov/ca/ca-cert.pem \
  --client-cert /data/gov/orderer/tls/server.crt \
  --client-key /data/gov/orderer/tls/server.key

# /fabric/bin/osnadmin channel join \
#   --channelID voting \
#   --config-block /data/channel-artifacts/genesis_voting.pb \
#   -o gov_orderer:7053 \
#   --ca-file /data/gov/orderer/tls/ca.crt \
#   --client-cert /data/gov/orderer/admin/msp/signcerts/* \
#   --client-key /data/gov/orderer/admin/msp/keystore/*

# /fabric/bin/osnadmin channel join \
#   --channelID voting \
#   --config-block /data/channel-artifacts/genesis_voting.pb \
#   -o gov_orderer:7053 \
#   --ca-file /data/gov/orderer/tls/ca.crt \
#   --client-cert /data/gov/orderer/msp/signcerts/* \
#   --client-key /data/gov/orderer/msp/keystore/*
