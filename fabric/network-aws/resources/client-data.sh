#!/bin/bash
set -e
set -x

# input variables
MEMBER_ID="{{MEMBER_ID}}"
ORDERING_SERVICE_ENDPOINT="{{ORDERING_SERVICE_ENDPOINT}}"
PEER_NODE_ENDPOINT="{{PEER_NODE_ENDPOINT}}"
CA_URL="{{FABRIC_CA_ENDPOINT}}"
TLS_CERT_URL="{{TLS_CERT_URL}}"
ADMIN_PASSWORD_ARN="{{ADMIN_PASSWORD_ARN}}"
AWS_REGION="{{AWS_REGION}}"
CHANNEL_CONFIG="{{CHANNEL_CONFIG}}"

# constants
FABRIC_CA_VERSION=1.4.7
FABRIC_TOOLS_VERSION=2.2.4

cd /home/ec2-user

yum update -y
pip install --upgrade awscli

# download fabric binaries
mkdir fabric
wget https://github.com/hyperledger/fabric/releases/download/v"${FABRIC_TOOLS_VERSION}"/hyperledger-fabric-linux-amd64-"${FABRIC_TOOLS_VERSION}".tar.gz
tar -xzf hyperledger-fabric-ca-linux-amd64-"${FABRIC_CA_VERSION}".tar.gz -C fabric
wget https://github.com/hyperledger/fabric-ca/releases/download/v"${FABRIC_CA_VERSION}"/hyperledger-fabric-ca-linux-amd64-"${FABRIC_CA_VERSION}".tar.gz
tar -xzf hyperledger-fabric-ca-linux-amd64-"${FABRIC_CA_VERSION}".tar.gz -C fabric

# Download TLS cert
wget -O managedblockchain-tls-chain.pem "${TLS_CERT_URL}"

# shellcheck disable=SC2016
echo 'export PATH=$PATH:/home/ec2-user/fabric/bin' >>.bash_profile

echo "
export MSP_PATH=/opt/home/admin-msp
export MSP=${MEMBER_ID}
export ORDERER=${ORDERING_SERVICE_ENDPOINT}
export PEER=${PEER_NODE_ENDPOINT}
export CA_URL=${CA_URL}
" >>.bash_profile

source .bash_profile

CA_PASSWORD=$(aws secretsmanager get-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$ADMIN_PASSWORD_ARN" \
  --query "SecretString" \
  --output text)

# enroll admin
fabric-ca-client enroll \
  -u https://admin:"$CA_PASSWORD"@"$CA_URL" \
  --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem

# create channel

export FABRIC_CFG_PATH=/home/ec2-user/fabric/channel
mkdir -p "$FABRIC_CFG_PATH"
cd "$FABRIC_CFG_PATH"

echo "${!CHANNEL_CONFIG}" >configtx.yaml

configtxgen \
  -profile VotingAppChannelEtcdRaft \
  -outputBlock genesis_voting.pb \
  -channelID voting

osnadmin channel join \
  --channelID voting \
  --config-block genesis_voting.pb \
  --ca-file /home/ec2-user/managedblockchain-tls-chain.pem
#  -o orderer.gov:7053 \
#  --client-cert /data/gov/orderer/tls/server.crt \
#  --client-key /data/gov/orderer/tls/server.key

peer channel join -b genesis_voting.pb

# deploy chaincode
cd /home/ec2-user

git clone https://github.com/vchernetskyi993/voting-poc
cd voting-poc/fabric/chaincode

./gradlew installDist

peer lifecycle chaincode package cc.tar.gz \
  --path build/install/elections/ \
  --lang java \
  --label elections_0.1.0

peer lifecycle chaincode install cc.tar.gz >/data/log 2>&1

cat /data/log

PACKAGE_ID=$(tail -n 1 /data/log | awk '{print $NF}')

peer lifecycle chaincode approveformyorg \
  --tls \
  --cafile /home/ec2-user/managedblockchain-tls-chain.pem \
  --channelID voting \
  --name elections \
  --version 0.1.0 \
  --package-id "$PACKAGE_ID" \
  --sequence 1
#  -o orderer.gov:7050 \

peer lifecycle chaincode commit \
  --channelID voting \
  --name elections \
  --version 0.1.0 \
  --sequence 1 \
  --tls \
  --cafile /home/ec2-user/managedblockchain-tls-chain.pem
#  -o orderer.gov:7050 \
