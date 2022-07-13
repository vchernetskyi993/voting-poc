#!/bin/sh

. shell/shell-utils.sh
. shell/fabric-utils.sh

trapErrors

export PATH="$PATH":"$FABRIC_BIN_PATH"
export FABRIC_CFG_PATH=/config/peer
ORG=gov MSP_ID=Government useOrgAdmin

MAX_WAIT=25
ATTEMPTS=0

until peer lifecycle chaincode querycommitted --channelID voting | grep -q elections; do
  if [ $ATTEMPTS = $MAX_WAIT ]; then
    echo "Elections chaincode is not commited. Exiting..."
    exit 1
  else
    echo 'Waiting for commit of elections chaincode...'
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 5
  fi
done

for ORG_DATA in $ORGS; do
  ORG=$(echo "$ORG_DATA" | sed 's/\(.*\),.*/\1/')
  MSP_ID=$(echo "$ORG_DATA" | sed 's/.*,\(.*\)/\1/')
  echo "ORG: $ORG" 
  echo "MSP_ID: $MSP_ID" 
  infoln "------ Preparing $ORG MSP ------"

  prepareOrgMsp

  infoln "------ Preparing $ORG configtx delta ------"

  CHANNEL_DIR=/data/"$ORG"/channel
  mkdir "$CHANNEL_DIR"

  ORG=gov MSP_ID=Government useOrgAdmin

  CONFIG_DIR=$CHANNEL_DIR fetchChannelConfig

  export FABRIC_CFG_PATH=/config/channel/"$ORG"
  configtxgen -printOrg "$MSP_ID" >"$CHANNEL_DIR"/org_config.json

  jq \
    -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'"$MSP_ID"'":.[1]}}}}}' \
    "$CHANNEL_DIR"/config.json \
    "$CHANNEL_DIR"/org_config.json \
    >"$CHANNEL_DIR"/modified_config.json

  CONFIG_DIR=$CHANNEL_DIR buildConfigUpdate

  infoln "------ Updating config ------"

  export FABRIC_CFG_PATH=/config/peer

  peer channel signconfigtx -f "$CHANNEL_DIR"/update_in_envelope.pb

  peer channel update \
    -f "$CHANNEL_DIR"/update_in_envelope.pb \
    -c voting \
    -o orderer.gov:7050 \
    --tls \
    --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem

  infoln "------ Joining $ORG peer ------"

  useOrgAdmin

  peer channel join -b /data/channel-artifacts/genesis_voting.pb

  setAnchorPeer

  infoln "------ Approving chaincode ------"

  approveChaincode
done
