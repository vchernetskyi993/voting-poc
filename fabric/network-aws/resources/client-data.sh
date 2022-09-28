#!/bin/bash
set -ex

# input variables
MEMBER_ID="{{MEMBER_ID}}"
ORDERING_SERVICE_ENDPOINT="{{ORDERING_SERVICE_ENDPOINT}}"
PEER_NODE_ENDPOINT="{{PEER_NODE_ENDPOINT}}"
CA_URL="{{FABRIC_CA_ENDPOINT}}"
TLS_CERT_URL="{{TLS_CERT_URL}}"
SU_PASSWORD_ARN="{{SU_PASSWORD_ARN}}"
ADMIN_PASSWORD_ARN="{{ADMIN_PASSWORD_ARN}}"
AWS_REGION="{{AWS_REGION}}"
NETWORK_DATA_BUCKET="{{NETWORK_DATA_BUCKET}}"

# constants
FABRIC_CA_VERSION=1.4.7
FABRIC_TOOLS_VERSION=2.2.4

USER_HOME=/home/ec2-user

function main() {
  yum update -y
  pip install --upgrade awscli

  downloadFabricBinaries

  # Download TLS cert
  TLS_CERT=$USER_HOME/managedblockchain-tls-chain.pem
  wget -O "$TLS_CERT" "${TLS_CERT_URL}"

  enrollUsers
  createChannel
  deployChainCode
}

#######################################
# Download fabric binaries to ~/fabric folder.
# Globals:
#   USER_HOME
#   FABRIC_TOOLS_VERSION
#   FABRIC_CA_VERSION
# Outputs:
#   Fabric binaries and configs inside ~/fabric.
#######################################
function downloadFabricBinaries() {
  cd $USER_HOME
  mkdir -p fabric

  FABRIC_TOOLS_ARCHIVE=hyperledger-fabric-linux-amd64-"${FABRIC_TOOLS_VERSION}".tar.gz
  wget https://github.com/hyperledger/fabric/releases/download/v"${FABRIC_TOOLS_VERSION}"/"${FABRIC_TOOLS_ARCHIVE}"
  tar -xzf "${FABRIC_TOOLS_ARCHIVE}" -C fabric

  FABRIC_CA_ARCHIVE=hyperledger-fabric-ca-linux-amd64-"${FABRIC_CA_VERSION}".tar.gz
  wget https://github.com/hyperledger/fabric-ca/releases/download/v"${FABRIC_CA_VERSION}"/"${FABRIC_CA_ARCHIVE}"
  tar -xzf "${FABRIC_CA_ARCHIVE}" -C fabric

  rm hyperledger-*.tar.gz

  # shellcheck disable=SC2016
  echo 'export PATH=$PATH:'"$USER_HOME/fabric/bin" >>.bash_profile
  source .bash_profile

  cd -
}

#######################################
# Register and enroll super user and administrator.
# Globals:
#   USER_HOME
#   CA_URL
#   TLS_CERT
#   SU_PASSWORD_ARN
#   ADMIN_PASSWORD_ARN
# Outputs:
#   SU_MSP_PATH
#   ADMIN_MSP_PATH
#######################################
function enrollUsers() {
  SU_PASSWORD=$(getSecret "$SU_PASSWORD_ARN")
  BASE_MSP_PATH=$USER_HOME/msp
  SU_MSP_PATH=$BASE_MSP_PATH/su

  fabric-ca-client enroll \
    -u https://admin:"$(urlEncode "$SU_PASSWORD")"@"$CA_URL" \
    --tls.certfiles "$TLS_CERT" \
    -M "$SU_MSP_PATH"

  cp -r $SU_MSP_PATH/signcerts $SU_MSP_PATH/admincerts

  writeOUs "$SU_MSP_PATH"

  USERNAME=govadmin
  PASSWORD=$(getSecret "$ADMIN_PASSWORD_ARN")

  fabric-ca-client register -d \
    --url https://"$CA_URL" \
    --id.name "$USERNAME" \
    --id.secret "$PASSWORD" \
    --id.type admin \
    --tls.certfiles "$TLS_CERT"

  ADMIN_MSP_PATH=$BASE_MSP_PATH/admin

  fabric-ca-client enroll \
    -u https://"$USERNAME":"$(urlEncode "$PASSWORD")"@"$CA_URL" \
    -M "$ADMIN_MSP_PATH" \
    --tls.certfiles "$TLS_CERT"

  writeOUs "$ADMIN_MSP_PATH"
}

#######################################
# URL-encode provided string.
# Globals:
#   CA_URL
# Arguments:
#   Msp path.
# Outputs:
#   Writes encoded string to stdout.
#######################################
function writeOUs() {
  OU_CA_CERT=cacerts/"${CA_URL//[:.]/-}".pem
  echo "
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: $OU_CA_CERT
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: $OU_CA_CERT
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: $OU_CA_CERT
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: $OU_CA_CERT
    OrganizationalUnitIdentifier: orderer
" >"$1"/config.yaml
}

#######################################
# Create elections channel.
# Globals:
#   USER_HOME
#   TLS_CERT
#   ADMIN_MSP_PATH
#   MEMBER_ID
#   ORDERING_SERVICE_ENDPOINT
#   PEER_NODE_ENDPOINT
# Outputs:
#   CHANNEL_ID
#   ORDERER_URL
#######################################
function createChannel() {
  export FABRIC_CFG_PATH=$USER_HOME/fabric/channel
  mkdir -p "$FABRIC_CFG_PATH"
  cd "$FABRIC_CFG_PATH"

  aws s3 cp s3://${NETWORK_DATA_BUCKET}/configtx.yaml configtx-template.yaml

  yum install -y gettext

  # exporting vars for envsubst to use
  export TLS_CERT
  export MSP_PATH=$ADMIN_MSP_PATH
  export MEMBER_ID
  export ORDERER_URL=${ORDERING_SERVICE_ENDPOINT}
  export ORDERER_HOST=${ORDERER_URL%:*}
  export ORDERER_PORT=${ORDERER_URL#*:}

  envsubst <configtx-template.yaml >configtx.yaml

  CHANNEL_ID=voting

  configtxgen \
    -profile VotingAppChannelEtcdRaft \
    -outputCreateChannelTx genesis_voting.pb \
    -channelID $CHANNEL_ID

  echo "
export FABRIC_CFG_PATH=$USER_HOME/fabric/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=$MEMBER_ID
export CORE_PEER_MSPCONFIGPATH=$ADMIN_MSP_PATH
export CORE_PEER_ADDRESS=$PEER_NODE_ENDPOINT
export CORE_PEER_TLS_ROOTCERT_FILE=$TLS_CERT
" >>$USER_HOME/.bash_profile
  source $USER_HOME/.bash_profile

  peer channel create \
    --channelID $CHANNEL_ID \
    --file genesis_voting.pb \
    --orderer "$ORDERER_URL" \
    --cafile "$TLS_CERT" \
    --tls

  peer channel join -b genesis_voting.pb

  cd -
}

#######################################
# Deploy elections chaincode.
# Globals:
#   USER_HOME
#   TLS_CERT
#   PEER_NODE_ENDPOINT
#   ORDERER_URL
#   CHANNEL_ID
#######################################
function deployChainCode() {
  cd $USER_HOME

  git clone https://github.com/vchernetskyi993/voting-poc
  cd voting-poc/fabric/chaincode

  ./gradlew installDist

  peer lifecycle chaincode package cc.tar.gz \
    --path build/install/elections/ \
    --lang java \
    --label elections_0.1.0

  CC_INSTALL_LOG=/var/log/cc-install.log
  peer lifecycle chaincode install cc.tar.gz >"${CC_INSTALL_LOG}" 2>&1

  cat "${CC_INSTALL_LOG}"

  PACKAGE_ID=$(tail -n 1 "${CC_INSTALL_LOG}" | awk '{print $NF}')

  peer lifecycle chaincode approveformyorg \
    --orderer "$ORDERER_URL" \
    --cafile "$TLS_CERT" \
    --tls \
    --channelID "$CHANNEL_ID" \
    --name elections \
    --version 0.1.0 \
    --package-id "$PACKAGE_ID" \
    --sequence 1

  peer lifecycle chaincode commit \
    --orderer "$ORDERER_URL" \
    --cafile "$TLS_CERT" \
    --tls \
    --channelID "$CHANNEL_ID" \
    --name elections \
    --version 0.1.0 \
    --sequence 1

  cd -
}

#######################################
# Fetch secret value from SecretsManager.
# Arguments:
#   ARN of the secret to retrieve.
# Outputs:
#   Writes secret value to stdout.
#######################################
function getSecret() {
  aws secretsmanager get-secret-value \
    --region "$AWS_REGION" \
    --secret-id "$1" \
    --query "SecretString" \
    --output text
}

#######################################
# URL-encode provided string.
# Arguments:
#   String value to encode.
# Outputs:
#   Writes encoded string to stdout.
#######################################
function urlEncode() {
  python -c "import urllib;print urllib.quote(raw_input())" <<<"$SU_PASSWORD"
}

main
