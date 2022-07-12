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

infoln "------ Preparing $ORG MSP ------"

prepareOrgMsp

infoln "------ Preparing $ORG configtx delta ------"

CHANNEL_DIR=/data/"$ORG"/channel
mkdir "$CHANNEL_DIR"

peer channel fetch config "$CHANNEL_DIR"/config_block.pb \
  -o orderer.gov:7050 \
  -c voting \
  --tls \
  --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem

configtxlator proto_decode \
  --input "$CHANNEL_DIR"/config_block.pb \
  --type common.Block \
  --output "$CHANNEL_DIR"/config_block.json

jq .data.data[0].payload.data.config \
  "$CHANNEL_DIR"/config_block.json \
  >"$CHANNEL_DIR"/config.json

export FABRIC_CFG_PATH=/config/channel/"$ORG"
configtxgen -printOrg "$MSP_ID" >"$CHANNEL_DIR"/org_config.json

jq \
  -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'"$MSP_ID"'":.[1]}}}}}' \
  "$CHANNEL_DIR"/config.json \
  "$CHANNEL_DIR"/org_config.json \
  >"$CHANNEL_DIR"/modified_config.json

configtxlator proto_encode \
  --input data/"$ORG"/channel/config.json \
  --type common.Config \
  --output data/"$ORG"/channel/config.pb

configtxlator proto_encode \
  --input "$CHANNEL_DIR"/modified_config.json \
  --type common.Config \
  --output "$CHANNEL_DIR"/modified_config.pb

configtxlator compute_update \
  --channel_id voting \
  --original "$CHANNEL_DIR"/config.pb \
  --updated "$CHANNEL_DIR"/modified_config.pb \
  --output "$CHANNEL_DIR"/update.pb

configtxlator proto_decode \
  --input "$CHANNEL_DIR"/update.pb \
  --type common.ConfigUpdate \
  --output "$CHANNEL_DIR"/update.json

jq -n \
  --argjson upd "$(cat "$CHANNEL_DIR"/update.json)" \
  '{"payload":{"header":{"channel_header":{"channel_id":"voting","type":2}},"data":{"config_update":$upd}}}' \
  >"$CHANNEL_DIR"/update_in_envelope.json

configtxlator proto_encode \
  --input "$CHANNEL_DIR"/update_in_envelope.json \
  --type common.Envelope \
  --output "$CHANNEL_DIR"/update_in_envelope.pb

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

infoln "------ Approving chaincode ------"

approveChaincode
