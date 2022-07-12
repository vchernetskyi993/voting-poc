#!/bin/sh

. shell/shell-utils.sh
. shell/fabric-utils.sh

MAX_WAIT=5
ATTEMPTS=0

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

trapErrors

export PATH="$PATH":"$FABRIC_BIN_PATH"

infoln "------ Preparing Gov MSP ------"

ORG=gov prepareOrgMsp

infoln "------ Generating genesis block ------"

export FABRIC_CFG_PATH=/config/channel
GENESIS_BLOCK=/data/channel-artifacts/genesis_voting.pb

configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock $GENESIS_BLOCK \
  -channelID voting

infoln "------ Joining services ------"

osnadmin channel join \
  --channelID voting \
  --config-block $GENESIS_BLOCK \
  -o orderer.gov:7053 \
  --ca-file /data/gov/ca/ca-cert.pem \
  --client-cert /data/gov/orderer/tls/server.crt \
  --client-key /data/gov/orderer/tls/server.key

sleep 2

ORG=gov MSP_ID=Government useOrgAdmin

peer channel join -b $GENESIS_BLOCK

infoln "------ Building chaincode ------"

cd /chaincode
gradle clean installDist

peer lifecycle chaincode package cc.tar.gz \
  --path build/install/elections/ \
  --lang java \
  --label elections_0.1.0

mv cc.tar.gz /data/channel-artifacts/cc.tar.gz
gradle clean

infoln "------ Deploying chaincode ------"

approveChaincode

peer lifecycle chaincode commit \
  -o orderer.gov:7050 \
  --channelID voting \
  --name elections \
  --version 0.1.0 \
  --sequence 1 \
  --tls \
  --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem
