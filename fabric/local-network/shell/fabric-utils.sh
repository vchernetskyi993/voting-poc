#!/bin/sh

#######################################
# Writes default NodeOUs config to DATA_PATH/msp/config.yaml.
# Globals:
#   CA_FILE_NAME
#   DATA_PATH
#######################################
writeOUconfig() {
  echo "
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/$CA_FILE_NAME.pem
    OrganizationalUnitIdentifier: orderer
" >"$DATA_PATH"/msp/config.yaml
}

#######################################
# Creates organization msp folder.
# Globals:
#   ORG
#######################################
prepareOrgMsp() {
  mkdir -p /data/"$ORG"/msp/cacerts /data/"$ORG"/msp/tlscacerts
  cp /data/"$ORG"/ca/ca-cert.pem /data/"$ORG"/msp/cacerts
  cp /data/"$ORG"/ca/ca-cert.pem /data/"$ORG"/msp/tlscacerts
  CA_FILE_NAME=ca-cert DATA_PATH=/data/"$ORG" writeOUconfig
}

#######################################
# Uses admin user of requested organization for following peer interactions.
# Globals:
#   ORG
#   MSP_ID
#######################################
useOrgAdmin() {
  export FABRIC_CFG_PATH=/config/peer
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="$MSP_ID"
  export CORE_PEER_MSPCONFIGPATH=/data/"$ORG"/admin/msp
  export CORE_PEER_ADDRESS=peer."$ORG":7051
  export CORE_PEER_TLS_ROOTCERT_FILE=/data/"$ORG"/peer/tls/tlscacerts/tls-ca-"$ORG"-7054.pem
}

#######################################
# Installs and then approves chaincode package.
# Assumes that `useOrgAdmin` is already called.
#######################################
approveChaincode() {
  peer lifecycle chaincode install /data/channel-artifacts/cc.tar.gz >/data/log 2>&1

  cat /data/log

  PACKAGE_ID=$(tail -n 1 /data/log | awk '{print $NF}')

  peer lifecycle chaincode approveformyorg \
    -o orderer.gov:7050 \
    --tls \
    --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem \
    --channelID voting \
    --name elections \
    --version 0.1.0 \
    --package-id "$PACKAGE_ID" \
    --sequence 1
}

#######################################
# Fetch channel config and save result to CONFIG_DIR/config.json.
# Globals:
#   CONFIG_DIR
# Outputs:
#   CONFIG_DIR/config_block.pb encoded block config
#   CONFIG_DIR/config_block.json decoded block config
#   CONFIG_DIR/config.json decoded config without block metadata
#######################################
fetchChannelConfig() {
  peer channel fetch config "$CONFIG_DIR"/config_block.pb \
    -o orderer.gov:7050 \
    -c voting \
    --tls \
    --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem

  configtxlator proto_decode \
    --input "$CONFIG_DIR"/config_block.pb \
    --type common.Block \
    --output "$CONFIG_DIR"/config_block.json

  jq .data.data[0].payload.data.config \
    "$CONFIG_DIR"/config_block.json \
    >"$CONFIG_DIR"/config.json
}

#######################################
# Build encoded update file between CONFIG_DIR/config.json and CONFIG_DIR/modified_config.json.
# Stores resulting update in CONFIG_DIR/update_in_envelope.pb.
# Globals:
#   CONFIG_DIR
# Outputs:
#   CONFIG_DIR/config.pb encoded config
#   CONFIG_DIR/modified_config.pb encoded modified config
#   CONFIG_DIR/update.pb encoded delta
#   CONFIG_DIR/update.json decoded delta
#   CONFIG_DIR/update_in_envelope.json decoded wrapped delta
#   CONFIG_DIR/update_in_envelope.pb encoded wrapped delta
#######################################
buildConfigUpdate() {
  configtxlator proto_encode \
    --input "$CONFIG_DIR"/config.json \
    --type common.Config \
    --output "$CONFIG_DIR"/config.pb

  configtxlator proto_encode \
    --input "$CONFIG_DIR"/modified_config.json \
    --type common.Config \
    --output "$CONFIG_DIR"/modified_config.pb

  configtxlator compute_update \
    --channel_id voting \
    --original "$CONFIG_DIR"/config.pb \
    --updated "$CONFIG_DIR"/modified_config.pb \
    --output "$CONFIG_DIR"/update.pb

  configtxlator proto_decode \
    --input "$CONFIG_DIR"/update.pb \
    --type common.ConfigUpdate \
    --output "$CONFIG_DIR"/update.json

  jq -n \
    --argjson upd "$(cat "$CONFIG_DIR"/update.json)" \
    '{"payload":{"header":{"channel_header":{"channel_id":"voting","type":2}},"data":{"config_update":$upd}}}' \
    >"$CONFIG_DIR"/update_in_envelope.json

  configtxlator proto_encode \
    --input "$CONFIG_DIR"/update_in_envelope.json \
    --type common.Envelope \
    --output "$CONFIG_DIR"/update_in_envelope.pb
}

#######################################
# Set anchor peer for the organization.
# Globals:
#   ORG
#   MSP_ID
#######################################
setAnchorPeer() {
  ANCHOR_DIR=/data/"$ORG"/anchor
  mkdir "$ANCHOR_DIR"

  CONFIG_DIR=$ANCHOR_DIR fetchChannelConfig

  jq '.channel_group.groups.Application.groups.'"$MSP_ID"'.values += {
      "AnchorPeers": {
        "mod_policy": "Admins",
        "value":{
          "anchor_peers": [{"host": "peer.'"$ORG"'","port": 7051}]
        },
        "version": "0"
      }
    }' \
    "$ANCHOR_DIR"/config.json \
    >"$ANCHOR_DIR"/modified_config.json

  CONFIG_DIR=$ANCHOR_DIR buildConfigUpdate

  peer channel update \
    -f "$ANCHOR_DIR"/update_in_envelope.pb \
    -c voting \
    -o orderer.gov:7050 \
    --tls \
    --cafile /data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem
}
