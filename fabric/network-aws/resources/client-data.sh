#!/bin/bash
set -ex

# input variables
MEMBER_ID="{{MEMBER_ID}}"
ORDERING_SERVICE_ENDPOINT="{{ORDERING_SERVICE_ENDPOINT}}"
PEER_NODE_ENDPOINT="{{PEER_NODE_ENDPOINT}}"
CA_URL="{{FABRIC_CA_ENDPOINT}}"
TLS_CERT_URL="{{TLS_CERT_URL}}"
ADMIN_PASSWORD_ARN="{{ADMIN_PASSWORD_ARN}}"
AWS_REGION="{{AWS_REGION}}"
NETWORK_DATA_BUCKET="{{NETWORK_DATA_BUCKET}}"

# constants
FABRIC_CA_VERSION=1.4.7
FABRIC_TOOLS_VERSION=2.2.4

USER_HOME=/home/ec2-user

cd $USER_HOME

yum update -y
pip install --upgrade awscli

# download fabric binaries
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

# Download TLS cert
wget -O managedblockchain-tls-chain.pem "${TLS_CERT_URL}"

# --- enroll admin
CA_PASSWORD=$(aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$ADMIN_PASSWORD_ARN" \
  --query "SecretString" \
  --output text)
TLS_CERT=$USER_HOME/managedblockchain-tls-chain.pem
MSP_PATH=$USER_HOME/admin-msp

fabric-ca-client enroll \
  -u https://admin:"$CA_PASSWORD"@"$CA_URL" \
  --tls.certfiles "$TLS_CERT" \
  -M "$MSP_PATH"

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
" >"$MSP_PATH"/config.yaml

# --- create channel
export FABRIC_CFG_PATH=$USER_HOME/fabric/channel
mkdir -p "$FABRIC_CFG_PATH"
cd "$FABRIC_CFG_PATH"

aws s3 cp s3://${NETWORK_DATA_BUCKET}/configtx.yaml configtx-template.yaml

yum install -y gettext

# exporting vars for envsubst to use
export TLS_CERT
export MSP_PATH
export MEMBER_ID
export ORDERER_URL=${ORDERING_SERVICE_ENDPOINT}
export ORDERER_HOST=${ORDERER_URL%:*}
export ORDERER_PORT=${ORDERER_URL#*:}

envsubst <configtx-template.yaml >configtx.yaml

configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock genesis_voting.pb \
  -channelID voting

echo "
export FABRIC_CFG_PATH=$USER_HOME/fabric/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=$MEMBER_ID
export CORE_PEER_MSPCONFIGPATH=$MSP_PATH
export CORE_PEER_ADDRESS=$PEER_NODE_ENDPOINT
export CORE_PEER_TLS_ROOTCERT_FILE=$TLS_CERT
" >>$USER_HOME/.bash_profile
source $USER_HOME/.bash_profile

peer channel create \
  --channelID voting \
  --file genesis_voting.pb \
  --orderer "$ORDERER_URL" \
  --cafile "$TLS_CERT" \
  --tls

peer channel join -b genesis_voting.pb

# --- deploy chaincode
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
  --channelID voting \
  --name elections \
  --version 0.1.0 \
  --package-id "$PACKAGE_ID" \
  --sequence 1

peer lifecycle chaincode commit \
  --orderer "$ORDERER_URL" \
  --cafile "$TLS_CERT" \
  --tls \
  --channelID voting \
  --name elections \
  --version 0.1.0 \
  --sequence 1
