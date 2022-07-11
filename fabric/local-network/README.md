# Voting platform network

Uses docker to start all nodes locally. Should serve as an example to deploy on other envs.

## Setup base Voting network

We use Python script to generate `docker-compose.yaml` from `Jinja2` template.

1. Install python script requirements: `pip install -r requirements.txt`.
As usual, it's recommended to use virtualenv for this.

2. Generate compose file: `./template.py --orgs gov,rev,con > docker-compose.yaml`

3. Start network: `docker compose up`

Docker compose:
* starts containers for 3 organizations
* creates voting channel
* deploys elections chaincode

## Add new party

TODO: new party setup process:
* join elections channel
* receive & test chaincode
* only government should be able to add new orgs

## Transact using chaincode

After successful network start you can interact with deployed contract.

Use peer admin:
```bash
# set fabric variables
export PATH=$PATH:~/repo/fabric/fabric-samples/bin
export FABRIC_CFG_PATH=./config/
# update data ownership
sudo chown -R $USER:$USER data/
# set peer variables
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Government
export CORE_PEER_MSPCONFIGPATH=$PWD/data/gov/admin/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/data/gov/peer/tls/tlscacerts/tls-ca-gov-7054.pem
```

Get elections count:
```bash
peer chaincode query \
    -C voting \
    -n elections \
    -c '{"function":"ElectionsCount","Args":[]}'
```

Create election:
```bash
peer chaincode invoke \
    -o localhost:7050 \
    --tls \
    --cafile "$PWD/data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem" \
    -C voting \
    -n elections \
    -c "$(jq -nc --argjson el "$(python generate-election.py)" '{"function":"CreateElection","Args":[$el | tostring]}')"
```

Retrieve election with results:
```bash
peer chaincode query \
    -C voting \
    -n elections \
    -c '{"function":"FetchElection","Args":["0"]}' | jq
```

Check if user can vote:
```bash
peer chaincode query \
    -C voting \
    -n elections \
    -c '{"function":"CanVote","Args":["0", "0"]}'
```

Vote:
```bash
peer chaincode invoke \
    -o localhost:7050 \
    --tls \
    --cafile "$PWD/data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem" \
    -C voting \
    -n elections \
    -c '{"function":"Vote","Args":["{\"electionId\":\"0\",\"candidateId\":1,\"voterId\":\"0\"}"]}'
```


## Cleanup

1. Stop and remove containers: `docker compose down`

2. Remove services persistent data: `sudo rm -rf data`
